import React from 'react'
import { cn } from '@/lib/cn'

export interface ProgressProps {
  value: number // 0-100
  className?: string
  color?: 'blue' | 'emerald' | 'amber' | 'purple'
}

export const Progress: React.FC<ProgressProps> = ({ value, className, color = 'blue' }) => {
  const clamped = Math.min(100, Math.max(0, value))

  const colors = {
    blue: 'bg-blue-500 shadow-blue-500/50',
    emerald: 'bg-emerald-500 shadow-emerald-500/50',
    amber: 'bg-amber-500 shadow-amber-500/50',
    purple: 'bg-purple-500 shadow-purple-500/50',
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('w-full h-2 rounded-full bg-slate-800 overflow-hidden', className)}
    >
      <div
        className={cn('h-full transition-all duration-500 ease-out rounded-full shadow-sm', colors[color])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
