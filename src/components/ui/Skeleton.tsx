import React from 'react'
import { cn } from '@/lib/cn'

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-slate-800/80', className)}
      {...props}
    />
  )
}
