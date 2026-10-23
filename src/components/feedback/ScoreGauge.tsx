import React from 'react'

interface ScoreGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showTier?: boolean
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 'md',
  showTier = true,
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(score)))

  const getTier = (s: number) => {
    if (s >= 90) return { label: 'Excellent', color: 'text-emerald-400', stroke: '#10B981' }
    if (s >= 75) return { label: 'Strong', color: 'text-blue-400', stroke: '#3B82F6' }
    if (s >= 60) return { label: 'Competent', color: 'text-indigo-400', stroke: '#6366F1' }
    if (s >= 40) return { label: 'Developing', color: 'text-amber-400', stroke: '#F59E0B' }
    return { label: 'Needs Improvement', color: 'text-rose-400', stroke: '#EF4444' }
  }

  const tier = getTier(clamped)

  const dimensions = {
    sm: { radius: 32, strokeWidth: 5, boxSize: 76, textSize: 'text-lg' },
    md: { radius: 46, strokeWidth: 7, boxSize: 110, textSize: 'text-3xl' },
    lg: { radius: 64, strokeWidth: 9, boxSize: 150, textSize: 'text-4xl' },
  }

  const { radius, strokeWidth, boxSize, textSize } = dimensions[size]
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clamped / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center gap-1.5">
      <div className="relative flex items-center justify-center" style={{ width: boxSize, height: boxSize }}>
        <svg className="transform -rotate-90" width={boxSize} height={boxSize}>
          {/* Background circle */}
          <circle
            cx={boxSize / 2}
            cy={boxSize / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-800"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={boxSize / 2}
            cy={boxSize / 2}
            r={radius}
            stroke={tier.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-extrabold ${textSize} text-slate-100 tracking-tight font-mono`}>
            {clamped}
          </span>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider -mt-1">
            /100
          </span>
        </div>
      </div>

      {showTier && (
        <span className={`text-xs font-bold uppercase tracking-wider ${tier.color}`}>
          {tier.label}
        </span>
      )}
    </div>
  )
}
