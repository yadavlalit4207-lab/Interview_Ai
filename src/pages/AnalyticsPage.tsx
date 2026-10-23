import React, { useEffect, useState } from 'react'
import {
  BarChart2,
  TrendingUp,
  Calendar,
  AlertCircle,
  Award,
  Clock,
  CheckCircle,
  HelpCircle,
  BookOpen,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { storageService } from '@/lib/storageService'
import { AnalyticsData } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      if (!user) return
      setIsLoading(true)
      try {
        const stats = await storageService.getUserAnalytics(user.id)
        setData(stats)
      } catch (err) {
        console.error('Failed to load analytics:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [user])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-400" />
          <h1 className="text-2xl font-bold text-slate-100">Performance Analytics</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Measurable preparation metrics derived from real evaluated mock interviews
        </p>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Interviews</span>
            <h3 className="text-2xl font-bold font-mono text-slate-100 mt-1">
              {isLoading ? <Skeleton className="h-8 w-12" /> : data?.totalInterviews || 0}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Completed full sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Score</span>
            <h3 className="text-2xl font-bold font-mono text-slate-100 mt-1">
              {isLoading ? <Skeleton className="h-8 w-14" /> : data?.averageScore ? `${data.averageScore}%` : '—'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Normalized rubric average</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Practice Minutes</span>
            <h3 className="text-2xl font-bold font-mono text-slate-100 mt-1">
              {isLoading ? <Skeleton className="h-8 w-14" /> : `${data?.totalPracticeMinutes || 0}m`}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Active interview answering</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Questions Answered</span>
            <h3 className="text-2xl font-bold font-mono text-slate-100 mt-1">
              {isLoading ? <Skeleton className="h-8 w-12" /> : data?.totalQuestionsAnswered || 0}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Detailed responses graded</p>
          </CardContent>
        </Card>
      </div>

      {/* Score Trend Line Chart */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Interview Score Trend Over Time
          </CardTitle>
          <CardDescription>
            Chronological performance progression across recent mock sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : data?.scoreTrend && data.scoreTrend.length > 0 ? (
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.scoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500">
              <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">No score history yet. Complete an interview to view trends.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Performance & Missed Concepts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Performance Bar Chart */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" /> Category Breakdown
            </CardTitle>
            <CardDescription>Average score earned per interview domain.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : data?.categoryScores && data.categoryScores.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.categoryScores}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                    />
                    <Bar dataKey="averageScore" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500">
                <p className="text-xs">Category metrics appear once you complete your first session.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Frequently Missed Technical Concepts */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" /> Focus Revision Topics
            </CardTitle>
            <CardDescription>
              Concepts flagged by the rubric evaluator during recent answers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : data?.mostMissedConcepts && data.mostMissedConcepts.length > 0 ? (
              <div className="divide-y divide-slate-800 text-xs">
                {data.mostMissedConcepts.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <span className="font-medium text-slate-200">{item.concept}</span>
                    <Badge variant="warning" size="sm">
                      {item.occurrences} {item.occurrences === 1 ? 'flag' : 'flags'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500">
                <CheckCircle className="w-8 h-8 mb-2 text-emerald-500/50" />
                <p className="text-xs">No missing concepts recorded yet. Keep up the high standard!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
