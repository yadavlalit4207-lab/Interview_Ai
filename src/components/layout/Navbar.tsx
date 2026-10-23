import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Compass,
  FileQuestion,
  BarChart2,
  History,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  PlayCircle,
  Database,
  Cloud,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export const Navbar: React.FC = () => {
  const { user, profile, signOut, isDemoMode } = useAuth()
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: <Compass className="w-4 h-4" /> },
    { label: 'Mock Interview', path: '/interview/setup', icon: <PlayCircle className="w-4 h-4" /> },
    { label: 'Question Bank', path: '/question-bank', icon: <FileQuestion className="w-4 h-4" /> },
    { label: 'Analytics', path: '/analytics', icon: <BarChart2 className="w-4 h-4" /> },
    { label: 'History', path: '/history', icon: <History className="w-4 h-4" /> },
  ]

  const handleSignOut = async () => {
    await signOut()
    setUserDropdownOpen(false)
    navigate('/')
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-1.5">
                  Interview<span className="text-blue-500">Ace</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase -mt-1">
                  AI Prep Studio
                </span>
              </div>
            </Link>

            {/* Mode indicator badge */}
            <div className="hidden lg:flex items-center">
              {isDemoMode ? (
                <Badge variant="warning" size="sm" className="gap-1 normal-case font-mono">
                  <Database className="w-3 h-3" />
                  Local Demo Mode
                </Badge>
              ) : (
                <Badge variant="success" size="sm" className="gap-1 normal-case font-mono">
                  <Cloud className="w-3 h-3" />
                  Supabase Live
                </Badge>
              )}
            </div>
          </div>

          {/* Desktop Nav Links (Authenticated) */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive =
                  location.pathname === link.path ||
                  (link.path !== '/dashboard' && location.pathname.startsWith(link.path))
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                    {(profile?.display_name || user.email)[0]}
                  </div>
                  <span className="hidden sm:inline-block text-sm font-medium text-slate-200 max-w-[120px] truncate">
                    {profile?.display_name || user.email.split('@')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/60 p-2 z-40 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                        <p className="text-xs font-semibold text-slate-200 truncate">
                          {profile?.display_name || 'Interview Candidate'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        <p className="text-[10px] text-blue-400 font-mono mt-0.5">
                          {profile?.target_role || 'Candidate'}
                        </p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Profile & Goals</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Account Settings</span>
                      </Link>

                      <div className="border-t border-slate-800/80 my-1" />

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm">
                    Start Practicing Free
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {user && mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800/80 flex flex-col gap-1.5 animate-in slide-in-from-top-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900"
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
