import { app } from './app'
import { config } from './config'
import { initializeDatabase } from './db'

// Initialize SQLite database and tables
initializeDatabase()

const server = app.listen(config.port, () => {
  console.log(`
=====================================================
 InterviewAce Backend Server Running
 Port:          ${config.port}
 Health Check:  http://localhost:${config.port}/api/health
 Environment:   ${process.env.NODE_ENV || 'development'}
 Auth Provider: JWT + SQLite Native Store
 AI Provider:   ${config.aiApiKey ? 'Gemini API Enabled' : 'Deterministic Rubric Engine'}
=====================================================
`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
  })
})
