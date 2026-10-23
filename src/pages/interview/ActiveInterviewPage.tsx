import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  HelpCircle,
  SkipForward,
  LogOut,
  AlertCircle,
  Loader2,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  Video,
  Volume2,
  LayoutGrid,
  Radio,
  Mic,
  MicOff,
  Trash2,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { storageService } from '@/lib/storageService'
import { aiService } from '@/lib/aiService'
import {
  speakText,
  stopSpeaking,
  buildInterviewerCorrectionScript,
  LiveInterviewDictator,
  getAllFemaleVoices,
  getBestFemaleVoice,
  loadVoices,
  VisemeType,
} from '@/lib/speechUtils'
import {
  InterviewSession,
  InterviewQuestion,
  InterviewAnswer,
  AnswerEvaluation,
} from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Progress } from '@/components/ui/Progress'
import { Dialog } from '@/components/ui/Dialog'
import { Timer } from '@/components/interview/Timer'
import { StarGuide } from '@/components/interview/StarGuide'
import {
  InterviewerAvatar,
  InterviewerState,
} from '@/components/interview/InterviewerAvatar'
import { CandidateVideoTile } from '@/components/interview/CandidateVideoTile'
import { InterviewerCorrectionCard } from '@/components/interview/InterviewerCorrectionCard'

export const ActiveInterviewPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { user, profile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [session, setSession] = useState<InterviewSession | null>(null)
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [durationSeconds, setDurationSeconds] = useState(0)

  // Female voice selection & word-level lip sync states
  const [availableFemaleVoices, setAvailableFemaleVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [currentWord, setCurrentWord] = useState('')
  const [currentViseme, setCurrentViseme] = useState<VisemeType>('closed')

  // Live microphone continuous dictation states
  const [isDictating, setIsDictating] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const dictatorRef = useRef<LiveInterviewDictator | null>(null)

  // Video call & Interviewer states
  const [hasJoinedCall, setHasJoinedCall] = useState(false)
  const [interviewerStatus, setInterviewerStatus] = useState<InterviewerState>('idle')
  const [spokenCaption, setSpokenCaption] = useState('')
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isCandidateMuted, setIsCandidateMuted] = useState(false)
  const [isCandidateCameraOff, setIsCandidateCameraOff] = useState(false)
  const [viewLayout, setViewLayout] = useState<'video' | 'focus'>('video')

  // Real-time evaluation & correction states
  const [currentCorrection, setCurrentCorrection] = useState<AnswerEvaluation | null>(null)
  const [isSpeakingCorrection, setIsSpeakingCorrection] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEvaluatingFinal, setIsEvaluatingFinal] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Camera & Microphone Hardware Stream & Permission States
  const [candidateStream, setCandidateStream] = useState<MediaStream | null>(null)
  const candidateStreamRef = useRef<MediaStream | null>(null)
  const [mediaPermission, setMediaPermission] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt')
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [isRequestingMedia, setIsRequestingMedia] = useState(false)

  // Proactively request Camera and Microphone permissions when interview starts
  const requestCameraAndMicrophone = async (): Promise<MediaStream | null> => {
    setPermissionError(null)
    setIsRequestingMedia(true)

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaPermission('unsupported')
      setPermissionError('Camera and microphone are not supported in this browser environment.')
      setIsRequestingMedia(false)
      return null
    }

    if (candidateStreamRef.current && candidateStreamRef.current.active) {
      setMediaPermission('granted')
      setIsRequestingMedia(false)
      return candidateStreamRef.current
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: true,
      })

      candidateStreamRef.current = stream
      setCandidateStream(stream)
      setMediaPermission('granted')
      setPermissionError(null)
      setIsRequestingMedia(false)
      return stream
    } catch (err: any) {
      console.warn('getUserMedia error:', err)
      setMediaPermission('denied')
      let msg = 'Could not access camera and microphone.'
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera or microphone access was blocked. Please click the lock or camera icon in your browser URL bar to allow access.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera or microphone hardware found on this computer. You can continue in text mode.'
      }
      setPermissionError(msg)
      setIsRequestingMedia(false)
      return null
    }
  }

  // Automatically shut down camera, microphone tracks, audio synthesis, and live dictation
  const closeCameraAndMicrophone = useCallback(() => {
    // 1. Explicitly stop every track in the MediaStream (turns off hardware camera light & mic)
    if (candidateStreamRef.current) {
      candidateStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch (e) {
          console.warn('Error stopping media track:', e)
        }
      })
      candidateStreamRef.current = null
    }
    setCandidateStream(null)

    // 2. Shut down microphone SpeechRecognition dictation
    if (dictatorRef.current) {
      dictatorRef.current.stop()
      setIsDictating(false)
    }

    // 3. Stop speech synthesis
    stopSpeaking()
  }, [])

  // Proactively request camera and microphone on interview entry and guarantee cleanup
  useEffect(() => {
    requestCameraAndMicrophone()

    const handleBeforeUnload = () => {
      closeCameraAndMicrophone()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      closeCameraAndMicrophone()
    }
  }, [closeCameraAndMicrophone])

  // Sync camera track enabled state with isCandidateCameraOff
  useEffect(() => {
    if (candidateStreamRef.current) {
      candidateStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isCandidateCameraOff
      })
    }
  }, [isCandidateCameraOff])

  // Sync audio track enabled state with isCandidateMuted
  useEffect(() => {
    if (candidateStreamRef.current) {
      candidateStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isCandidateMuted
      })
    }
  }, [isCandidateMuted])

  const answersMapRef = useRef<Map<string, InterviewAnswer>>(new Map())
  const hasSpokenQuestionRef = useRef<number | null>(null)

  // Initialize Voices and ensure Girl/Female voice selection
  useEffect(() => {
    loadVoices().then((voices) => {
      const females = getAllFemaleVoices()
      setAvailableFemaleVoices(females)

      // Try saved preference or best female voice
      const savedVoiceName = localStorage.getItem('interviewace_interviewer_voice')
      if (savedVoiceName) {
        const found = voices.find((v) => v.name === savedVoiceName)
        if (found) {
          setSelectedVoice(found)
          return
        }
      }

      const best = getBestFemaleVoice()
      setSelectedVoice(best)
    })
  }, [])

  // Initialize Continuous Live Microphone Dictator (Auto-transcribes words to answer)
  useEffect(() => {
    const dictator = new LiveInterviewDictator(
      (finalText, interimText) => {
        if (finalText) {
          setCurrentAnswer((prev) => {
            const trimmed = prev.trim()
            return trimmed ? `${trimmed} ${finalText}` : finalText
          })
          setInterimTranscript('')
        } else if (interimText) {
          setInterimTranscript(interimText)
        }
      },
      (errMsg) => {
        console.warn('Dictation status:', errMsg)
      },
      (active) => {
        setIsDictating(active)
      }
    )

    dictatorRef.current = dictator

    return () => {
      dictator.stop()
    }
  }, [])

  // Load session and questions
  useEffect(() => {
    async function loadSession() {
      if (!sessionId || !user) return
      setIsLoading(true)
      try {
        const s = await storageService.getSessionById(sessionId, user.id)
        if (!s) {
          setError('Interview session not found or you do not have permission to view it.')
          return
        }

        if (s.status === 'Completed') {
          navigate(`/interview/${sessionId}/feedback`, { replace: true })
          return
        }

        setSession(s)
        const qList = s.questions || []
        setQuestions(qList)

        // Populate already answered questions
        const ansList = s.answers || []
        ansList.forEach((a) => answersMapRef.current.set(a.question_id, a))

        // Find the first unanswered question
        const firstUnanswered = qList.findIndex((q) => !answersMapRef.current.has(q.id))
        if (firstUnanswered !== -1) {
          setCurrentIndex(firstUnanswered)
        } else if (qList.length > 0) {
          finalizeEvaluation(s, qList, Array.from(answersMapRef.current.values()))
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load session.')
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()

    return () => {
      stopSpeaking()
      dictatorRef.current?.stop()
    }
  }, [sessionId, user])

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length
  const progressPercent =
    totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0

  // Speak question through Sarah with female voice and synchronized lips
  const speakCurrentQuestion = (greeting = false) => {
    if (!currentQuestion || isAudioMuted) return

    stopSpeaking()
    dictatorRef.current?.stop() // Pause mic while interviewer is speaking
    setIsSpeakingCorrection(false)

    const textToSpeak = greeting
      ? `Hi there! Welcome to your technical interview session. I'm Sarah, and I'll be conducting your interview today. Feel free to think through your approach, and let's get started with your first question: ${currentQuestion.question_text}`
      : currentIndex === 0
      ? `Let's begin with your first question: ${currentQuestion.question_text}`
      : `Alright, let's move forward to your next question: ${currentQuestion.question_text}`

    setSpokenCaption(textToSpeak)
    setInterviewerStatus('speaking')

    speakText(textToSpeak, {
      voice: selectedVoice,
      pitch: 1.0, // Authentic 1.0 pitch preserves neural voice smoothness and clarity
      rate: 0.98,
      onStart: () => {
        setInterviewerStatus('speaking')
      },
      onWordBoundary: (word, viseme) => {
        setCurrentWord(word)
        setCurrentViseme(viseme)
      },
      onPhrasePause: () => {
        setCurrentWord('')
        setCurrentViseme('closed')
      },
      onDone: () => {
        setCurrentWord('')
        setCurrentViseme('closed')
        setInterviewerStatus('listening')
        setSpokenCaption('')

        // Sarah finished asking: automatically start listening to candidate mic & transcribe answer!
        if (!isCandidateMuted) {
          dictatorRef.current?.start()
        }
      },
      onError: () => {
        setCurrentWord('')
        setCurrentViseme('closed')
        setInterviewerStatus('listening')
        if (!isCandidateMuted) {
          dictatorRef.current?.start()
        }
      },
    })
  }

  // Handle Joining Video Call from Lobby
  const handleJoinCall = async () => {
    // Proactively verify / request camera & mic before entering the live room
    if (!candidateStreamRef.current || !candidateStreamRef.current.active) {
      await requestCameraAndMicrophone()
    }

    setHasJoinedCall(true)
    setTimeout(() => {
      speakCurrentQuestion(true)
      hasSpokenQuestionRef.current = currentIndex
    }, 400)
  }

  // Trigger speech when question changes in active call
  useEffect(() => {
    if (!hasJoinedCall || !currentQuestion) return
    if (hasSpokenQuestionRef.current === currentIndex) return

    setCurrentCorrection(null)
    setCurrentAnswer('')
    setInterimTranscript('')
    hasSpokenQuestionRef.current = currentIndex

    speakCurrentQuestion(false)
  }, [currentIndex, hasJoinedCall, currentQuestion])

  // Select girl voice
  const handleSelectVoice = (v: SpeechSynthesisVoice) => {
    setSelectedVoice(v)
    try {
      localStorage.setItem('interviewace_interviewer_voice', v.name)
    } catch {
      // Safe ignore
    }
    showToast(`Interviewer voice set to ${v.name}`, 'info')
  }

  // Toggle Interviewer voice on/off
  const handleToggleInterviewerVoice = () => {
    if (interviewerStatus === 'speaking' || isSpeakingCorrection) {
      stopSpeaking()
      setInterviewerStatus('listening')
      setIsSpeakingCorrection(false)
      setIsAudioMuted(true)
      if (!isCandidateMuted) dictatorRef.current?.start()
    } else {
      setIsAudioMuted(false)
      if (currentCorrection) {
        speakCorrection(currentCorrection)
      } else {
        speakCurrentQuestion(false)
      }
    }
  }

  // Speak correction when answer is wrong
  const speakCorrection = (evaluation: AnswerEvaluation) => {
    if (isAudioMuted || !currentQuestion) return

    stopSpeaking()
    dictatorRef.current?.stop() // Pause mic during Sarah's explanation
    const { spokenText } = buildInterviewerCorrectionScript({
      questionText: currentQuestion.question_text,
      score: evaluation.overallScore,
      missingConcepts: evaluation.missingConcepts,
      whatNeedsImprovement: evaluation.whatNeedsImprovement,
      suggestedAnswer: evaluation.suggestedStrongerAnswer,
      practicalTip: evaluation.practicalTip,
    })

    setSpokenCaption(spokenText)
    setInterviewerStatus('correcting')
    setIsSpeakingCorrection(true)

    speakText(spokenText, {
      voice: selectedVoice,
      pitch: 1.0, // Natural neural pitch
      rate: 0.98,
      onStart: () => {
        setInterviewerStatus('correcting')
        setIsSpeakingCorrection(true)
      },
      onWordBoundary: (word, viseme) => {
        setCurrentWord(word)
        setCurrentViseme(viseme)
      },
      onPhrasePause: () => {
        setCurrentWord('')
        setCurrentViseme('closed')
      },
      onDone: () => {
        setCurrentWord('')
        setCurrentViseme('closed')
        setInterviewerStatus('idle')
        setIsSpeakingCorrection(false)
      },
      onError: () => {
        setCurrentWord('')
        setCurrentViseme('closed')
        setInterviewerStatus('idle')
        setIsSpeakingCorrection(false)
      },
    })
  }

  // Submit Answer
  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !session || !user) return
    const finalAnswerToSubmit = currentAnswer.trim() || interimTranscript.trim()

    if (!finalAnswerToSubmit) {
      showToast('Please speak or type an answer before submitting.', 'warning')
      return
    }

    setIsSubmitting(true)
    stopSpeaking()
    dictatorRef.current?.stop()
    setInterviewerStatus('evaluating')
    setSpokenCaption('Analyzing your technical depth and structure...')

    try {
      // 1. Evaluate single answer via rubric engine
      const { data: evaluation } = await aiService.evaluateAnswer(
        currentQuestion,
        finalAnswerToSubmit,
        durationSeconds,
        session.role
      )

      // 2. Build Answer record
      const answer: InterviewAnswer = {
        id: crypto.randomUUID(),
        session_id: session.id,
        question_id: currentQuestion.id,
        answer_text: finalAnswerToSubmit,
        duration_seconds: durationSeconds,
        submitted_at: new Date().toISOString(),
        score: evaluation.overallScore,
        feedback_json: evaluation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // 3. Save to storage
      await storageService.saveAnswer(answer)
      answersMapRef.current.set(currentQuestion.id, answer)

      // 4. CHECK IF THE ANSWER IS WRONG / INACCURATE / INCOMPLETE:
      const hasErrorsOrMissing =
        evaluation.overallScore < 70 ||
        (evaluation.missingConcepts && evaluation.missingConcepts.length > 0) ||
        (evaluation.whatNeedsImprovement && evaluation.whatNeedsImprovement.length > 0)

      if (hasErrorsOrMissing) {
        // Interviewer points out the information and suggests how to correct it
        setCurrentCorrection(evaluation)
        speakCorrection(evaluation)
        showToast('Interviewer pointed out missing concepts.', 'warning')
      } else {
        // Answer was strong and correct!
        setCurrentCorrection(null)
        setInterviewerStatus('speaking')
        const praise = `Great job! You explained that clearly and covered the key concepts. Let's move to the next question.`
        setSpokenCaption(praise)

        speakText(praise, {
          voice: selectedVoice,
          pitch: 1.0, // Natural neural pitch
          onWordBoundary: (word, viseme) => {
            setCurrentWord(word)
            setCurrentViseme(viseme)
          },
          onDone: () => {
            setCurrentWord('')
            setCurrentViseme('closed')
            advanceToNextQuestion()
          },
        })
      }
    } catch (err: any) {
      console.error('Error submitting answer:', err)
      showToast(err.message || 'Failed to submit answer. Please retry.', 'error')
      setInterviewerStatus('listening')
      if (!isCandidateMuted) dictatorRef.current?.start()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Move forward after reviewing correction or correct answer
  const advanceToNextQuestion = async () => {
    stopSpeaking()
    setIsSpeakingCorrection(false)
    setCurrentCorrection(null)
    setCurrentAnswer('')
    setInterimTranscript('')
    setDurationSeconds(0)
    setShowHints(false)

    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex((prev) => prev + 1)
      showToast('Moving to next question', 'info')
    } else if (session) {
      await finalizeEvaluation(
        session,
        questions,
        Array.from(answersMapRef.current.values())
      )
    }
  }

  // Candidate chooses to practice and re-answer after seeing the correction
  const handleRetryAnswer = () => {
    stopSpeaking()
    setIsSpeakingCorrection(false)
    setCurrentCorrection(null)
    setCurrentAnswer('')
    setInterimTranscript('')
    setDurationSeconds(0)

    const retryPrompt = `Take your time! Speak your revised response into the microphone.`
    setSpokenCaption(retryPrompt)
    setInterviewerStatus('listening')

    // Restart dictation so candidate can speak right away
    if (!isCandidateMuted) {
      dictatorRef.current?.start()
    }

    showToast('Mic live! Speak your corrected response.', 'info')
  }

  // Toggle live dictation
  const handleToggleDictation = () => {
    if (isDictating) {
      dictatorRef.current?.stop()
      setIsDictating(false)
      showToast('Microphone dictation paused.', 'info')
    } else {
      dictatorRef.current?.start()
      setIsDictating(true)
      showToast('Microphone dictation active. Speak your answer!', 'success')
    }
  }

  // Clear answer
  const handleClearAnswer = () => {
    setCurrentAnswer('')
    setInterimTranscript('')
  }

  // Skip Question
  const handleSkipQuestion = async () => {
    if (!currentQuestion || !session || !user) return

    setIsSubmitting(true)
    stopSpeaking()
    dictatorRef.current?.stop()
    try {
      const answer: InterviewAnswer = {
        id: crypto.randomUUID(),
        session_id: session.id,
        question_id: currentQuestion.id,
        answer_text: '(Question was skipped by candidate)',
        duration_seconds: durationSeconds,
        submitted_at: new Date().toISOString(),
        score: 0,
        feedback_json: {
          overallScore: 0,
          dimensionScores: {
            relevance: 0,
            correctness: 0,
            completeness: 0,
            structure: 0,
            clarity: 0,
            examples: 0,
            communication: 0,
          },
          whatWentWell: [],
          whatNeedsImprovement: ['Question was skipped without an answer.'],
          missingConcepts: currentQuestion.expected_concepts,
          suggestedStrongerAnswer:
            currentQuestion.example_solution || 'Provide an initial attempt even if uncertain.',
          practicalTip:
            'In real interviews, never give up immediately. State your assumptions and break down the problem.',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await storageService.saveAnswer(answer)
      answersMapRef.current.set(currentQuestion.id, answer)

      setCurrentAnswer('')
      setInterimTranscript('')
      setDurationSeconds(0)
      setShowHints(false)
      setCurrentCorrection(null)

      if (currentIndex + 1 < totalQuestions) {
        setCurrentIndex((prev) => prev + 1)
      } else {
        await finalizeEvaluation(session, questions, Array.from(answersMapRef.current.values()))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Finalize evaluation
  const finalizeEvaluation = async (
    s: InterviewSession,
    qList: InterviewQuestion[],
    ansList: InterviewAnswer[]
  ) => {
    // Automatically close camera, microphone hardware, dictation, and speech synthesis
    closeCameraAndMicrophone()

    if (!user) return
    setIsEvaluatingFinal(true)
    try {
      await storageService.updateSessionStatus(s.id, user.id, 'Evaluating')
      const { data: summary } = await aiService.evaluateSession(s, qList, ansList)
      await storageService.saveSessionEvaluation(s.id, user.id, summary)

      showToast('Interview report generated!', 'success')
      navigate(`/interview/${s.id}/feedback`)
    } catch (err: any) {
      console.error('Final evaluation error:', err)
      showToast('Evaluation complete, report saved.', 'info')
      navigate(`/interview/${s.id}/feedback`)
    } finally {
      setIsEvaluatingFinal(false)
    }
  }

  const handleConfirmExit = async () => {
    setShowExitDialog(false)
    // Automatically close camera and microphone hardware tracks
    closeCameraAndMicrophone()

    if (session && user) {
      await storageService.updateSessionStatus(session.id, user.id, 'Cancelled')
    }
    navigate('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading your interview room...</p>
      </div>
    )
  }

  if (isEvaluatingFinal) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">
          Sarah is Generating Your Interview Report...
        </h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          Synthesizing your technical accuracy, communication clarity, missing concepts, and complete 7-dimension score rubric.
        </p>
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin mx-auto mt-4" />
      </div>
    )
  }

  if (error || !currentQuestion) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-100">Session Error</h3>
        <p className="text-xs text-slate-400">{error || 'No questions available for this session.'}</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  // PRE-INTERVIEW LOBBY: Join Video Call Screen
  if (!hasJoinedCall) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Live Video Call Interview Room</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Ready to Enter the Interview?
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Sarah, your AI interviewer, will ask questions with natural girl voice and word-synchronized lips. When you speak in the microphone, your answer is automatically written down in real-time.
          </p>
        </div>

        {/* Device & Hardware Permission Check Banner */}
        <div className="max-w-xl mx-auto p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${
                mediaPermission === 'granted'
                  ? 'bg-emerald-400 animate-pulse'
                  : mediaPermission === 'denied'
                  ? 'bg-rose-500'
                  : 'bg-amber-400 animate-ping'
              }`}
            />
            <div>
              <p className="font-semibold text-slate-200">
                {mediaPermission === 'granted'
                  ? 'Camera & Microphone Ready'
                  : mediaPermission === 'denied'
                  ? 'Camera or Microphone Access Blocked'
                  : 'Requesting Device Permissions...'}
              </p>
              <p className="text-[11px] text-slate-400">
                {mediaPermission === 'granted'
                  ? 'Hardware check passed • Camera and microphone will automatically close when the call ends'
                  : mediaPermission === 'denied'
                  ? (permissionError || 'Please allow camera and microphone in your browser address bar')
                  : 'Please click "Allow" when prompted by your browser to enable video & mic'}
              </p>
            </div>
          </div>

          {mediaPermission !== 'granted' && (
            <button
              type="button"
              onClick={requestCameraAndMicrophone}
              disabled={isRequestingMedia}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-all shrink-0 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRequestingMedia ? 'animate-spin' : ''}`} />
              <span>{isRequestingMedia ? 'Checking...' : 'Allow Access'}</span>
            </button>
          )}
        </div>

        {/* Video Preview Grid in Lobby */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Interviewer Preview Tile */}
          <div className="flex flex-col">
            <InterviewerAvatar
              status="idle"
              captionText="Waiting for candidate to join the call..."
              isSpeaking={false}
              isAudioMuted={isAudioMuted}
              availableVoices={availableFemaleVoices}
              selectedVoice={selectedVoice}
              onSelectVoice={handleSelectVoice}
            />
          </div>

          {/* Candidate Preview Tile */}
          <div className="flex flex-col">
            <CandidateVideoTile
              candidateName={profile?.display_name || user?.email?.split('@')[0] || 'Candidate'}
              isMuted={isCandidateMuted}
              isCameraOff={isCandidateCameraOff}
              onToggleMute={() => setIsCandidateMuted(!isCandidateMuted)}
              onToggleCamera={() => setIsCandidateCameraOff(!isCandidateCameraOff)}
              mediaStream={candidateStream}
              hasPermission={mediaPermission === 'granted'}
              permissionError={permissionError}
              onRequestPermission={requestCameraAndMicrophone}
            />
          </div>
        </div>

        {/* Features highlight & Join CTA */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Girl Voice & Synced Lips</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Articulates every word verbally with authentic female tone and word-synced mouth movement.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Mic className="w-3.5 h-3.5" />
                <span>Speak to Write Answer</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Just speak into your microphone; your words are automatically typed into your answer live.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Coaching & Corrections</span>
              </div>
              <p className="text-[11px] text-slate-400">
                If you miss concepts, Sarah speaks the correction and allows you to practice again.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleJoinCall}
              leftIcon={<Video className="w-5 h-5 text-white" />}
              className="w-full sm:w-auto px-8 py-3 text-base shadow-xl shadow-blue-500/25"
            >
              Join Video Interview Call
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => {
                closeCameraAndMicrophone()
                navigate('/dashboard')
              }}
              className="w-full sm:w-auto"
            >
              Cancel & Return
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ACTIVE VIDEO CALL INTERVIEW ROOM
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-5">
      {/* Top Video Call Bar & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" title="Recording active" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <Badge variant="neutral" size="sm">
                {currentQuestion.category}
              </Badge>
              <Badge variant="default" size="sm">
                {currentQuestion.difficulty}
              </Badge>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-200 mt-0.5">
              {session?.role} Live Video Interview
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Timer isRunning={!isSubmitting} onTick={(s) => setDurationSeconds(s)} />

          {/* Layout switcher */}
          <button
            type="button"
            onClick={() => setViewLayout(viewLayout === 'video' ? 'focus' : 'video')}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-all"
            title="Toggle video view layout"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {viewLayout === 'video' ? 'Compact' : 'Side-by-Side'}
            </span>
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExitDialog(true)}
            className="text-slate-400 hover:text-rose-400"
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Leave Call
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-slate-500 font-mono font-medium">
          <span>Interview Progress</span>
          <span>{progressPercent}% Complete</span>
        </div>
        <Progress value={progressPercent} color="blue" />
      </div>

      {/* MAIN VIDEO CALL STAGE: Interviewer + Candidate */}
      <div
        className={`grid gap-4 transition-all duration-300 ${
          viewLayout === 'video'
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 max-w-2xl mx-auto'
        }`}
      >
        {/* INTERVIEWER VIDEO FEED (Sarah - Girl Voice with Synced Lips) */}
        <InterviewerAvatar
          status={interviewerStatus}
          captionText={spokenCaption || (interviewerStatus === 'speaking' ? currentQuestion.question_text : '')}
          isSpeaking={interviewerStatus === 'speaking' || isSpeakingCorrection}
          currentWord={currentWord}
          currentViseme={currentViseme}
          onToggleSpeech={handleToggleInterviewerVoice}
          isAudioMuted={isAudioMuted}
          availableVoices={availableFemaleVoices}
          selectedVoice={selectedVoice}
          onSelectVoice={handleSelectVoice}
        />

        {/* CANDIDATE WEBCAM VIDEO FEED (User) */}
        {viewLayout === 'video' && (
          <CandidateVideoTile
            candidateName={profile?.display_name || user?.email?.split('@')[0] || 'Candidate'}
            isMuted={isCandidateMuted}
            isCameraOff={isCandidateCameraOff}
            onToggleMute={() => {
              const nextMuted = !isCandidateMuted
              setIsCandidateMuted(nextMuted)
              if (nextMuted) {
                dictatorRef.current?.stop()
              } else if (interviewerStatus === 'listening') {
                dictatorRef.current?.start()
              }
            }}
            onToggleCamera={() => setIsCandidateCameraOff(!isCandidateCameraOff)}
            liveTranscript={interimTranscript || (isDictating && currentAnswer ? currentAnswer.slice(-90) : '')}
            isDictating={isDictating}
            mediaStream={candidateStream}
            hasPermission={mediaPermission === 'granted'}
            permissionError={permissionError}
            onRequestPermission={requestCameraAndMicrophone}
          />
        )}
      </div>

      {/* INTERVIEWER CORRECTION & COACHING CARD (Visible when answer has errors) */}
      {currentCorrection && (
        <InterviewerCorrectionCard
          score={currentCorrection.overallScore}
          missingConcepts={currentCorrection.missingConcepts}
          whatNeedsImprovement={currentCorrection.whatNeedsImprovement}
          whatWentWell={currentCorrection.whatWentWell}
          suggestedStrongerAnswer={currentCorrection.suggestedStrongerAnswer}
          practicalTip={currentCorrection.practicalTip}
          onRetry={handleRetryAnswer}
          onContinue={advanceToNextQuestion}
          isSpeakingCorrection={isSpeakingCorrection}
          onToggleSpeech={handleToggleInterviewerVoice}
        />
      )}

      {/* QUESTION & CANDIDATE ANSWER DOCK */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl">
        <CardContent className="p-5 sm:p-7 space-y-5">
          {/* Active Question Prompt */}
          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
              <FileQuestion className="w-3.5 h-3.5 text-blue-400" />
              Sarah's Current Question:
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-slate-100 leading-relaxed">
              {currentQuestion.question_text}
            </h3>
          </div>

          {/* STAR Framework Helper for behavioral questions */}
          {currentQuestion.question_type === 'behavioral' && <StarGuide />}

          {/* Expandable Hints */}
          {currentQuestion.hints && currentQuestion.hints.length > 0 && (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
              <button
                type="button"
                onClick={() => setShowHints(!showHints)}
                className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Stuck? View Practice Hint</span>
                </div>
                {showHints ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showHints && (
                <div className="p-3 pt-0 border-t border-slate-800/80 text-xs text-slate-300 space-y-1">
                  {currentQuestion.hints.map((h, i) => (
                    <p key={i}>&bull; {h}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LIVE MICROPHONE SPEECH-TO-TEXT STATUS BANNER */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  isDictating ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                }`}
              />
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                {isDictating ? (
                  <>
                    <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>Microphone Live — Anything you say is written down as your answer</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-400">Microphone dictation paused</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleDictation}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                  isDictating
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {isDictating ? (
                  <>
                    <MicOff className="w-3 h-3 text-rose-400" />
                    <span>Pause Mic</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3 text-emerald-400" />
                    <span>Resume Dictation</span>
                  </>
                )}
              </button>

              {(currentAnswer || interimTranscript) && (
                <button
                  type="button"
                  onClick={handleClearAnswer}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 transition-all flex items-center gap-1"
                  title="Clear Answer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Transcribed / Typed Answer Box */}
          <div className="space-y-2">
            <Textarea
              label="Your Answer (Automatically Written from Microphone)"
              placeholder="Speak directly into your microphone; your words will be written here as your answer. You can also edit or type manually..."
              value={currentAnswer + (interimTranscript ? ` ${interimTranscript}` : '')}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              showWordCount
              rows={6}
              disabled={isSubmitting || Boolean(currentCorrection)}
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting || Boolean(currentCorrection)}
              onClick={handleSkipQuestion}
              leftIcon={<SkipForward className="w-3.5 h-3.5" />}
            >
              Skip Question
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              disabled={Boolean(currentCorrection)}
              onClick={handleSubmitAnswer}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {currentIndex + 1 === totalQuestions ? 'Submit Final Answer' : 'Submit Answer to Interviewer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leave Call Confirmation Dialog */}
      <Dialog
        isOpen={showExitDialog}
        onClose={() => setShowExitDialog(false)}
        title="Leave Interview Video Call?"
        description="Your submitted answers up to this question are saved, but the session will be marked as ended early."
      >
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowExitDialog(false)}>
            Stay in Call
          </Button>
          <Button variant="danger" size="sm" onClick={handleConfirmExit}>
            Leave Call
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
