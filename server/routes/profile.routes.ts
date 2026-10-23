import { Router, Response } from 'express'
import { db } from '../db'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'

const router = Router()

// GET /api/profile
router.get('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const stmt = db.prepare('SELECT * FROM profiles WHERE user_id = ?')
    const profile = stmt.get(userId)

    if (!profile) {
      res.status(404).json({ error: 'Profile not found.' })
      return
    }

    res.json(profile)
  } catch (err: any) {
    console.error('Fetch profile error:', err)
    res.status(500).json({ error: 'Failed to retrieve profile.' })
  }
})

// PUT /api/profile
router.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const {
      display_name,
      career_stage,
      target_role,
      experience_level,
      preferred_language,
      target_company,
      preparation_goals,
    } = req.body

    const now = new Date().toISOString()

    const updateProfileStmt = db.prepare(`
      UPDATE profiles
      SET
        display_name = COALESCE(?, display_name),
        career_stage = COALESCE(?, career_stage),
        target_role = COALESCE(?, target_role),
        experience_level = COALESCE(?, experience_level),
        preferred_language = COALESCE(?, preferred_language),
        target_company = ?,
        preparation_goals = ?,
        updated_at = ?
      WHERE user_id = ?
    `)

    updateProfileStmt.run(
      display_name ?? null,
      career_stage ?? null,
      target_role ?? null,
      experience_level ?? null,
      preferred_language ?? null,
      target_company ?? null,
      preparation_goals ?? null,
      now,
      userId
    )

    // Also update display_name in users table if provided
    if (display_name) {
      db.prepare('UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?').run(
        display_name,
        now,
        userId
      )
    }

    const updated = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId)
    res.json(updated)
  } catch (err: any) {
    console.error('Update profile error:', err)
    res.status(500).json({ error: 'Failed to update profile.' })
  }
})

// GET /api/preferences
router.get('/preferences', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const stmt = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?')
    let prefs = stmt.get(userId) as any

    if (!prefs) {
      const now = new Date().toISOString()
      db.prepare(`
        INSERT INTO user_preferences (user_id, theme, default_interview_type, default_difficulty, voice_enabled, updated_at)
        VALUES (?, 'system', 'Technical', 'Medium', 0, ?)
      `).run(userId, now)
      prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId)
    }

    res.json({
      ...prefs,
      voice_enabled: Boolean(prefs.voice_enabled),
    })
  } catch (err: any) {
    console.error('Fetch preferences error:', err)
    res.status(500).json({ error: 'Failed to retrieve preferences.' })
  }
})

// PUT /api/preferences
router.put('/preferences', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { theme, default_interview_type, default_difficulty, voice_enabled } = req.body
    const now = new Date().toISOString()

    const updateStmt = db.prepare(`
      INSERT INTO user_preferences (user_id, theme, default_interview_type, default_difficulty, voice_enabled, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        theme = excluded.theme,
        default_interview_type = excluded.default_interview_type,
        default_difficulty = excluded.default_difficulty,
        voice_enabled = excluded.voice_enabled,
        updated_at = excluded.updated_at
    `)

    updateStmt.run(
      userId,
      theme || 'system',
      default_interview_type || 'Technical',
      default_difficulty || 'Medium',
      voice_enabled ? 1 : 0,
      now
    )

    const updated = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId) as any
    res.json({
      ...updated,
      voice_enabled: Boolean(updated.voice_enabled),
    })
  } catch (err: any) {
    console.error('Update preferences error:', err)
    res.status(500).json({ error: 'Failed to update preferences.' })
  }
})

// DELETE /api/user/data - Comprehensive data purge for privacy & isolation
router.delete('/user/data', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id

    // With ON DELETE CASCADE enabled on tables, deleting sessions and user records will cleanly purge everything
    db.prepare('DELETE FROM saved_questions WHERE user_id = ?').run(userId)
    db.prepare('DELETE FROM interview_sessions WHERE user_id = ?').run(userId)

    res.json({ message: 'User interview history and personal records have been successfully purged.' })
  } catch (err: any) {
    console.error('Delete user data error:', err)
    res.status(500).json({ error: 'Failed to purge user records.' })
  }
})

export default router
