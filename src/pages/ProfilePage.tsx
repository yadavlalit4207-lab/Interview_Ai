import React, { useState } from 'react'
import { User, Briefcase, GraduationCap, Building2, Target, Globe, Save } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { CareerStage, ExperienceLevel } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'

export const ProfilePage: React.FC = () => {
  const { user, profile, updateProfile } = useAuth()
  const { showToast } = useToast()

  const [displayName, setDisplayName] = useState(profile?.display_name || user?.user_metadata?.display_name || '')
  const [careerStage, setCareerStage] = useState<CareerStage>(profile?.career_stage || 'Working professional')
  const [targetRole, setTargetRole] = useState(profile?.target_role || 'Frontend Developer')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(profile?.experience_level || 'Intermediate')
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferred_language || 'English')
  const [targetCompany, setTargetCompany] = useState(profile?.target_company || '')
  const [preparationGoals, setPreparationGoals] = useState(profile?.preparation_goals || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
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
      showToast('Profile updated successfully!', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-400" /> Candidate Profile
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your career background, target positions, and prep priorities
        </p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex Rivera"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Career Stage"
                value={careerStage}
                onChange={(e) => setCareerStage(e.target.value as CareerStage)}
                options={[
                  { value: 'Student', label: 'College Student' },
                  { value: 'Fresher', label: 'Fresh Graduate' },
                  { value: 'Working professional', label: 'Working Professional' },
                  { value: 'Career switcher', label: 'Career Switcher' },
                ]}
              />

              <Input
                label="Target Job Role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Full-Stack Developer"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Experience Level"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                options={[
                  { value: 'Beginner', label: 'Beginner (0–2 years)' },
                  { value: 'Intermediate', label: 'Intermediate (2–5 years)' },
                  { value: 'Advanced', label: 'Advanced (5+ years / Lead)' },
                ]}
              />

              <Input
                label="Target Company (Optional)"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. Stripe, OpenAI, or Target Co."
              />
            </div>

            <Textarea
              label="Preparation Objectives"
              value={preparationGoals}
              onChange={(e) => setPreparationGoals(e.target.value)}
              placeholder="e.g. Master distributed consensus, optimize LCP/INP frontend performance, and practice executive behavioral storytelling."
              rows={3}
            />

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
