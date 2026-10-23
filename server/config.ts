import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'interviewace_dev_jwt_secret_change_in_production_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbPath: process.env.DB_PATH || path.resolve(__dirname, '../data/interviewace.sqlite'),
  aiApiKey: process.env.AI_PROVIDER_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gemini-1.5-flash',
  aiBaseUrl: process.env.AI_PROVIDER_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/models/',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  isProduction: process.env.NODE_ENV === 'production',
}
