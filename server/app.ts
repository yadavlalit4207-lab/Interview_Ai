import express from 'express'
import cors from 'cors'
import { config } from './config'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth.routes'
import profileRoutes from './routes/profile.routes'
import sessionsRoutes from './routes/sessions.routes'
import questionsRoutes from './routes/questions.routes'
import analyticsRoutes from './routes/analytics.routes'
import { aiService } from './services/ai.service'

export const app = express()

// Middleware
app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin,
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: aiService.isConfigured(),
    aiModel: config.aiModel,
    storage: 'SQLite persistent engine',
  })
})

// Route mounting
app.use('/api/auth', authRoutes)
app.use('/api', profileRoutes)
app.use('/api/sessions', sessionsRoutes)
app.use('/api/questions', questionsRoutes)
app.use('/api/analytics', analyticsRoutes)

// 404 handler for API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' })
})

// Error handling middleware
app.use(errorHandler)
