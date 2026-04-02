import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { User, Globe, Bell } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/shared/ui'
import { cn } from '@/shared/lib'
import { LANGUAGES } from '@/shared/config/constants'
import { ROUTES } from '@/shared/config/routes'
import { apiClient } from '@/shared/api/client'

export default function SettingsPage() {
  const { t, i18n } = useTranslation('nav')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()

  const [notifPrefs, setNotifPrefs] = useState({
    survey: true,
    reward: true,
    marketing: false,
  })

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code)
    // Sync to backend — fire and forget
    apiClient.put('/respondent/profile', { preferred_lang: code }).catch(() => undefined)
  }

  const toggleNotif = (key: keyof typeof notifPrefs) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-text-primary">{t('settings')}</h1>

      {/* Profile section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5 text-text-secondary" />
            {t('profile')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.PROFILE_SETUP)}
          >
            {tc('edit')} {t('profile')}
          </Button>
        </CardContent>
      </Card>

      {/* Language section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-5 w-5 text-text-secondary" />
            Language
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {LANGUAGES.map((lang) => (
              <label
                key={lang.code}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                  i18n.language === lang.code
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-border hover:bg-surface-secondary',
                )}
              >
                <input
                  type="radio"
                  name="language"
                  value={lang.code}
                  checked={i18n.language === lang.code}
                  onChange={() => handleLanguageChange(lang.code)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-lg">{lang.flag}</span>
                <span className="text-sm font-medium text-text-primary">{lang.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-text-secondary" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(
              [
                { key: 'survey' as const, label: 'Survey notifications', desc: 'New surveys matching your profile' },
                { key: 'reward' as const, label: 'Reward notifications', desc: 'Reward status and wallet updates' },
                { key: 'marketing' as const, label: 'Marketing', desc: 'Tips, promotions and updates' },
              ] as const
            ).map((pref) => (
              <div key={pref.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{pref.label}</p>
                  <p className="text-xs text-text-muted">{pref.desc}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={notifPrefs[pref.key]}
                  onClick={() => toggleNotif(pref.key)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                    notifPrefs[pref.key] ? 'bg-primary-600' : 'bg-gray-200',
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      notifPrefs[pref.key] ? 'translate-x-5' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
