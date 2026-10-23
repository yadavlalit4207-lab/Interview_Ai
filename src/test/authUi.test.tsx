import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

const TestProtectedComponent = () => <div>Protected Content Visible</div>

describe('Auth & UI Component Tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders login page with email and password inputs and 1-Click Demo button', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <LoginPage />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    )

    expect(screen.getByText(/Sign In to Your Studio/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument()
    expect(screen.getByText(/1-Click Instant Demo Access/i)).toBeInTheDocument()
  })

  it('signs in with demo user upon clicking instant demo access', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <LoginPage />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    )

    const demoBtn = screen.getByText(/1-Click Instant Demo Access/i)
    fireEvent.click(demoBtn)

    await waitFor(() => {
      const stored = localStorage.getItem('interviewace_auth_user')
      expect(stored).not.toBeNull()
      expect(JSON.parse(stored!).email).toBe('alex.rivera@interviewace.dev')
    })
  })

  it('protects routes from unauthenticated access by withholding protected content', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <ProtectedRoute>
                <TestProtectedComponent />
              </ProtectedRoute>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    )

    // Unauthenticated user should not see protected content
    expect(screen.queryByText('Protected Content Visible')).not.toBeInTheDocument()
  })
})
