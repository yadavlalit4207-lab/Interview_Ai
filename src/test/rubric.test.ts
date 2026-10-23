import { describe, it, expect } from 'vitest'
import { aiService } from '@/lib/aiService'
import { InterviewQuestion } from '@/types'

describe('Rubric & AI Evaluation Engine', () => {
  const sampleQuestion: InterviewQuestion = {
    id: 'q-test-1',
    session_id: 'session-123',
    position: 1,
    question_text: 'Explain how React Virtual DOM diffing works and why keys are necessary in lists.',
    category: 'React Architecture',
    difficulty: 'Medium',
    topic_tags: ['React', 'Virtual DOM'],
    expected_concepts: ['Virtual DOM', 'diffing', 'key stability', 'heuristic O(n)'],
    question_type: 'technical_explanation',
    hints: ['Mention component identity'],
    created_at: new Date().toISOString(),
  }

  it('evaluates strong comprehensive answer with high score', async () => {
    const strongAnswer = `React maintains an in-memory Virtual DOM tree representation of the UI.
When state updates, React runs a heuristic O(n) diffing algorithm against the new VDOM tree.
Key stability is critical for lists so React can reconcile element identities between renders rather than unmounting and recreating components.`

    const { data } = await aiService.evaluateAnswer(sampleQuestion, strongAnswer, 75, 'Frontend Developer')

    expect(data.overallScore).toBeGreaterThanOrEqual(70)
    expect(data.dimensionScores.relevance).toBeGreaterThanOrEqual(75)
    expect(data.dimensionScores.correctness).toBeGreaterThanOrEqual(70)
    expect(data.whatWentWell.length).toBeGreaterThan(0)
    expect(data.suggestedStrongerAnswer).toBeDefined()
  })

  it('penalizes brief or evasive answers', async () => {
    const briefAnswer = 'It is fast.'
    const { data } = await aiService.evaluateAnswer(sampleQuestion, briefAnswer, 5, 'Frontend Developer')

    expect(data.overallScore).toBeLessThan(50)
    expect(data.whatNeedsImprovement.length).toBeGreaterThan(0)
  })

  it('rewards STAR framework structure in behavioral questions', async () => {
    const behavioralQuestion: InterviewQuestion = {
      id: 'q-star-1',
      session_id: 'session-123',
      position: 2,
      question_text: 'Tell me about a time you handled a disagreement with a team member.',
      category: 'Conflict Resolution',
      difficulty: 'Medium',
      topic_tags: ['Teamwork', 'Behavioral'],
      expected_concepts: ['STAR framework', 'active listening', 'objective data'],
      question_type: 'behavioral',
      created_at: new Date().toISOString(),
    }

    const starAnswer = `In my previous project (Situation), our team disagreed on state management architecture (Task).
I organized a 1-day benchmark spikes comparing Redux Toolkit vs Zustand and shared metrics on bundle size and velocity (Action).
As a Result, the team aligned on Zustand and delivered the feature 2 weeks ahead of schedule with zero regressions.`

    const { data } = await aiService.evaluateAnswer(behavioralQuestion, starAnswer, 80, 'Frontend Developer')

    expect(data.overallScore).toBeGreaterThanOrEqual(65)
    expect(data.dimensionScores.structure).toBeGreaterThanOrEqual(80)
  })
})
