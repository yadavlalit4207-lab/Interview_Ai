import {
  UserProfile,
  UserPreferences,
  InterviewSession,
  InterviewQuestion,
  InterviewAnswer,
  InterviewEvaluationSummary,
  QuestionBankItem,
  AnalyticsData,
  InterviewConfig,
} from '@/types'
import { supabase, isSupabaseConfigured } from './supabaseClient'
import { SEED_QUESTION_BANK } from './mockData'

const STORAGE_KEYS = {
  PROFILES: 'interviewace_profiles',
  PREFERENCES: 'interviewace_preferences',
  SESSIONS: 'interviewace_sessions',
  QUESTIONS: 'interviewace_questions',
  ANSWERS: 'interviewace_answers',
  SAVED_QUESTIONS: 'interviewace_saved_questions',
}

function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : defaultValue
  } catch {
    return defaultValue
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error(`Failed to save to localStorage (${key}):`, err)
  }
}

export const storageService = {
  // ==========================================
  // PROFILES
  // ==========================================
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      if (data) return data as UserProfile
    }

    const profiles = getLocal<Record<string, UserProfile>>(STORAGE_KEYS.PROFILES, {})
    return profiles[userId] || null
  },

  async upsertProfile(profile: UserProfile): Promise<UserProfile> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profile)
        .select()
        .single()
      if (error) throw error
      return data as UserProfile
    }

    const profiles = getLocal<Record<string, UserProfile>>(STORAGE_KEYS.PROFILES, {})
    profiles[profile.id] = { ...profile, updated_at: new Date().toISOString() }
    setLocal(STORAGE_KEYS.PROFILES, profiles)
    return profiles[profile.id]
  },

  // ==========================================
  // PREFERENCES
  // ==========================================
  async getPreferences(userId: string): Promise<UserPreferences> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      if (data) return data as UserPreferences
    }

    const allPrefs = getLocal<Record<string, UserPreferences>>(STORAGE_KEYS.PREFERENCES, {})
    if (allPrefs[userId]) return allPrefs[userId]

    const defaultPrefs: UserPreferences = {
      user_id: userId,
      theme: 'system',
      default_interview_type: 'Technical',
      default_difficulty: 'Medium',
      voice_enabled: false,
      updated_at: new Date().toISOString(),
    }
    allPrefs[userId] = defaultPrefs
    setLocal(STORAGE_KEYS.PREFERENCES, allPrefs)
    return defaultPrefs
  },

  async updatePreferences(preferences: UserPreferences): Promise<UserPreferences> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(preferences)
        .select()
        .single()
      if (error) throw error
      return data as UserPreferences
    }

    const allPrefs = getLocal<Record<string, UserPreferences>>(STORAGE_KEYS.PREFERENCES, {})
    allPrefs[preferences.user_id] = {
      ...preferences,
      updated_at: new Date().toISOString(),
    }
    setLocal(STORAGE_KEYS.PREFERENCES, allPrefs)
    return allPrefs[preferences.user_id]
  },

  // ==========================================
  // SESSIONS
  // ==========================================
  async createSession(userId: string, config: InterviewConfig): Promise<InterviewSession> {
    const newSession: InterviewSession = {
      id: crypto.randomUUID(),
      user_id: userId,
      role: config.role,
      interview_type: config.interview_type,
      experience_level: config.experience_level,
      difficulty: config.difficulty,
      target_company: config.target_company || null,
      job_description: config.job_description || null,
      skills_focus: config.skills_focus || null,
      language: config.language || 'English',
      candidate_background: config.candidate_background || null,
      status: 'Preparing',
      question_count: config.question_count,
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert(newSession)
        .select()
        .single()
      if (error) throw error
      return data as InterviewSession
    }

    const sessions = getLocal<InterviewSession[]>(STORAGE_KEYS.SESSIONS, [])
    sessions.unshift(newSession)
    setLocal(STORAGE_KEYS.SESSIONS, sessions)
    return newSession
  },

  async getSessionById(sessionId: string, currentUserId: string): Promise<InterviewSession | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select(`
          *,
          questions:interview_questions(*),
          answers:interview_answers(*)
        `)
        .eq('id', sessionId)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      if (!data) return null

      // Strict user ownership check
      if (data.user_id !== currentUserId) {
        throw new Error('Access denied: You do not own this interview session.')
      }

      // Sort questions by position
      if (data.questions) {
        data.questions.sort((a: InterviewQuestion, b: InterviewQuestion) => a.position - b.position)
      }
      return data as InterviewSession
    }

    const sessions = getLocal<InterviewSession[]>(STORAGE_KEYS.SESSIONS, [])
    const session = sessions.find((s) => s.id === sessionId)
    if (!session) return null

    if (session.user_id !== currentUserId) {
      throw new Error('Access denied: You do not own this interview session.')
    }

    const allQuestions = getLocal<InterviewQuestion[]>(STORAGE_KEYS.QUESTIONS, [])
    const allAnswers = getLocal<InterviewAnswer[]>(STORAGE_KEYS.ANSWERS, [])

    const questions = allQuestions
      .filter((q) => q.session_id === sessionId)
      .sort((a, b) => a.position - b.position)
    const answers = allAnswers.filter((a) => a.session_id === sessionId)

    return {
      ...session,
      questions,
      answers,
    }
  },

  async getUserSessions(userId: string): Promise<InterviewSession[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as InterviewSession[]
    }

    const sessions = getLocal<InterviewSession[]>(STORAGE_KEYS.SESSIONS, [])
    return sessions
      .filter((s) => s.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  async updateSessionStatus(
    sessionId: string,
    userId: string,
    status: InterviewSession['status'],
    overallScore?: number
  ): Promise<void> {
    const updates: Partial<InterviewSession> = {
      status,
      updated_at: new Date().toISOString(),
      ...(status === 'Completed' ? { completed_at: new Date().toISOString() } : {}),
      ...(typeof overallScore === 'number' ? { overall_score: overallScore } : {}),
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('interview_sessions')
        .update(updates)
        .eq('id', sessionId)
        .eq('user_id', userId)
      if (error) throw error
      return
    }

    const sessions = getLocal<InterviewSession[]>(STORAGE_KEYS.SESSIONS, [])
    const index = sessions.findIndex((s) => s.id === sessionId && s.user_id === userId)
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...updates }
      setLocal(STORAGE_KEYS.SESSIONS, sessions)
    }
  },

  async saveSessionEvaluation(
    sessionId: string,
    userId: string,
    evaluation: InterviewEvaluationSummary
  ): Promise<void> {
    const updates = {
      status: 'Completed' as const,
      completed_at: new Date().toISOString(),
      overall_score: evaluation.overallScore,
      summary_feedback: evaluation,
      updated_at: new Date().toISOString(),
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('interview_sessions')
        .update(updates)
        .eq('id', sessionId)
        .eq('user_id', userId)
      if (error) throw error
      return
    }

    const sessions = getLocal<InterviewSession[]>(STORAGE_KEYS.SESSIONS, [])
    const index = sessions.findIndex((s) => s.id === sessionId && s.user_id === userId)
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...updates }
      setLocal(STORAGE_KEYS.SESSIONS, sessions)
    }
  },

  // ==========================================
  // QUESTIONS & ANSWERS
  // ==========================================
  async saveQuestions(questions: InterviewQuestion[]): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('interview_questions').insert(questions)
      if (error) throw error
      return
    }

    const existing = getLocal<InterviewQuestion[]>(STORAGE_KEYS.QUESTIONS, [])
    setLocal(STORAGE_KEYS.QUESTIONS, [...existing, ...questions])
  },

  async saveAnswer(answer: InterviewAnswer): Promise<InterviewAnswer> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('interview_answers')
        .upsert(answer, { onConflict: 'session_id,question_id' })
        .select()
        .single()
      if (error) throw error
      return data as InterviewAnswer
    }

    const answers = getLocal<InterviewAnswer[]>(STORAGE_KEYS.ANSWERS, [])
    const index = answers.findIndex(
      (a) => a.session_id === answer.session_id && a.question_id === answer.question_id
    )

    if (index !== -1) {
      answers[index] = { ...answers[index], ...answer, updated_at: new Date().toISOString() }
    } else {
      answers.push(answer)
    }
    setLocal(STORAGE_KEYS.ANSWERS, answers)
    return answer
  },

  // ==========================================
  // QUESTION BANK
  // ==========================================
  async getQuestionBank(userId?: string): Promise<QuestionBankItem[]> {
    let items = SEED_QUESTION_BANK

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('question_bank').select('*')
      if (!error && data && data.length > 0) {
        items = data as QuestionBankItem[]
      }
    }

    if (userId) {
      const savedIds = await this.getSavedQuestionIds(userId)
      return items.map((q) => ({
        ...q,
        is_saved: savedIds.includes(q.id),
      }))
    }

    return items
  },

  async getSavedQuestionIds(userId: string): Promise<string[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('saved_questions')
        .select('question_id')
        .eq('user_id', userId)
      if (error) throw error
      return data.map((d: { question_id: string }) => d.question_id)
    }

    const map = getLocal<Record<string, string[]>>(STORAGE_KEYS.SAVED_QUESTIONS, {})
    return map[userId] || []
  },

  async toggleSaveQuestion(userId: string, questionId: string): Promise<boolean> {
    const savedIds = await this.getSavedQuestionIds(userId)
    const isSaved = savedIds.includes(questionId)

    if (isSupabaseConfigured()) {
      if (isSaved) {
        await supabase
          .from('saved_questions')
          .delete()
          .eq('user_id', userId)
          .eq('question_id', questionId)
        return false
      } else {
        await supabase
          .from('saved_questions')
          .insert({ user_id: userId, question_id: questionId })
        return true
      }
    }

    const map = getLocal<Record<string, string[]>>(STORAGE_KEYS.SAVED_QUESTIONS, {})
    const current = map[userId] || []
    if (isSaved) {
      map[userId] = current.filter((id) => id !== questionId)
      setLocal(STORAGE_KEYS.SAVED_QUESTIONS, map)
      return false
    } else {
      map[userId] = [...current, questionId]
      setLocal(STORAGE_KEYS.SAVED_QUESTIONS, map)
      return true
    }
  },

  // ==========================================
  // ANALYTICS
  // ==========================================
  async getUserAnalytics(userId: string): Promise<AnalyticsData> {
    const sessions = await this.getUserSessions(userId)
    const completedSessions = sessions.filter(
      (s) => s.status === 'Completed' && s.overall_score !== null && s.overall_score !== undefined
    )

    const allAnswers = getLocal<InterviewAnswer[]>(STORAGE_KEYS.ANSWERS, [])
    const userAnswers = allAnswers.filter((a) =>
      completedSessions.some((s) => s.id === a.session_id)
    )

    const totalInterviews = completedSessions.length
    const averageScore = totalInterviews > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => acc + (s.overall_score || 0), 0) / totalInterviews
        )
      : 0

    // Practice minutes approximation based on answered questions
    const totalQuestionsAnswered = userAnswers.length
    const totalDurationSeconds = userAnswers.reduce(
      (acc, a) => acc + (a.duration_seconds || 90),
      0
    )
    const totalPracticeMinutes = Math.round(totalDurationSeconds / 60)

    // Score trend by date
    const scoreTrend = completedSessions
      .slice(0, 10)
      .reverse()
      .map((s) => ({
        date: new Date(s.completed_at || s.created_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        sessionName: `${s.role} (${s.interview_type})`,
        score: Math.round(s.overall_score || 0),
      }))

    // Weekly activity
    const weeks: Record<string, { count: number; minutes: number }> = {}
    completedSessions.forEach((s) => {
      const d = new Date(s.completed_at || s.created_at)
      const weekLabel = `Wk ${d.getDate()}/${d.getMonth() + 1}`
      if (!weeks[weekLabel]) weeks[weekLabel] = { count: 0, minutes: 0 }
      weeks[weekLabel].count += 1
      weeks[weekLabel].minutes += (s.question_count || 5) * 2
    })

    const weeklyActivity = Object.entries(weeks).map(([week, val]) => ({
      week,
      count: val.count,
      minutes: val.minutes,
    }))

    // Category scores
    const categoryMap: Record<string, { total: number; count: number }> = {}
    completedSessions.forEach((s) => {
      const cat = s.interview_type || 'General'
      if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 }
      categoryMap[cat].total += s.overall_score || 0
      categoryMap[cat].count += 1
    })

    const categoryScores = Object.entries(categoryMap).map(([category, val]) => ({
      category,
      averageScore: Math.round(val.total / val.count),
      count: val.count,
    }))

    // Aggregate missed concepts
    const conceptCounts: Record<string, { count: number; category: string }> = {}
    userAnswers.forEach((a) => {
      if (a.feedback_json?.missingConcepts) {
        a.feedback_json.missingConcepts.forEach((c) => {
          if (!conceptCounts[c]) conceptCounts[c] = { count: 0, category: 'General' }
          conceptCounts[c].count += 1
        })
      }
    })

    const mostMissedConcepts = Object.entries(conceptCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([concept, data]) => ({
        concept,
        occurrences: data.count,
        category: data.category,
      }))

    return {
      totalInterviews,
      averageScore,
      totalPracticeMinutes,
      totalQuestionsAnswered,
      scoreTrend,
      weeklyActivity,
      categoryScores,
      skillBreakdown: [
        { skill: 'Relevance', score: averageScore ? Math.min(100, averageScore + 4) : 0, level: 'Proficient' },
        { skill: 'Technical Depth', score: averageScore ? Math.max(0, averageScore - 3) : 0, level: 'Developing' },
        { skill: 'Structure (STAR)', score: averageScore ? Math.min(100, averageScore + 2) : 0, level: 'Competent' },
        { skill: 'Clarity & Delivery', score: averageScore || 0, level: 'Competent' },
      ],
      recentSessions: sessions.slice(0, 5),
      mostMissedConcepts,
    }
  },

  // Delete all user records (for GDPR / settings account deletion)
  async deleteUserData(userId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('profiles').delete().eq('id', userId)
      await supabase.from('interview_sessions').delete().eq('user_id', userId)
      await supabase.from('saved_questions').delete().eq('user_id', userId)
      await supabase.from('user_preferences').delete().eq('user_id', userId)
    }

    const profiles = getLocal<Record<string, UserProfile>>(STORAGE_KEYS.PROFILES, {})
    delete profiles[userId]
    setLocal(STORAGE_KEYS.PROFILES, profiles)

    const sessions = getLocal<InterviewSession[]>(STORAGE_KEYS.SESSIONS, [])
    const filteredSessions = sessions.filter((s) => s.user_id !== userId)
    setLocal(STORAGE_KEYS.SESSIONS, filteredSessions)
  },
}
