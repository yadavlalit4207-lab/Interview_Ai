// Browser Speech Recognition & Synthesis utility with robust safety checks and fallbacks

// Type definitions for SpeechRecognition API
interface IWindow extends Window {
  webkitSpeechRecognition?: any
  SpeechRecognition?: any
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  const win = window as IWindow
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition)
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
}

// Word Visemes for realistic lip-syncing
export type VisemeType = 'closed' | 'open_ah' | 'round_oh' | 'wide_ee' | 'lip_teeth' | 'mid_open'

export function getWordViseme(rawWord: string): VisemeType {
  const clean = rawWord.toLowerCase().replace(/[^a-z]/g, '').trim()
  if (!clean || clean.length === 0) return 'closed'

  // Labial consonants (m, p, b) - lips pressed together
  if (/^[mpb]/.test(clean) && clean.length <= 2) return 'closed'
  if (/^(my|me|be|by|pm|am|up|but|more|must)$/.test(clean)) return 'closed'

  // Labiodental (f, v)
  if (/^[fv]/.test(clean)) return 'lip_teeth'

  // Rounded vowels (o, oo, u, ow, ou, w)
  if (/[oou]|ow|ou|wh|wo|to|do|who|you/.test(clean)) return 'round_oh'

  // Open broad vowels (a, ah, ar, al, aw)
  if (/[a]|ah|ar|al|aw|how|what|can|are/.test(clean)) return 'open_ah'

  // Spread / wide vowels (e, ee, i, ea, ay)
  if (/[ei]|ee|ea|ay|see|key|react|we|is/.test(clean)) return 'wide_ee'

  return 'mid_open'
}

// Continuous speech dictation engine for live interview response
export class LiveInterviewDictator {
  private recognition: any = null
  private isListening = false
  private shouldKeepListening = false
  private retryTimeout: any = null

  constructor(
    private onTranscript: (finalText: string, interimText: string) => void,
    private onError?: (errorMsg: string) => void,
    private onStatusChange?: (active: boolean) => void
  ) {
    if (!isSpeechRecognitionSupported()) return

    const win = window as IWindow
    const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition
    this.recognition = new SpeechClass()
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = 'en-US'

    this.recognition.onresult = (event: any) => {
      let interim = ''
      let finalBatch = ''

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const trans = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalBatch += trans
        } else {
          interim += trans
        }
      }

      this.onTranscript(finalBatch, interim)
    }

    this.recognition.onerror = (event: any) => {
      console.warn('SpeechRecognition error:', event.error)
      if (event.error === 'not-allowed') {
        this.shouldKeepListening = false
        this.onError?.('Microphone permission was denied. Please allow microphone access in your browser.')
      } else if (event.error === 'no-speech') {
        // Normal silence during interview - safe to auto-continue
      }
    }

    this.recognition.onend = () => {
      this.isListening = false
      this.onStatusChange?.(false)

      // Auto-restart if candidate is still actively dictating their answer
      if (this.shouldKeepListening) {
        clearTimeout(this.retryTimeout)
        this.retryTimeout = setTimeout(() => {
          if (this.shouldKeepListening) {
            try {
              this.recognition?.start()
              this.isListening = true
              this.onStatusChange?.(true)
            } catch {
              // Safe ignore
            }
          }
        }, 150)
      }
    }
  }

  public start(): void {
    if (!this.recognition) return
    this.shouldKeepListening = true
    if (this.isListening) return

    try {
      this.recognition.start()
      this.isListening = true
      this.onStatusChange?.(true)
    } catch {
      // Already running or starting
    }
  }

  public stop(): void {
    this.shouldKeepListening = false
    clearTimeout(this.retryTimeout)
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop()
      } catch {
        // Safe ignore
      }
      this.isListening = false
      this.onStatusChange?.(false)
    }
  }

  public get active(): boolean {
    return this.isListening
  }
}

// Backward compatible recognizer
export class VoiceSpeechRecognizer {
  private dictator: LiveInterviewDictator | null = null

  constructor(
    private onResult: (text: string, isFinal: boolean) => void,
    private onError: (errorMsg: string) => void,
    private onEnd: () => void
  ) {
    this.dictator = new LiveInterviewDictator(
      (finalText, interimText) => {
        if (finalText) {
          this.onResult(finalText, true)
        } else if (interimText) {
          this.onResult(interimText, false)
        }
      },
      (err) => this.onError(err),
      (active) => {
        if (!active) this.onEnd()
      }
    )
  }

  public start(): void {
    this.dictator?.start()
  }

  public stop(): void {
    this.dictator?.stop()
  }

  public get active(): boolean {
    return this.dictator?.active || false
  }
}

// Cached voices
let cachedVoices: SpeechSynthesisVoice[] = []

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) {
      resolve([])
      return
    }

    const available = window.speechSynthesis.getVoices()
    if (available.length > 0) {
      cachedVoices = available
      resolve(available)
      return
    }

    window.speechSynthesis.onvoiceschanged = () => {
      const updated = window.speechSynthesis.getVoices()
      cachedVoices = updated
      resolve(updated)
    }

    // Safety timeout fallback
    setTimeout(() => {
      cachedVoices = window.speechSynthesis.getVoices()
      resolve(cachedVoices)
    }, 400)
  })
}

// Strictly exclude all male voice names so interviewer is ALWAYS a girl voice
const MALE_VOICE_NAMES = [
  'david',
  'guy',
  'mark',
  'george',
  'james',
  'richard',
  'stefan',
  'christopher',
  'eric',
  'brian',
  'adam',
  'michael',
  'paul',
  'daniel',
  'male',
  'uk english male',
]

// High-priority known female/girl voices sorted by natural human quality
const GIRL_VOICE_PRIORITY = [
  'jenny', // Microsoft Jenny Online (Natural) - High quality, very human female
  'aria',  // Microsoft Aria Online (Natural) - Natural conversational female
  'google us english', // Chrome default female voice
  'zira',  // Microsoft Zira - Windows built-in female
  'samantha', // Apple macOS / iOS natural female
  'sonia', // Microsoft Sonia Online (Natural)
  'natasha', // Microsoft Natasha Online (Natural)
  'clara', // Microsoft Clara Online (Natural)
  'victoria',
  'karen',
  'michelle',
  'ana',
  'emma',
  'fiona',
  'moira',
  'hazel',
  'susan',
  'catherine',
  'stephanie',
  'en-us-neural2-f',
  'en-us-wavenet-c',
  'en-us-wavenet-f',
  'female',
  'woman',
  'girl',
]

export function getAllFemaleVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return []
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices()

  const nonMale = voices.filter((v) => {
    const nameLower = v.name.toLowerCase()
    return !MALE_VOICE_NAMES.some((m) => nameLower.includes(m))
  })

  // Sort with highest quality natural girl voices first
  return nonMale.sort((a, b) => {
    const aName = a.name.toLowerCase()
    const bName = b.name.toLowerCase()

    const aIdx = GIRL_VOICE_PRIORITY.findIndex((kw) => aName.includes(kw))
    const bIdx = GIRL_VOICE_PRIORITY.findIndex((kw) => bName.includes(kw))

    const aRank = aIdx === -1 ? 999 : aIdx
    const bRank = bIdx === -1 ? 999 : bIdx

    return aRank - bRank
  })
}

// Find the most natural professional female/girl voice
export function getBestFemaleVoice(): SpeechSynthesisVoice | null {
  const femaleList = getAllFemaleVoices()
  if (femaleList.length > 0) return femaleList[0]

  const voices = cachedVoices.length > 0 ? cachedVoices : (typeof window !== 'undefined' ? window.speechSynthesis.getVoices() : [])
  const nonMale = voices.filter((v) => {
    const nameLower = v.name.toLowerCase()
    return !MALE_VOICE_NAMES.some((m) => nameLower.includes(m))
  })

  return nonMale[0] || voices[0] || null
}

export interface SpeakOptions {
  onStart?: () => void
  onWordBoundary?: (word: string, viseme: VisemeType, charIndex: number) => void
  onPhrasePause?: () => void
  onDone?: () => void
  onError?: (err: any) => void
  rate?: number
  pitch?: number
  voice?: SpeechSynthesisVoice | null
}

// Flawless human speech synthesis: Speaks in a smooth, continuous audio stream without choppy clause restarts
export function speakText(
  text: string,
  optionsOrDone?: SpeakOptions | (() => void)
): void {
  if (!isSpeechSynthesisSupported()) {
    if (typeof optionsOrDone === 'function') optionsOrDone()
    else if (optionsOrDone?.onDone) optionsOrDone.onDone()
    return
  }

  const options: SpeakOptions =
    typeof optionsOrDone === 'function' ? { onDone: optionsOrDone } : optionsOrDone || {}

  try {
    window.speechSynthesis.cancel() // Cancel any prior speech

    const cleanText = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!cleanText) {
      options.onDone?.()
      return
    }

    const selectedVoice = options.voice || getBestFemaleVoice()
    const utterance = new SpeechSynthesisUtterance(cleanText)

    // Flawless conversational human parameters
    utterance.rate = options.rate ?? 0.98 // Smooth, articulate conversational pace
    utterance.pitch = options.pitch ?? 1.0 // Natural 1.0 preserves authentic neural female voice acoustics
    utterance.lang = selectedVoice?.lang || 'en-US'

    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    let syllableTimer: any = null

    utterance.onstart = () => {
      options.onStart?.()
    }

    // Word-level lip sync: tracks each word smoothly during continuous playback
    utterance.onboundary = (e: SpeechSynthesisEvent) => {
      const charIndex = e.charIndex || 0
      const remaining = cleanText.slice(charIndex)
      const wordMatch = remaining.match(/^([a-zA-Z0-9']+)/)
      const currentWord = wordMatch ? wordMatch[1] : ''

      if (currentWord) {
        const viseme = getWordViseme(currentWord)
        options.onWordBoundary?.(currentWord, viseme, charIndex)

        // Reset to articulate resting mouth between syllables/pauses
        clearTimeout(syllableTimer)
        syllableTimer = setTimeout(() => {
          options.onPhrasePause?.()
        }, 130)
      }
    }

    // Chromium keep-alive interval (prevents long utterance stall bug)
    const keepAliveTimer = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      } else {
        clearInterval(keepAliveTimer)
      }
    }, 10000)

    const cleanup = () => {
      clearInterval(keepAliveTimer)
      clearTimeout(syllableTimer)
      options.onPhrasePause?.()
    }

    utterance.onend = () => {
      cleanup()
      options.onDone?.()
    }

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e)
      cleanup()
      options.onError?.(e)
      options.onDone?.()
    }

    window.speechSynthesis.speak(utterance)
  } catch (err) {
    console.warn('Speech synthesis call failed:', err)
    options.onError?.(err)
    options.onDone?.()
  }
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel()
    } catch {
      // Safe ignore
    }
  }
}

// Generate spoken interviewer correction script when interviewee gives a wrong or incomplete answer
export function buildInterviewerCorrectionScript(params: {
  questionText: string
  score: number
  missingConcepts?: string[]
  whatNeedsImprovement?: string[]
  suggestedAnswer?: string
  practicalTip?: string
}): { spokenText: string; summaryNotice: string } {
  const { score, missingConcepts = [], whatNeedsImprovement = [], suggestedAnswer } = params

  const missingList = missingConcepts.slice(0, 3).join(', ')

  let opening = ''
  if (score < 40) {
    opening = 'Thanks for your attempt, but that answer is not quite correct.'
  } else if (score < 60) {
    opening = 'You touched on a few aspects, but the answer is incomplete and missed some critical core concepts.'
  } else {
    opening = 'Good effort! However, to really stand out, there are important points you missed.'
  }

  let missingPhrase = ''
  if (missingConcepts.length > 0) {
    missingPhrase = ` Specifically, you missed key concepts like ${missingList}.`
  } else if (whatNeedsImprovement.length > 0) {
    missingPhrase = ` Noticeably, ${whatNeedsImprovement[0].toLowerCase()}`
  }

  let correctionPhrase = ''
  if (suggestedAnswer) {
    const cleanSuggestion = suggestedAnswer
      .split('.')[0]
      .replace(/[*_#`]/g, '')
      .trim()
    correctionPhrase = ` The correct way to address this is: ${cleanSuggestion}.`
  } else {
    correctionPhrase = ' Remember to state the fundamental tradeoffs, definitions, and reasoning clearly.'
  }

  const closing = ' I have highlighted the exact details on your screen. You can review them and try answering again!'

  const spokenText = `${opening}${missingPhrase}${correctionPhrase}${closing}`
  const summaryNotice = missingConcepts.length > 0
    ? `Missing: ${missingList}`
    : whatNeedsImprovement[0] || 'Answer requires deeper technical explanation.'

  return { spokenText, summaryNotice }
}

// Initialize voices on module load
if (typeof window !== 'undefined') {
  loadVoices()
}
