import React from 'react'
import {
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Volume2,
  VolumeX,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface InterviewerCorrectionCardProps {
  score: number
  missingConcepts?: string[]
  whatNeedsImprovement?: string[]
  whatWentWell?: string[]
  suggestedStrongerAnswer?: string
  practicalTip?: string
  onRetry: () => void
  onContinue: () => void
  isSpeakingCorrection: boolean
  onToggleSpeech: () => void
}

export const InterviewerCorrectionCard: React.FC<InterviewerCorrectionCardProps> = ({
  score,
  missingConcepts = [],
  whatNeedsImprovement = [],
  whatWentWell = [],
  suggestedStrongerAnswer,
  practicalTip,
  onRetry,
  onContinue,
  isSpeakingCorrection,
  onToggleSpeech,
}) => {
  const isSeverelyIncorrect = score < 50

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-slate-900/95 shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Top Banner */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border-b border-amber-500/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Interviewer Feedback & Correction</span>
              <Badge
                variant={isSeverelyIncorrect ? 'danger' : 'warning'}
                size="sm"
              >
                {isSeverelyIncorrect ? 'Needs Correction' : 'Partially Correct'} ({score}/100)
              </Badge>
            </h3>
            <p className="text-xs text-amber-300/90 mt-0.5">
              Sarah pointed out missing concepts in your answer and explained how to correct it.
            </p>
          </div>
        </div>

        {/* Listen again to Sarah's spoken correction */}
        <button
          type="button"
          onClick={onToggleSpeech}
          className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
            isSpeakingCorrection
              ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/30 animate-pulse'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
          title={isSpeakingCorrection ? 'Stop Audio' : 'Hear Sarah Speak Correction'}
        >
          {isSpeakingCorrection ? (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mute Voice</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Hear Correction</span>
            </>
          )}
        </button>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* SECTION 1: POINTING OUT WHAT WAS WRONG / MISSING */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Missing or Inaccurate Information:</span>
          </div>

          {missingConcepts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {missingConcepts.map((concept, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  {concept}
                </span>
              ))}
            </div>
          )}

          {whatNeedsImprovement.length > 0 && (
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300 pl-1">
              {whatNeedsImprovement.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* SECTION 2: HOW TO CORRECT IT (MODEL ANSWER & TIPS) */}
        {suggestedStrongerAnswer && (
          <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>How To Answer Correctly (Model Solution):</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
              {suggestedStrongerAnswer}
            </p>
          </div>
        )}

        {practicalTip && (
          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-200 leading-relaxed">
              <span className="font-semibold text-blue-300">Interviewer Tip: </span>
              {practicalTip}
            </div>
          </div>
        )}

        {/* SECTION 3: ACTION BUTTONS (RETRY OR CONTINUE) */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-4 h-4 text-amber-400" />}
            className="w-full sm:w-auto border-amber-500/40 hover:bg-amber-500/10 text-amber-300 hover:text-amber-200"
          >
            Practice Again (Apply Correction)
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onContinue}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Next Question
          </Button>
        </div>
      </div>
    </div>
  )
}
