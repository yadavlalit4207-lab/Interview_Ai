import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle, PlayCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { signIn, signInDemoUser, isDemoMode } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const destination = (location.state as any)?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Please provide both email and password.')
      return
    }

    setIsLoading(true)
    try {
      await signIn(email, password)
      showToast('Welcome back to InterviewAce!', 'success')
      navigate(destination, { replace: true })
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setIsLoading(true)
    try {
      await signInDemoUser()
      showToast('Signed in with Demo Candidate profile!', 'info')
      navigate(destination, { replace: true })
    } catch (err: any) {
      setError(err.message || 'Could not start demo session.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-slate-100">
              Interview<span className="text-blue-500">Ace</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Sign In to Your Studio</h1>
          <p className="text-sm text-slate-400 mt-1">
            Pick up where you left off with your mock interviews
          </p>
        </div>

        <Card className="bg-slate-900/90 border-slate-800 shadow-2xl">
          <CardContent className="p-6">
            {/* Quick 1-Click Demo Login */}
            <div className="mb-6 pb-6 border-b border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={handleDemoLogin}
                isLoading={isLoading}
                className="w-full justify-center bg-blue-950/40 hover:bg-blue-900/50 border-blue-500/30 text-blue-200"
                leftIcon={<PlayCircle className="w-4 h-4 text-blue-400" />}
              >
                1-Click Instant Demo Access
              </Button>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                Instant access with pre-configured candidate profile & history
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold">
                Sign up free
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
