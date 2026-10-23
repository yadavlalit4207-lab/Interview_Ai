export type CareerStage = 'Student' | 'Fresher' | 'Working professional' | 'Career switcher'
export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced'
export type InterviewDifficulty = 'Easy' | 'Medium' | 'Hard'
export type InterviewType = 'Technical' | 'Behavioral' | 'HR' | 'Role-specific' | 'Mixed interview'

export type SessionStatus =
  | 'Draft'
  | 'Preparing'
  | 'In progress'
  | 'Evaluating'
  | 'Completed'
  | 'Cancelled'
  | 'Failed'

export type QuestionType =
  | 'technical_explanation'
  | 'coding'
  | 'behavioral'
  | 'system_design'
  | 'short_answer'

export interface UserProfile {
  id: string
  email: string
  display_name: string
  career_stage: CareerStage
  target_role: string
  experience_level: ExperienceLevel
  preferred_language: string
  target_company?: string | null
  preparation_goals?: string | null
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  user_id: string
  theme: 'dark' | 'light' | 'system'
  default_interview_type: InterviewType
  default_difficulty: InterviewDifficulty
  voice_enabled: boolean
  updated_at: string
}

export interface InterviewConfig {
  role: string
  interview_type: InterviewType
  experience_level: ExperienceLevel
  difficulty: InterviewDifficulty
  question_count: number
  target_company?: string
  job_description?: string
  skills_focus?: string[]
  language: string
  candidate_background?: string
}

export interface DimensionScore {
  name: string
  key: 'relevance' | 'correctness' | 'completeness' | 'structure' | 'clarity' | 'examples' | 'communication'
  score: number // 0-100
  weight: number
  feedback: string
}

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

export interface ImprovementStep {
  step: number
  title: string
  description: string
  timeline: string
}

export interface InterviewEvaluationSummary {
  overallScore: number
  rubricTier: 'Needs substantial improvement' | 'Developing' | 'Competent' | 'Strong' | 'Excellent'
  questionsCompleted: number
  categoryPerformance: { category: string; score: number }[]
  strongestAreas: string[]
  weakestAreas: string[]
  repeatedMistakes: string[]
  keyConceptsToRevise: string[]
  actionableImprovementPlan: ImprovementStep[]
  suggestedNextSession: {
    role: string
    type: InterviewType
    focus: string
    reason: string
  }
}

export interface InterviewQuestion {
  id: string
  session_id: string
  position: number
  question_text: string
  category: string
  difficulty: InterviewDifficulty
  topic_tags: string[]
  expected_concepts: string[]
  question_type: QuestionType
  hints?: string[]
  example_solution?: string | null
  created_at: string
}

export interface InterviewAnswer {
  id: string
  session_id: string
  question_id: string
  answer_text: string
  transcript?: string | null
  duration_seconds?: number | null
  submitted_at: string
  score?: number | null
  feedback_json?: AnswerEvaluation | null
  created_at: string
  updated_at: string
}

export interface InterviewSession {
  id: string
  user_id: string
  role: string
  interview_type: InterviewType
  experience_level: ExperienceLevel
  difficulty: InterviewDifficulty
  target_company?: string | null
  job_description?: string | null
  skills_focus?: string[] | null
  language: string
  candidate_background?: string | null
  status: SessionStatus
  question_count: number
  started_at: string
  completed_at?: string | null
  overall_score?: number | null
  evaluation_version?: string | null
  summary_feedback?: InterviewEvaluationSummary | null
  created_at: string
  updated_at: string
  questions?: InterviewQuestion[]
  answers?: InterviewAnswer[]
}

export interface QuestionBankItem {
  id: string
  role: string
  category: string
  difficulty: InterviewDifficulty
  topic: string
  question_text: string
  question_type: QuestionType
  hints: string[]
  expected_concepts: string[]
  example_solution?: string | null
  is_saved?: boolean
  created_at: string
}

export interface AnalyticsData {
  totalInterviews: number
  averageScore: number
  totalPracticeMinutes: number
  totalQuestionsAnswered: number
  scoreTrend: { date: string; sessionName: string; score: number }[]
  weeklyActivity: { week: string; count: number; minutes: number }[]
  categoryScores: { category: string; averageScore: number; count: number }[]
  skillBreakdown: { skill: string; score: number; level: string }[]
  recentSessions: InterviewSession[]
  mostMissedConcepts: { concept: string; occurrences: number; category: string }[]
}
