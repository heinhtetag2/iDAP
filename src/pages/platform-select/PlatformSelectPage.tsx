import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Users, BarChart3, Shield, Globe, ArrowRight, CheckCircle, Sparkles } from 'lucide-react'
import { cn } from '@/shared/lib'
import { ROUTES } from '@/shared/config/routes'

const PORTALS = [
  {
    id: 'respondent',
    route: ROUTES.LOGIN,
    badge: 'Respondent',
    badgeBg: 'bg-sky-500/15 text-sky-300 border border-sky-500/25',
    icon: Users,
    iconBg: 'bg-sky-500/15 border-sky-500/20',
    iconColor: 'text-sky-400',
    glow: 'hover:border-sky-500/40 hover:shadow-sky-500/8',
    title: 'iDap Respondent',
    subtitle: 'Earn MNT rewards by sharing your opinions on real surveys.',
    features: ['Personalized survey feed', 'Instant wallet payouts', 'QPay & Bonum withdrawal', 'Trust level progression'],
    cta: 'Join as Respondent',
    ctaBg: 'from-sky-500 to-blue-600',
    stat: '12,000+ active users',
  },
  {
    id: 'company',
    route: ROUTES.COMPANY_LOGIN,
    badge: 'Company',
    badgeBg: 'bg-violet-500/15 text-violet-300 border border-violet-500/25',
    icon: BarChart3,
    iconBg: 'bg-violet-500/15 border-violet-500/20',
    iconColor: 'text-violet-400',
    glow: 'hover:border-violet-500/40 hover:shadow-violet-500/8',
    title: 'iDap Business',
    subtitle: 'Launch targeted surveys and receive quality-verified responses.',
    features: ['Drag-and-drop survey builder', 'Demographic targeting', 'Real-time analytics', 'Fraud-proof responses'],
    cta: 'Access Business Portal',
    ctaBg: 'from-violet-600 to-indigo-600',
    stat: '340+ active companies',
  },
  {
    id: 'admin',
    route: ROUTES.ADMIN_LOGIN,
    badge: 'Operator',
    badgeBg: 'bg-rose-500/15 text-rose-300 border border-rose-500/25',
    icon: Shield,
    iconBg: 'bg-rose-500/15 border-rose-500/20',
    iconColor: 'text-rose-400',
    glow: 'hover:border-rose-500/40 hover:shadow-rose-500/8',
    title: 'iDap Admin',
    subtitle: 'Manage companies, review fraud alerts, and process payouts.',
    features: ['Company approvals', 'Fraud detection queue', 'Payout processing', 'Platform analytics'],
    cta: 'Admin Console',
    ctaBg: 'from-rose-600 to-pink-600',
    stat: 'Platform operators only',
  },
  {
    id: 'website',
    route: '/about',
    badge: 'Website',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
    icon: Globe,
    iconBg: 'bg-emerald-500/15 border-emerald-500/20',
    iconColor: 'text-emerald-400',
    glow: 'hover:border-emerald-500/40 hover:shadow-emerald-500/8',
    title: 'iDap Website',
    subtitle: 'Learn about our platform, features, quality system, and pricing.',
    features: ['Product overview', 'How it works', 'Quality engine details', 'For companies & respondents'],
    cta: 'Visit Website',
    ctaBg: 'from-emerald-600 to-teal-600',
    stat: 'Public · No login required',
  },
]

export default function PlatformSelectPage() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-[#080811] text-white flex flex-col overflow-hidden">

      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-violet-700/15 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-sky-700/8 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-black text-white shadow-lg shadow-violet-500/25">
            i
          </div>
          <span className="text-lg font-black tracking-tight">iDap</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/50 font-medium">Mongolia's #1 Survey Platform</span>
        </div>
      </header>

      {/* Hero text */}
      <div className="relative text-center px-6 pt-10 pb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/8 px-4 py-1.5 text-xs font-medium text-violet-300 mb-6">
          <Sparkles className="h-3 w-3" />
          Choose your portal
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4">
          Which one are you?
        </h1>
        <p className="text-white/40 text-lg max-w-lg mx-auto">
          Four portals, one platform. Pick your role and dive right in.
        </p>
      </div>

      {/* Portal cards */}
      <div className="relative flex-1 px-4 pb-12">
        <div className="mx-auto grid w-full max-w-screen-xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
          {PORTALS.map((p) => {
            const Icon = p.icon
            const isHovered = hovered === p.id
            return (
              <button
                key={p.id}
                onClick={() => navigate(p.route)}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  'group relative flex flex-col rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-6 text-left',
                  'transition-all duration-300 hover:-translate-y-2 hover:bg-white/6 hover:shadow-2xl',
                  p.glow
                )}
              >
                {/* Badge */}
                <span className={cn('inline-flex self-start rounded-full px-2.5 py-0.5 text-xs font-semibold mb-5', p.badgeBg)}>
                  {p.badge}
                </span>

                {/* Icon */}
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl border mb-5',
                  'transition-transform duration-300 group-hover:scale-110',
                  p.iconBg
                )}>
                  <Icon className={cn('h-6 w-6', p.iconColor)} />
                </div>

                {/* Text */}
                <h2 className="text-lg font-bold text-white mb-2 leading-tight">{p.title}</h2>
                <p className="text-sm text-white/40 leading-relaxed mb-5">{p.subtitle}</p>

                {/* Features */}
                <ul className="space-y-2 mb-5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-white/55">
                      <CheckCircle className="h-3.5 w-3.5 shrink-0 text-white/20" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Stat */}
                <p className="text-xs text-white/22 mb-4">{p.stat}</p>

                {/* CTA */}
                <div className={cn(
                  'flex items-center justify-between rounded-xl px-4 py-3',
                  'text-sm font-bold text-white bg-gradient-to-r shadow-lg',
                  'transition-all duration-300 group-hover:shadow-xl group-hover:brightness-110',
                  p.ctaBg
                )}>
                  {p.cta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative text-center pb-6 text-xs text-white/20">
        © 2026 iDap Platform Inc. · Mongolia
      </footer>
    </div>
  )
}
