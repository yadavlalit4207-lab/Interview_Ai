import React, { useEffect, useRef, useState } from 'react'
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  User,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Radio,
} from 'lucide-react'

interface CandidateVideoTileProps {
  candidateName: string
  isMuted: boolean
  isCameraOff: boolean
  onToggleMute: () => void
  onToggleCamera: () => void
  onAudioLevelChange?: (level: number) => void
  liveTranscript?: string
  isDictating?: boolean
  className?: string
  mediaStream?: MediaStream | null
  hasPermission?: boolean | null
  permissionError?: string | null
  onRequestPermission?: () => void
}

export const CandidateVideoTile: React.FC<CandidateVideoTileProps> = ({
  candidateName,
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onAudioLevelChange,
  liveTranscript = '',
  isDictating = false,
  className = '',
  mediaStream,
  hasPermission: propHasPermission,
  permissionError: propPermissionError,
  onRequestPermission,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const internalStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const [internalPermission, setInternalPermission] = useState<boolean | null>(null)
  const [internalError, setInternalError] = useState<string | null>(null)
  const [micVolume, setMicVolume] = useState<number>(0) // 0 to 100

  // Use externally managed media stream if provided, otherwise internal fallback
  const isExternallyManaged = mediaStream !== undefined
  const activeStream = isExternallyManaged ? mediaStream : internalStreamRef.current
  const effectivePermission =
    propHasPermission !== undefined
      ? propHasPermission
      : isExternallyManaged
      ? Boolean(mediaStream && mediaStream.active)
      : internalPermission
  const effectiveError = propPermissionError !== undefined ? propPermissionError : internalError

  // Fallback internal startMedia for standalone tile usage
  const startInternalMedia = async () => {
    setInternalError(null)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setInternalError('Camera and microphone are not supported in this browser.')
        setInternalPermission(false)
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: true,
      })

      internalStreamRef.current = stream
      setInternalPermission(true)
    } catch (err: any) {
      console.warn('getUserMedia internal error:', err)
      let msg = 'Could not access camera and microphone.'
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera or microphone access was blocked. Please allow permissions in your browser.'
      }
      setInternalError(msg)
      setInternalPermission(false)
    }
  }

  // Request media when standalone
  useEffect(() => {
    if (!isExternallyManaged) {
      startInternalMedia()

      return () => {
        if (internalStreamRef.current) {
          internalStreamRef.current.getTracks().forEach((track) => track.stop())
          internalStreamRef.current = null
        }
      }
    }
  }, [isExternallyManaged])

  // Attach activeStream to video element and handle video track state
  useEffect(() => {
    if (videoRef.current) {
      if (activeStream && activeStream.active && !isCameraOff) {
        videoRef.current.srcObject = activeStream
        const playPromise = videoRef.current.play()
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch((e) => console.warn('Video play error:', e))
        }
      } else {
        videoRef.current.srcObject = null
      }
    }

    if (activeStream) {
      activeStream.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOff
      })
    }
  }, [activeStream, isCameraOff])

  // Sync audio track enabled state with isMuted
  useEffect(() => {
    if (activeStream) {
      activeStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted
      })
    }
  }, [activeStream, isMuted])

  // Setup Web Audio API analyser to monitor microphone levels
  useEffect(() => {
    // Tear down previous audio analyzer
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }

    if (!activeStream || !activeStream.active || isMuted) {
      setMicVolume(0)
      onAudioLevelChange?.(0)
      return
    }

    const audioTracks = activeStream.getAudioTracks()
    if (audioTracks.length === 0) return

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      const audioCtx = new AudioContextClass()
      audioContextRef.current = audioCtx

      const source = audioCtx.createMediaStreamSource(activeStream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.5
      source.connect(analyser)
      analyserRef.current = analyser

      const buffer = new Uint8Array(analyser.frequencyBinCount)

      const checkAudioLevel = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(buffer)

        let sum = 0
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i]
        }
        const avg = sum / buffer.length
        const normalized = Math.min(100, Math.round((avg / 128) * 100))

        if (!isMuted) {
          setMicVolume(normalized)
          onAudioLevelChange?.(normalized)
        } else {
          setMicVolume(0)
          onAudioLevelChange?.(0)
        }

        animFrameRef.current = requestAnimationFrame(checkAudioLevel)
      }

      checkAudioLevel()
    } catch (audioErr) {
      console.warn('Audio metering setup skipped:', audioErr)
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
    }
  }, [activeStream, isMuted])

  const isSpeakingCandidate = micVolume > 15 && !isMuted

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-slate-950 border transition-all duration-300 shadow-2xl flex flex-col justify-between ${
        isSpeakingCandidate
          ? 'animate-listening-glow border-emerald-500'
          : 'border-slate-800'
      } ${className}`}
      style={{ minHeight: '360px', aspectRatio: '4/3' }}
    >
      {/* Video Feed or Camera-Off Placeholder */}
      <div className="absolute inset-0 z-0 bg-slate-900 flex items-center justify-center">
        {effectivePermission && !isCameraOff && activeStream && activeStream.active ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted // ALWAYS mute local preview to prevent audio feedback loop
            className="w-full h-full object-cover -scale-x-100" // Mirrored self-view like Zoom
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-200 text-base">{candidateName}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {isCameraOff
                  ? 'Camera Turned Off'
                  : effectivePermission === false
                  ? 'Camera Permission Blocked'
                  : !activeStream
                  ? 'Camera & Microphone Closed'
                  : 'Camera Feed Inactive'}
              </p>
            </div>

            {effectivePermission === false && effectiveError && (
              <div className="max-w-xs mt-2 p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 text-amber-300 text-xs text-left space-y-2">
                <div className="flex items-start gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>{effectiveError}</span>
                </div>
                <button
                  type="button"
                  onClick={onRequestPermission || startInternalMedia}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-medium transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry Permission
                </button>
              </div>
            )}
          </div>
        )}

        {/* Ambient subtle vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20 pointer-events-none" />
      </div>

      {/* TOP HEADER: Media Badges & Mic Meter */}
      <div className="relative z-10 p-3.5 sm:p-4 flex items-center justify-between gap-2">
        {/* Candidate tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-slate-900/80 text-slate-200 border border-slate-700/80 shadow-md">
          <span className={`w-2 h-2 rounded-full ${isSpeakingCandidate ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'}`} />
          <span>You (Candidate)</span>
          {isDictating && (
            <span className="text-[10px] text-emerald-400 font-normal px-1 py-0.2 bg-emerald-500/20 rounded">
              Live Dictation
            </span>
          )}
        </div>

        {/* Live Audio Level Meter */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs backdrop-blur-md bg-slate-900/80 border border-slate-700/80">
          {isMuted ? (
            <MicOff className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Mic className={`w-3.5 h-3.5 ${isSpeakingCandidate ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
          )}

          {/* Meter bar */}
          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden flex items-center">
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                isMuted
                  ? 'w-0 bg-transparent'
                  : micVolume > 60
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${isMuted ? 0 : Math.max(5, micVolume)}%` }}
            />
          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER: Subtitles & Video Call Controls */}
      <div className="relative z-10 p-3 sm:p-4 space-y-2">
        {/* Real-time Candidate Speech Live Subtitles */}
        {liveTranscript && (
          <div className="bg-slate-950/85 backdrop-blur-md border border-emerald-500/40 rounded-xl p-3 text-xs sm:text-sm text-slate-100 shadow-xl max-h-24 overflow-y-auto leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-200">
            <span className="text-emerald-400 font-semibold mr-1.5 flex items-center gap-1 inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              You:
            </span>
            <span className="italic">"{liveTranscript}"</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          {/* Name and connection quality */}
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl px-3 py-2 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-300 font-medium truncate max-w-[120px] sm:max-w-none">
              {candidateName}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              HD 720p
            </span>
          </div>

          {/* In-Call Quick Controls */}
          <div className="flex items-center gap-1.5">
            {/* Mute/Unmute Mic */}
            <button
              type="button"
              onClick={onToggleMute}
              className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${
                isMuted
                  ? 'bg-rose-600/90 border-rose-400 text-white shadow-lg shadow-rose-600/20'
                  : 'bg-slate-900/80 border-slate-700/80 text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
              title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Toggle Camera */}
            <button
              type="button"
              onClick={onToggleCamera}
              className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${
                isCameraOff
                  ? 'bg-rose-600/90 border-rose-400 text-white shadow-lg shadow-rose-600/20'
                  : 'bg-slate-900/80 border-slate-700/80 text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
              title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isCameraOff ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
