import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Laptop,
  Download,
  Trash2,
  KeyRound,
  Shield,
  Volume2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { storageService } from '@/lib/storageService'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'

export const SettingsPage: React.FC = () => {
  const { user, profile, resetPassword, signOut, isDemoMode } = useAuth()
  const { theme, setTheme } = useTheme()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [passwordResetSent, setPasswordResetSent] = useState(false)

  const handlePasswordReset = async () => {
    if (!user?.email) return
    try {
      await resetPassword(user.email)
      setPasswordResetSent(true)
      showToast('Password recovery email dispatched!', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to request reset.', 'error')
    }
  }

  const handleExportData = async () => {
    if (!user) return
    setIsExporting(true)
    try {
      const userProfile = await storageService.getProfile(user.id)
      const userSessions = await storageService.getUserSessions(user.id)
      const userPrefs = await storageService.getPreferences(user.id)

      const archive = {
        exportedAt: new Date().toISOString(),
        user: { id: user.id, email: user.email },
        profile: userProfile,
        preferences: userPrefs,
        sessions: userSessions,
      }

      const blob = new Blob([JSON.stringify(archive, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `interviewace-data-export-${user.id.slice(0, 8)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showToast('Data exported successfully!', 'success')
    } catch (err: any) {
      showToast('Failed to export data archive.', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    setIsDeleting(true)
    try {
      await storageService.deleteUserData(user.id)
      await signOut()
      showToast('Account and all related practice records deleted.', 'info')
      navigate('/')
    } catch (err: any) {
      showToast(err.message || 'Failed to delete account.', 'error')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-blue-400" /> Account Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure preferences, export candidate records, and security settings
        </p>
      </div>

      {/* Account Info */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Account Information</CardTitle>
          <CardDescription>Authentication and security credentials.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 gap-2">
            <div>
              <span className="text-xs text-slate-400">Email Address</span>
              <p className="text-sm font-semibold text-slate-200">{user?.email}</p>
            </div>
            <Badge variant={isDemoMode ? 'warning' : 'success'} size="sm">
              {isDemoMode ? 'Demo / Local' : 'Supabase Live'}
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 gap-2">
            <div>
              <span className="text-xs text-slate-400">Password Security</span>
              <p className="text-xs text-slate-300 mt-0.5">
                Update or recover your password via email link
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePasswordReset}
              disabled={passwordResetSent}
              leftIcon={<KeyRound className="w-3.5 h-3.5" />}
            >
              {passwordResetSent ? 'Link Sent!' : 'Send Reset Link'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance & Theme */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Theme Preferences</CardTitle>
          <CardDescription>Customize the application appearance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'dark' as const, label: 'Dark Mode', icon: <Moon className="w-4 h-4 text-blue-400" /> },
              { id: 'light' as const, label: 'Light Mode', icon: <Sun className="w-4 h-4 text-amber-400" /> },
              { id: 'system' as const, label: 'System Match', icon: <Laptop className="w-4 h-4 text-purple-400" /> },
            ].map((opt) => {
              const isSelected = theme === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 text-slate-100 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {opt.icon}
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Export & Privacy */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Data Export & Portability</CardTitle>
          <CardDescription>
            Download your full practice records, including all evaluated answers and rubric scores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Export All Data (JSON)</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Machine-readable JSON archive of your profile, interviews, and progress metrics.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportData}
              isLoading={isExporting}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone: Account Deletion */}
      <Card className="bg-rose-950/20 border-rose-500/30">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-rose-300">Danger Zone</CardTitle>
          <CardDescription className="text-rose-400/80">
            Irreversible destructive account actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-rose-200">Delete Account & Data</h4>
              <p className="text-xs text-rose-300/80 mt-0.5 max-w-md">
                Permanently deletes your user profile, saved questions, interview questions, and graded answer evaluations.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Permanently Delete Account?"
        description="This action cannot be undone. All of your mock interview records, scores, and profile data will be permanently purged."
      >
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={isDeleting}
            onClick={handleDeleteAccount}
          >
            Confirm Permanent Deletion
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
