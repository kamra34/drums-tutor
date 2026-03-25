import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { authRouter } from './routes/auth'
import { exerciseRouter } from './routes/exercises'
import { sessionRouter } from './routes/sessions'
import { progressRouter } from './routes/progress'

const prisma = new PrismaClient()
const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRouter(prisma))
app.use('/api/exercises', exerciseRouter(prisma))
app.use('/api/sessions', sessionRouter(prisma))
app.use('/api/progress', progressRouter(prisma))

// Start
async function main() {
  await prisma.$connect()
  console.log('Database connected')

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`)
  })
}

main().catch((e) => {
  console.error('Failed to start:', e)
  process.exit(1)
})
