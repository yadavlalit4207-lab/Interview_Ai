export interface AnswerEvaluation {
  overallScore: number
  dimensionScores: {
    relevance: number
    correctness: number
    completeness: number
    structure: number
    clarity: number
    examples: number
    communication: number
  }
  whatWentWell: string[]
  whatNeedsImprovement: string[]
  missingConcepts: string[]
  suggestedStrongerAnswer: string
  practicalTip: string
  dimensionFeedback?: string[]
}

export interface SessionEvaluationSummary {
  overallScore: number
  rubricTier: 'Needs substantial improvement' | 'Developing' | 'Competent' | 'Strong' | 'Excellent'
  questionsCompleted: number
  categoryPerformance: { category: string; score: number }[]
  strongestAreas: string[]
  weakestAreas: string[]
  repeatedMistakes: string[]
  keyConceptsToRevise: string[]
  actionableImprovementPlan: {
    step: number
    title: string
    description: string
    timeline: string
  }[]
  suggestedNextSession: {
    role: string
    type: string
    focus: string
    reason: string
  }
}

export const rubricService = {
  evaluateAnswer(params: {
    questionText: string
    category: string
    questionType: string
    expectedConcepts?: string[]
    candidateAnswer: string
    exampleSolution?: string | null
    durationSeconds?: number
  }): AnswerEvaluation {
    const { questionType, candidateAnswer, expectedConcepts = [], exampleSolution } = params
    const wordCount = candidateAnswer.trim().split(/\s+/).filter(Boolean).length
    const cleanAnswer = candidateAnswer.toLowerCase()

    // 1. Relevance: Did candidate address the prompt?
    let relevance = 50
    if (wordCount >= 20) relevance += 25
    if (wordCount >= 50) relevance += 15
    if (wordCount < 10) relevance = 25

    // 2. Correctness & Concept Coverage
    const matchedConcepts: string[] = []
    const missingConcepts: string[] = []

    expectedConcepts.forEach((concept) => {
      const words = concept.toLowerCase().split(/\s+/)
      const matches = words.some((w) => w.length > 3 && cleanAnswer.includes(w))
      if (matches) {
        matchedConcepts.push(concept)
      } else {
        missingConcepts.push(concept)
      }
    })

    const conceptRatio =
      expectedConcepts.length > 0 ? matchedConcepts.length / expectedConcepts.length : 0.7
    let correctness = Math.round(40 + conceptRatio * 50)
    if (wordCount < 15) correctness = Math.min(correctness, 35)

    // 3. Completeness
    let completeness = 40
    if (wordCount >= 40) completeness += 20
    if (wordCount >= 80) completeness += 20
    if (wordCount >= 130) completeness += 15

    // 4. Structure: STAR framework for behavioral, structured progression for technical
    let structure = 60
    if (questionType === 'behavioral') {
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
    const clarity = Math.min(92, Math.max(45, Math.round(50 + Math.min(wordCount, 100) * 0.4)))

    // 6. Examples
    const hasExample =
      cleanAnswer.includes('for example') ||
      cleanAnswer.includes('for instance') ||
      cleanAnswer.includes('such as') ||
      cleanAnswer.includes('in my previous') ||
      cleanAnswer.includes('we noticed') ||
      cleanAnswer.includes('in production')
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
      exampleSolution ||
      `A model answer would begin with a clear high-level definition, detail the operational tradeoffs, cite how ${expectedConcepts.slice(0, 2).join(' and ') || 'core principles'} apply in practice, and conclude with measurable impact.`

    const practicalTip =
      questionType === 'behavioral'
        ? 'Anchor your behavioral responses using the STAR method: Situation (15%), Task (15%), Action (50%), and Result (20%).'
        : 'When answering technical questions, always state your assumptions upfront and briefly analyze time/space complexity or system tradeoffs.'

    return {
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
      missingConcepts,
      suggestedStrongerAnswer,
      practicalTip,
      dimensionFeedback: [
        `Relevance: ${relevance}% | Correctness: ${correctness}% | Completeness: ${completeness}%`,
        `Structure: ${structure}% | Clarity: ${clarity}% | Examples: ${examples}%`,
      ],
    }
  },

  evaluateSession(params: {
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
  }): SessionEvaluationSummary {
    const { role, interviewType, qaPairs } = params
    const answeredPairs = qaPairs.filter((p) => p.answerText && p.answerText.trim().length > 0)
    const count = answeredPairs.length

    const scores = answeredPairs.map((p) => p.score || 65)
    const avgScore = count > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / count) : 0

    let rubricTier: SessionEvaluationSummary['rubricTier'] = 'Developing'
    if (avgScore >= 90) rubricTier = 'Excellent'
    else if (avgScore >= 80) rubricTier = 'Strong'
    else if (avgScore >= 70) rubricTier = 'Competent'
    else if (avgScore >= 55) rubricTier = 'Developing'
    else rubricTier = 'Needs substantial improvement'

    // Category performance grouping
    const categoryMap = new Map<string, number[]>()
    qaPairs.forEach((q) => {
      const cat = q.category || 'General'
      const cur = categoryMap.get(cat) || []
      cur.push(q.score || 65)
      categoryMap.set(cat, cur)
    })

    const categoryPerformance = Array.from(categoryMap.entries()).map(([cat, list]) => ({
      category: cat,
      score: Math.round(list.reduce((a, b) => a + b, 0) / list.length),
    }))

    // Missing concepts aggregation
    const missingFreq = new Map<string, number>()
    qaPairs.forEach((q) => {
      ;(q.missingConcepts || []).forEach((c) => {
        missingFreq.set(c, (missingFreq.get(c) || 0) + 1)
      })
    })

    const keyConceptsToRevise = Array.from(missingFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([concept]) => concept)
      .slice(0, 5)

    if (keyConceptsToRevise.length === 0) {
      keyConceptsToRevise.push('System Tradeoffs & Constraints', 'Complexity Analysis', 'Edge Case Handling')
    }

    const strongestAreas = categoryPerformance
      .filter((c) => c.score >= 75)
      .map((c) => `${c.category} concepts`)
    if (strongestAreas.length === 0) {
      strongestAreas.push('Prompt comprehension', 'Willingness to explain thought process')
    }

    const weakestAreas = categoryPerformance
      .filter((c) => c.score < 75)
      .map((c) => `Deeper exploration of ${c.category}`)
    if (weakestAreas.length === 0) {
      weakestAreas.push('Providing production-grade metrics and scale benchmarks')
    }

    const repeatedMistakes: string[] = []
    const briefAnswersCount = answeredPairs.filter((p) => p.answerText.split(/\s+/).length < 40).length
    if (briefAnswersCount >= 2) {
      repeatedMistakes.push('Truncated responses lacking concrete architectural or mathematical depth.')
    }
    const noExamplesCount = answeredPairs.filter(
      (p) => !p.answerText.toLowerCase().includes('example') && !p.answerText.toLowerCase().includes('such as')
    ).length
    if (noExamplesCount >= 2) {
      repeatedMistakes.push('Omitting production war stories or real-world project examples.')
    }
    if (repeatedMistakes.length === 0) {
      repeatedMistakes.push('Occasional hesitation when discussing performance tradeoffs.')
    }

    const actionableImprovementPlan = [
      {
        step: 1,
        title: 'Review Key Missing Architectural Concepts',
        description: `Dedicate focused revision to ${keyConceptsToRevise.slice(0, 2).join(' and ')}. Write concise one-paragraph cheat-sheets for each.`,
        timeline: 'Day 1 - 2',
      },
      {
        step: 2,
        title: 'Structured STAR Delivery Drills',
        description: 'Practice 3 targeted questions using 2-minute voice delivery. Enforce clear Situation, Task, Action, and measurable Result.',
        timeline: 'Day 3 - 5',
      },
      {
        step: 3,
        title: 'Full Simulation with Time Pressure',
        description: `Complete a 5-question mock session focusing on ${weakestAreas[0] || 'challenging technical scenarios'}.`,
        timeline: 'Day 6 - 7',
      },
    ]

    return {
      overallScore: avgScore,
      rubricTier,
      questionsCompleted: count,
      categoryPerformance,
      strongestAreas,
      weakestAreas,
      repeatedMistakes,
      keyConceptsToRevise,
      actionableImprovementPlan,
      suggestedNextSession: {
        role,
        type: interviewType === 'Behavioral' ? 'Technical' : 'Role-specific',
        focus: weakestAreas[0] || 'System Architecture & Edge Cases',
        reason: 'Reinforces identified growth areas while maintaining current domain fluency.',
      },
    }
  },
}
