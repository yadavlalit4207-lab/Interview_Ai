import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await resetPassword(email)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send password recovery email.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-slate-100">
              Interview<span className="text-blue-500">Ace</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Reset Password</h1>
          <p className="text-sm text-slate-400 mt-1">
            Enter your email to receive recovery instructions
          </p>
        </div>

        <Card className="bg-slate-900/90 border-slate-800 shadow-2xl">
          <CardContent className="p-6">
            {submitted ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-100 text-lg">Check Your Email</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We've dispatched password recovery instructions to{' '}
                  <span className="text-slate-200 font-semibold">{email}</span> if an account exists.
                </p>
                <Link to="/login">
                  <Button variant="secondary" size="md" className="w-full mt-4" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Input
                  label="Registered Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Send Recovery Link
                </Button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
