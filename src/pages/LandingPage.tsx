import React from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Mic,
  BarChart3,
  BookOpen,
  Award,
  Zap,
  Target,
  Code2,
  Briefcase,
  Users,
  Layers,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { ScoreGauge } from '@/components/feedback/ScoreGauge'

export const LandingPage: React.FC = () => {
  const popularRoles = [
    'Frontend Developer',
    'Backend Developer',
    'Full-Stack Developer',
    'Data Analyst',
    'Python Developer',
    'Machine Learning Engineer',
    'DevOps Engineer',
    'Product Manager',
  ]

  const features = [
    {
      icon: <Sparkles className="w-5 h-5 text-blue-400" />,
      title: 'Context-Aware AI Interviewer',
      description:
        'Generates role-specific, difficulty-tuned questions tailored to your experience level, target company, and actual job description.',
    },
    {
      icon: <Mic className="w-5 h-5 text-indigo-400" />,
      title: 'Voice & Typing Modes',
      description:
        'Practice speaking aloud with real-time speech recognition and text-to-speech, or type structured answers with code block support.',
    },
    {
      icon: <Award className="w-5 h-5 text-purple-400" />,
      title: '7-Dimension Rubric Evaluation',
      description:
        'Detailed evaluation across Relevance, Correctness, Completeness, Structure (STAR), Clarity, Examples, and Communication.',
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-emerald-400" />,
      title: 'Actionable Progress Analytics',
      description:
        'Track score trends, identify frequently missed technical concepts, and receive structured personalized study plans.',
    },
    {
      icon: <BookOpen className="w-5 h-5 text-amber-400" />,
      title: 'Curated Question Bank',
      description:
        'Explore hundreds of real-world technical and behavioral questions with hints, expected concepts, and model answers.',
    },
    {
      icon: <Target className="w-5 h-5 text-rose-400" />,
      title: 'STAR Method Coaching',
      description:
        'Behavioral questions are guided with Situation, Task, Action, and Result frameworks to guarantee structured responses.',
    },
  ]

  const faqs = [
    {
      q: 'How does InterviewAce evaluate my responses?',
      a: 'Answers are evaluated against a standardized 7-dimension rubric (Relevance, Correctness, Completeness, Structure, Clarity, Examples, and Communication) using structured AI models. You receive an objective 0–100 score, strengths, areas for improvement, and a model answer.',
    },
    {
      q: 'Can I practice by speaking instead of typing?',
      a: 'Yes! InterviewAce supports browser-powered voice speech recognition. You can record your spoken answer, review and edit the transcript, and submit it for evaluation.',
    },
    {
      q: 'Does InterviewAce guarantee a job offer?',
      a: 'No. InterviewAce is an educational preparation platform designed to boost your skills and confidence. AI scores are practice estimations and not guarantees of commercial hiring outcomes.',
    },
    {
      q: 'Is my interview practice data private?',
      a: 'Yes. With Supabase Row Level Security (RLS) and local browser storage, your sessions, answers, and evaluations are strictly isolated to your account.',
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-slate-800/60 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[250px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium mb-6 animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI-Powered Technical & Behavioral Preparation</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-100 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Practice Smarter.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400">
              Interview Better.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Your personal AI interview coach. Practice real-world questions, receive actionable feedback, and build the confidence to land your next opportunity.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto px-8 shadow-xl shadow-blue-600/25" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Start Practicing Free
              </Button>
            </Link>
            <a href="#features">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Explore Features
              </Button>
            </a>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Technical & Behavioral
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant Rubric Feedback
            </span>
          </div>

          {/* Interactive Product Preview Dashboard */}
          <div className="mt-16 max-w-5xl mx-auto rounded-3xl p-2 bg-gradient-to-b from-slate-700/40 via-slate-800/20 to-slate-900/60 border border-slate-700/50 shadow-2xl shadow-black/80">
            <div className="rounded-2xl bg-slate-950 p-6 sm:p-8 text-left border border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-100">Senior Full-Stack Developer Mock Session</h3>
                      <Badge variant="success" size="sm">Sample Report</Badge>
                    </div>
                    <p className="text-xs text-slate-400">Technical & System Design &bull; Hard &bull; 5 Questions</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Overall Evaluation</span>
                    <p className="text-xs text-emerald-400 font-bold">Strong &bull; Top 15%</p>
                  </div>
                  <ScoreGauge score={84} size="sm" showTier={false} />
                </div>
              </div>

              {/* Sample Question & Evaluation */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-semibold text-blue-400">Question 3 of 5 &bull; System Design</span>
                      <span>Avg Score: 88%</span>
                    </div>
                    <p className="text-sm font-medium text-slate-200">
                      "Design a distributed rate limiter that handles 100,000 requests per second across multiple data centers. How do you prevent race conditions and handle Redis node failures?"
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-3">
                    <div>
                      <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> What Went Well:
                      </span>
                      <p className="text-slate-300 mt-1">
                        Accurately proposed Redis Token Bucket with Lua scripts to guarantee atomic increments without distributed locking overhead.
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" /> Suggested Improvement:
                      </span>
                      <p className="text-slate-300 mt-1">
                        Mention a local in-memory fallback cache (Guava/LRU) if Redis becomes completely unreachable to fail-open gracefully.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rubric Breakdown Widget */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3 text-xs">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                    Rubric Breakdown
                  </span>
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Relevance</span>
                        <span className="font-bold text-slate-200 font-mono">92%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Correctness</span>
                        <span className="font-bold text-slate-200 font-mono">85%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Structure (STAR)</span>
                        <span className="font-bold text-slate-200 font-mono">88%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: '88%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Edge Cases</span>
                        <span className="font-bold text-slate-200 font-mono">72%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '72%' }} />
                      </div>
                    </div>
                  </div>
                  <Link to="/signup">
                    <Button variant="primary" size="sm" className="w-full mt-2">
                      Try This Question
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Workflow */}
      <section className="py-20 bg-slate-950 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Simple 3-Step Process
            </h2>
            <p className="mt-2 text-3xl font-bold text-slate-100">
              How AI Mock Interviews Work
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Configure Your Interview</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Choose your target job role, experience level, difficulty, and optional job description or company to generate personalized questions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Conduct Mock Session</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Answer one question at a time by speaking aloud or typing. Take your time or practice under realistic timer constraints.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Get Actionable Feedback</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Receive standardized rubric scoring, missing concepts, strengths, model answers, and a structured study plan to improve rapidly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Supported Roles */}
      <section className="py-20 bg-slate-900/40 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Role Versatility
            </h2>
            <p className="mt-2 text-3xl font-bold text-slate-100">
              Tailored For Top In-Demand Roles
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {popularRoles.map((role) => (
              <div
                key={role}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center gap-3"
              >
                <Briefcase className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-sm font-medium text-slate-200">{role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-950 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Why InterviewAce
            </h2>
            <p className="mt-2 text-3xl font-bold text-slate-100">
              Engineered For Measurable Preparation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => (
              <Card key={feat.title} className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center mb-4">
                    {feat.icon}
                  </div>
                  <h3 className="text-base font-semibold text-slate-100 mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-20 bg-slate-900/30 border-b border-slate-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Honest Answers
            </h2>
            <p className="mt-2 text-3xl font-bold text-slate-100">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-left">
                <h3 className="text-base font-semibold text-slate-100 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="mt-4 text-base text-slate-400 max-w-xl mx-auto">
            Join candidates sharpening their technical explanations and behavioral delivery with InterviewAce.
          </p>
          <div className="mt-8 flex justify-center">
            <Link to="/signup">
              <Button size="lg" className="px-8 shadow-xl shadow-blue-600/30" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Start Practicing Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
