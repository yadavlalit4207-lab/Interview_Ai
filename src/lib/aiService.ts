import {
  InterviewConfig,
  InterviewQuestion,
  InterviewAnswer,
  AnswerEvaluation,
  InterviewEvaluationSummary,
  InterviewSession,
  QuestionType,
} from '@/types'
import { isSupabaseConfigured, supabase } from './supabaseClient'

export interface AiServiceResult<T> {
  data: T
  isSimulation: boolean
  providerName: string
}

// Question template pools for realistic simulation fallback
const ROLE_QUESTION_POOLS: Record<string, Array<{ text: string; category: string; type: QuestionType; concepts: string[]; hints: string[] }>> = {
  'Frontend Developer': [
    {
      text: 'Explain how React\'s reconciliation algorithm and Virtual DOM work. How does React determine when to re-render, and what role do keys play in list reconciliation?',
      category: 'React Architecture',
      type: 'technical_explanation',
      concepts: ['Virtual DOM', 'Heuristic diffing O(n)', 'Key stability', 'Fiber work loop'],
      hints: ['Mention why array indices as keys can cause bugs with stateful child items.'],
    },
    {
      text: 'What are Core Web Vitals (LCP, INP, CLS)? Walk me through how you would diagnose and optimize a web application suffering from poor Largest Contentful Paint (LCP) and High Cumulative Layout Shift (CLS).',
      category: 'Web Performance',
      type: 'technical_explanation',
      concepts: ['LCP optimization', 'fetchpriority="high"', 'CLS layout shifts', 'aspect-ratio CSS'],
      hints: ['Break down the four phases of LCP: TTFB, load delay, load duration, render delay.'],
    },
    {
      text: 'Describe how CSS Cascading and Specificity work. How do CSS Cascade Layers (@layer) solve specificity wars in modern design systems?',
      category: 'CSS Architecture',
      type: 'technical_explanation',
      concepts: ['Specificity weights (IDs, classes, elements)', 'Cascade layers @layer', 'Source order', '!important override rules'],
      hints: ['Explain how @layer allows utility resets to sit below component styles regardless of selector strength.'],
    },
    {
      text: 'How do you handle asynchronous data fetching, race conditions, and stale-while-revalidate caching in a client-side Single Page Application?',
      category: 'State Management & Async',
      type: 'technical_explanation',
      concepts: ['AbortController / signal cancellation', 'Stale-while-revalidate', 'Optimistic UI updates', 'Race condition prevention'],
      hints: ['Think about what happens when a user types rapidly into a search box and request #1 resolves after request #2.'],
    },
    {
      text: 'Tell me about a challenging UI bug or accessibility issue you encountered that affected assistive technologies or cross-browser rendering. How did you resolve it?',
      category: 'Behavioral & Accessibility',
      type: 'behavioral',
      concepts: ['STAR framework', 'WCAG conformance', 'ARIA semantics', 'Keyboard focus management'],
      hints: ['Structure your response using Situation, Task, Action, and Result.'],
    },
  ],
  'Backend Developer': [
    {
      text: 'Explain how B-Tree indexes work in relational databases (PostgreSQL/MySQL). When can an index degrade overall system performance, and how do composite indexes obey the leftmost prefix rule?',
      category: 'Database Internals',
      type: 'technical_explanation',
      concepts: ['B-Tree traversal O(log N)', 'Write amplification and page splits', 'Leftmost prefix rule', 'Index selectivity'],
      hints: ['Discuss why indexing low-cardinality boolean columns is often wasteful.'],
    },
    {
      text: 'How do you design an idempotent API endpoint for payment processing or critical resource creation? What mechanisms prevent duplicate charges during network timeouts?',
      category: 'API Design & Reliability',
      type: 'technical_explanation',
      concepts: ['Idempotency keys (UUIDs)', 'Atomic conditional insert/lock', 'Distributed locks (Redis Redlock)', 'HTTP status codes 200 vs 201 vs 409'],
      hints: ['Explain what happens when a client sends a payment request, times out after 30s, and retries.'],
    },
    {
      text: 'Walk me through how connection pooling works in a backend service connected to a database. What causes connection pool starvation, and how do you size the pool correctly?',
      category: 'Concurrency & Infrastructure',
      type: 'technical_explanation',
      concepts: ['Active vs idle connections', 'Pool saturation & starvation', 'HikariCP / PgBouncer sizing formula', 'Slow queries holding connections'],
      hints: ['Mention the formula: Pool size = (core_count * 2) + effective_spindle_count.'],
    },
    {
      text: 'Compare message queues (like RabbitMQ/SQS) with event streaming platforms (like Apache Kafka). When would you choose one over the other for inter-service communication?',
      category: 'Distributed Systems',
      type: 'system_design',
      concepts: ['Message broker vs partitioned commit log', 'At-least-once delivery', 'Consumer groups and replayability', 'Backpressure and DLQ (Dead Letter Queue)'],
      hints: ['Focus on message retention after consumption and order preservation within partition keys.'],
    },
    {
      text: 'Describe an outage or severe production incident you dealt with in a backend system. How did you identify the root cause, mitigate immediate customer impact, and prevent recurrence?',
      category: 'Incident Response & Post-Mortem',
      type: 'behavioral',
      concepts: ['STAR framework', 'Observability (metrics, logs, traces)', 'Graceful degradation / circuit breakers', 'Blameless post-mortem'],
      hints: ['Detail the triage process first, then the permanent architectural remediation.'],
    },
  ],
  'Full-Stack Developer': [
    {
      text: 'Design a scalable real-time collaborative document editor (like Google Docs or Notion). What concurrency algorithms (OT vs CRDTs) would you consider, and how would you structure the client-server sync?',
      category: 'System Design',
      type: 'system_design',
      concepts: ['Operational Transformation (OT)', 'Conflict-free Replicated Data Types (CRDTs)', 'WebSockets / WebRTC', 'Local state vs Remote vector clock'],
      hints: ['Weigh the complexity of a centralized transformation server vs decentralized CRDT math.'],
    },
    {
      text: 'Explain how authentication with JWTs (JSON Web Tokens) compares with stateful session cookies. How do you implement secure refresh token rotation and protect against XSS and CSRF?',
      category: 'Security Architecture',
      type: 'technical_explanation',
      concepts: ['HttpOnly & SameSite=Strict cookies', 'Short-lived access tokens + Refresh token rotation', 'XSS memory theft vs CSRF cross-origin submits', 'Revocation lists / blacklists'],
      hints: ['Explain why storing JWTs in localStorage exposes users to token theft via third-party npm scripts.'],
    },
    {
      text: 'What are database transactions and ACID properties? Walk me through what an isolation anomaly like "Dirty Read", "Non-Repeatable Read", or "Phantom Read" is and how isolation levels prevent them.',
      category: 'Data Integrity',
      type: 'technical_explanation',
      concepts: ['Atomicity, Consistency, Isolation, Durability', 'Read Committed vs Repeatable Read vs Serializable', 'Multi-Version Concurrency Control (MVCC)', 'Deadlock detection'],
      hints: ['Contrast snapshot isolation in PostgreSQL with row-level locking.'],
    },
    {
      text: 'Tell me about a full-stack feature you architected from database schema to user interface. What technical tradeoffs did you make between developer velocity and long-term scalability?',
      category: 'System Ownership',
      type: 'behavioral',
      concepts: ['STAR structure', 'End-to-end architecture', 'Tradeoff balancing', 'Measurable business outcome'],
      hints: ['Explain what you deliberately chose NOT to build in v1 to ship on time.'],
    },
  ],
  'Data Analyst': [
    {
      text: 'Explain the difference between ROW_NUMBER(), RANK(), and DENSE_RANK() in SQL. Provide a practical business scenario where you would use DENSE_RANK over RANK.',
      category: 'SQL & Window Functions',
      type: 'technical_explanation',
      concepts: ['Ties handling', 'Gapless ranking', 'PARTITION BY clause', 'Top-N ranking per category'],
      hints: ['Think of rewarding sales commissions across distinct performance bands.'],
    },
    {
      text: 'How do you design a Star Schema vs Snowflake Schema in a Data Warehouse? When would you denormalize dimensions for analytics query performance?',
      category: 'Data Modeling',
      type: 'technical_explanation',
      concepts: ['Fact tables vs Dimension tables', 'Star schema simplicity', 'Snowflake normalization', 'Columnar storage compression (BigQuery/Snowflake)'],
      hints: ['Consider analytical query scan costs and join complexity in modern OLAP engines.'],
    },
    {
      text: 'Walk me through how you detect, handle, and communicate missing or anomalous data in a critical business metric report before sharing insights with C-level stakeholders.',
      category: 'Data Quality & Governance',
      type: 'technical_explanation',
      concepts: ['Outlier detection (IQR, Z-score)', 'Imputation methods vs exclusion', 'Data lineage tracking', 'Executive summary caveats'],
      hints: ['Emphasize transparency and sensitivity analysis.'],
    },
  ],
  'Default': [
    {
      text: 'Can you describe your professional background, your target responsibilities, and what key strengths you would bring to this role?',
      category: 'Introduction & Value Proposition',
      type: 'behavioral',
      concepts: ['Clear narrative', 'Alignment with job requirements', 'Demonstrated accomplishments', 'Career trajectory'],
      hints: ['Keep it under 3 minutes and focus on tangible impact.'],
    },
    {
      text: 'Tell me about a complex project where priorities changed abruptly or requirements were ambiguous. How did you establish clarity and deliver results?',
      category: 'Adaptability & Execution',
      type: 'behavioral',
      concepts: ['STAR framework', 'Stakeholder communication', 'Pragmatic scoping', 'Ownership mindset'],
      hints: ['Describe the initial ambiguity and the specific questions you asked to align expectations.'],
    },
    {
      text: 'What is your methodology for testing, validating, and ensuring the quality and security of the deliverables you produce?',
      category: 'Quality & Process',
      type: 'technical_explanation',
      concepts: ['Automated test strategy', 'Edge case identification', 'Peer reviews and feedback loops', 'Monitoring in production'],
      hints: ['Mention continuous integration and defense-in-depth principles.'],
    },
    {
      text: 'Describe a situation where a deliverable failed to meet expectations or caused a problem. What did you learn and how did you adjust your process going forward?',
      category: 'Continuous Learning & Resilience',
      type: 'behavioral',
      concepts: ['Accountability', 'Humility and self-reflection', 'Systemic process improvement', 'Follow-up verification'],
      hints: ['Focus on what you proactively changed in your workflow rather than blaming external factors.'],
    },
  ],
}

export const aiService = {
  // ==========================================
  // GENERATE QUESTIONS
  // ==========================================
  async generateQuestions(
    sessionId: string,
    config: InterviewConfig
  ): Promise<AiServiceResult<InterviewQuestion[]>> {
    // Attempt Edge Function call if Supabase is configured
    if (isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interview-ai`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                action: 'generate_questions',
                sessionConfig: {
                  role: config.role,
                  interviewType: config.interview_type,
                  experienceLevel: config.experience_level,
                  difficulty: config.difficulty,
                  questionCount: config.question_count,
                  targetCompany: config.target_company,
                  jobDescription: config.job_description,
                  skillsFocus: config.skills_focus,
                  language: config.language,
                  candidateBackground: config.candidate_background,
                },
              }),
            }
          )

          if (res.ok) {
            const json = await res.json()
            if (json.questions && Array.isArray(json.questions)) {
              const questions: InterviewQuestion[] = json.questions.map(
                (q: any, idx: number) => ({
                  id: crypto.randomUUID(),
                  session_id: sessionId,
                  position: idx + 1,
                  question_text: q.question_text,
                  category: q.category || config.role,
                  difficulty: config.difficulty,
                  topic_tags: q.topic_tags || [config.role],
                  expected_concepts: q.expected_concepts || [],
                  question_type: q.question_type || 'technical_explanation',
                  hints: q.hints || [],
                  created_at: new Date().toISOString(),
                })
              )
              return { data: questions, isSimulation: false, providerName: 'Cloud AI Provider' }
            }
          }
        }
      } catch (err) {
        console.warn('Edge Function question generation failed, falling back to local simulation engine:', err)
      }
    }

    // High quality deterministic simulation engine
    // Select questions tailored to the requested role or fall back intelligently
    const pool =
      ROLE_QUESTION_POOLS[config.role] ||
      (config.role.toLowerCase().includes('front') ? ROLE_QUESTION_POOLS['Frontend Developer'] : null) ||
      (config.role.toLowerCase().includes('back') ? ROLE_QUESTION_POOLS['Backend Developer'] : null) ||
      (config.role.toLowerCase().includes('full') ? ROLE_QUESTION_POOLS['Full-Stack Developer'] : null) ||
      (config.role.toLowerCase().includes('data') ? ROLE_QUESTION_POOLS['Data Analyst'] : null) ||
      ROLE_QUESTION_POOLS['Default']

    const count = Math.min(config.question_count, 15)
    const questions: InterviewQuestion[] = []

    for (let i = 0; i < count; i++) {
      const template = pool[i % pool.length]
      questions.push({
        id: crypto.randomUUID(),
        session_id: sessionId,
        position: i + 1,
        question_text: template.text,
        category: template.category,
        difficulty: config.difficulty,
        topic_tags: [config.role, template.category],
        expected_concepts: template.concepts,
        question_type: template.type,
        hints: template.hints,
        created_at: new Date().toISOString(),
      })
    }

    return {
      data: questions,
      isSimulation: true,
      providerName: 'InterviewAce Deterministic Simulation Engine',
    }
  },

  // ==========================================
  // EVALUATE SINGLE ANSWER
  // ==========================================
  async evaluateAnswer(
    question: InterviewQuestion,
    answerText: string,
    durationSeconds: number,
    role: string
  ): Promise<AiServiceResult<AnswerEvaluation>> {
    // Attempt Edge Function call if Supabase is configured
    if (isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interview-ai`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                action: 'evaluate_answer',
                answerPayload: {
                  questionText: question.question_text,
                  questionCategory: question.category,
                  questionType: question.question_type,
                  expectedConcepts: question.expected_concepts,
                  candidateAnswer: answerText,
                  durationSeconds,
                },
              }),
            }
          )

          if (res.ok) {
            const json = await res.json()
            if (json.overallScore !== undefined && json.dimensionScores) {
              return { data: json as AnswerEvaluation, isSimulation: false, providerName: 'Cloud AI Provider' }
            }
          }
        }
      } catch (err) {
        console.warn('Edge Function evaluation failed, falling back to local rubric engine:', err)
      }
    }

    // Local Rubric Evaluation Engine
    const wordCount = answerText.trim().split(/\s+/).filter(Boolean).length
    const cleanAnswer = answerText.toLowerCase()

    // 1. Relevance: Did they answer the prompt?
    let relevance = 50
    if (wordCount >= 20) relevance += 25
    if (wordCount >= 50) relevance += 15
    if (wordCount < 10) relevance = 25

    // 2. Correctness & Concepts
    const matchedConcepts: string[] = []
    const missingConcepts: string[] = []

    question.expected_concepts.forEach((concept) => {
      const words = concept.toLowerCase().split(/\s+/)
      const matches = words.some((w) => w.length > 3 && cleanAnswer.includes(w))
      if (matches) {
        matchedConcepts.push(concept)
      } else {
        missingConcepts.push(concept)
      }
    })

    const conceptRatio =
      question.expected_concepts.length > 0
        ? matchedConcepts.length / question.expected_concepts.length
        : 0.7

    let correctness = Math.round(40 + conceptRatio * 50)
    if (wordCount < 15) correctness = Math.min(correctness, 35)

    // 3. Completeness
    let completeness = 40
    if (wordCount >= 40) completeness += 20
    if (wordCount >= 80) completeness += 20
    if (wordCount >= 130) completeness += 15

    // 4. Structure: Check for STAR markers if behavioral, or structured reasoning if technical
    let structure = 60
    if (question.question_type === 'behavioral') {
      const hasStar =
        (cleanAnswer.includes('situation') || cleanAnswer.includes('project') || cleanAnswer.includes('when')) &&
        (cleanAnswer.includes('action') || cleanAnswer.includes('decided') || cleanAnswer.includes('implemented')) &&
        (cleanAnswer.includes('result') || cleanAnswer.includes('outcome') || cleanAnswer.includes('achieved'))
      structure = hasStar ? 88 : 65
    } else {
      const hasStructure =
        cleanAnswer.includes('because') ||
        cleanAnswer.includes('first') ||
        cleanAnswer.includes('second') ||
        cleanAnswer.includes('tradeoff') ||
        cleanAnswer.includes('however') ||
        cleanAnswer.includes('therefore')
      structure = hasStructure ? 82 : 68
    }

    // 5. Clarity
    const clarity = Math.min(92, Math.max(45, 50 + Math.min(wordCount, 100) * 0.4))

    // 6. Examples
    const hasExample =
      cleanAnswer.includes('for example') ||
      cleanAnswer.includes('for instance') ||
      cleanAnswer.includes('such as') ||
      cleanAnswer.includes('in my previous') ||
      cleanAnswer.includes('we noticed')
    const examples = hasExample ? 85 : 55

    // 7. Communication
    const communication = Math.min(90, Math.max(50, Math.round((clarity + structure) / 2)))

    // Overall weighted score
    const overallScore = Math.min(
      98,
      Math.max(
        15,
        Math.round(
          relevance * 0.2 +
          correctness * 0.25 +
          completeness * 0.15 +
          structure * 0.15 +
          clarity * 0.1 +
          examples * 0.1 +
          communication * 0.05
        )
      )
    )

    const whatWentWell: string[] = []
    const whatNeedsImprovement: string[] = []

    if (relevance >= 75) whatWentWell.push('Directly addressed the core interview prompt without deviating.')
    if (matchedConcepts.length > 0) {
      whatWentWell.push(`Accurately highlighted key industry terminology: ${matchedConcepts.slice(0, 2).join(', ')}.`)
    }
    if (structure >= 75) whatWentWell.push('Maintained logical progression and clear narrative structure.')

    if (wordCount < 40) {
      whatNeedsImprovement.push('Answer is somewhat brief; elaborate with concrete technical details or specific tradeoffs.')
    }
    if (missingConcepts.length > 0) {
      whatNeedsImprovement.push(`Deepen discussion on essential topics: ${missingConcepts.slice(0, 2).join(', ')}.`)
    }
    if (!hasExample) {
      whatNeedsImprovement.push('Include a real-world scenario or tangible metric to substantiate your claims.')
    }

    if (whatWentWell.length === 0) whatWentWell.push('Demonstrated foundational understanding of the problem.')
    if (whatNeedsImprovement.length === 0) whatNeedsImprovement.push('Consider addressing edge cases or high-scale constraints for an even stronger response.')

    const suggestedStrongerAnswer =
      question.example_solution ||
      `A model answer would begin with a clear high-level definition, detail the operational tradeoffs, cite how ${question.expected_concepts.slice(0, 2).join(' and ')} apply in practice, and conclude with measurable impact.`

    const practicalTip =
      question.question_type === 'behavioral'
        ? 'Anchor your behavioral responses using the STAR method: Situation (15%), Task (15%), Action (50%), and Result (20%).'
        : 'When answering technical questions, always state your assumptions upfront and briefly analyze time/space complexity or system tradeoffs.'

    return {
      data: {
        overallScore,
        dimensionScores: {
          relevance,
          correctness,
          completeness,
          structure,
          clarity,
          examples,
          communication,
        },
        whatWentWell,
        whatNeedsImprovement,
        missingConcepts: missingConcepts.slice(0, 3),
        suggestedStrongerAnswer,
        practicalTip,
      },
      isSimulation: true,
      providerName: 'InterviewAce Deterministic Rubric Evaluator',
    }
  },

  // ==========================================
  // EVALUATE COMPLETE INTERVIEW SESSION
  // ==========================================
  async evaluateSession(
    session: InterviewSession,
    questions: InterviewQuestion[],
    answers: InterviewAnswer[]
  ): Promise<AiServiceResult<InterviewEvaluationSummary>> {
    // Attempt Edge Function call if Supabase is configured
    if (isSupabaseConfigured()) {
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession()
        if (authSession?.access_token) {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interview-ai`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authSession.access_token}`,
              },
              body: JSON.stringify({
                action: 'evaluate_session',
                sessionEvaluationPayload: {
                  role: session.role,
                  interviewType: session.interview_type,
                  experienceLevel: session.experience_level,
                  difficulty: session.difficulty,
                  qaPairs: questions.map((q) => {
                    const ans = answers.find((a) => a.question_id === q.id)
                    return {
                      questionText: q.question_text,
                      category: q.category,
                      answerText: ans?.answer_text || 'Skipped',
                      score: ans?.score,
                    }
                  }),
                },
              }),
            }
          )

          if (res.ok) {
            const json = await res.json()
            if (json.overallScore !== undefined && json.rubricTier) {
              return { data: json as InterviewEvaluationSummary, isSimulation: false, providerName: 'Cloud AI Provider' }
            }
          }
        }
      } catch (err) {
        console.warn('Edge Function session evaluation failed, falling back to local synthesis engine:', err)
      }
    }

    // Local Synthesis Engine
    const answeredCount = answers.filter((a) => a.answer_text && a.answer_text.trim().length > 0).length
    const scores = answers.map((a) => a.score || 0).filter((s) => s > 0)
    const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 50

    let rubricTier: InterviewEvaluationSummary['rubricTier'] = 'Competent'
    if (overallScore < 40) rubricTier = 'Needs substantial improvement'
    else if (overallScore < 60) rubricTier = 'Developing'
    else if (overallScore < 75) rubricTier = 'Competent'
    else if (overallScore < 90) rubricTier = 'Strong'
    else rubricTier = 'Excellent'

    // Group scores by question category
    const catMap: Record<string, { total: number; count: number }> = {}
    questions.forEach((q) => {
      const ans = answers.find((a) => a.question_id === q.id)
      const score = ans?.score || 50
      if (!catMap[q.category]) catMap[q.category] = { total: 0, count: 0 }
      catMap[q.category].total += score
      catMap[q.category].count += 1
    })

    const categoryPerformance = Object.entries(catMap).map(([category, data]) => ({
      category,
      score: Math.round(data.total / data.count),
    }))

    const strongestAreas: string[] = []
    const weakestAreas: string[] = []
    const allMissing: string[] = []

    answers.forEach((ans) => {
      if (ans.feedback_json?.missingConcepts) {
        allMissing.push(...ans.feedback_json.missingConcepts)
      }
      if (ans.feedback_json?.whatWentWell?.[0] && !strongestAreas.includes(ans.feedback_json.whatWentWell[0])) {
        strongestAreas.push(ans.feedback_json.whatWentWell[0])
      }
      if (ans.feedback_json?.whatNeedsImprovement?.[0] && !weakestAreas.includes(ans.feedback_json.whatNeedsImprovement[0])) {
        weakestAreas.push(ans.feedback_json.whatNeedsImprovement[0])
      }
    })

    const summary: InterviewEvaluationSummary = {
      overallScore,
      rubricTier,
      questionsCompleted: answeredCount,
      categoryPerformance,
      strongestAreas: strongestAreas.slice(0, 3).length > 0 ? strongestAreas.slice(0, 3) : ['Clarity of communication', 'Professional tone'],
      weakestAreas: weakestAreas.slice(0, 3).length > 0 ? weakestAreas.slice(0, 3) : ['Providing deeper edge-case analysis', 'Mentioning quantified business metrics'],
      repeatedMistakes: [
        'Occasionally jumping into implementation before stating architectural assumptions.',
        'Not elaborating on time or space complexity tradeoffs.',
      ],
      keyConceptsToRevise: allMissing.slice(0, 4).length > 0 ? allMissing.slice(0, 4) : ['System scalability limits', 'Graceful failure recovery', 'STAR story structure'],
      actionableImprovementPlan: [
        {
          step: 1,
          title: 'Review Core Foundational Concepts',
          description: `Revise targeted topics in ${session.role} domain: ${allMissing.slice(0, 2).join(', ') || 'Core design patterns and complexity analysis'}.`,
          timeline: 'Days 1–3',
        },
        {
          step: 2,
          title: 'Practice Time-Boxed Delivery',
          description: 'Re-answer the 2 lowest scoring questions under a 2-minute timer with structured bullet points.',
          timeline: 'Days 4–5',
        },
        {
          step: 3,
          title: 'Conduct Follow-up Mock Session',
          description: `Schedule a 5-question ${session.difficulty} difficulty session focusing on technical explanations.`,
          timeline: 'Day 7',
        },
      ],
      suggestedNextSession: {
        role: session.role,
        type: session.interview_type,
        focus: session.skills_focus?.[0] || 'System Architecture & Edge Cases',
        reason: 'Reinforce technical depth and reduce response latency on complex topics.',
      },
    }

    return {
      data: summary,
      isSimulation: true,
      providerName: 'InterviewAce Synthesis Engine',
    }
  },
}
