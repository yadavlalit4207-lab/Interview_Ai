import React from 'react'

interface DimensionBarProps {
  label: string
  score: number
  description?: string
}

export const DimensionBar: React.FC<DimensionBarProps> = ({ label, score, description }) => {
  const clamped = Math.min(100, Math.max(0, Math.round(score)))

  const getColor = (s: number) => {
    if (s >= 85) return 'bg-emerald-500'
    if (s >= 70) return 'bg-blue-500'
    if (s >= 55) return 'bg-indigo-500'
    if (s >= 40) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-300">{label}</span>
        <span className="font-mono font-bold text-slate-200">{clamped}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getColor(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {description && <p className="text-[11px] text-slate-400">{description}</p>}
    </div>
  )
}
