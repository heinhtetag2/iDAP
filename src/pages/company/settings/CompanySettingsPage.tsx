import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Building2, Bell, Users, Save, CheckCircle2, Mail, Globe, Lock, Eye, EyeOff } from 'lucide-react'
import { apiClient } from '@/shared/api/client'
import { useCompanyAuthStore } from '@/shared/model/companyAuthStore'
import { cn } from '@/shared/lib'

export default function CompanySettingsPage() {
  const { user, setUser } = useCompanyAuthStore()
  const [saved, setSaved] = useState(false)

  const [profile, setProfile] = useState({
    company_name: user?.company_name ?? '',
    industry: 'technology',
    website: 'https://example.com',
    contact_email: user?.email ?? '',
    contact_phone: '+976 9900 0000',
    description: '',
  })

  const [notifs, setNotifs] = useState({
    survey_responses: true,
    low_credits: true,
    survey_completed: true,
    weekly_report: false,
  })

  const [teamInvite, setTeamInvite] = useState('')

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false })
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')

  const passwordMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put('/company/settings/password', { current_password: passwords.current, new_password: passwords.next })
    },
    onSuccess: () => {
      setPasswords({ current: '', next: '', confirm: '' })
      setPwError('')
      setPwSaved(true)
      setTimeout(() => setPwSaved(false), 2500)
    },
  })

  const handlePasswordSave = () => {
    setPwError('')
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      setPwError('All fields are required.')
      return
    }
    if (passwords.next.length < 8) {
      setPwError('New password must be at least 8 characters.')
      return
    }
    if (passwords.next !== passwords.confirm) {
      setPwError('New passwords do not match.')
      return
    }
    passwordMutation.mutate()
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put('/company/settings', profile)
    },
    onSuccess: () => {
      if (user) setUser({ ...user, company_name: profile.company_name })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const INDUSTRIES = ['technology', 'finance', 'retail', 'healthcare', 'education', 'food_beverage', 'telecom', 'media', 'other']

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-0.5">Manage company profile and preferences</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-success-50 border border-success-200 px-4 py-3 text-success-600 text-sm">
          <CheckCircle2 className="h-5 w-5" />
          Changes saved successfully
        </div>
      )}

      {/* Company profile */}
      <div className="rounded-xl border border-border bg-white p-5 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Building2 className="h-4 w-4 text-indigo-600" />
          Company Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Company Name</label>
            <input
              value={profile.company_name}
              onChange={(e) => setProfile((p) => ({ ...p, company_name: e.target.value }))}
              className="h-10 w-full rounded-lg border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Industry</label>
            <select
              value={profile.industry}
              onChange={(e) => setProfile((p) => ({ ...p, industry: e.target.value }))}
              className="h-10 w-full rounded-lg border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5 flex items-center gap-1">
            <Globe className="h-3.5 w-3.5" /> Website
          </label>
          <input
            value={profile.website}
            onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
            type="url"
            className="h-10 w-full rounded-lg border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> Contact Email
            </label>
            <input
              value={profile.contact_email}
              onChange={(e) => setProfile((p) => ({ ...p, contact_email: e.target.value }))}
              type="email"
              className="h-10 w-full rounded-lg border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Phone</label>
            <input
              value={profile.contact_phone}
              onChange={(e) => setProfile((p) => ({ ...p, contact_phone: e.target.value }))}
              className="h-10 w-full rounded-lg border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
          <textarea
            value={profile.description}
            onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))}
            rows={3}
            placeholder="Brief description of your company…"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Notification preferences */}
      <div className="rounded-xl border border-border bg-white p-5 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Bell className="h-4 w-4 text-indigo-600" />
          Notification Preferences
        </h2>
        <div className="space-y-3">
          {(
            [
              { key: 'survey_responses' as const, label: 'Survey response milestones', desc: 'When surveys hit 25%, 50%, 75%, 100%' },
              { key: 'low_credits' as const, label: 'Low credits alert', desc: 'When balance falls below ₮50,000' },
              { key: 'survey_completed' as const, label: 'Survey completed', desc: 'When a survey reaches max responses' },
              { key: 'weekly_report' as const, label: 'Weekly report', desc: 'Summary email every Monday' },
            ] as const
          ).map((pref) => (
            <div key={pref.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">{pref.label}</p>
                <p className="text-xs text-text-muted">{pref.desc}</p>
              </div>
              <button
                role="switch"
                aria-checked={notifs[pref.key]}
                onClick={() => setNotifs((n) => ({ ...n, [pref.key]: !n[pref.key] }))}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                  notifs[pref.key] ? 'bg-indigo-600' : 'bg-gray-200'
                )}
              >
                <span className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  notifs[pref.key] ? 'translate-x-5' : 'translate-x-0'
                )} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="rounded-xl border border-border bg-white p-5 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-600" />
          Team Members
        </h2>
        <div className="space-y-2">
          {[
            { name: user?.full_name ?? 'You', email: user?.email ?? '', role: 'Owner' },
          ].map((m) => (
            <div key={m.email} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {m.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{m.name}</p>
                <p className="text-xs text-text-muted">{m.email}</p>
              </div>
              <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">{m.role}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={teamInvite}
            onChange={(e) => setTeamInvite(e.target.value)}
            placeholder="colleague@company.com"
            type="email"
            className="h-9 flex-1 rounded-lg border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => setTeamInvite('')}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            Invite
          </button>
        </div>
      </div>
      {/* Change password */}
      <div className="rounded-xl border border-border bg-white p-5 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Lock className="h-4 w-4 text-indigo-600" />
          Change Password
        </h2>

        {pwSaved && (
          <div className="flex items-center gap-2 rounded-lg bg-success-50 border border-success-200 px-3 py-2 text-success-600 text-sm">
            <CheckCircle2 className="h-4 w-4" /> Password updated successfully
          </div>
        )}
        {pwError && (
          <p className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-lg px-3 py-2">{pwError}</p>
        )}

        <div className="space-y-3">
          {([
            { key: 'current' as const, label: 'Current Password' },
            { key: 'next' as const, label: 'New Password' },
            { key: 'confirm' as const, label: 'Confirm New Password' },
          ]).map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={showPw[key] ? 'text' : 'password'}
                  value={passwords[key]}
                  onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-border px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPw[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handlePasswordSave}
          disabled={passwordMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          <Lock className="h-4 w-4" />
          {passwordMutation.isPending ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </div>
  )
}
