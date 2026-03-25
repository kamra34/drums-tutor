import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const createSessionSchema = z.object({
  exerciseId: z.string().optional(),
  bpm: z.number().min(40).max(300),
  score: z.number().min(0).max(100),
  stars: z.number().min(0).max(3),
  accuracy: z.number().min(0).max(1),
  timingData: z.any().optional(),
  velocityData: z.any().optional(),
  missedNotes: z.number().default(0),
  totalNotes: z.number().default(0),
  hitNotes: z.number().default(0),
  practiceMode: z.string().default('exercise'),
})

export function sessionRouter(prisma: PrismaClient): Router {
  const router = Router()

  // POST /api/sessions — record a completed practice session
  router.post('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = createSessionSchema.parse(req.body)

      const session = await prisma.practiceSession.create({
        data: {
          userId: req.userId!,
          exerciseId: data.exerciseId || null,
          bpm: data.bpm,
          score: data.score,
          stars: data.stars,
          accuracy: data.accuracy,
          timingData: data.timingData ?? undefined,
          velocityData: data.velocityData ?? undefined,
          missedNotes: data.missedNotes,
          totalNotes: data.totalNotes,
          hitNotes: data.hitNotes,
          practiceMode: data.practiceMode,
          completedAt: new Date(),
        },
      })

      res.status(201).json({ session })
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid input', details: e.errors })
        return
      }
      console.error('Create session error:', e)
      res.status(500).json({ error: 'Failed to save session' })
    }
  })

  // GET /api/sessions — list user's practice sessions
  router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    const limit = (req.query.limit as string) || '20'
    const offset = (req.query.offset as string) || '0'
    const exerciseId = req.query.exerciseId as string | undefined
    const practiceMode = req.query.practiceMode as string | undefined

    const where: any = { userId: req.userId! }
    if (exerciseId) where.exerciseId = exerciseId
    if (practiceMode) where.practiceMode = practiceMode

    const sessions = await prisma.practiceSession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: parseInt(limit, 10),
      skip: parseInt(offset, 10),
      include: {
        exercise: { select: { id: true, title: true, category: true } },
      },
    })

    const total = await prisma.practiceSession.count({ where })

    res.json({ sessions, total })
  })

  // GET /api/sessions/stats — aggregated stats for the user
  router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.userId!

    const [totalSessions, totalByMode, bestScores, recentActivity] = await Promise.all([
      prisma.practiceSession.count({ where: { userId } }),

      prisma.practiceSession.groupBy({
        by: ['practiceMode'],
        where: { userId },
        _count: true,
        _avg: { score: true, accuracy: true },
      }),

      prisma.practiceSession.groupBy({
        by: ['exerciseId'],
        where: { userId, exerciseId: { not: null } },
        _max: { score: true, stars: true },
        _count: true,
      }),

      prisma.practiceSession.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        take: 7,
        select: { startedAt: true, score: true, practiceMode: true },
      }),
    ])

    res.json({ totalSessions, totalByMode, bestScores, recentActivity })
  })

  // GET /api/sessions/best/:exerciseId — best result for a specific exercise
  router.get('/best/:exerciseId', authenticateToken, async (req: AuthRequest, res) => {
    const exerciseId = req.params.exerciseId as string
    const best = await prisma.practiceSession.findFirst({
      where: { userId: req.userId!, exerciseId },
      orderBy: { score: 'desc' },
    })

    res.json({ best })
  })

  return router
}
