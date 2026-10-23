import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PlayCircle,
  Award,
  Clock,
  CheckCircle,
  FileQuestion,
  BarChart2,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Calendar,
  AlertTriangle,
  BookOpen,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { storageService } from '@/lib/storageService'
import { InterviewSession, AnalyticsData } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { ScoreGauge } from '@/components/feedback/ScoreGauge'
import { Skeleton } from '@/components/ui/Skeleton'

export const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [unfinishedSession, setUnfinishedSession] = useState<InterviewSession | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      if (!user) return
      setIsLoading(true)
      try {
        const data = await storageService.getUserAnalytics(user.id)
        setAnalytics(data)

        // Check for any in-progress or preparing session
        const allSessions = await storageService.getUserSessions(user.id)
        const inProgress = allSessions.find(
          (s) => s.status === 'In progress' || s.status === 'Preparing'
        )
        setUnfinishedSession(inProgress || null)
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [user])

  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Candidate'
  const targetRole = profile?.target_role || 'Software Engineer'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            Welcome, {displayName}! <Sparkles className="w-5 h-5 text-blue-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Targeting: <span className="text-blue-400 font-semibold">{targetRole}</span> &bull; Experience: {profile?.experience_level || 'Intermediate'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/question-bank">
            <Button variant="secondary" size="md" leftIcon={<BookOpen className="w-4 h-4 text-slate-400" />}>
              Question Bank
            </Button>
          </Link>
          <Link to="/interview/setup">
            <Button variant="primary" size="md" leftIcon={<PlayCircle className="w-4 h-4" />}>
              Start Mock Interview
            </Button>
          </Link>
        </div>
      </div>

      {/* In-Progress Session Recovery Alert */}
      {unfinishedSession && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 text-sm">
                  Active Interview in Progress: {unfinishedSession.role}
                </span>
                <Badge variant="warning" size="sm">Resume Available</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {unfinishedSession.interview_type} &bull; {unfinishedSession.difficulty} &bull; Started {new Date(unfinishedSession.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <Link to={`/interview/${unfinishedSession.id}`}>
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Resume Session
            </Button>
          </Link>
        </div>
      )}

      {/* Key Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Completed Interviews */}
        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Interviews</p>
              <h3 className="text-2xl font-bold text-slate-100 font-mono mt-1">
                {isLoading ? <Skeleton className="h-8 w-12" /> : analytics?.totalInterviews || 0}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Completed sessions</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Average Score */}
        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Score</p>
              <h3 className="text-2xl font-bold text-slate-100 font-mono mt-1">
                {isLoading ? (
                  <Skeleton className="h-8 w-14" />
                ) : analytics?.averageScore ? (
                  `${analytics.averageScore}%`
                ) : (
                  '—'
                )}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {analytics?.averageScore && analytics.averageScore >= 75 ? 'Above benchmark' : 'Evaluated by rubric'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Practice Minutes */}
        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Practice Time</p>
              <h3 className="text-2xl font-bold text-slate-100 font-mono mt-1">
                {isLoading ? <Skeleton className="h-8 w-16" /> : `${analytics?.totalPracticeMinutes || 0}m`}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Time answering questions</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Questions Answered */}
        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Answered</p>
              <h3 className="text-2xl font-bold text-slate-100 font-mono mt-1">
                {isLoading ? <Skeleton className="h-8 w-12" /> : analytics?.totalQuestionsAnswered || 0}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Questions evaluated</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <FileQuestion className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Recent Interviews & Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Interviews Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100">Recent Interview Sessions</h2>
            <Link to="/history" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
              View All History <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card className="bg-slate-900 border-slate-800">
            {isLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : analytics?.recentSessions && analytics.recentSessions.length > 0 ? (
              <div className="divide-y divide-slate-800/80">
                {analytics.recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                        {session.overall_score ? `${Math.round(session.overall_score)}%` : '—'}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100">{session.role}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <span className="capitalize">{session.interview_type}</span>
                          <span>&bull;</span>
                          <span className="capitalize">{session.difficulty}</span>
                          <span>&bull;</span>
                          <span>{new Date(session.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          session.status === 'Completed'
                            ? 'success'
                            : session.status === 'In progress'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {session.status}
                      </Badge>
                      <Link
                        to={
                          session.status === 'Completed'
                            ? `/interview/${session.id}/feedback`
                            : `/interview/${session.id}`
                        }
                      >
                        <Button variant="ghost" size="sm" className="p-2">
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">No mock interviews completed yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Start your first AI practice session to test your knowledge and receive structured rubric feedback.
                </p>
                <Link to="/interview/setup" className="inline-block pt-2">
                  <Button variant="primary" size="sm">
                    Configure First Interview
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Recommended Practice & Skill Breakdown */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-100">Recommended Practice</h2>
          <Card className="bg-slate-900 border-slate-800 p-5 space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Focus Area
              </span>
              <h4 className="text-sm font-semibold text-slate-100 mt-1">
                System Design & High-Concurrency Architecture
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Rehearsing cache invalidation strategies and database sharding patterns will boost technical interview scores.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Top Categories for {targetRole}
              </span>
              <div className="space-y-1.5">
                {['Technical Deep Dive', 'Behavioral (STAR Stories)', 'Architecture & Tradeoffs'].map((cat) => (
                  <div key={cat} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
                    <span className="text-slate-300">{cat}</span>
                    <Link to="/interview/setup">
                      <span className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer">
                        Practice
                      </span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <Link to="/interview/setup" className="block pt-2">
              <Button variant="secondary" size="sm" className="w-full justify-center">
                Custom Setup
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
