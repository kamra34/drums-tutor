import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const createExerciseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().default(''),
  patternData: z.any(), // flexible: drums use {beats,subdivisions,tracks}, piano uses {notes,chordsLeft,...}
  config: z.any().optional(),
  category: z.string().default('reading'),
  instrument: z.enum(['drums', 'piano']).default('drums'),
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
    const category = req.query.category as string | undefined
    const difficulty = req.query.difficulty as string | undefined
    const instrument = req.query.instrument as string | undefined
    const limit = (req.query.limit as string) || '50'
    const offset = (req.query.offset as string) || '0'

    const where: any = {
      OR: [
        { isBuiltin: true },
        { userId: req.userId },
      ],
    }
    if (category) where.category = category
    if (difficulty) where.difficulty = parseInt(difficulty, 10)
    if (instrument) where.instrument = instrument

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: [{ isBuiltin: 'desc' }, { createdAt: 'desc' }],
      take: parseInt(limit, 10),
      skip: parseInt(offset, 10),
      select: {
        id: true, title: true, description: true, category: true,
        difficulty: true, bpm: true, timeSignature: true, bars: true,
        tags: true, isBuiltin: true, isAiGenerated: true, createdAt: true,
        patternData: true, config: true,
        backingTrackName: true, backingTrackBpm: true,
        backingTrackOffset: true, backingTrackVolume: true,
        // NOTE: backingTrackData excluded (too large for list)
        _count: { select: { sessions: true } },
      },
    })

    res.json({ exercises })
  })

  // GET /api/exercises/:id
  router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
    const id = req.params.id as string
    const exercise = await prisma.exercise.findUnique({
      where: { id },
      select: {
        id: true, userId: true, title: true, description: true,
        patternData: true, config: true,
        category: true, difficulty: true, bpm: true, timeSignature: true,
        bars: true, tags: true, isBuiltin: true, isAiGenerated: true,
        instrument: true, createdAt: true,
        backingTrackName: true, backingTrackBpm: true,
        backingTrackOffset: true, backingTrackVolume: true,
        // backingTrackData excluded — fetched via /backing-track endpoint
        sessions: {
          where: { userId: req.userId! },
          orderBy: { startedAt: 'desc' },
          take: 10,
          select: { id: true, score: true, stars: true, accuracy: true, bpm: true, startedAt: true },
        },
      },
    })

    if (!exercise) { res.status(404).json({ error: 'Exercise not found' }); return }
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

  // PUT /api/exercises/:id — update an exercise (only user's own)
  router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = req.params.id as string
      const existing = await prisma.exercise.findUnique({ where: { id } })
      if (!existing) { res.status(404).json({ error: 'Not found' }); return }
      if (existing.isBuiltin || existing.userId !== req.userId) {
        res.status(403).json({ error: 'Cannot update this exercise' })
        return
      }

      const data = createExerciseSchema.partial().parse(req.body)
      const exercise = await prisma.exercise.update({
        where: { id },
        data: {
          ...data,
          patternData: data.patternData ? (data.patternData as any) : undefined,
          config: data.config !== undefined ? (data.config ?? undefined) : undefined,
        },
      })

      res.json({ exercise })
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid input', details: e.errors })
        return
      }
      console.error('Update exercise error:', e)
      res.status(500).json({ error: 'Failed to update exercise' })
    }
  })

  // POST /api/exercises/:id/backing-track — upload backing track as base64 JSON
  router.post('/:id/backing-track', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = req.params.id as string
      const exercise = await prisma.exercise.findUnique({ where: { id } })
      if (!exercise) { res.status(404).json({ error: 'Not found' }); return }
      if (exercise.isBuiltin || exercise.userId !== req.userId) {
        res.status(403).json({ error: 'Cannot modify this exercise' }); return
      }

      const { data: base64Data, name, mime, bpm, offset, volume } = req.body as {
        data: string; name: string; mime: string; bpm: number; offset: number; volume: number
      }

      if (!base64Data) { res.status(400).json({ error: 'No audio data' }); return }

      const audioBuffer = Buffer.from(base64Data, 'base64')
      console.log(`Backing track upload: ${name}, ${audioBuffer.length} bytes (${base64Data.length} base64 chars)`)

      await prisma.exercise.update({
        where: { id },
        data: {
          backingTrackData: new Uint8Array(audioBuffer),
          backingTrackName: name || 'backing-track.mp3',
          backingTrackMime: mime || 'audio/mpeg',
          backingTrackBpm: bpm || 90,
          backingTrackOffset: offset || 0,
          backingTrackVolume: volume || 0.7,
        },
      })

      res.json({ success: true })
    } catch (e) {
      console.error('Backing track upload error:', e)
      res.status(500).json({ error: 'Failed to upload backing track' })
    }
  })

  // GET /api/exercises/:id/backing-track — download backing track audio
  router.get('/:id/backing-track', authenticateToken, async (req: AuthRequest, res) => {
    const id = req.params.id as string
    const exercise = await prisma.exercise.findUnique({
      where: { id },
      select: {
        backingTrackData: true, backingTrackMime: true, backingTrackName: true,
        userId: true, isBuiltin: true,
      },
    })
    if (!exercise) { res.status(404).json({ error: 'Not found' }); return }
    if (!exercise.isBuiltin && exercise.userId !== req.userId) {
      res.status(403).json({ error: 'Access denied' }); return
    }
    if (!exercise.backingTrackData) {
      res.status(404).json({ error: 'No backing track' }); return
    }

    res.setHeader('Content-Type', exercise.backingTrackMime || 'audio/mpeg')
    res.setHeader('Content-Disposition', `inline; filename="${exercise.backingTrackName || 'backing-track.mp3'}"`)
    res.send(exercise.backingTrackData)
  })

  // DELETE /api/exercises/:id/backing-track — remove backing track
  router.delete('/:id/backing-track', authenticateToken, async (req: AuthRequest, res) => {
    const id = req.params.id as string
    const exercise = await prisma.exercise.findUnique({ where: { id } })
    if (!exercise) { res.status(404).json({ error: 'Not found' }); return }
    if (exercise.isBuiltin || exercise.userId !== req.userId) {
      res.status(403).json({ error: 'Cannot modify' }); return
    }

    await prisma.exercise.update({
      where: { id },
      data: {
        backingTrackData: null, backingTrackName: null, backingTrackMime: null,
        backingTrackBpm: null, backingTrackOffset: null, backingTrackVolume: null,
      },
    })
    res.json({ deleted: true })
  })

  // DELETE /api/exercises/:id
  router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
    const id = req.params.id as string
    const exercise = await prisma.exercise.findUnique({ where: { id } })
    if (!exercise) { res.status(404).json({ error: 'Not found' }); return }
    if (exercise.isBuiltin || exercise.userId !== req.userId) {
      res.status(403).json({ error: 'Cannot delete this exercise' })
      return
    }

    await prisma.exercise.delete({ where: { id } })
    res.json({ deleted: true })
  })

  return router
}
