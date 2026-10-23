// Supabase Edge Function: interview-ai
// Handles secure question generation, answer evaluation, and improvement plan creation
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestPayload {
  action: 'generate_questions' | 'evaluate_answer' | 'evaluate_session'
  sessionConfig?: {
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
  answerPayload?: {
    questionText: string
    questionCategory: string
    questionType: string
    expectedConcepts?: string[]
    candidateAnswer: string
    durationSeconds?: number
  }
  sessionEvaluationPayload?: {
    role: string
    interviewType: string
    experienceLevel: string
    difficulty: string
    qaPairs: Array<{
      questionText: string
      category: string
      answerText: string
      score?: number
    }>
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const aiApiKey = Deno.env.get('AI_PROVIDER_API_KEY') || Deno.env.get('GEMINI_API_KEY') || Deno.env.get('OPENAI_API_KEY')
    const aiModel = Deno.env.get('AI_MODEL') || 'gemini-1.5-flash'
    const aiBaseUrl = Deno.env.get('AI_PROVIDER_BASE_URL')

    // Validate Authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: RequestPayload = await req.json()
    const { action } = body

    if (!aiApiKey) {
      return new Response(
        JSON.stringify({
          error: 'AI Provider API Key is not configured on the server. Please set AI_PROVIDER_API_KEY.',
          code: 'AI_KEY_NOT_CONFIGURED',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call LLM provider (Supports Gemini API or OpenAI-compatible format)
    if (action === 'generate_questions') {
      const config = body.sessionConfig
      if (!config) throw new Error('Missing sessionConfig in payload')

      const prompt = `You are an expert technical interviewer and hiring manager for the role of ${config.role}.
Generate exactly ${config.questionCount} distinct, high-quality interview questions for a ${config.experienceLevel} candidate at ${config.difficulty} difficulty.
Interview Type: ${config.interviewType}
${config.targetCompany ? `Target Company: ${config.targetCompany}` : ''}
${config.skillsFocus?.length ? `Skills Focus: ${config.skillsFocus.join(', ')}` : ''}
${config.jobDescription ? `Job Description Context: ${config.jobDescription.slice(0, 500)}` : ''}

CRITICAL RULES:
1. Do not ask generic or repeated questions.
2. If behavioral, formulate scenarios where STAR response is expected.
3. If technical, formulate questions that assess depth, tradeoffs, and edge cases.
4. Output STRICT JSON only with the following structure:
{
  "questions": [
    {
      "position": 1,
      "question_text": "...",
      "category": "...",
      "difficulty": "${config.difficulty}",
      "question_type": "technical_explanation" | "coding" | "behavioral" | "system_design" | "short_answer",
      "topic_tags": ["tag1", "tag2"],
      "expected_concepts": ["concept1", "concept2"],
      "hints": ["hint 1", "hint 2"]
    }
  ]
}`

      const llmResult = await callLlmProvider(prompt, aiApiKey, aiModel, aiBaseUrl)
      return new Response(JSON.stringify(llmResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'evaluate_answer') {
      const payload = body.answerPayload
      if (!payload) throw new Error('Missing answerPayload in payload')

      const prompt = `You are a fair, rigorous, objective interview evaluator assessing a candidate's response.
Question: "${payload.questionText}"
Category: ${payload.questionCategory}
Type: ${payload.questionType}
Expected Concepts: ${payload.expectedConcepts?.join(', ') || 'N/A'}

Candidate Answer:
"${payload.candidateAnswer}"

Evaluate strictly according to this normalized 0-100 rubric:
- 0–39: Needs substantial improvement
- 40–59: Developing
- 60–74: Competent
- 75–89: Strong
- 90–100: Excellent

Scoring dimensions (0-100 each):
- relevance: did it answer the specific question?
- correctness: technical or domain factual accuracy.
- completeness: addressed core concepts and edge cases without unnecessary fluff.
- structure: logical flow (e.g. STAR for behavioral, premise->tradeoffs for tech).
- clarity: clear language, accessible communication.
- examples: practical concrete examples or complexity analysis where appropriate.
- communication: confidence, concise articulation.

Output STRICT JSON only:
{
  "overallScore": number (0-100),
  "dimensionScores": {
    "relevance": number,
    "correctness": number,
    "completeness": number,
    "structure": number,
    "clarity": number,
    "examples": number,
    "communication": number
  },
  "whatWentWell": ["point 1", "point 2"],
  "whatNeedsImprovement": ["point 1", "point 2"],
  "missingConcepts": ["missing item 1"],
  "suggestedStrongerAnswer": "A concise, well-structured exemplary answer demonstrating optimal structure.",
  "practicalTip": "Actionable takeaway for future interviews."
}`

      const llmResult = await callLlmProvider(prompt, aiApiKey, aiModel, aiBaseUrl)
      return new Response(JSON.stringify(llmResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'evaluate_session') {
      const payload = body.sessionEvaluationPayload
      if (!payload) throw new Error('Missing sessionEvaluationPayload')

      const prompt = `You are a Principal Hiring Committee Lead synthesizing a complete interview evaluation.
Role: ${payload.role}
Type: ${payload.interviewType}
Experience Level: ${payload.experienceLevel}
Difficulty: ${payload.difficulty}

Session Q&A Review:
${JSON.stringify(payload.qaPairs, null, 2)}

Produce a comprehensive final evaluation report in strict JSON:
{
  "overallScore": number,
  "rubricTier": "Needs substantial improvement" | "Developing" | "Competent" | "Strong" | "Excellent",
  "questionsCompleted": number,
  "categoryPerformance": [{"category": "...", "score": number}],
  "strongestAreas": ["area 1", "area 2"],
  "weakestAreas": ["area 1", "area 2"],
  "repeatedMistakes": ["mistake 1"],
  "keyConceptsToRevise": ["concept 1", "concept 2"],
  "actionableImprovementPlan": [
    {"step": 1, "title": "...", "description": "...", "timeline": "Days 1-3"},
    {"step": 2, "title": "...", "description": "...", "timeline": "Days 4-7"},
    {"step": 3, "title": "...", "description": "...", "timeline": "Week 2"}
  ],
  "suggestedNextSession": {
    "role": "${payload.role}",
    "type": "Technical",
    "focus": "...",
    "reason": "..."
  }
}`

      const llmResult = await callLlmProvider(prompt, aiApiKey, aiModel, aiBaseUrl)
      return new Response(JSON.stringify(llmResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function callLlmProvider(prompt: string, apiKey: string, model: string, baseUrl?: string): Promise<unknown> {
  // If base URL provided or model looks like OpenAI
  const endpoint = baseUrl || 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey

  // Gemini native format
  if (endpoint.includes('googleapis.com')) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Gemini API error: ${res.status} ${errText}`)
    }
    const data = await res.json()
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
    return JSON.parse(rawText)
  }

  // Standard OpenAI-compatible format
  const openAiUrl = baseUrl || 'https://api.openai.com/v1/chat/completions'
  const res = await fetch(openAiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenAI API error: ${res.status} ${errText}`)
  }
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  return JSON.parse(content)
}
