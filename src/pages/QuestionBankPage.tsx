import React, { useEffect, useState } from 'react'
import {
  FileQuestion,
  Search,
  Bookmark,
  BookmarkCheck,
  Play,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Tag,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { storageService } from '@/lib/storageService'
import { aiService } from '@/lib/aiService'
import { QuestionBankItem, AnswerEvaluation } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Textarea } from '@/components/ui/Textarea'
import { VoiceRecorder } from '@/components/interview/VoiceRecorder'
import { Skeleton } from '@/components/ui/Skeleton'

export const QuestionBankPage: React.FC = () => {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [questions, setQuestions] = useState<QuestionBankItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [difficultyFilter, setDifficultyFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [onlySaved, setOnlySaved] = useState(false)

  // Practice Single Question Modal
  const [activePracticeQuestion, setActivePracticeQuestion] = useState<QuestionBankItem | null>(null)
  const [practiceAnswer, setPracticeAnswer] = useState('')
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [practiceEvaluation, setPracticeEvaluation] = useState<AnswerEvaluation | null>(null)

  // Expandable hints & solution
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function loadQuestions() {
      setIsLoading(true)
      try {
        const data = await storageService.getQuestionBank(user?.id)
        setQuestions(data)
      } catch (err) {
        console.error('Failed to load question bank:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadQuestions()
  }, [user])

  const toggleSave = async (questionId: string) => {
    if (!user) {
      showToast('Please sign in to save questions.', 'warning')
      return
    }

    try {
      const isNowSaved = await storageService.toggleSaveQuestion(user.id, questionId)
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, is_saved: isNowSaved } : q))
      )
      showToast(isNowSaved ? 'Question saved to bookmarks!' : 'Question removed from saved.', 'info')
    } catch (err: any) {
      showToast(err.message || 'Failed to update bookmark.', 'error')
    }
  }

  const toggleSolutionVisibility = (id: string) => {
    setExpandedSolutions((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const openPracticeModal = (q: QuestionBankItem) => {
    setActivePracticeQuestion(q)
    setPracticeAnswer('')
    setPracticeEvaluation(null)
  }

  const handleEvaluatePractice = async () => {
    if (!activePracticeQuestion) return
    if (!practiceAnswer.trim()) {
      showToast('Please provide an answer before requesting evaluation.', 'warning')
      return
    }

    setIsEvaluating(true)
    try {
      const mockQuestionParam = {
        id: activePracticeQuestion.id,
        session_id: 'quick-practice',
        position: 1,
        question_text: activePracticeQuestion.question_text,
        category: activePracticeQuestion.category,
        difficulty: activePracticeQuestion.difficulty,
        topic_tags: [activePracticeQuestion.topic],
        expected_concepts: activePracticeQuestion.expected_concepts,
        question_type: activePracticeQuestion.question_type,
        hints: activePracticeQuestion.hints,
        example_solution: activePracticeQuestion.example_solution,
        created_at: new Date().toISOString(),
      }

      const { data } = await aiService.evaluateAnswer(
        mockQuestionParam,
        practiceAnswer.trim(),
        60,
        activePracticeQuestion.role
      )
      setPracticeEvaluation(data)
      showToast('Evaluation complete!', 'success')
    } catch (err: any) {
      showToast(err.message || 'Evaluation failed.', 'error')
    } finally {
      setIsEvaluating(false)
    }
  }

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.role.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === 'ALL' || q.role === roleFilter
    const matchesDiff = difficultyFilter === 'ALL' || q.difficulty === difficultyFilter
    const matchesType = typeFilter === 'ALL' || q.question_type === typeFilter
    const matchesSaved = !onlySaved || q.is_saved

    return matchesSearch && matchesRole && matchesDiff && matchesType && matchesSaved
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-blue-400" />
            <h1 className="text-2xl font-bold text-slate-100">Curated Question Bank</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Browse, search, bookmark, and practice real-world interview questions with instant evaluation
          </p>
        </div>

        <button
          onClick={() => setOnlySaved(!onlySaved)}
          className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            onlySaved
              ? 'bg-blue-600/20 border-blue-500 text-blue-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          {onlySaved ? <BookmarkCheck className="w-4 h-4 text-blue-400" /> : <Bookmark className="w-4 h-4" />}
          <span>{onlySaved ? 'Showing Saved Questions' : 'Show Saved Only'}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          placeholder="Search questions or topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />

        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          options={[
            { value: 'ALL', label: 'All Job Roles' },
            { value: 'Frontend Developer', label: 'Frontend Developer' },
            { value: 'Backend Developer', label: 'Backend Developer' },
            { value: 'Full-Stack Developer', label: 'Full-Stack Developer' },
            { value: 'Python Developer', label: 'Python Developer' },
            { value: 'Data Analyst', label: 'Data Analyst' },
            { value: 'Product Manager', label: 'Product Manager' },
          ]}
        />

        <Select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          options={[
            { value: 'ALL', label: 'All Difficulties' },
            { value: 'Easy', label: 'Easy' },
            { value: 'Medium', label: 'Medium' },
            { value: 'Hard', label: 'Hard' },
          ]}
        />

        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { value: 'ALL', label: 'All Question Types' },
            { value: 'technical_explanation', label: 'Technical Explanation' },
            { value: 'system_design', label: 'System Design' },
            { value: 'behavioral', label: 'Behavioral (STAR)' },
            { value: 'coding', label: 'Coding Problem' },
          ]}
        />
      </div>

      {/* Questions Grid */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : filteredQuestions.length > 0 ? (
        <div className="space-y-4">
          {filteredQuestions.map((question) => {
            const isSolutionOpen = Boolean(expandedSolutions[question.id])

            return (
              <Card key={question.id} className="bg-slate-900 border-slate-800">
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="default" size="sm">{question.role}</Badge>
                        <Badge variant="neutral" size="sm">{question.category}</Badge>
                        <Badge variant="outline" size="sm">{question.difficulty}</Badge>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Tag className="w-3 h-3 text-slate-400" /> {question.topic}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-100 leading-snug">
                        {question.question_text}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => toggleSave(question.id)}
                        className={`p-2 rounded-xl border transition-colors ${
                          question.is_saved
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                            : 'bg-slate-800 border-slate-700/80 text-slate-400 hover:text-white'
                        }`}
                        title={question.is_saved ? 'Remove bookmark' : 'Save question'}
                        aria-label="Save question"
                      >
                        {question.is_saved ? <BookmarkCheck className="w-4 h-4 text-blue-400" /> : <Bookmark className="w-4 h-4" />}
                      </button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openPracticeModal(question)}
                        leftIcon={<Play className="w-3 h-3 fill-current" />}
                      >
                        Practice
                      </Button>
                    </div>
                  </div>

                  {/* Hints and Expected Concepts Tag Row */}
                  {question.expected_concepts && question.expected_concepts.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Target Concepts:</span>
                      {question.expected_concepts.map((concept, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 font-mono text-[11px] border border-slate-800">
                          {concept}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expand Solution & Explanations */}
                  {question.example_solution && (
                    <div className="border-t border-slate-800 pt-3">
                      <button
                        type="button"
                        onClick={() => toggleSolutionVisibility(question.id)}
                        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>{isSolutionOpen ? 'Hide Exemplary Solution' : 'Reveal Model Solution'}</span>
                        {isSolutionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isSolutionOpen && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed italic animate-in fade-in">
                          "{question.example_solution}"
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <FileQuestion className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-semibold text-slate-200">No matching questions found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search criteria or resetting the role and difficulty filters.
          </p>
        </div>
      )}

      {/* Practice Single Question Interactive Modal */}
      {activePracticeQuestion && (
        <Dialog
          isOpen={Boolean(activePracticeQuestion)}
          onClose={() => setActivePracticeQuestion(null)}
          title={`Practice: ${activePracticeQuestion.role}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-blue-400">Prompt:</span>
              <p className="text-sm font-semibold text-slate-100 mt-1">
                {activePracticeQuestion.question_text}
              </p>
            </div>

            <VoiceRecorder
              onTranscriptReady={(t) => setPracticeAnswer((prev) => (prev ? `${prev} ${t}` : t))}
              disabled={isEvaluating}
            />

            <Textarea
              label="Your Response"
              placeholder="Structure your answer clearly with concrete examples..."
              value={practiceAnswer}
              onChange={(e) => setPracticeAnswer(e.target.value)}
              rows={5}
              showWordCount
              disabled={isEvaluating}
            />

            {/* Evaluation Results if evaluated */}
            {practiceEvaluation && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-sm text-slate-200">Instant Evaluation Result</span>
                  <Badge variant="success" size="md">
                    Score: {practiceEvaluation.overallScore}%
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-emerald-300">
                    <span className="font-bold">&bull; What Went Well:</span>{' '}
                    {practiceEvaluation.whatWentWell.join(' ')}
                  </div>
                  <div className="text-amber-300">
                    <span className="font-bold">&bull; Needs Improvement:</span>{' '}
                    {practiceEvaluation.whatNeedsImprovement.join(' ')}
                  </div>
                  <div className="text-blue-300">
                    <span className="font-bold">&bull; Practical Tip:</span> {practiceEvaluation.practicalTip}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActivePracticeQuestion(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isEvaluating}
                onClick={handleEvaluatePractice}
                rightIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Evaluate My Answer
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
