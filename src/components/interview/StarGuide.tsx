import React, { useState } from 'react'
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'

export const StarGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-xs text-indigo-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 font-medium hover:text-white transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span>Recommended Framework: <strong>STAR Method</strong></span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-indigo-400" />}
      </button>

      {isOpen && (
        <div className="p-3 pt-0 border-t border-indigo-500/10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
          <div className="p-2 rounded-lg bg-black/30">
            <span className="font-bold text-indigo-300">S — Situation:</span> Set the scene, context, and project challenge.
          </div>
          <div className="p-2 rounded-lg bg-black/30">
            <span className="font-bold text-indigo-300">T — Task:</span> What was your specific responsibility or goal?
          </div>
          <div className="p-2 rounded-lg bg-black/30">
            <span className="font-bold text-indigo-300">A — Action:</span> Detail the exact technical/interpersonal steps you took.
          </div>
          <div className="p-2 rounded-lg bg-black/30">
            <span className="font-bold text-indigo-300">R — Result:</span> Share the measurable outcome, learnings, and impact.
          </div>
        </div>
      )}
    </div>
  )
}
