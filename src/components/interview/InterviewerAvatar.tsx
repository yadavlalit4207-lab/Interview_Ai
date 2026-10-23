import React, { useEffect, useState, useRef } from 'react'
import {
  Volume2,
  VolumeX,
  Sparkles,
  Subtitles,
  Mic,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Settings2,
  UserCheck,
  Play,
} from 'lucide-react'
import { VisemeType } from '@/lib/speechUtils'

export type InterviewerState = 'idle' | 'speaking' | 'listening' | 'evaluating' | 'correcting'

interface InterviewerAvatarProps {
  status: InterviewerState
  captionText?: string
  isSpeaking: boolean
  currentWord?: string
  currentViseme?: VisemeType
  onToggleSpeech?: () => void
  isAudioMuted?: boolean
  availableVoices?: SpeechSynthesisVoice[]
  selectedVoice?: SpeechSynthesisVoice | null
  onSelectVoice?: (voice: SpeechSynthesisVoice) => void
  className?: string
}

export const InterviewerAvatar: React.FC<InterviewerAvatarProps> = ({
  status,
  captionText = '',
  isSpeaking,
  currentWord = '',
  currentViseme = 'closed',
  onToggleSpeech,
  isAudioMuted = false,
  availableVoices = [],
  selectedVoice,
  onSelectVoice,
  className = '',
}) => {
  const [showCaptions, setShowCaptions] = useState(true)
  const [showVoicePicker, setShowVoicePicker] = useState(false)
  const [isBlinking, setIsBlinking] = useState(false)
  const [activeViseme, setActiveViseme] = useState<VisemeType>('closed')
  const resetVisemeTimerRef = useRef<any>(null)

  // Track word boundary and morph mouth synchronously with spoken words
  useEffect(() => {
    if (!isSpeaking) {
      setActiveViseme('closed')
      return
    }

    if (currentViseme && currentViseme !== 'closed') {
      setActiveViseme(currentViseme)

      // Hold the viseme for the duration of the syllable (~160ms), then return to gentle articulate rest
      clearTimeout(resetVisemeTimerRef.current)
      resetVisemeTimerRef.current = setTimeout(() => {
        if (isSpeaking) {
          setActiveViseme('mid_open')
        } else {
          setActiveViseme('closed')
        }
      }, 160)
    }
  }, [currentWord, currentViseme, isSpeaking])

  // Periodic natural eye blink every 3.8 to 5.2 seconds
  useEffect(() => {
    let timeout: any

    const scheduleBlink = () => {
      const delay = 3500 + Math.random() * 2000
      timeout = setTimeout(() => {
        setIsBlinking(true)
        setTimeout(() => {
          setIsBlinking(false)
          scheduleBlink()
        }, 130)
      }, delay)
    }

    scheduleBlink()

    return () => {
      clearTimeout(timeout)
      clearTimeout(resetVisemeTimerRef.current)
    }
  }, [])

  // Natural facial & mouth articulation multipliers for photorealistic photo morphing
  const getVisemeStyles = (viseme: VisemeType) => {
    switch (viseme) {
      case 'open_ah': // "ah", "father", "call"
        return {
          scaleY: 1.18,
          scaleX: 1.02,
          jawDrop: 2.2,
          openBlend: 1.0,
        }
      case 'round_oh': // "oh", "you", "who", "go"
        return {
          scaleY: 1.14,
          scaleX: 0.90,
          jawDrop: 1.6,
          openBlend: 0.95,
        }
      case 'wide_ee': // "see", "tree", "reconciliation"
        return {
          scaleY: 1.05,
          scaleX: 1.08,
          jawDrop: 0.8,
          openBlend: 0.85,
        }
      case 'lip_teeth': // "f", "v"
        return {
          scaleY: 1.03,
          scaleX: 1.02,
          jawDrop: 0.5,
          openBlend: 0.7,
        }
      case 'mid_open': // consonants & transitions
        return {
          scaleY: 1.09,
          scaleX: 1.01,
          jawDrop: 1.2,
          openBlend: 0.88,
        }
      case 'closed': // "m", "p", "b", resting smile
      default:
        return {
          scaleY: 0.97,
          scaleX: 1.0,
          jawDrop: 0,
          openBlend: 0.0,
        }
    }
  }

  const vStyle = isSpeaking ? getVisemeStyles(activeViseme) : getVisemeStyles('closed')

  // Status badge styling
  const getStatusBadge = () => {
    switch (status) {
      case 'speaking':
        return {
          icon: <Volume2 className="w-3.5 h-3.5 text-blue-400 animate-pulse" />,
          label: currentWord ? `Sarah Asking Question: "${currentWord}"` : 'Sarah Asking Question...',
          classes: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        }
      case 'correcting':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />,
          label: 'Pointing Out Corrections...',
          classes: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        }
      case 'listening':
        return {
          icon: <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />,
          label: 'Listening Attentively...',
          classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        }
      case 'evaluating':
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />,
          label: 'Evaluating Concepts...',
          classes: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        }
      default:
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />,
          label: 'Ready',
          classes: 'bg-slate-800/80 text-slate-300 border-slate-700',
        }
    }
  }

  const badge = getStatusBadge()

  // Video call border glow
  const borderGlowClass =
    status === 'speaking'
      ? 'animate-speaker-glow border-blue-500'
      : status === 'correcting'
      ? 'animate-correction-glow border-amber-500'
      : status === 'listening'
      ? 'animate-listening-glow border-emerald-500'
      : 'border-slate-800'

  // Determine which visual pose should be active
  const isGestureActive = status === 'speaking' || status === 'correcting'
  const isListeningActive = status === 'listening'

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-slate-950 border transition-all duration-300 shadow-2xl flex flex-col justify-between ${borderGlowClass} ${className}`}
      style={{ minHeight: '380px', aspectRatio: '4/3' }}
    >
      {/* Background Avatar Visual with Multi-Pose Hand Gestures and Eye Contact */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-900 select-none">
        {/* Layer 1: Base Ready Frame (Resting posture) */}
        <div className="absolute inset-0 transition-opacity duration-500 animate-avatar-breathe">
          <img
            src="/interviewer.jpg"
            alt="Interviewer Sarah Neutral"
            className="w-full h-full object-cover object-center filter brightness-[1.02] contrast-[1.03]"
          />
        </div>

        {/* Layer 2: Hand Gesture Pose (Active Speaking & Explaining) */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            isGestureActive ? 'opacity-100 animate-gesture-emphasis' : 'opacity-0 pointer-events-none'
          }`}
        >
          <img
            src="/interviewer_gesture.jpg"
            alt="Interviewer Sarah Explaining with Hand Gesture"
            className="w-full h-full object-cover object-center filter brightness-[1.02] contrast-[1.03]"
          />
        </div>

        {/* Layer 3: Attentive Listening Pose (Head tilt & nodding as candidate speaks) */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            isListeningActive ? 'opacity-100 animate-attentive-nod' : 'opacity-0 pointer-events-none'
          }`}
        >
          <img
            src="/interviewer_listening.jpg"
            alt="Interviewer Sarah Listening Attentively"
            className="w-full h-full object-cover object-center filter brightness-[1.02] contrast-[1.03]"
          />
        </div>

        {/* Direct Eye Contact Pupil Tracker Overlay */}
        <div
          className="absolute pointer-events-none animate-eye-contact"
          style={{
            top: '28.2%',
            left: '42.0%',
            width: '18.0%',
            height: '4.2%',
          }}
        >
          {/* Subtle natural micro-reflection enhancement */}
          <div className="w-full h-full flex justify-between px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white/20 blur-[0.4px]" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/20 blur-[0.4px]" />
          </div>
        </div>

        {/* Natural Organic Eyelid Blink (Soft feathered skin shutter, 110ms natural speed) */}
        <div
          className={`absolute pointer-events-none transition-all duration-100 ease-in-out ${
            isBlinking ? 'opacity-70 scale-y-10' : 'opacity-0 scale-y-100'
          }`}
          style={{
            top: '28.4%',
            left: '42.0%',
            width: '18.0%',
            height: '4.0%',
            transformOrigin: 'top center',
            background: 'radial-gradient(ellipse at center, rgba(190,140,115,0.75) 30%, rgba(190,140,115,0) 75%)',
          }}
        />

        {/* Photorealistic Natural Lip Sync Layer (Uses Sarah's real photo with soft feathered elliptical radial mask) */}
        {isSpeaking && (
          <div
            className="absolute pointer-events-none transition-transform duration-100 ease-out z-[5]"
            style={{
              top: '36.5%',
              left: '44.0%',
              width: '12.0%',
              height: '8.5%',
              transform: `scaleY(${vStyle.scaleY}) scaleX(${vStyle.scaleX}) translateY(${vStyle.jawDrop}px)`,
              transformOrigin: 'top center',
              maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 75%)',
            }}
          >
            {/* Real photographic mouth from gesture pose seamlessly aligned and feathered into her face */}
            <img
              src="/interviewer_gesture.jpg"
              alt="Interviewer Speaking Lips"
              className="absolute pointer-events-none filter brightness-[1.02] contrast-[1.03]"
              style={{
                width: '833.33%', // 100 / 0.12
                height: '1176.47%', // 100 / 0.085
                left: '-366.67%', // -44.0 * (100 / 12)
                top: '-429.41%', // -36.5 * (100 / 8.5)
              }}
            />

            {/* Seamless closed lip transition layer for closed consonants (m, p, b) and speech pauses */}
            <div
              className="absolute inset-0 transition-opacity duration-150 pointer-events-none"
              style={{
                opacity: vStyle.openBlend < 0.2 ? 1 : 0,
              }}
            >
              <img
                src="/interviewer.jpg"
                alt="Interviewer Closed Lips"
                className="absolute pointer-events-none filter brightness-[1.02] contrast-[1.03]"
                style={{
                  width: '833.33%',
                  height: '1176.47%',
                  left: '-366.67%',
                  top: '-429.41%',
                }}
              />
            </div>
          </div>
        )}

        {/* Ambient subtle lighting vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30 pointer-events-none" />
      </div>

      {/* TOP HEADER: Status Pill & Voice Controls */}
      <div className="relative z-10 p-3.5 sm:p-4 flex items-center justify-between gap-2">
        {/* Status indicator badge with hand gesture / eye contact pill */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border shadow-lg transition-all ${badge.classes}`}
        >
          {badge.icon}
          <span className="truncate max-w-[170px] sm:max-w-none">{badge.label}</span>
        </div>

        {/* Action icons (Voice Picker, Speech Mute & Closed Captions) */}
        <div className="flex items-center gap-1.5">
          {/* Female Voice Selector Dropdown */}
          {availableVoices.length > 0 && onSelectVoice && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowVoicePicker(!showVoicePicker)}
                className="p-2 rounded-xl backdrop-blur-md bg-slate-900/70 border border-slate-700/70 text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1"
                title="Change Interviewer Girl Voice"
              >
                <Settings2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-semibold hidden md:inline">
                  {selectedVoice ? selectedVoice.name.split(' ')[0] : 'Voice'}
                </span>
              </button>

              {showVoicePicker && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1">
                    <span>Girl Voices (Verified)</span>
                    <span className="text-emerald-400 font-normal">Natural Flow</span>
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-1">
                    {availableVoices.map((voice, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          onSelectVoice(voice)
                          setShowVoicePicker(false)
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                          selectedVoice?.name === voice.name
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="truncate max-w-[190px]">{voice.name}</span>
                        {selectedVoice?.name === voice.name && (
                          <UserCheck className="w-3.5 h-3.5 text-white shrink-0 ml-1" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowCaptions(!showCaptions)}
            className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
              showCaptions
                ? 'bg-blue-600/80 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-900/70 border-slate-700/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={showCaptions ? 'Hide Subtitles' : 'Show Subtitles'}
          >
            <Subtitles className="w-3.5 h-3.5" />
          </button>

          {onToggleSpeech && (
            <button
              type="button"
              onClick={onToggleSpeech}
              className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
                isAudioMuted
                  ? 'bg-rose-900/80 border-rose-500 text-rose-300'
                  : isSpeaking
                  ? 'bg-blue-600/90 border-blue-400 text-white animate-pulse'
                  : 'bg-slate-900/70 border-slate-700/70 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title={isSpeaking ? 'Mute Interlocutor Voice' : 'Voice Enabled'}
            >
              {isAudioMuted ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* BOTTOM FOOTER: Interviewer Nameplate & Live Subtitles with Word Highlighting */}
      <div className="relative z-10 p-3 sm:p-4 space-y-2">
        {/* Real-time Subtitles / Captions Banner */}
        {showCaptions && captionText && (
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 text-xs sm:text-sm text-slate-100 shadow-xl max-h-24 overflow-y-auto leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-200">
            <span className="text-blue-400 font-semibold mr-1.5">Sarah:</span>
            <span>"{captionText}"</span>
            {currentWord && isSpeaking && (
              <span className="inline-block ml-2 px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 text-[10px] font-mono border border-blue-400/40 animate-pulse">
                Speaking: {currentWord}
              </span>
            )}
          </div>
        )}

        {/* Video Call Nameplate with Live Equalizer & Pose State Indicator */}
        <div className="flex items-center justify-between bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-blue-400 animate-ping' : isListeningActive ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-400'}`} />
            <div>
              <span className="font-bold text-slate-100">Sarah Jenkins</span>
              <span className="text-[11px] text-slate-400 ml-1.5 font-normal hidden sm:inline">
                {isGestureActive ? '• Speaking with Hand Gestures' : isListeningActive ? '• Listening & Eye Contact' : '• Lead Tech Interviewer'}
              </span>
            </div>
          </div>

          {/* Equalizer Visualizer */}
          {isSpeaking ? (
            <div className="flex items-center gap-1 h-3.5 px-1.5">
              <span className="w-0.5 bg-blue-400 rounded-full eq-bar eq-bar-1" />
              <span className="w-0.5 bg-blue-400 rounded-full eq-bar eq-bar-2" />
              <span className="w-0.5 bg-blue-400 rounded-full eq-bar eq-bar-3" />
              <span className="w-0.5 bg-blue-400 rounded-full eq-bar eq-bar-4" />
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>Direct Video Call</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
