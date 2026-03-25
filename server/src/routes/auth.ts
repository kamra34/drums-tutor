import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { signToken, authenticateToken, AuthRequest } from '../middleware/auth'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1).max(50),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export function authRouter(prisma: PrismaClient): Router {
  const router = Router()

  // POST /api/auth/register
  router.post('/register', async (req, res) => {
    try {
      const { email, password, displayName } = registerSchema.parse(req.body)

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        res.status(409).json({ error: 'Email already registered' })
        return
      }

      const passwordHash = await bcrypt.hash(password, 12)
      const user = await prisma.user.create({
        data: { email, passwordHash, displayName },
      })

      // Create initial progress
      await prisma.userProgress.create({
        data: { userId: user.id },
      })

      const token = signToken(user.id)
      res.status(201).json({
        token,
        user: { id: user.id, email: user.email, displayName: user.displayName },
      })
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid input', details: e.errors })
        return
      }
      console.error('Register error:', e)
      res.status(500).json({ error: 'Registration failed' })
    }
  })

  // POST /api/auth/login
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body)

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' })
        return
      }

      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        res.status(401).json({ error: 'Invalid email or password' })
        return
      }

      const token = signToken(user.id)
      res.json({
        token,
        user: { id: user.id, email: user.email, displayName: user.displayName },
      })
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid input' })
        return
      }
      console.error('Login error:', e)
      res.status(500).json({ error: 'Login failed' })
    }
  })

  // GET /api/auth/me
  router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, email: true, displayName: true, createdAt: true },
    })
    if (!user) { res.status(404).json({ error: 'User not found' }); return }
    res.json({ user })
  })

  return router
}
