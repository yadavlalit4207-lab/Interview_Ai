import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 mb-4 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" />
          <h1 className="text-3xl font-bold text-slate-100">Privacy Policy</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">Last Updated: October 2026</p>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-sm text-slate-300 space-y-6 leading-relaxed">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-100">1. Information We Collect</h2>
            <p>
              InterviewAce collects information you provide directly, including your display name, target job role, career stage, experience level, and responses submitted during mock interviews. Audio recorded in voice mode is processed through your browser's speech recognition engine and converted to text; raw audio files are not stored on our servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-100">2. How We Use Your Data</h2>
            <p>
              Your data is used solely to generate relevant interview questions, evaluate your submitted answers against educational rubrics, track preparation progress, and deliver performance analytics. We do not sell your personal data or candidate responses to third parties or recruiters.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-100">3. Artificial Intelligence & Third-Party Processing</h2>
            <p>
              When AI evaluations are executed, question contexts and submitted text answers are transmitted via secure server-side API calls to configured Large Language Model providers (such as Google Gemini or OpenAI) solely to produce structured evaluation reports. User identifiers are omitted from AI payloads.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-100">4. Security & Row-Level Isolation</h2>
            <p>
              We implement PostgreSQL Row Level Security (RLS) policies ensuring that each candidate can only read, update, and evaluate their own interview sessions and answers. You retain the right to export all stored records in JSON format or delete your account and all associated data at any time via Settings.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-100">5. Contact & Data Protection Inquiries</h2>
            <p>
              If you have any questions or data protection requests regarding your privacy, please submit a request through the platform or contact privacy@interviewace.dev.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
