import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import http from 'http'
import { app } from '../../server/app'
import { initializeDatabase } from '../../server/db'

let server: http.Server
let baseUrl: string

async function api(
  path: string,
  options?: {
    method?: string
    body?: any
    token?: string
  }
) {
  const method = options?.method || 'GET'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  })

  let data: any
  try {
    data = await res.json()
  } catch {
    data = null
  }

  return { status: res.status, body: data }
}

describe('Complete Backend & Authentication System', () => {
  beforeAll(async () => {
    initializeDatabase()
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any
        baseUrl = `http://127.0.0.1:${address.port}`
        resolve()
      })
    })
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve())
    })
  })

  it('responds to health check endpoint with system status', async () => {
    const res = await api('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.storage).toContain('SQLite')
  })

  it('registers a new user and returns JWT token and profile', async () => {
    const email = `testuser_${Date.now()}@example.com`
    const res = await api('/api/auth/register', {
      method: 'POST',
      body: {
        email,
        password: 'StrongPassword123!',
        displayName: 'Jordan Lee',
      },
    })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe(email)
    expect(res.body.user.display_name).toBe('Jordan Lee')
    expect(res.body.profile.target_role).toBe('Software Engineer')
  })

  it('rejects duplicate email registration with 409 Conflict', async () => {
    const email = `duplicate_${Date.now()}@example.com`
    await api('/api/auth/register', {
      method: 'POST',
      body: {
        email,
        password: 'Password123!',
        displayName: 'First User',
      },
    })

    const duplicateRes = await api('/api/auth/register', {
      method: 'POST',
      body: {
        email,
        password: 'DifferentPassword!',
        displayName: 'Second User',
      },
    })

    expect(duplicateRes.status).toBe(409)
    expect(duplicateRes.body.error).toMatch(/already exists/i)
  })

  it('authenticates valid credentials and rejects incorrect passwords', async () => {
    const email = `login_test_${Date.now()}@example.com`
    const password = 'CorrectPassword123!'

    await api('/api/auth/register', {
      method: 'POST',
      body: {
        email,
        password,
        displayName: 'Alex Candidate',
      },
    })

    // Wrong password
    const badRes = await api('/api/auth/login', {
      method: 'POST',
      body: {
        email,
        password: 'WrongPassword!',
      },
    })
    expect(badRes.status).toBe(401)

    // Correct password
    const goodRes = await api('/api/auth/login', {
      method: 'POST',
      body: {
        email,
        password,
      },
    })
    expect(goodRes.status).toBe(200)
    expect(goodRes.body.token).toBeDefined()
    expect(goodRes.body.user.email).toBe(email)
  })

  it('protects authenticated endpoints and returns 401 without valid token', async () => {
    const unauthRes = await api('/api/auth/me')
    expect(unauthRes.status).toBe(401)

    // With valid demo login
    const demoRes = await api('/api/auth/demo-login', { method: 'POST' })
    expect(demoRes.status).toBe(200)
    const token = demoRes.body.token

    const meRes = await api('/api/auth/me', { token })
    expect(meRes.status).toBe(200)
    expect(meRes.body.user.email).toBe('alex.rivera@interviewace.dev')
    expect(meRes.body.profile).toBeDefined()
  })

  it('supports full password reset flow with reset token', async () => {
    const email = `reset_user_${Date.now()}@example.com`
    await api('/api/auth/register', {
      method: 'POST',
      body: {
        email,
        password: 'OldPassword123!',
        displayName: 'Reset Candidate',
      },
    })

    // Request reset
    const forgotRes = await api('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
    })
    expect(forgotRes.status).toBe(200)
    const resetToken = forgotRes.body.resetToken
    expect(resetToken).toBeDefined()

    // Apply new password
    const resetRes = await api('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: resetToken,
        newPassword: 'BrandNewPassword456!',
      },
    })
    expect(resetRes.status).toBe(200)

    // Login with new password
    const loginRes = await api('/api/auth/login', {
      method: 'POST',
      body: {
        email,
        password: 'BrandNewPassword456!',
      },
    })
    expect(loginRes.status).toBe(200)
  })

  it('manages interview session creation, question generation, and answer submission', async () => {
    const email = `session_user_${Date.now()}@example.com`
    const regRes = await api('/api/auth/register', {
      method: 'POST',
      body: {
        email,
        password: 'Password123!',
        displayName: 'Interview Tester',
      },
    })
    const token = regRes.body.token

    // Create session
    const createSessionRes = await api('/api/sessions', {
      method: 'POST',
      body: {
        role: 'Frontend Developer',
        interview_type: 'Technical',
        experience_level: 'Intermediate',
        difficulty: 'Medium',
        question_count: 2,
      },
      token,
    })

    expect(createSessionRes.status).toBe(201)
    expect(createSessionRes.body.id).toBeDefined()
    expect(createSessionRes.body.questions.length).toBeGreaterThan(0)

    const sessionId = createSessionRes.body.id
    const questionId = createSessionRes.body.questions[0].id

    // Submit answer
    const answerRes = await api(`/api/sessions/${sessionId}/answers`, {
      method: 'POST',
      body: {
        question_id: questionId,
        answer_text:
          'React maintains an in-memory Virtual DOM tree representation of the UI. When state or props update, React constructs a new VDOM tree and diffs it with the previous snapshot using an O(n) heuristic diffing algorithm. Stable persistent keys allow React to uniquely track identity across renders so that list elements are reused rather than destroyed and recreated, preserving local DOM state and performance.',
        duration_seconds: 45,
      },
      token,
    })

    expect(answerRes.status).toBe(201)
    expect(answerRes.body.score).toBeGreaterThan(50)
    expect(answerRes.body.feedback_json.dimensionScores.relevance).toBeGreaterThan(50)

    // Evaluate whole session
    const evalRes = await api(`/api/sessions/${sessionId}/evaluate`, {
      method: 'POST',
      token,
    })
    expect(evalRes.status).toBe(200)
    expect(evalRes.body.status).toBe('Completed')
    expect(evalRes.body.summary_feedback.rubricTier).toBeDefined()
    expect(evalRes.body.summary_feedback.actionableImprovementPlan.length).toBe(3)
  })

  it('enforces strict cross-user isolation on interview sessions', async () => {
    // User A
    const userA = await api('/api/auth/register', {
      method: 'POST',
      body: {
        email: `user_a_${Date.now()}@example.com`,
        password: 'Password123!',
        displayName: 'User A',
      },
    })
    const tokenA = userA.body.token

    // User B
    const userB = await api('/api/auth/register', {
      method: 'POST',
      body: {
        email: `user_b_${Date.now()}@example.com`,
        password: 'Password123!',
        displayName: 'User B',
      },
    })
    const tokenB = userB.body.token

    // User A creates session
    const sessionRes = await api('/api/sessions', {
      method: 'POST',
      body: {
        role: 'Backend Developer',
        interview_type: 'Technical',
        experience_level: 'Intermediate',
        difficulty: 'Hard',
        question_count: 2,
      },
      token: tokenA,
    })
    const sessionId = sessionRes.body.id

    // User A can access
    const ownRes = await api(`/api/sessions/${sessionId}`, { token: tokenA })
    expect(ownRes.status).toBe(200)

    // User B attempts to access User A's session -> must be rejected with 403 Forbidden
    const forbiddenRes = await api(`/api/sessions/${sessionId}`, { token: tokenB })
    expect(forbiddenRes.status).toBe(403)
  })

  it('supports question bank search and bookmarking', async () => {
    const demo = await api('/api/auth/demo-login', { method: 'POST' })
    const token = demo.body.token

    // Get question bank
    const bankRes = await api('/api/questions/bank?role=Frontend', { token })
    expect(bankRes.status).toBe(200)
    expect(Array.isArray(bankRes.body)).toBe(true)
    expect(bankRes.body.length).toBeGreaterThan(0)

    const questionId = bankRes.body[0].id

    // Bookmark question
    const saveRes = await api(`/api/questions/saved/${questionId}`, {
      method: 'POST',
      token,
    })
    expect(saveRes.status).toBe(200)
    expect(saveRes.body.is_saved).toBe(true)

    // Unbookmark question
    const unsaveRes = await api(`/api/questions/saved/${questionId}`, {
      method: 'DELETE',
      token,
    })
    expect(unsaveRes.status).toBe(200)
    expect(unsaveRes.body.is_saved).toBe(false)
  })

  it('supports user profile and preferences updates', async () => {
    const demo = await api('/api/auth/demo-login', { method: 'POST' })
    const token = demo.body.token

    // Update profile
    const updateProfileRes = await api('/api/profile', {
      method: 'PUT',
      body: {
        target_role: 'Lead AI Engineer',
        experience_level: 'Advanced',
      },
      token,
    })
    expect(updateProfileRes.status).toBe(200)
    expect(updateProfileRes.body.target_role).toBe('Lead AI Engineer')

    // Update preferences
    const updatePrefsRes = await api('/api/preferences', {
      method: 'PUT',
      body: {
        theme: 'dark',
        voice_enabled: true,
      },
      token,
    })
    expect(updatePrefsRes.status).toBe(200)
    expect(updatePrefsRes.body.theme).toBe('dark')
    expect(updatePrefsRes.body.voice_enabled).toBe(true)
  })
})
