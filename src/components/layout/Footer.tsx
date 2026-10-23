import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Shield, Heart } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-slate-100">
                Interview<span className="text-blue-500">Ace</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              AI-powered mock interview practice platform for software engineers, data analysts, and tech professionals. Master technical concepts, hone behavioral stories, and track progress with objective metrics.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Row Level Security & Local Data Privacy Protected</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Platform</h4>
            <Link to="/interview/setup" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
              Mock Interview Studio
            </Link>
            <Link to="/question-bank" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
              Curated Question Bank
            </Link>
            <Link to="/analytics" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
              Skill Analytics
            </Link>
            <Link to="/dashboard" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
              Candidate Dashboard
            </Link>
          </div>

          {/* Legal & Compliance */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Legal & Terms</h4>
            <Link to="/privacy" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
              Terms of Service
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
            >
              API & Edge Documentation
            </a>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="text-center sm:text-left">
            Disclaimer: InterviewAce evaluations and scores are AI-assisted practice estimations. They do not represent official hiring guarantees or commercial company assessments.
          </p>
          <div className="flex items-center gap-1 shrink-0 text-slate-400">
            <span>&copy; {new Date().getFullYear()} InterviewAce. Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>for job seekers.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
