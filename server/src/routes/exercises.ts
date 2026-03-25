import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const createExerciseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().default(''),
  patternData: z.object({
    beats: z.number(),
    subdivisions: z.number(),
    tracks: z.record(z.array(z.number())),
  }),
  config: z.any().optional(),
  category: z.string().default('reading'),
  difficulty: z.number().min(1).max(10).default(5),
  bpm: z.number().min(40).max(300).default(90),
  timeSignature: z.array(z.number()).length(2).default([4, 4]),
  bars: z.number().min(1).max(32).default(2),
  tags: z.array(z.string()).default([]),
  isAiGenerated: z.boolean().default(false),
})

export function exerciseRouter(prisma: PrismaClient): Router {
  const router = Router()

  // GET /api/exercises — list exercises (built-in + user's own)
  router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    const { category, difficulty, limit = '50', offset = '0' } = req.query

    const where: any = {
      OR: [
        { isBuiltin: true },
        { userId: req.userId },
      ],
    }
    if (category) where.category = category
    if (difficulty) where.difficulty = parseInt(difficulty as string, 10)

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: [{ isBuiltin: 'desc' }, { createdAt: 'desc' }],
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
      select: {
        id: true, title: true, description: true, category: true,
        difficulty: true, bpm: true, timeSignature: true, bars: true,
        tags: true, isBuiltin: true, isAiGenerated: true, createdAt: true,
        patternData: true, config: true,
        _count: { select: { sessions: true } },
      },
    })

    res.json({ exercises })
  })

  // GET /api/exercises/:id
  router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
    const exercise = await prisma.exercise.findUnique({
      where: { id: req.params.id },
      include: {
        sessions: {
          where: { userId: req.userId! },
          orderBy: { startedAt: 'desc' },
          take: 10,
          select: { id: true, score: true, stars: true, accuracy: true, bpm: true, startedAt: true },
        },
      },
    })

    if (!exercise) { res.status(404).json({ error: 'Exercise not found' }); return }
    // Check access: must be built-in or user's own
    if (!exercise.isBuiltin && exercise.userId !== req.userId) {
      res.status(403).json({ error: 'Access denied' })
      return
    }

    res.json({ exercise })
  })

  // POST /api/exercises — save a new exercise
  router.post('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = createExerciseSchema.parse(req.body)

      const exercise = await prisma.exercise.create({
        data: {
          ...data,
          patternData: data.patternData as any,
          config: data.config ?? undefined,
          userId: req.userId!,
        },
      })

      res.status(201).json({ exercise })
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid input', details: e.errors })
        return
      }
      console.error('Create exercise error:', e)
      res.status(500).json({ error: 'Failed to create exercise' })
    }
  })

  // DELETE /api/exercises/:id
  router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
    const exercise = await prisma.exercise.findUnique({ where: { id: req.params.id } })
    if (!exercise) { res.status(404).json({ error: 'Not found' }); return }
    if (exercise.isBuiltin || exercise.userId !== req.userId) {
      res.status(403).json({ error: 'Cannot delete this exercise' })
      return
    }

    await prisma.exercise.delete({ where: { id: req.params.id } })
    res.json({ deleted: true })
  })

  return router
}
