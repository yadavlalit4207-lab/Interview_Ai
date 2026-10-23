import { describe, it, expect, beforeEach } from 'vitest'
import { storageService } from '@/lib/storageService'
import { aiService } from '@/lib/aiService'
import { InterviewConfig, InterviewAnswer } from '@/types'

describe('End-to-End Interview Workflow Engine', () => {
  const userId = 'candidate-test-4444'

  beforeEach(() => {
    localStorage.clear()
  })

  it('generates role-appropriate questions matching difficulty and experience', async () => {
    const config: InterviewConfig = {
      role: 'Frontend Developer',
      interview_type: 'Technical',
      experience_level: 'Intermediate',
      difficulty: 'Hard',
      question_count: 5,
      language: 'English',
    }

    const session = await storageService.createSession(userId, config)
    const { data: questions } = await aiService.generateQuestions(session.id, config)

    expect(questions.length).toBe(5)
    expect(questions[0].session_id).toBe(session.id)
    expect(questions[0].difficulty).toBe('Hard')
    expect(questions[0].question_text.length).toBeGreaterThan(15)
    expect(questions[0].expected_concepts.length).toBeGreaterThan(0)
  })

  it('records answers, scores them with rubric, and finalizes evaluation report', async () => {
    const config: InterviewConfig = {
      role: 'Backend Developer',
      interview_type: 'Technical',
      experience_level: 'Intermediate',
      difficulty: 'Medium',
      question_count: 2,
      language: 'English',
    }

    // 1. Create Session & Questions
    const session = await storageService.createSession(userId, config)
    const { data: questions } = await aiService.generateQuestions(session.id, config)
    await storageService.saveQuestions(questions)

    // 2. Submit Answers for all questions
    const answerList: InterviewAnswer[] = []
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const answerText = `For question ${i + 1}, we need to analyze database indexing tradeoffs. B-tree indexes provide O(log n) lookup, but every write operation causes write amplification and leaf page balancing.`

      const { data: evalResult } = await aiService.evaluateAnswer(q, answerText, 45, config.role)

      const answer: InterviewAnswer = {
        id: crypto.randomUUID(),
        session_id: session.id,
        question_id: q.id,
        answer_text: answerText,
        duration_seconds: 45,
        submitted_at: new Date().toISOString(),
        score: evalResult.overallScore,
        feedback_json: evalResult,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await storageService.saveAnswer(answer)
      answerList.push(answer)
    }

    // 3. Finalize Session Evaluation
    const { data: finalReport } = await aiService.evaluateSession(session, questions, answerList)
    await storageService.saveSessionEvaluation(session.id, userId, finalReport)

    // 4. Verify completed session state recovery
    const recoveredSession = await storageService.getSessionById(session.id, userId)
    expect(recoveredSession?.status).toBe('Completed')
    expect(recoveredSession?.overall_score).toBeGreaterThan(0)
    expect(recoveredSession?.summary_feedback?.strongestAreas.length).toBeGreaterThan(0)
    expect(recoveredSession?.summary_feedback?.actionableImprovementPlan.length).toBe(3)
  })
})
