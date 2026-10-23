import { config } from '../config'
import { rubricService, AnswerEvaluation, SessionEvaluationSummary } from './rubric.service'
import { db } from '../db'
import crypto from 'crypto'

export interface SessionConfig {
  role: string
  interviewType: string
  experienceLevel: string
  difficulty: string
  questionCount: number
  targetCompany?: string
  jobDescription?: string
  skillsFocus?: string[]
  language?: string
  candidateBackground?: string
}

export interface GeneratedQuestion {
  id: string
  question_text: string
  category: string
  difficulty: string
  topic_tags: string[]
  expected_concepts: string[]
  question_type: string
  hints: string[]
  example_solution?: string
}

export const aiService = {
  isConfigured(): boolean {
    return Boolean(config.aiApiKey && config.aiApiKey.trim().length > 0 && !config.aiApiKey.includes('your_llm_api_key'))
  },

  async callGemini(prompt: string, systemInstruction?: string): Promise<string | null> {
    if (!this.isConfigured()) return null

    const model = config.aiModel || 'gemini-1.5-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.aiApiKey}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction ? systemInstruction + '\n\n' : ''}${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: 'application/json',
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.warn(`[Gemini API] Request failed status ${response.status}:`, errorText)
        return null
      }

      const data = (await response.json()) as any
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      return text || null
    } catch (err) {
      console.warn('[Gemini API] Error calling Gemini API:', err)
      return null
    }
  },

  async generateQuestions(sessionConfig: SessionConfig): Promise<GeneratedQuestion[]> {
    const {
      role,
      interviewType,
      experienceLevel,
      difficulty,
      questionCount,
      targetCompany,
      jobDescription,
      skillsFocus,
      candidateBackground,
    } = sessionConfig

    if (this.isConfigured()) {
      const prompt = `You are a Principal Hiring Manager and Interviewer assessing a ${experienceLevel} candidate for a ${role} position.
Target Company: ${targetCompany || 'Top Tech'}
Interview Type: ${interviewType}
Difficulty: ${difficulty}
Skills Focus: ${skillsFocus?.join(', ') || 'Core competencies'}
Job Description Snippet: ${jobDescription || 'Standard requirements'}
Candidate Background: ${candidateBackground || 'Standard profile'}

Generate exactly ${questionCount} tailored, high-caliber interview questions in a JSON array.
Each question object MUST strictly contain:
- "question_text": The complete, articulate question.
- "category": e.g. "Architecture", "Data Structures", "STAR Behavioral", "Security", or "Performance".
- "difficulty": "${difficulty}"
- "topic_tags": array of 2-4 strings
- "expected_concepts": array of 3-5 core concepts/keywords the candidate should touch on
- "question_type": one of ["technical_explanation", "coding", "behavioral", "system_design", "short_answer"]
- "hints": array of 2 helpful hints
- "example_solution": concise 2-3 sentence model answer outline

Return ONLY valid JSON array with no extra markdown wrapping.`

      const text = await this.callGemini(prompt, 'You are an expert technical interviewer.')
      if (text) {
        try {
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((item, index) => ({
              id: crypto.randomUUID(),
              question_text: item.question_text || `Question ${index + 1}`,
              category: item.category || interviewType,
              difficulty: item.difficulty || difficulty,
              topic_tags: item.topic_tags || [role],
              expected_concepts: item.expected_concepts || [],
              question_type: item.question_type || 'technical_explanation',
              hints: item.hints || [],
              example_solution: item.example_solution || null,
            }))
          }
        } catch (err) {
          console.warn('Failed to parse AI generated questions:', err)
        }
      }
    }

    // Fallback: Query question bank from SQLite
    const stmt = db.prepare(`
      SELECT * FROM question_bank
      WHERE (role LIKE ? OR role = 'Full-Stack Developer')
      ORDER BY RANDOM()
      LIMIT ?
    `)
    const rows = stmt.all(`%${role.split(' ')[0]}%`, questionCount) as any[]

    if (rows.length >= questionCount) {
      return rows.map((r) => ({
        id: crypto.randomUUID(),
        question_text: r.question_text,
        category: r.category,
        difficulty: r.difficulty,
        topic_tags: [r.topic],
        expected_concepts: JSON.parse(r.expected_concepts || '[]'),
        question_type: r.question_type,
        hints: JSON.parse(r.hints || '[]'),
        example_solution: r.example_solution,
      }))
    }

    // Fallback: Fetch any questions from bank
    const anyStmt = db.prepare('SELECT * FROM question_bank ORDER BY RANDOM() LIMIT ?')
    const anyRows = anyStmt.all(questionCount) as any[]
    return anyRows.map((r) => ({
      id: crypto.randomUUID(),
      question_text: r.question_text,
      category: r.category,
      difficulty: r.difficulty,
      topic_tags: [r.topic],
      expected_concepts: JSON.parse(r.expected_concepts || '[]'),
      question_type: r.question_type,
      hints: JSON.parse(r.hints || '[]'),
      example_solution: r.example_solution,
    }))
  },

  async evaluateAnswer(params: {
    questionText: string
    category: string
    questionType: string
    expectedConcepts?: string[]
    candidateAnswer: string
    exampleSolution?: string | null
    durationSeconds?: number
  }): Promise<AnswerEvaluation> {
    if (this.isConfigured() && params.candidateAnswer.trim().length > 10) {
      const prompt = `Evaluate the candidate's interview response against standard industry hiring bars.
Question: ${params.questionText}
Category: ${params.category}
Question Type: ${params.questionType}
Expected Concepts: ${params.expectedConcepts?.join(', ') || 'None specified'}
Candidate Answer: "${params.candidateAnswer}"

Return a JSON object strictly matching this schema:
{
  "overallScore": number (0-100),
  "dimensionScores": {
    "relevance": number (0-100),
    "correctness": number (0-100),
    "completeness": number (0-100),
    "structure": number (0-100),
    "clarity": number (0-100),
    "examples": number (0-100),
    "communication": number (0-100)
  },
  "whatWentWell": string[],
  "whatNeedsImprovement": string[],
  "missingConcepts": string[],
  "suggestedStrongerAnswer": string,
  "practicalTip": string
}`

      const text = await this.callGemini(prompt, 'You are an objective hiring bar evaluator.')
      if (text) {
        try {
          const parsed = JSON.parse(text)
          if (parsed.overallScore !== undefined && parsed.dimensionScores) {
            return parsed as AnswerEvaluation
          }
        } catch (err) {
          console.warn('Failed to parse AI answer evaluation:', err)
        }
      }
    }

    // Deterministic rubric evaluation fallback
    return rubricService.evaluateAnswer(params)
  },

  async evaluateSession(params: {
    role: string
    interviewType: string
    experienceLevel: string
    difficulty: string
    qaPairs: Array<{
      questionText: string
      category: string
      answerText: string
      score?: number
      missingConcepts?: string[]
    }>
  }): Promise<SessionEvaluationSummary> {
    if (this.isConfigured() && params.qaPairs.length > 0) {
      const prompt = `Perform a comprehensive interview debrief and evaluation for a ${params.experienceLevel} candidate interviewing for ${params.role}.
Interview Type: ${params.interviewType}
Difficulty: ${params.difficulty}

QA Pairs Evaluated:
${params.qaPairs
  .map(
    (qa, i) =>
      `Q${i + 1} [${qa.category}]: ${qa.questionText}\nA: ${qa.answerText}\nScore: ${qa.score ?? 'N/A'}`
  )
  .join('\n\n')}

Return a JSON object with:
{
  "overallScore": number (0-100),
  "rubricTier": "Needs substantial improvement" | "Developing" | "Competent" | "Strong" | "Excellent",
  "questionsCompleted": number,
  "categoryPerformance": [{ "category": string, "score": number }],
  "strongestAreas": string[],
  "weakestAreas": string[],
  "repeatedMistakes": string[],
  "keyConceptsToRevise": string[],
  "actionableImprovementPlan": [{ "step": number, "title": string, "description": string, "timeline": string }],
  "suggestedNextSession": { "role": string, "type": string, "focus": string, "reason": string }
}`

      const text = await this.callGemini(prompt, 'You are an Executive Tech Interview Coach.')
      if (text) {
        try {
          const parsed = JSON.parse(text)
          if (parsed.overallScore !== undefined && parsed.rubricTier) {
            return parsed as SessionEvaluationSummary
          }
        } catch (err) {
          console.warn('Failed to parse AI session evaluation:', err)
        }
      }
    }

    return rubricService.evaluateSession(params)
  },
}
