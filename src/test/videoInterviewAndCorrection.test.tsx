import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { buildInterviewerCorrectionScript } from '@/lib/speechUtils'
import { InterviewerAvatar } from '@/components/interview/InterviewerAvatar'
import { InterviewerCorrectionCard } from '@/components/interview/InterviewerCorrectionCard'
import { CandidateVideoTile } from '@/components/interview/CandidateVideoTile'

describe('Video Interview & AI Correction Suite', () => {
  it('generates precise spoken correction scripts when interviewee gives wrong or incomplete answer', () => {
    const script = buildInterviewerCorrectionScript({
      questionText: 'Explain React reconciliation',
      score: 35,
      missingConcepts: ['Fiber work loop', 'Key stability'],
      whatNeedsImprovement: ['Missed how the diffing algorithm handles arrays'],
      suggestedAnswer: 'React uses an O(n) heuristic diffing algorithm that relies on stable keys to track element identity.',
      practicalTip: 'Always mention why index as key causes re-rendering bugs.',
    })

    expect(script.spokenText).toContain('not quite correct')
    expect(script.spokenText).toContain('Fiber work loop')
    expect(script.spokenText).toContain('Key stability')
    expect(script.spokenText).toContain('React uses an O(n) heuristic diffing algorithm')
    expect(script.summaryNotice).toContain('Fiber work loop')
  })

  it('renders InterviewerAvatar with Sarah Jenkins nameplate and active status', () => {
    render(
      <InterviewerAvatar
        status="speaking"
        captionText="Explain React reconciliation and Virtual DOM."
        isSpeaking={true}
      />
    )

    expect(screen.getByText('Sarah Jenkins')).toBeDefined()
    expect(screen.getByText(/Asking Question/i)).toBeDefined()
    expect(screen.getByText('"Explain React reconciliation and Virtual DOM."')).toBeDefined()
  })

  it('renders InterviewerCorrectionCard and handles Retry and Next Question user actions', () => {
    const handleRetry = vi.fn()
    const handleContinue = vi.fn()
    const handleToggleSpeech = vi.fn()

    render(
      <InterviewerCorrectionCard
        score={48}
        missingConcepts={['Reconciliation', 'Virtual DOM diffing']}
        whatNeedsImprovement={['Failed to explain how keys stabilize list items']}
        suggestedStrongerAnswer="Structure the answer by explaining the Virtual DOM tree diffing heuristics."
        practicalTip="State your assumptions before diving into code."
        onRetry={handleRetry}
        onContinue={handleContinue}
        isSpeakingCorrection={false}
        onToggleSpeech={handleToggleSpeech}
      />
    )

    expect(screen.getByText(/Interviewer Feedback & Correction/i)).toBeDefined()
    expect(screen.getByText('Reconciliation')).toBeDefined()
    expect(screen.getByText('Virtual DOM diffing')).toBeDefined()
    expect(screen.getByText(/Failed to explain how keys stabilize/i)).toBeDefined()
    expect(screen.getByText(/Structure the answer by explaining the Virtual DOM/i)).toBeDefined()

    // Test Practice Again / Retry click
    const retryBtn = screen.getByRole('button', { name: /Practice Again/i })
    fireEvent.click(retryBtn)
    expect(handleRetry).toHaveBeenCalledTimes(1)

    // Test Next Question click
    const nextBtn = screen.getByRole('button', { name: /Next Question/i })
    fireEvent.click(nextBtn)
    expect(handleContinue).toHaveBeenCalledTimes(1)
  })

  it('renders CandidateVideoTile and handles camera and microphone permission states', () => {
    const handleToggleMute = vi.fn()
    const handleToggleCamera = vi.fn()
    const handleRequestPermission = vi.fn()

    const mockVideoTrack = { kind: 'video', enabled: true, stop: vi.fn() }
    const mockAudioTrack = { kind: 'audio', enabled: true, stop: vi.fn() }
    const mockStream = {
      active: true,
      getVideoTracks: () => [mockVideoTrack],
      getAudioTracks: () => [mockAudioTrack],
      getTracks: () => [mockVideoTrack, mockAudioTrack],
    } as unknown as MediaStream

    const { rerender } = render(
      <CandidateVideoTile
        candidateName="Alex Morgan"
        isMuted={false}
        isCameraOff={false}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
        mediaStream={mockStream}
        hasPermission={true}
        onRequestPermission={handleRequestPermission}
      />
    )

    expect(screen.getByText('Alex Morgan')).toBeDefined()
    expect(screen.getByText(/You \(Candidate\)/i)).toBeDefined()
    expect(screen.getByText('HD 720p')).toBeDefined()

    // Test permission denied state with retry button
    rerender(
      <CandidateVideoTile
        candidateName="Alex Morgan"
        isMuted={false}
        isCameraOff={false}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
        mediaStream={null}
        hasPermission={false}
        permissionError="Camera access was blocked by browser."
        onRequestPermission={handleRequestPermission}
      />
    )

    expect(screen.getByText('Camera Permission Blocked')).toBeDefined()
    expect(screen.getByText('Camera access was blocked by browser.')).toBeDefined()
    const retryBtn = screen.getByRole('button', { name: /Retry Permission/i })
    fireEvent.click(retryBtn)
    expect(handleRequestPermission).toHaveBeenCalledTimes(1)

    // Test camera & microphone auto-closed state when call ends (mediaStream is null)
    rerender(
      <CandidateVideoTile
        candidateName="Alex Morgan"
        isMuted={false}
        isCameraOff={false}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
        mediaStream={null}
        hasPermission={true}
      />
    )

    expect(screen.getByText('Camera & Microphone Closed')).toBeDefined()
  })
})
