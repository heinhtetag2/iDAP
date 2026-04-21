import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, User, Bell, Shield, Save, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/shared/lib'
import { apiClient } from '@/shared/api/client'
import { useAdminAuthStore } from '@/shared/model/adminAuthStore'

interface AdminSettings {
  full_name: string
  email: string
  admin_role: string
  notifications: {
    fraud_alerts: boolean
    company_approvals: boolean
    payout_requests: boolean
    system_alerts: boolean
    weekly_summary: boolean
  }
  security: {
    two_factor_enabled: boolean
    session_timeout_minutes: number
  }
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
        <Icon className="h-5 w-5 text-violet-600" />
        <h2 className="font-semibold text-text-primary">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
          checked ? 'bg-violet-600' : 'bg-gray-200'
        )}
      >
        <span className={cn('pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform', checked ? 'translate-x-5' : 'translate-x-0')} />
      </button>
    </div>
  )
}

export default function AdminSettingsPage() {
  const user = useAdminAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [showPw, setShowPw] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [saved, setSaved] = useState(false)

  const { data: settings, isLoading } = useQuery<AdminSettings>({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/settings')
      return data as AdminSettings
    },
  })

  const updateSettings = useMutation({
    mutationFn: async (payload: Partial<AdminSettings>) => apiClient.put('/admin/settings', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const [notifs, setNotifs] = useState<AdminSettings['notifications'] | null>(null)
  const currentNotifs = notifs ?? settings?.notifications

  const toggleNotif = (key: keyof AdminSettings['notifications'], val: boolean) => {
    const updated = { ...(currentNotifs as AdminSettings['notifications']), [key]: val }
    setNotifs(updated)
    updateSettings.mutate({ notifications: updated })
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        {[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-xl bg-gray-100" />)}
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Settings className="h-6 w-6 text-violet-600" />
            Settings
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Manage your admin account and preferences</p>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
            <Save className="h-4 w-4" /> Saved
          </span>
        )}
      </div>

      {/* Profile */}
      <Section title="Profile" icon={User}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Full Name</label>
            <input
              defaultValue={settings?.full_name ?? user?.full_name}
              className="h-10 w-full rounded-lg border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              onBlur={(e) => updateSettings.mutate({ full_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Email Address</label>
            <input
              defaultValue={settings?.email ?? user?.email}
              className="h-10 w-full rounded-lg border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              onBlur={(e) => updateSettings.mutate({ email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Role</label>
            <input
              value={(settings?.admin_role ?? user?.admin_role ?? '').replace('_', ' ')}
              readOnly
              className="h-10 w-full rounded-lg border border-border px-3 text-sm bg-gray-50 text-text-muted capitalize cursor-not-allowed"
            />
          </div>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notification Preferences" icon={Bell}>
        {currentNotifs && (
          <div>
            <Toggle checked={currentNotifs.fraud_alerts} onChange={(v) => toggleNotif('fraud_alerts', v)}
              label="Fraud Alerts" description="Get notified when fraud is detected on the platform" />
            <Toggle checked={currentNotifs.company_approvals} onChange={(v) => toggleNotif('company_approvals', v)}
              label="Company Approvals" description="Notify when a new company registration needs review" />
            <Toggle checked={currentNotifs.payout_requests} onChange={(v) => toggleNotif('payout_requests', v)}
              label="Payout Requests" description="Alerts for pending respondent payout requests" />
            <Toggle checked={currentNotifs.system_alerts} onChange={(v) => toggleNotif('system_alerts', v)}
              label="System Alerts" description="Critical platform health and error notifications" />
            <Toggle checked={currentNotifs.weekly_summary} onChange={(v) => toggleNotif('weekly_summary', v)}
              label="Weekly Summary" description="Receive a weekly platform performance report" />
          </div>
        )}
      </Section>

      {/* Security */}
      <Section title="Security" icon={Shield}>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-text-primary">Two-Factor Authentication</p>
              <p className="text-xs text-text-muted mt-0.5">Add an extra layer of security to your account</p>
            </div>
            <button
              onClick={() => updateSettings.mutate({ security: { ...settings!.security, two_factor_enabled: !settings?.security.two_factor_enabled } })}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                settings?.security.two_factor_enabled ? 'bg-violet-600' : 'bg-gray-200'
              )}
            >
              <span className={cn('pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform', settings?.security.two_factor_enabled ? 'translate-x-5' : 'translate-x-0')} />
            </button>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium text-text-primary mb-3">Change Password</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: 'current', label: 'Current Password' },
                { key: 'next', label: 'New Password' },
                { key: 'confirm', label: 'Confirm New Password' },
              ].map(({ key, label }) => (
                <div key={key} className="relative">
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">{label}</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pwForm[key as keyof typeof pwForm]}
                    onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-border px-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  {key === 'confirm' && (
                    <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2.5 top-8 text-text-muted">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button className="mt-3 rounded-lg bg-violet-600 hover:bg-violet-700 px-4 py-2 text-sm font-medium text-white transition-colors">
              Update Password
            </button>
          </div>
        </div>
      </Section>
    </div>
  )
}
