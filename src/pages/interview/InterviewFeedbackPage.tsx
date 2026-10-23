import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import {
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Printer,
  Copy,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Calendar,
  Layers,
  FileText,
  Target,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { storageService } from '@/lib/storageService'
import { InterviewSession, InterviewQuestion, InterviewAnswer } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { ScoreGauge } from '@/components/feedback/ScoreGauge'
import { DimensionBar } from '@/components/feedback/DimensionBar'
import { Skeleton } from '@/components/ui/Skeleton'

export const InterviewFeedbackPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [session, setSession] = useState<InterviewSession | null>(null)
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [answers, setAnswers] = useState<InterviewAnswer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null)

  useEffect(() => {
    async function loadReport() {
      if (!sessionId || !user) return
      setIsLoading(true)
      try {
        const s = await storageService.getSessionById(sessionId, user.id)
        if (!s) {
          showToast('Interview report not found or access denied.', 'error')
          navigate('/dashboard')
          return
        }
        setSession(s)
        const qList = s.questions || []
        const aList = s.answers || []
        setQuestions(qList)
        setAnswers(aList)

        // Expand first question by default
        if (qList.length > 0) {
          setExpandedQuestionId(qList[0].id)
        }

        // Fire confetti celebration if score is competent or higher
        if (s.overall_score && s.overall_score >= 60) {
          confetti({
            particleCount: 65,
            spread: 70,
            origin: { y: 0.6 },
          })
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load report.', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    loadReport()
  }, [sessionId, user])

  const copyReportSummary = () => {
    if (!session || !session.summary_feedback) return
    const text = `InterviewAce Evaluation Report
Role: ${session.role} (${session.interview_type})
Overall Score: ${session.overall_score || 0}/100 (${session.summary_feedback.rubricTier})
Strongest Areas: ${session.summary_feedback.strongestAreas.join(', ')}
Key Focus Areas: ${session.summary_feedback.weakestAreas.join(', ')}`

    navigator.clipboard.writeText(text)
    showToast('Report summary copied to clipboard!', 'success')
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!session || !session.summary_feedback) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="font-bold text-slate-100">No Evaluation Report</h3>
        <p className="text-xs text-slate-400">This interview has not been evaluated yet.</p>
        <Link to="/dashboard">
          <Button variant="secondary" size="sm">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  const summary = session.summary_feedback
  const score = session.overall_score || 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 print:p-0">
      {/* Report Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">Evaluation Completed</Badge>
            <span className="text-xs text-slate-400">
              {new Date(session.completed_at || session.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
            {session.role} Interview Evaluation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {session.interview_type} &bull; {session.difficulty} difficulty &bull; {session.question_count} questions
          </p>
        </div>

        <div className="flex items-center gap-2.5 print:hidden">
          <Button variant="secondary" size="sm" onClick={copyReportSummary} leftIcon={<Copy className="w-3.5 h-3.5" />}>
            Copy Summary
          </Button>
          <Button variant="secondary" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-3.5 h-3.5" />}>
            Print / PDF
          </Button>
          <Link to="/interview/setup">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Practice Again
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Score & Synthesis Card */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-slate-800 shadow-2xl">
        <CardContent className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Score Radial Gauge */}
            <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-8">
              <ScoreGauge score={score} size="lg" />
              <p className="text-xs text-slate-400 text-center mt-3 max-w-[200px]">
                Normalized practice score based on technical depth, relevance, structure, and communication.
              </p>
            </div>

            {/* Performance Highlights */}
            <div className="md:col-span-2 space-y-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Strongest Areas
                </span>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-200">
                  {summary.strongestAreas.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">&bull;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Priority Areas for Improvement
                </span>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-200">
                  {summary.weakestAreas.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">&bull;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actionable Improvement Plan */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" /> Actionable Next Steps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summary.actionableImprovementPlan.map((step) => (
            <Card key={step.step} className="bg-slate-900 border-slate-800 p-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Badge variant="default" size="sm">Step {step.step}</Badge>
                <span className="font-mono text-slate-400">{step.timeline}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-200">{step.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Detailed Question-by-Question Review Accordion */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" /> Question-by-Question Breakdown
        </h2>

        <div className="space-y-3">
          {questions.map((question, index) => {
            const answer = answers.find((a) => a.question_id === question.id)
            const evaluation = answer?.feedback_json
            const isExpanded = expandedQuestionId === question.id
            const qScore = answer?.score !== undefined && answer?.score !== null ? Math.round(answer.score) : 0

            return (
              <Card
                key={question.id}
                className={`bg-slate-900 border-slate-800 transition-all ${
                  isExpanded ? 'ring-1 ring-blue-500/30' : ''
                }`}
              >
                {/* Question Header Accordion Trigger */}
                <div
                  onClick={() => setExpandedQuestionId(isExpanded ? null : question.id)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                      Q{index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral" size="sm">{question.category}</Badge>
                        <Badge variant="outline" size="sm">{question.difficulty}</Badge>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-200 mt-1 line-clamp-1">
                        {question.question_text}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-100">{qScore}%</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-slate-800/80 space-y-6 mt-3 text-xs">
                    {/* Full Question Text */}
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Prompt:</span>
                      <p className="text-sm font-medium text-slate-200 mt-1">{question.question_text}</p>
                    </div>

                    {/* Candidate Answer */}
                    <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Your Submitted Answer:</span>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap font-sans">
                        {answer?.answer_text || '(Skipped or not recorded)'}
                      </p>
                    </div>

                    {/* Rubric Dimension Scores */}
                    {evaluation && evaluation.dimensionScores && (
                      <div className="space-y-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Rubric Dimension Scores
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                          <DimensionBar label="Relevance" score={evaluation.dimensionScores.relevance} />
                          <DimensionBar label="Correctness & Depth" score={evaluation.dimensionScores.correctness} />
                          <DimensionBar label="Completeness" score={evaluation.dimensionScores.completeness} />
                          <DimensionBar label="Structure & Organization" score={evaluation.dimensionScores.structure} />
                          <DimensionBar label="Clarity of Explanation" score={evaluation.dimensionScores.clarity} />
                          <DimensionBar label="Concrete Examples" score={evaluation.dimensionScores.examples} />
                        </div>
                      </div>
                    )}

                    {/* What Went Well & Improvements */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {evaluation?.whatWentWell && evaluation.whatWentWell.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> What Went Well:
                          </span>
                          {evaluation.whatWentWell.map((w, idx) => (
                            <p key={idx} className="text-slate-300">&bull; {w}</p>
                          ))}
                        </div>
                      )}

                      {evaluation?.whatNeedsImprovement && evaluation.whatNeedsImprovement.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-1.5">
                          <span className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" /> Needs Improvement:
                          </span>
                          {evaluation.whatNeedsImprovement.map((w, idx) => (
                            <p key={idx} className="text-slate-300">&bull; {w}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Suggested Stronger Model Answer */}
                    {evaluation?.suggestedStrongerAnswer && (
                      <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 space-y-1">
                        <span className="font-bold text-blue-400 flex items-center gap-1.5 text-[11px]">
                          <Lightbulb className="w-3.5 h-3.5" /> Exemplary Model Answer (Demonstrative):
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed mt-1 italic">
                          "{evaluation.suggestedStrongerAnswer}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Bottom Follow-up Recommended Session */}
      {summary.suggestedNextSession && (
        <Card className="bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border-blue-500/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Recommended Next Practice
            </span>
            <h3 className="text-base font-bold text-slate-100">
              {summary.suggestedNextSession.role} &bull; Focus: {summary.suggestedNextSession.focus}
            </h3>
            <p className="text-xs text-slate-300">{summary.suggestedNextSession.reason}</p>
          </div>
          <Link to="/interview/setup">
            <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Configure Follow-Up
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
