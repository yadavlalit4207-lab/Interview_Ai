import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface TimerProps {
  onTick?: (seconds: number) => void
  isRunning?: boolean
  initialSeconds?: number
}

export const Timer: React.FC<TimerProps> = ({
  onTick,
  isRunning = true,
  initialSeconds = 0,
}) => {
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    let interval: any = null
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1
          if (onTick) onTick(next)
          return next
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, onTick])

  const format = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Highlight warning color if question taking over 3 minutes
  const isLengthy = seconds > 180

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-mono font-semibold transition-colors ${
        isLengthy
          ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
          : 'bg-slate-900 border-slate-800 text-slate-300'
      }`}
    >
      <Clock className={`w-3.5 h-3.5 ${isLengthy ? 'text-amber-400' : 'text-blue-400'}`} />
      <span>{format(seconds)}</span>
    </div>
  )
}
