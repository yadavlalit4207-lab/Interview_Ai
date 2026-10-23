import { describe, it, expect, beforeEach } from 'vitest'
import { storageService } from '@/lib/storageService'
import { InterviewConfig } from '@/types'

describe('Security & Cross-User Isolation', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('strictly rejects access when User A attempts to view User B session', async () => {
    const userA_Id = 'user-a-1111-1111'
    const userB_Id = 'user-b-2222-2222'

    const config: InterviewConfig = {
      role: 'Backend Developer',
      interview_type: 'Technical',
      experience_level: 'Intermediate',
      difficulty: 'Hard',
      question_count: 5,
      language: 'English',
    }

    // User A creates a session
    const sessionA = await storageService.createSession(userA_Id, config)
    expect(sessionA.id).toBeDefined()

    // User A can access their own session
    const fetchedOwn = await storageService.getSessionById(sessionA.id, userA_Id)
    expect(fetchedOwn).not.toBeNull()
    expect(fetchedOwn?.user_id).toBe(userA_Id)

    // User B attempts to access User A's session -> must throw error
    await expect(storageService.getSessionById(sessionA.id, userB_Id)).rejects.toThrow(
      /Access denied/i
    )
  })

  it('ensures no secret backend keys or service role tokens are present in client environment', () => {
    // Frontend should only expose VITE_ prefixed public variables
    const clientEnv = import.meta.env

    expect(clientEnv.AI_PROVIDER_API_KEY).toBeUndefined()
    expect(clientEnv.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined()
    expect(clientEnv.DATABASE_PASSWORD).toBeUndefined()
  })

  it('purges all associated personal records upon deleteUserData request', async () => {
    const userId = 'user-delete-test-3333'
    const config: InterviewConfig = {
      role: 'Frontend Developer',
      interview_type: 'Technical',
      experience_level: 'Beginner',
      difficulty: 'Easy',
      question_count: 5,
      language: 'English',
    }

    await storageService.createSession(userId, config)
    const sessionsBefore = await storageService.getUserSessions(userId)
    expect(sessionsBefore.length).toBe(1)

    // Delete user data
    await storageService.deleteUserData(userId)

    const sessionsAfter = await storageService.getUserSessions(userId)
    expect(sessionsAfter.length).toBe(0)
  })
})
