import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, AlertCircle, Volume2, Square, Check } from 'lucide-react'
import {
  isSpeechRecognitionSupported,
  VoiceSpeechRecognizer,
} from '@/lib/speechUtils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface VoiceRecorderProps {
  onTranscriptReady: (transcript: string) => void
  disabled?: boolean
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptReady,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const recognizerRef = useRef<VoiceSpeechRecognizer | null>(null)
  const timerRef = useRef<any>(null)

  const supported = isSpeechRecognitionSupported()

  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.stop()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const handleStart = () => {
    setErrorMessage(null)
    setTranscript('')
    setRecordingSeconds(0)

    if (!supported) {
      setErrorMessage(
        'Speech recognition is not supported in this browser. Please use Chrome, Edge, or type your answer.'
      )
      return
    }

    try {
      const recognizer = new VoiceSpeechRecognizer(
        (text, isFinal) => {
          setTranscript((prev) => (isFinal ? `${prev} ${text}`.trim() : text))
        },
        (error) => {
          setErrorMessage(error)
          handleStop()
        },
        () => {
          setIsRecording(false)
          if (timerRef.current) clearInterval(timerRef.current)
        }
      )

      recognizerRef.current = recognizer
      recognizer.start()
      setIsRecording(true)

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not access microphone.')
      setIsRecording(false)
    }
  }

  const handleStop = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stop()
    }
    setIsRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const handleApply = () => {
    if (transcript.trim()) {
      onTranscriptReady(transcript.trim())
      setTranscript('')
    }
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`
  }

  if (!supported) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
        <MicOff className="w-4 h-4 text-slate-400" />
        <span>Voice mode unavailable in this browser. Typed answers work in all browsers.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isRecording ? (
            <Badge variant="danger" size="sm" className="gap-1 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
              Recording: {formatTime(recordingSeconds)}
            </Badge>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Mic className="w-3.5 h-3.5 text-blue-400" />
              <span>Voice to Text Mode</span>
            </div>
          )}

          {/* Animated waveform when recording */}
          {isRecording && (
            <div className="flex items-center gap-1 h-5 px-2">
              <span className="w-1 bg-rose-400 rounded-full wave-bar-1" />
              <span className="w-1 bg-rose-400 rounded-full wave-bar-2" />
              <span className="w-1 bg-rose-400 rounded-full wave-bar-3" />
              <span className="w-1 bg-rose-400 rounded-full wave-bar-4" />
              <span className="w-1 bg-rose-400 rounded-full wave-bar-5" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isRecording ? (
            <Button
              variant="danger"
              size="sm"
              onClick={handleStop}
              leftIcon={<Square className="w-3.5 h-3.5 fill-current" />}
            >
              Stop Recording
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={handleStart}
              leftIcon={<Mic className="w-3.5 h-3.5 text-blue-400" />}
            >
              Speak Answer
            </Button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-950/60 border border-rose-500/20 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Transcript review and insertion */}
      {transcript && !isRecording && (
        <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300">Captured Speech Transcript:</span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApply}
              leftIcon={<Check className="w-3 h-3" />}
            >
              Insert into Answer
            </Button>
          </div>
          <p className="text-slate-200 italic leading-relaxed font-sans">{transcript}</p>
        </div>
      )}
    </div>
  )
}
