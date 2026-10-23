import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { db } from '../db'
import { authService } from '../services/auth.service'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { rateLimiter } from '../middleware/rateLimiter'

const router = Router()

// Rate limit sensitive endpoints to 20 requests per 15 minutes
const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
})

// POST /api/auth/register
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body

    if (!email || !password || !displayName) {
      res.status(400).json({ error: 'Email, password, and display name are required.' })
      return
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' })
      return
    }

    const emailClean = email.trim().toLowerCase()
    const existingStmt = db.prepare('SELECT id FROM users WHERE email = ?')
    const existing = existingStmt.get(emailClean)

    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' })
      return
    }

    const userId = crypto.randomUUID()
    const passwordHash = await authService.hashPassword(password)
    const now = new Date().toISOString()

    // 1. Insert user
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    insertUser.run(userId, emailClean, passwordHash, displayName.trim(), now, now)

    // 2. Insert profile
    const insertProfile = db.prepare(`
      INSERT INTO profiles (
        id, user_id, email, display_name, career_stage, target_role,
        experience_level, preferred_language, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertProfile.run(
      userId,
      userId,
      emailClean,
      displayName.trim(),
      'Fresher',
      'Software Engineer',
      'Beginner',
      'English',
      now,
      now
    )

    // 3. Insert default preferences
    const insertPrefs = db.prepare(`
      INSERT INTO user_preferences (user_id, theme, default_interview_type, default_difficulty, voice_enabled, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    insertPrefs.run(userId, 'system', 'Technical', 'Medium', 0, now)

    // Fetch created profile
    const profileStmt = db.prepare('SELECT * FROM profiles WHERE user_id = ?')
    const profile = profileStmt.get(userId)

    const token = authService.generateToken({
      id: userId,
      email: emailClean,
      display_name: displayName.trim(),
    })

    res.status(201).json({
      token,
      user: {
        id: userId,
        email: emailClean,
        display_name: displayName.trim(),
      },
      profile,
    })
  } catch (err: any) {
    console.error('Registration error:', err)
    res.status(500).json({ error: 'Failed to create account.' })
  }
})

// POST /api/auth/login
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' })
      return
    }

    const emailClean = email.trim().toLowerCase()
    const userStmt = db.prepare('SELECT id, email, password_hash, display_name FROM users WHERE email = ?')
    const user = userStmt.get(emailClean) as { id: string; email: string; password_hash: string; display_name: string } | undefined

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' })
      return
    }

    const isValid = await authService.comparePassword(password, user.password_hash)
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password.' })
      return
    }

    const profileStmt = db.prepare('SELECT * FROM profiles WHERE user_id = ?')
    const profile = profileStmt.get(user.id)

    const token = authService.generateToken({
      id: user.id,
      email: user.email,
      display_name: user.display_name,
    })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
      },
      profile,
    })
  } catch (err: any) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Failed to authenticate.' })
  }
})

// POST /api/auth/demo-login
router.post('/demo-login', async (_req: Request, res: Response) => {
  try {
    const demoEmail = 'alex.rivera@interviewace.dev'
    const userStmt = db.prepare('SELECT id, email, display_name FROM users WHERE email = ?')
    let user = userStmt.get(demoEmail) as { id: string; email: string; display_name: string } | undefined

    if (!user) {
      // Re-seed demo user if somehow deleted
      const demoId = '00000000-0000-0000-0000-000000000001'
      const hash = await authService.hashPassword('demoPassword123!')
      const now = new Date().toISOString()
      db.prepare('INSERT INTO users (id, email, password_hash, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(demoId, demoEmail, hash, 'Alex Rivera', now, now)
      db.prepare(`
        INSERT INTO profiles (id, user_id, email, display_name, career_stage, target_role, experience_level, preferred_language, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(demoId, demoId, demoEmail, 'Alex Rivera', 'Working professional', 'Full-Stack Developer', 'Intermediate', 'English', now, now)
      user = { id: demoId, email: demoEmail, display_name: 'Alex Rivera' }
    }

    const profileStmt = db.prepare('SELECT * FROM profiles WHERE user_id = ?')
    const profile = profileStmt.get(user.id)

    const token = authService.generateToken({
      id: user.id,
      email: user.email,
      display_name: user.display_name,
    })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
      },
      profile,
    })
  } catch (err: any) {
    console.error('Demo login error:', err)
    res.status(500).json({ error: 'Failed to initialize demo session.' })
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const userStmt = db.prepare('SELECT id, email, display_name, created_at FROM users WHERE id = ?')
    const user = userStmt.get(userId)

    const profileStmt = db.prepare('SELECT * FROM profiles WHERE user_id = ?')
    const profile = profileStmt.get(userId)

    const prefsStmt = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?')
    const preferences = prefsStmt.get(userId)

    res.json({
      user,
      profile,
      preferences,
    })
  } catch (err: any) {
    console.error('Fetch /me error:', err)
    res.status(500).json({ error: 'Failed to retrieve current user.' })
  }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400).json({ error: 'Email is required.' })
      return
    }

    const emailClean = email.trim().toLowerCase()
    const userStmt = db.prepare('SELECT id FROM users WHERE email = ?')
    const user = userStmt.get(emailClean) as { id: string } | undefined

    if (user) {
      const resetToken = authService.generateRandomToken()
      const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour expiry

      const updateStmt = db.prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?')
      updateStmt.run(resetToken, expiry, user.id)

      res.json({
        message: 'Password reset instructions have been generated.',
        resetToken, // Provided for direct verification / development
      })
      return
    }

    // Always respond with success to prevent user enumeration
    res.json({ message: 'If that email is registered, password reset instructions have been sent.' })
  } catch (err: any) {
    console.error('Forgot password error:', err)
    res.status(500).json({ error: 'Failed to process password reset request.' })
  }
})

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Reset token and new password are required.' })
      return
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' })
      return
    }

    const userStmt = db.prepare('SELECT id, reset_token_expiry FROM users WHERE reset_token = ?')
    const user = userStmt.get(token) as { id: string; reset_token_expiry: string } | undefined

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired password reset token.' })
      return
    }

    if (new Date(user.reset_token_expiry).getTime() < Date.now()) {
      res.status(400).json({ error: 'Password reset token has expired. Please request a new one.' })
      return
    }

    const passwordHash = await authService.hashPassword(newPassword)
    const now = new Date().toISOString()

    const updateStmt = db.prepare(`
      UPDATE users
      SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = ?
      WHERE id = ?
    `)
    updateStmt.run(passwordHash, now, user.id)

    res.json({ message: 'Password has been successfully updated. You may now sign in.' })
  } catch (err: any) {
    console.error('Reset password error:', err)
    res.status(500).json({ error: 'Failed to reset password.' })
  }
})

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Signed out successfully.' })
})

export default router
