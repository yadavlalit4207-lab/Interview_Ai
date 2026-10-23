import {
  UserProfile,
  UserPreferences,
  InterviewSession,
  InterviewQuestion,
  InterviewAnswer,
  QuestionBankItem,
  AnalyticsData,
  InterviewConfig,
  InterviewEvaluationSummary,
  AnswerEvaluation,
} from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'interviewace_auth_token'

export class ApiError extends Error {
  status: number
  details?: any

  constructor(message: string, status: number, details?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch (e) {
      console.warn('Failed to save auth token:', e)
    }
  },
  remove(): void {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch (e) {
      console.warn('Failed to remove auth token:', e)
    }
  },
}

let cachedBackendStatus: boolean | null = null
let lastStatusCheck = 0

export async function isBackendAvailable(): Promise<boolean> {
  const now = Date.now()
  if (cachedBackendStatus !== null && now - lastStatusCheck < 10000) {
    return cachedBackendStatus
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1500)
    const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal })
    clearTimeout(timeout)
    cachedBackendStatus = res.ok
    lastStatusCheck = now
    return res.ok
  } catch {
    cachedBackendStatus = false
    lastStatusCheck = now
    return false
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const response = await fetch(url, {
    ...options,
    headers,
  })

  let data: any
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const message = data?.error || `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, data)
  }

  return data as T
}

export const apiClient = {
  // Authentication
  auth: {
    async register(email: string, password: string, displayName: string) {
      const res = await request<{
        token: string
        user: { id: string; email: string; display_name: string }
        profile: UserProfile
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName }),
      })
      tokenStorage.set(res.token)
      return res
    },

    async login(email: string, password: string) {
      const res = await request<{
        token: string
        user: { id: string; email: string; display_name: string }
        profile: UserProfile
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      tokenStorage.set(res.token)
      return res
    },

    async demoLogin() {
      const res = await request<{
        token: string
        user: { id: string; email: string; display_name: string }
        profile: UserProfile
      }>('/auth/demo-login', {
        method: 'POST',
      })
      tokenStorage.set(res.token)
      return res
    },

    async getMe() {
      return request<{
        user: { id: string; email: string; display_name: string }
        profile: UserProfile
        preferences: UserPreferences
      }>('/auth/me')
    },

    async forgotPassword(email: string) {
      return request<{ message: string; resetToken?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    },

    async resetPassword(token: string, newPassword: string) {
      return request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      })
    },

    async logout() {
      tokenStorage.remove()
      try {
        await request('/auth/logout', { method: 'POST' })
      } catch {
        // ignore logout errors
      }
    },
  },

  // Profile & Preferences
  profile: {
    async get(): Promise<UserProfile> {
      return request<UserProfile>('/profile')
    },
    async update(updates: Partial<UserProfile>): Promise<UserProfile> {
      return request<UserProfile>('/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
    },
    async getPreferences(): Promise<UserPreferences> {
      return request<UserPreferences>('/preferences')
    },
    async updatePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
      return request<UserPreferences>('/preferences', {
        method: 'PUT',
        body: JSON.stringify(prefs),
      })
    },
    async deleteUserData(): Promise<{ message: string }> {
      return request<{ message: string }>('/user/data', {
        method: 'DELETE',
      })
    },
  },

  // Interview Sessions
  sessions: {
    async list(): Promise<InterviewSession[]> {
      return request<InterviewSession[]>('/sessions')
    },
    async create(config: InterviewConfig): Promise<InterviewSession> {
      return request<InterviewSession>('/sessions', {
        method: 'POST',
        body: JSON.stringify(config),
      })
    },
    async get(id: string): Promise<InterviewSession> {
      return request<InterviewSession>(`/sessions/${id}`)
    },
    async update(id: string, updates: Partial<InterviewSession>): Promise<InterviewSession> {
      return request<InterviewSession>(`/sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
    },
    async delete(id: string): Promise<{ message: string }> {
      return request<{ message: string }>(`/sessions/${id}`, {
        method: 'DELETE',
      })
    },
    async submitAnswer(
      sessionId: string,
      payload: {
        question_id: string
        answer_text: string
        transcript?: string | null
        duration_seconds?: number | null
      }
    ): Promise<InterviewAnswer> {
      return request<InterviewAnswer>(`/sessions/${sessionId}/answers`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    async evaluate(sessionId: string): Promise<InterviewSession> {
      return request<InterviewSession>(`/sessions/${sessionId}/evaluate`, {
        method: 'POST',
      })
    },
  },

  // Question Bank
  questions: {
    async getBank(filters?: {
      role?: string
      difficulty?: string
      category?: string
      search?: string
    }): Promise<QuestionBankItem[]> {
      const query = new URLSearchParams()
      if (filters?.role) query.set('role', filters.role)
      if (filters?.difficulty) query.set('difficulty', filters.difficulty)
      if (filters?.category) query.set('category', filters.category)
      if (filters?.search) query.set('search', filters.search)

      const qs = query.toString()
      return request<QuestionBankItem[]>(`/questions/bank${qs ? `?${qs}` : ''}`)
    },
    async getSaved(): Promise<QuestionBankItem[]> {
      return request<QuestionBankItem[]>('/questions/saved')
    },
    async save(questionId: string): Promise<{ is_saved: boolean }> {
      return request<{ is_saved: boolean }>(`/questions/saved/${questionId}`, {
        method: 'POST',
      })
    },
    async unsave(questionId: string): Promise<{ is_saved: boolean }> {
      return request<{ is_saved: boolean }>(`/questions/saved/${questionId}`, {
        method: 'DELETE',
      })
    },
  },

  // Analytics
  analytics: {
    async get(): Promise<AnalyticsData> {
      return request<AnalyticsData>('/analytics')
    },
  },
}
