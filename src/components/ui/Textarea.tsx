import React from 'react'
import { cn } from '@/lib/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  showWordCount?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, showWordCount = false, value, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    const wordCount = typeof value === 'string' ? value.trim().split(/\s+/).filter(Boolean).length : 0

    return (
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={textareaId} className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {label}
            </label>
          )}
          {showWordCount && (
            <span className="text-xs text-slate-500 font-mono">
              {wordCount} words
            </span>
          )}
        </div>
        <textarea
          id={textareaId}
          ref={ref}
          value={value}
          className={cn(
            'w-full min-h-[120px] rounded-xl bg-slate-900/80 border border-slate-700/80 p-3.5 text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed resize-y',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-rose-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
