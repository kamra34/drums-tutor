import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const updateProgressSchema = z.object({
  currentModule: z.string().optional(),
  completedLessons: z.array(z.string()).optional(),
  skillTiming: z.number().min(0).max(100).optional(),
  skillDynamics: z.number().min(0).max(100).optional(),
  skillIndependence: z.number().min(0).max(100).optional(),
  skillSpeed: z.number().min(0).max(100).optional(),
  skillMusicality: z.number().min(0).max(100).optional(),
})

export function progressRouter(prisma: PrismaClient): Router {
  const router = Router()

  // GET /api/progress — get user's progress
  router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    let progress = await prisma.userProgress.findUnique({
      where: { userId: req.userId! },
    })

    if (!progress) {
      progress = await prisma.userProgress.create({
        data: { userId: req.userId! },
      })
    }

    res.json({ progress })
  })

  // PATCH /api/progress — update progress
  router.patch('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = updateProgressSchema.parse(req.body)

      const progress = await prisma.userProgress.upsert({
        where: { userId: req.userId! },
        update: data,
        create: { userId: req.userId!, ...data },
      })

      res.json({ progress })
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid input', details: e.errors })
        return
      }
      console.error('Update progress error:', e)
      res.status(500).json({ error: 'Failed to update progress' })
    }
  })

  // POST /api/progress/complete-lesson — mark a lesson as complete
  router.post('/complete-lesson', authenticateToken, async (req: AuthRequest, res) => {
    const { lessonId } = req.body
    if (!lessonId || typeof lessonId !== 'string') {
      res.status(400).json({ error: 'lessonId required' })
      return
    }

    const progress = await prisma.userProgress.findUnique({
      where: { userId: req.userId! },
    })

    const current = progress?.completedLessons ?? []
    if (current.includes(lessonId)) {
      res.json({ progress })
      return
    }

    const updated = await prisma.userProgress.upsert({
      where: { userId: req.userId! },
      update: { completedLessons: [...current, lessonId] },
      create: { userId: req.userId!, completedLessons: [lessonId] },
    })

    res.json({ progress: updated })
  })

  return router
}
