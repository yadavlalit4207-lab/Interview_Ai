import { Router, Response } from 'express'
import crypto from 'crypto'
import { db } from '../db'
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth'

const router = Router()

// GET /api/questions/bank - List question bank items with optional filters
router.get('/bank', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, difficulty, category, search } = req.query
    const userId = req.user?.id

    let query = 'SELECT * FROM question_bank WHERE 1=1'
    const params: any[] = []

    if (role && role !== 'All') {
      query += ' AND role LIKE ?'
      params.push(`%${role}%`)
    }

    if (difficulty && difficulty !== 'All') {
      query += ' AND difficulty = ?'
      params.push(difficulty)
    }

    if (category && category !== 'All') {
      query += ' AND category = ?'
      params.push(category)
    }

    if (search) {
      query += ' AND (question_text LIKE ? OR topic LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    query += ' ORDER BY created_at DESC'

    const stmt = db.prepare(query)
    const rows = stmt.all(...params) as any[]

    // Get user saved question IDs if logged in
    let savedIds = new Set<string>()
    if (userId) {
      const savedStmt = db.prepare('SELECT question_id FROM saved_questions WHERE user_id = ?')
      const savedRows = savedStmt.all(userId) as { question_id: string }[]
      savedIds = new Set(savedRows.map((r) => r.question_id))
    }

    const questions = rows.map((r) => ({
      ...r,
      hints: r.hints ? JSON.parse(r.hints) : [],
      expected_concepts: r.expected_concepts ? JSON.parse(r.expected_concepts) : [],
      is_saved: savedIds.has(r.id),
    }))

    res.json(questions)
  } catch (err: any) {
    console.error('List question bank error:', err)
    res.status(500).json({ error: 'Failed to retrieve question bank items.' })
  }
})

// GET /api/questions/saved - List user bookmarked questions
router.get('/saved', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const stmt = db.prepare(`
      SELECT qb.*
      FROM question_bank qb
      JOIN saved_questions sq ON qb.id = sq.question_id
      WHERE sq.user_id = ?
      ORDER BY sq.created_at DESC
    `)
    const rows = stmt.all(userId) as any[]

    const questions = rows.map((r) => ({
      ...r,
      hints: r.hints ? JSON.parse(r.hints) : [],
      expected_concepts: r.expected_concepts ? JSON.parse(r.expected_concepts) : [],
      is_saved: true,
    }))

    res.json(questions)
  } catch (err: any) {
    console.error('List saved questions error:', err)
    res.status(500).json({ error: 'Failed to retrieve saved questions.' })
  }
})

// POST /api/questions/saved/:questionId - Bookmark question
router.post('/saved/:questionId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const questionId = req.params.questionId as string

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const stmt = db.prepare(`
      INSERT INTO saved_questions (id, user_id, question_id, created_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, question_id) DO NOTHING
    `)
    stmt.run(id, userId, questionId, now)

    res.json({ message: 'Question saved successfully.', question_id: questionId, is_saved: true })
  } catch (err: any) {
    console.error('Save question error:', err)
    res.status(500).json({ error: 'Failed to save question.' })
  }
})

// DELETE /api/questions/saved/:questionId - Remove bookmark
router.delete('/saved/:questionId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const questionId = req.params.questionId as string

    db.prepare('DELETE FROM saved_questions WHERE user_id = ? AND question_id = ?').run(userId, questionId)

    res.json({ message: 'Question removed from saved list.', question_id: questionId, is_saved: false })
  } catch (err: any) {
    console.error('Unsave question error:', err)
    res.status(500).json({ error: 'Failed to remove saved question.' })
  }
})

export default router
