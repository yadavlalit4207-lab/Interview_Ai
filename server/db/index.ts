import { DatabaseSync } from 'node:sqlite'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import { config } from '../config'
import { SEED_QUESTIONS } from './seed'

// Ensure database directory exists
const dbDir = path.dirname(config.dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

export const db = new DatabaseSync(config.dbPath)

// Initialize database pragmas
db.exec('PRAGMA foreign_keys = ON;')
db.exec('PRAGMA journal_mode = WAL;')

// Initialize schema tables
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      reset_token TEXT,
      reset_token_expiry TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      display_name TEXT NOT NULL,
      career_stage TEXT NOT NULL DEFAULT 'Working professional',
      target_role TEXT NOT NULL DEFAULT 'Software Engineer',
      experience_level TEXT NOT NULL DEFAULT 'Intermediate',
      preferred_language TEXT NOT NULL DEFAULT 'English',
      target_company TEXT,
      preparation_goals TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      theme TEXT NOT NULL DEFAULT 'system',
      default_interview_type TEXT NOT NULL DEFAULT 'Technical',
      default_difficulty TEXT NOT NULL DEFAULT 'Medium',
      voice_enabled INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS interview_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      interview_type TEXT NOT NULL,
      experience_level TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      target_company TEXT,
      job_description TEXT,
      skills_focus TEXT,
      language TEXT NOT NULL DEFAULT 'English',
      candidate_background TEXT,
      status TEXT NOT NULL DEFAULT 'Draft',
      question_count INTEGER NOT NULL DEFAULT 5,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      overall_score REAL,
      evaluation_version TEXT DEFAULT 'v1',
      summary_feedback TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS interview_questions (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      topic_tags TEXT,
      expected_concepts TEXT,
      question_type TEXT NOT NULL,
      hints TEXT,
      example_solution TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS interview_answers (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
      answer_text TEXT NOT NULL,
      transcript TEXT,
      duration_seconds INTEGER,
      submitted_at TEXT NOT NULL,
      score REAL,
      feedback_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_questions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, question_id)
    );

    CREATE TABLE IF NOT EXISTS question_bank (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      topic TEXT NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      hints TEXT,
      expected_concepts TEXT,
      example_solution TEXT,
      created_at TEXT NOT NULL
    );

    -- Indices for performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON interview_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_questions_session ON interview_questions(session_id);
    CREATE INDEX IF NOT EXISTS idx_answers_session ON interview_answers(session_id);
    CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_questions(user_id);
  `)

  seedDefaultData()
}

function seedDefaultData() {
  // 1. Seed Question Bank if empty
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM question_bank')
  const result = countStmt.get() as { count: number }
  if (result.count === 0) {
    const insertQuestionStmt = db.prepare(`
      INSERT INTO question_bank (
        id, role, category, difficulty, topic, question_text, question_type, hints, expected_concepts, example_solution, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const q of SEED_QUESTIONS) {
      insertQuestionStmt.run(
        q.id,
        q.role,
        q.category,
        q.difficulty,
        q.topic,
        q.question_text,
        q.question_type,
        JSON.stringify(q.hints),
        JSON.stringify(q.expected_concepts),
        q.example_solution,
        new Date().toISOString()
      )
    }
  }

  // 2. Seed Default Demo User if not exists
  const demoEmail = 'alex.rivera@interviewace.dev'
  const userCheckStmt = db.prepare('SELECT id FROM users WHERE email = ?')
  const existingUser = userCheckStmt.get(demoEmail)

  if (!existingUser) {
    const demoId = '00000000-0000-0000-0000-000000000001'
    const passwordHash = bcrypt.hashSync('demoPassword123!', 10)
    const now = new Date().toISOString()

    const insertUserStmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    insertUserStmt.run(demoId, demoEmail, passwordHash, 'Alex Rivera', now, now)

    const insertProfileStmt = db.prepare(`
      INSERT INTO profiles (
        id, user_id, email, display_name, career_stage, target_role,
        experience_level, preferred_language, target_company, preparation_goals, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertProfileStmt.run(
      demoId,
      demoId,
      demoEmail,
      'Alex Rivera',
      'Working professional',
      'Full-Stack Developer',
      'Intermediate',
      'English',
      'Top Tech / High-Growth SaaS',
      'Master distributed systems design and behavioral STAR responses.',
      now,
      now
    )

    const insertPrefStmt = db.prepare(`
      INSERT INTO user_preferences (user_id, theme, default_interview_type, default_difficulty, voice_enabled, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    insertPrefStmt.run(demoId, 'system', 'Technical', 'Medium', 0, now)
  }
}
