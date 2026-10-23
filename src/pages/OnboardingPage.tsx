import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, Briefcase, GraduationCap, Code, Globe, Building2, Target } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { CareerStage, ExperienceLevel } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'

export const OnboardingPage: React.FC = () => {
  const { user, profile, updateProfile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState(profile?.display_name || user?.user_metadata?.display_name || '')
  const [careerStage, setCareerStage] = useState<CareerStage>(profile?.career_stage || 'Working professional')
  const [targetRole, setTargetRole] = useState(profile?.target_role || 'Frontend Developer')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(profile?.experience_level || 'Intermediate')
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferred_language || 'English')
  const [targetCompany, setTargetCompany] = useState(profile?.target_company || '')
  const [preparationGoals, setPreparationGoals] = useState(profile?.preparation_goals || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const careerStages: { value: CareerStage; label: string; desc: string }[] = [
    { value: 'Student', label: 'College Student', desc: 'Preparing for internships or upcoming campus drives' },
    { value: 'Fresher', label: 'Fresh Graduate', desc: 'Seeking first entry-level engineering or tech role' },
    { value: 'Working professional', label: 'Working Professional', desc: 'Sharpening skills for senior / lead opportunities' },
    { value: 'Career switcher', label: 'Career Switcher', desc: 'Transitioning into software, data, or product' },
  ]

  const popularRoles = [
    'Frontend Developer',
    'Backend Developer',
    'Full-Stack Developer',
    'Python Developer',
    'Java Developer',
    'Data Analyst',
    'Data Scientist',
    'Machine Learning Engineer',
    'DevOps Engineer',
    'Cybersecurity Analyst',
    'Product Manager',
    'Business Analyst',
    'UI/UX Designer',
    'Custom Role',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateProfile({
        display_name: displayName.trim() || 'Candidate',
        career_stage: careerStage,
        target_role: targetRole,
        experience_level: experienceLevel,
        preferred_language: preferredLanguage,
        target_company: targetCompany.trim() || null,
        preparation_goals: preparationGoals.trim() || null,
      })

      showToast('Profile personalized successfully!', 'success')
      navigate('/dashboard')
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-950 flex flex-col justify-center items-center">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Personalize Your Practice Studio
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
            InterviewAce adapts mock interview questions and evaluation criteria to your target role and background.
          </p>
        </div>

        <Card className="bg-slate-900 border-slate-800 shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Display Name */}
              <Input
                label="Full Name or Preferred Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Rivera"
                required
              />

              {/* Career Stage Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                  Current Career Stage
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {careerStages.map((stage) => {
                    const isSelected = careerStage === stage.value
                    return (
                      <div
                        key={stage.value}
                        onClick={() => setCareerStage(stage.value)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-600/10 border-blue-500 text-slate-100 shadow-md shadow-blue-500/10'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <p className="text-sm font-semibold">{stage.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{stage.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Target Job Role & Experience Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Target Job Role"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  options={popularRoles.map((r) => ({ value: r, label: r }))}
                />

                <Select
                  label="Experience Level"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                  options={[
                    { value: 'Beginner', label: 'Beginner (0–2 years)' },
                    { value: 'Intermediate', label: 'Intermediate (2–5 years)' },
                    { value: 'Advanced', label: 'Advanced (5+ years / Staff)' },
                  ]}
                />
              </div>

              {/* Optional Target Company & Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Target Company (Optional)"
                  placeholder="e.g. Google, Stripe, or Early Stage AI"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  leftIcon={<Building2 className="w-4 h-4 text-slate-500" />}
                />

                <Select
                  label="Interview Language"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  options={[
                    { value: 'English', label: 'English' },
                    { value: 'Spanish', label: 'Spanish' },
                    { value: 'French', label: 'French' },
                    { value: 'German', label: 'German' },
                    { value: 'Hindi', label: 'Hindi' },
                  ]}
                />
              </div>

              {/* Preparation Goals */}
              <Input
                label="Primary Preparation Goals (Optional)"
                placeholder="e.g. Improve system design tradeoffs and behavioral STAR storytelling"
                value={preparationGoals}
                onChange={(e) => setPreparationGoals(e.target.value)}
                leftIcon={<Target className="w-4 h-4 text-slate-500" />}
              />

              <div className="pt-2 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Skip for now
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Save & Go to Dashboard
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
