import '@testing-library/jest-dom'
import { vi } from 'vitest'

// In-memory localStorage mock for Node 25 & jsdom
const storage: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => storage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storage[key] = String(value)
  }),
  removeItem: vi.fn((key: string) => {
    delete storage[key]
  }),
  clear: vi.fn(() => {
    for (const key of Object.keys(storage)) {
      delete storage[key]
    }
  }),
  key: vi.fn((index: number) => Object.keys(storage)[index] ?? null),
  get length() {
    return Object.keys(storage).length
  },
}

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

// Mock matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock window.scrollTo
window.scrollTo = vi.fn()

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock SpeechRecognition
class MockSpeechRecognition {
  continuous = false
  interimResults = false
  lang = 'en-US'
  onresult: ((event: unknown) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  onend: (() => void) | null = null
  start = vi.fn()
  stop = vi.fn()
  abort = vi.fn()
}

// Attach to window
;(window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition = MockSpeechRecognition
;(window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = MockSpeechRecognition
