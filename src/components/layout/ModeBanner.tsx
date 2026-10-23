import React, { useState } from 'react'
import { Info, X, ExternalLink, Database } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export const ModeBanner: React.FC = () => {
  const { isDemoMode } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  if (!isDemoMode || dismissed) return null

  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-200/90 flex items-center justify-between">
      <div className="max-w-7xl mx-auto flex items-center gap-2.5">
        <Database className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Local Mode:</strong> Running with browser-persistent storage and deterministic AI rubric evaluation. Supply Supabase credentials in <code className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-mono">.env</code> to connect cloud PostgreSQL.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded hover:bg-white/10 text-amber-400 hover:text-white transition-colors ml-2"
        aria-label="Dismiss banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
