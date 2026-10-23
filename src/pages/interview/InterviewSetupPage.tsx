import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Layers,
  GraduationCap,
  Flame,
  Clock,
  Building,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { storageService } from '@/lib/storageService'
import { aiService } from '@/lib/aiService'
import {
  InterviewConfig,
  InterviewType,
  ExperienceLevel,
  InterviewDifficulty,
} from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export const InterviewSetupPage: React.FC = () => {
  const { user, profile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(1)
  const [role, setRole] = useState(profile?.target_role || 'Frontend Developer')
  const [customRole, setCustomRole] = useState('')
  const [interviewType, setInterviewType] = useState<InterviewType>('Technical')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    profile?.experience_level || 'Intermediate'
  )
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('Medium')
  const [questionCount, setQuestionCount] = useState(5)
  const [targetCompany, setTargetCompany] = useState(profile?.target_company || '')
  const [jobDescription, setJobDescription] = useState('')
  const [skillsFocus, setSkillsFocus] = useState('')
  const [language, setLanguage] = useState(profile?.preferred_language || 'English')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const roles = [
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

  const interviewTypes: { type: InterviewType; label: string; desc: string }[] = [
    { type: 'Technical', label: 'Technical Core', desc: 'Coding concepts, architectures, complexity analysis, and debugging' },
    { type: 'Behavioral', label: 'Behavioral (STAR)', desc: 'Conflict resolution, leadership, failure recovery, and teamwork stories' },
    { type: 'HR', label: 'HR & Cultural Fit', desc: 'Motivation, career goals, work style, and communication skills' },
    { type: 'Role-specific', label: 'Role-Specific Deep Dive', desc: 'Domain-specific frameworks and real-world system scenarios' },
    { type: 'Mixed interview', label: 'Comprehensive Mixed', desc: 'Balanced blend of technical tradeoffs and behavioral questions' },
  ]

  const difficulties: { diff: InterviewDifficulty; label: string; desc: string }[] = [
    { diff: 'Easy', label: 'Easy', desc: 'Foundational concepts and standard definitions' },
    { diff: 'Medium', label: 'Medium', desc: 'Practical trade-offs, standard scenarios, and edge cases' },
    { diff: 'Hard', label: 'Hard', desc: 'High-scale architecture, intricate edge cases, and failure modes' },
  ]

  const questionPresets = [
    { count: 5, label: 'Quick Practice', duration: '~10–15 mins' },
    { count: 10, label: 'Standard Session', duration: '~25–30 mins' },
    { count: 15, label: 'Extended Interview', duration: '~45–50 mins' },
  ]

  const handleStartInterview = async () => {
    if (!user) {
      showToast('Please sign in to start practicing.', 'error')
      navigate('/login')
      return
    }

    setError(null)
    setIsGenerating(true)

    const finalRole = role === 'Custom Role' ? customRole.trim() || 'Software Engineer' : role

    const config: InterviewConfig = {
      role: finalRole,
      interview_type: interviewType,
      experience_level: experienceLevel,
      difficulty,
      question_count: questionCount,
      target_company: targetCompany.trim() || undefined,
      job_description: jobDescription.trim() || undefined,
      skills_focus: skillsFocus
        ? skillsFocus.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
      language,
    }

    try {
      // 1. Create interview session in storage / Supabase
      const session = await storageService.createSession(user.id, config)

      // 2. Generate questions via AI service (Edge function or deterministic rubric generator)
      const { data: questions, isSimulation } = await aiService.generateQuestions(session.id, config)

      // 3. Persist questions
      await storageService.saveQuestions(questions)

      // 4. Update session status to In progress
      await storageService.updateSessionStatus(session.id, user.id, 'In progress')

      showToast(
        isSimulation
          ? 'Mock interview prepared (Local Engine Mode)!'
          : 'Interview questions generated by AI!',
        'success'
      )

      // 5. Navigate to active session
      navigate(`/interview/${session.id}`)
    } catch (err: any) {
      console.error('Failed to create interview session:', err)
      setError(err.message || 'Failed to start interview. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedRoleName = role === 'Custom Role' ? customRole || 'Custom Role' : role

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Setup Step Progress */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interview Configuration Wizard</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          Configure Your Mock Session
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Customize questions to mirror real hiring rounds
        </p>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div
              key={step}
              onClick={() => setCurrentStep(step)}
              className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                currentStep === step
                  ? 'w-8 bg-blue-500'
                  : currentStep > step
                  ? 'w-4 bg-emerald-500'
                  : 'w-4 bg-slate-800'
              }`}
              title={`Step ${step}`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card className="bg-slate-900 border-slate-800 shadow-2xl">
        <CardContent className="p-6 sm:p-8">
          {/* STEP 1: JOB ROLE */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-400" /> Step 1: Select Target Job Role
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Questions will reflect actual interview expectations for this specialization.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {roles.map((r) => {
                  const isSelected = role === r
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 text-slate-100 shadow-md shadow-blue-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  )
                })}
              </div>

              {role === 'Custom Role' && (
                <div className="pt-2">
                  <Input
                    label="Specify Custom Job Role"
                    placeholder="e.g. Embedded Firmware Engineer"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: INTERVIEW TYPE */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" /> Step 2: Choose Interview Type
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Select the domain focus for this practice session.
                </p>
              </div>

              <div className="space-y-2.5">
                {interviewTypes.map((t) => {
                  const isSelected = interviewType === t.type
                  return (
                    <div
                      key={t.type}
                      onClick={() => setInterviewType(t.type)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 text-slate-100 shadow-md shadow-blue-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{t.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{t.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 3: EXPERIENCE LEVEL */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-400" /> Step 3: Candidate Seniority Level
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sets the depth, scope, and leadership expectation of questions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { level: 'Beginner' as ExperienceLevel, label: 'Entry / Junior', desc: '0–2 years of experience. Focus on fundamental knowledge, syntax, and basic algorithms.' },
                  { level: 'Intermediate' as ExperienceLevel, label: 'Mid-Level', desc: '2–5 years of experience. Focus on operational tradeoffs, edge cases, and design patterns.' },
                  { level: 'Advanced' as ExperienceLevel, label: 'Senior / Staff', desc: '5+ years of experience. Focus on distributed systems, scaling, resilience, and team mentorship.' },
                ].map((l) => {
                  const isSelected = experienceLevel === l.level
                  return (
                    <div
                      key={l.level}
                      onClick={() => setExperienceLevel(l.level)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 text-slate-100 shadow-md shadow-blue-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-sm">{l.label}</span>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{l.desc}</p>
                      </div>
                      {isSelected && <Badge variant="default" size="sm" className="mt-3 w-fit">Selected</Badge>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 4: DIFFICULTY */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-blue-400" /> Step 4: Challenge Difficulty
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Determines the technical rigor and grading strictness.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {difficulties.map((d) => {
                  const isSelected = difficulty === d.diff
                  return (
                    <div
                      key={d.diff}
                      onClick={() => setDifficulty(d.diff)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 text-slate-100 shadow-md shadow-blue-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-bold text-sm">{d.label}</span>
                      <p className="text-xs text-slate-400 mt-1">{d.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 5: DURATION & QUESTION COUNT */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" /> Step 5: Session Length & Questions
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Choose the number of questions for this session.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {questionPresets.map((p) => {
                  const isSelected = questionCount === p.count
                  return (
                    <div
                      key={p.count}
                      onClick={() => setQuestionCount(p.count)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all text-center ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 text-slate-100 shadow-md shadow-blue-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <h4 className="text-2xl font-bold font-mono text-slate-100">{p.count}</h4>
                      <p className="text-xs font-semibold text-slate-300 mt-0.5">{p.label}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{p.duration}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 6: ADDITIONAL CONTEXT & SUMMARY */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" /> Step 6: Target Context & Final Review
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Add optional details to specialize question generation even further.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Target Company (Optional)"
                  placeholder="e.g. Netflix, Meta, or Series A AI Startup"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  leftIcon={<Building className="w-4 h-4 text-slate-500" />}
                />

                <Input
                  label="Specific Skills to Focus On"
                  placeholder="e.g. Next.js, Redux, WebSockets, Redis"
                  value={skillsFocus}
                  onChange={(e) => setSkillsFocus(e.target.value)}
                />
              </div>

              <Textarea
                label="Job Description Snippet (Optional)"
                placeholder="Paste key requirements or responsibilities from the job posting to prompt targeted questions..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={3}
              />

              {/* Session Summary Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  Configured Session Summary
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>
                    <span className="text-slate-500">Role:</span>
                    <p className="font-semibold text-slate-200">{selectedRoleName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Type:</span>
                    <p className="font-semibold text-slate-200">{interviewType}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Difficulty:</span>
                    <p className="font-semibold text-slate-200">{difficulty}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Questions:</span>
                    <p className="font-semibold text-slate-200">{questionCount} Questions</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
            {currentStep > 1 ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 6 ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                isLoading={isGenerating}
                onClick={handleStartInterview}
                rightIcon={<Sparkles className="w-4 h-4" />}
              >
                Start AI Mock Interview
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
