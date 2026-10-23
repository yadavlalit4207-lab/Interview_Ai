import { Router, Response } from 'express'
import crypto from 'crypto'
import { db } from '../db'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { aiService, SessionConfig } from '../services/ai.service'

const router = Router()

// GET /api/sessions - List user sessions
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const stmt = db.prepare(`
      SELECT * FROM interview_sessions
      WHERE user_id = ?
      ORDER BY started_at DESC
    `)
    const rows = stmt.all(userId) as any[]

    const sessions = rows.map((r) => ({
      ...r,
      skills_focus: r.skills_focus ? JSON.parse(r.skills_focus) : [],
      summary_feedback: r.summary_feedback ? JSON.parse(r.summary_feedback) : null,
    }))

    res.json(sessions)
  } catch (err: any) {
    console.error('List sessions error:', err)
    res.status(500).json({ error: 'Failed to retrieve interview sessions.' })
  }
})

// POST /api/sessions - Create session and generate questions
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const {
      role = 'Full-Stack Developer',
      interview_type = 'Technical',
      experience_level = 'Intermediate',
      difficulty = 'Medium',
      question_count = 5,
      target_company,
      job_description,
      skills_focus = [],
      language = 'English',
      candidate_background,
    } = req.body

    const sessionId = crypto.randomUUID()
    const now = new Date().toISOString()

    // 1. Generate questions
    const sessionConfig: SessionConfig = {
      role,
      interviewType: interview_type,
      experienceLevel: experience_level,
      difficulty,
      questionCount: Math.min(10, Math.max(1, question_count)),
      targetCompany: target_company,
      jobDescription: job_description,
      skillsFocus: skills_focus,
      language,
      candidateBackground: candidate_background,
    }

    const generatedQuestions = await aiService.generateQuestions(sessionConfig)

    // 2. Insert session
    const insertSession = db.prepare(`
      INSERT INTO interview_sessions (
        id, user_id, role, interview_type, experience_level, difficulty,
        target_company, job_description, skills_focus, language, candidate_background,
        status, question_count, started_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertSession.run(
      sessionId,
      userId,
      role,
      interview_type,
      experience_level,
      difficulty,
      target_company || null,
      job_description || null,
      JSON.stringify(skills_focus),
      language,
      candidate_background || null,
      'Preparing',
      generatedQuestions.length,
      now,
      now,
      now
    )

    // 3. Insert questions
    const insertQuestion = db.prepare(`
      INSERT INTO interview_questions (
        id, session_id, position, question_text, category, difficulty,
        topic_tags, expected_concepts, question_type, hints, example_solution, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const questionsWithIds = generatedQuestions.map((q, idx) => {
      const qId = q.id || crypto.randomUUID()
      insertQuestion.run(
        qId,
        sessionId,
        idx + 1,
        q.question_text,
        q.category,
        q.difficulty,
        JSON.stringify(q.topic_tags || []),
        JSON.stringify(q.expected_concepts || []),
        q.question_type,
        JSON.stringify(q.hints || []),
        q.example_solution || null,
        now
      )

      return {
        id: qId,
        session_id: sessionId,
        position: idx + 1,
        question_text: q.question_text,
        category: q.category,
        difficulty: q.difficulty,
        topic_tags: q.topic_tags || [],
        expected_concepts: q.expected_concepts || [],
        question_type: q.question_type,
        hints: q.hints || [],
        example_solution: q.example_solution || null,
        created_at: now,
      }
    })

    // Return complete session object
    const createdSession = {
      id: sessionId,
      user_id: userId,
      role,
      interview_type,
      experience_level,
      difficulty,
      target_company: target_company || null,
      job_description: job_description || null,
      skills_focus,
      language,
      candidate_background: candidate_background || null,
      status: 'Preparing',
      question_count: questionsWithIds.length,
      started_at: now,
      created_at: now,
      updated_at: now,
      questions: questionsWithIds,
      answers: [],
    }

    res.status(201).json(createdSession)
  } catch (err: any) {
    console.error('Create session error:', err)
    res.status(500).json({ error: 'Failed to create interview session.' })
  }
})

// GET /api/sessions/:id - Get session details (with questions and answers)
router.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const sessionId = req.params.id as string

    const sessionStmt = db.prepare('SELECT * FROM interview_sessions WHERE id = ?')
    const session = sessionStmt.get(sessionId) as any

    if (!session) {
      res.status(404).json({ error: 'Interview session not found.' })
      return
    }

    // Strict cross-user isolation
    if (session.user_id !== userId) {
      res.status(403).json({ error: 'Access denied. You do not have permission to view this interview session.' })
      return
    }

    // Fetch questions
    const qStmt = db.prepare('SELECT * FROM interview_questions WHERE session_id = ? ORDER BY position ASC')
    const qRows = qStmt.all(sessionId) as any[]
    const questions = qRows.map((q) => ({
      ...q,
      topic_tags: q.topic_tags ? JSON.parse(q.topic_tags) : [],
      expected_concepts: q.expected_concepts ? JSON.parse(q.expected_concepts) : [],
      hints: q.hints ? JSON.parse(q.hints) : [],
    }))

    // Fetch answers
    const aStmt = db.prepare('SELECT * FROM interview_answers WHERE session_id = ? ORDER BY submitted_at ASC')
    const aRows = aStmt.all(sessionId) as any[]
    const answers = aRows.map((a) => ({
      ...a,
      feedback_json: a.feedback_json ? JSON.parse(a.feedback_json) : null,
    }))

    res.json({
      ...session,
      skills_focus: session.skills_focus ? JSON.parse(session.skills_focus) : [],
      summary_feedback: session.summary_feedback ? JSON.parse(session.summary_feedback) : null,
      questions,
      answers,
    })
  } catch (err: any) {
    console.error('Get session error:', err)
    res.status(500).json({ error: 'Failed to retrieve session details.' })
  }
})

// PUT /api/sessions/:id - Update session
router.put('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const sessionId = req.params.id as string
    const { status, overall_score, summary_feedback } = req.body

    const sessionStmt = db.prepare('SELECT user_id FROM interview_sessions WHERE id = ?')
    const session = sessionStmt.get(sessionId) as { user_id: string } | undefined

    if (!session) {
      res.status(404).json({ error: 'Interview session not found.' })
      return
    }

    if (session.user_id !== userId) {
      res.status(403).json({ error: 'Access denied.' })
      return
    }

    const now = new Date().toISOString()
    const updateStmt = db.prepare(`
      UPDATE interview_sessions
      SET
        status = COALESCE(?, status),
        overall_score = COALESCE(?, overall_score),
        summary_feedback = COALESCE(?, summary_feedback),
        completed_at = CASE WHEN ? = 'Completed' THEN ? ELSE completed_at END,
        updated_at = ?
      WHERE id = ?
    `)

    updateStmt.run(
      status ?? null,
      overall_score ?? null,
      summary_feedback ? JSON.stringify(summary_feedback) : null,
      status,
      now,
      now,
      sessionId
    )

    const updated = db.prepare('SELECT * FROM interview_sessions WHERE id = ?').get(sessionId) as any
    res.json({
      ...updated,
      skills_focus: updated.skills_focus ? JSON.parse(updated.skills_focus) : [],
      summary_feedback: updated.summary_feedback ? JSON.parse(updated.summary_feedback) : null,
    })
  } catch (err: any) {
    console.error('Update session error:', err)
    res.status(500).json({ error: 'Failed to update interview session.' })
  }
})

// DELETE /api/sessions/:id - Delete session
router.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const sessionId = req.params.id as string

    const sessionStmt = db.prepare('SELECT user_id FROM interview_sessions WHERE id = ?')
    const session = sessionStmt.get(sessionId) as { user_id: string } | undefined

    if (!session) {
      res.status(404).json({ error: 'Interview session not found.' })
      return
    }

    if (session.user_id !== userId) {
      res.status(403).json({ error: 'Access denied.' })
      return
    }

    db.prepare('DELETE FROM interview_sessions WHERE id = ?').run(sessionId)
    res.json({ message: 'Session deleted successfully.' })
  } catch (err: any) {
    console.error('Delete session error:', err)
    res.status(500).json({ error: 'Failed to delete session.' })
  }
})

// POST /api/sessions/:id/answers - Submit answer
router.post('/:id/answers', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const sessionId = req.params.id as string
    const { question_id, answer_text, transcript, duration_seconds } = req.body

    if (!question_id || !answer_text) {
      res.status(400).json({ error: 'question_id and answer_text are required.' })
      return
    }

    // Verify session ownership
    const session = db.prepare('SELECT user_id FROM interview_sessions WHERE id = ?').get(sessionId) as { user_id: string } | undefined
    if (!session) {
      res.status(404).json({ error: 'Session not found.' })
      return
    }
    if (session.user_id !== userId) {
      res.status(403).json({ error: 'Access denied.' })
      return
    }

    // Fetch question to evaluate
    const question = db.prepare('SELECT * FROM interview_questions WHERE id = ? AND session_id = ?').get(question_id, sessionId) as any
    if (!question) {
      res.status(404).json({ error: 'Question not found in this session.' })
      return
    }

    // Evaluate answer via AI/Rubric
    const evaluation = await aiService.evaluateAnswer({
      questionText: question.question_text,
      category: question.category,
      questionType: question.question_type,
      expectedConcepts: question.expected_concepts ? JSON.parse(question.expected_concepts) : [],
      candidateAnswer: answer_text,
      exampleSolution: question.example_solution,
      durationSeconds: duration_seconds,
    })

    const answerId = crypto.randomUUID()
    const now = new Date().toISOString()

    const insertAnswer = db.prepare(`
      INSERT INTO interview_answers (
        id, session_id, question_id, answer_text, transcript, duration_seconds,
        submitted_at, score, feedback_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertAnswer.run(
      answerId,
      sessionId,
      question_id,
      answer_text,
      transcript || null,
      duration_seconds || null,
      now,
      evaluation.overallScore,
      JSON.stringify(evaluation),
      now,
      now
    )

    // Update session status to In progress
    db.prepare("UPDATE interview_sessions SET status = 'In progress', updated_at = ? WHERE id = ?").run(now, sessionId)

    res.status(201).json({
      id: answerId,
      session_id: sessionId,
      question_id,
      answer_text,
      transcript: transcript || null,
      duration_seconds: duration_seconds || null,
      submitted_at: now,
      score: evaluation.overallScore,
      feedback_json: evaluation,
      created_at: now,
      updated_at: now,
    })
  } catch (err: any) {
    console.error('Submit answer error:', err)
    res.status(500).json({ error: 'Failed to submit and evaluate answer.' })
  }
})

// POST /api/sessions/:id/evaluate - Finish interview session and evaluate summary
router.post('/:id/evaluate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const sessionId = req.params.id as string

    const session = db.prepare('SELECT * FROM interview_sessions WHERE id = ?').get(sessionId) as any
    if (!session) {
      res.status(404).json({ error: 'Session not found.' })
      return
    }
    if (session.user_id !== userId) {
      res.status(403).json({ error: 'Access denied.' })
      return
    }

    const questions = db.prepare('SELECT * FROM interview_questions WHERE session_id = ? ORDER BY position ASC').all(sessionId) as any[]
    const answers = db.prepare('SELECT * FROM interview_answers WHERE session_id = ?').all(sessionId) as any[]

    const qaPairs = questions.map((q) => {
      const ans = answers.find((a) => a.question_id === q.id)
      const feedback = ans?.feedback_json ? JSON.parse(ans.feedback_json) : null
      return {
        questionText: q.question_text,
        category: q.category,
        answerText: ans ? ans.answer_text : '',
        score: ans ? ans.score : 0,
        missingConcepts: feedback ? feedback.missingConcepts : [],
      }
    })

    const summary = await aiService.evaluateSession({
      role: session.role,
      interviewType: session.interview_type,
      experienceLevel: session.experience_level,
      difficulty: session.difficulty,
      qaPairs,
    })

    const now = new Date().toISOString()
    db.prepare(`
      UPDATE interview_sessions
      SET
        status = 'Completed',
        completed_at = ?,
        overall_score = ?,
        summary_feedback = ?,
        updated_at = ?
      WHERE id = ?
    `).run(now, summary.overallScore, JSON.stringify(summary), now, sessionId)

    const updated = db.prepare('SELECT * FROM interview_sessions WHERE id = ?').get(sessionId) as any

    res.json({
      ...updated,
      skills_focus: updated.skills_focus ? JSON.parse(updated.skills_focus) : [],
      summary_feedback: summary,
    })
  } catch (err: any) {
    console.error('Evaluate session error:', err)
    res.status(500).json({ error: 'Failed to complete and evaluate session.' })
  }
})

export default router
