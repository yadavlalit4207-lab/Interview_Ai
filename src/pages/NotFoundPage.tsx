import React from 'react'
import { Link } from 'react-router-dom'
import { Compass, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center mx-auto">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-100">404 — Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-sm mx-auto">
        The page or interview record you requested does not exist or may have been moved.
      </p>
      <Link to="/" className="pt-2 inline-block">
        <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Home
        </Button>
      </Link>
    </div>
  )
}
