import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  History as HistoryIcon,
  Search,
  Calendar,
  Award,
  ArrowRight,
  Filter,
  PlayCircle,
  Clock,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { storageService } from '@/lib/storageService'
import { InterviewSession } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

export const HistoryPage: React.FC = () => {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<InterviewSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    async function loadHistory() {
      if (!user) return
      setIsLoading(true)
      try {
        const data = await storageService.getUserSessions(user.id)
        setSessions(data)
      } catch (err) {
        console.error('Failed to load session history:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [user])

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.interview_type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-blue-400" />
            <h1 className="text-2xl font-bold text-slate-100">Session History</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Review past mock interviews, answers, and performance evaluations
          </p>
        </div>

        <Link to="/interview/setup">
          <Button variant="primary" size="md" leftIcon={<PlayCircle className="w-4 h-4" />}>
            New Mock Interview
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search role or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'Completed', label: 'Completed' },
              { value: 'In progress', label: 'In Progress' },
              { value: 'Cancelled', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      {/* Sessions List */}
      <Card className="bg-slate-900 border-slate-800">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-200 flex flex-col items-center justify-center font-bold shrink-0">
                    <span className="text-base font-mono leading-none">
                      {session.overall_score !== null && session.overall_score !== undefined
                        ? `${Math.round(session.overall_score)}%`
                        : '—'}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold mt-0.5">
                      {session.overall_score ? 'Score' : 'Active'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-100">{session.role}</h3>
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
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400">
                      <span>Type: {session.interview_type}</span>
                      <span>&bull;</span>
                      <span>Difficulty: {session.difficulty}</span>
                      <span>&bull;</span>
                      <span>{session.question_count} Questions</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(session.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <Link
                    to={
                      session.status === 'Completed'
                        ? `/interview/${session.id}/feedback`
                        : `/interview/${session.id}`
                    }
                  >
                    <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      {session.status === 'Completed' ? 'View Evaluation' : 'Resume Session'}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <HistoryIcon className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="font-semibold text-slate-200">No matching sessions found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't conducted any interviews matching this filter yet.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
