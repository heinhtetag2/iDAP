import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, BarChart2, ShieldCheck, Zap, Users, Globe, Star,
  ChevronRight, DollarSign, CheckCircle, TrendingUp, Lock,
  Play, Sparkles, Building2, UserCheck, Menu, X, Shield, BarChart3
} from 'lucide-react'
import { cn } from '@/shared/lib'
import { ROUTES } from '@/shared/config/routes'

// ── Animated counter hook ─────────────────────────────────────────────────────
function useCounter(target: number, duration = 2000, started = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!started) return
    const step = target / (duration / 16)
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + step, target)
      setCount(Math.floor(current))
      if (current >= target) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration, started])
  return count
}

// ── Intersection observer hook ─────────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ── Survey card mock ────────────────────────────────────────────────────────────
function SurveyCardMock({ delay = 0 }: { delay?: number }) {
  const [prog, setProg] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => {
      let v = 0
      const i = setInterval(() => { v = Math.min(v + 1.2, 73); setProg(v); if (v >= 73) clearInterval(i) }, 20)
      return () => clearInterval(i)
    }, delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-4 hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white leading-snug">Consumer Preferences Study</p>
          <p className="text-xs text-white/50 mt-0.5">MCS Group · Market Research</p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/30">Active</span>
      </div>
      <div>
        <div className="flex justify-between text-xs text-white/50 mb-1.5">
          <span>73 / 100 responses</span>
          <span className="font-medium text-white/70">{Math.floor(prog)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all duration-75" style={{ width: `${prog}%` }} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/20">
            <DollarSign className="h-3 w-3 text-violet-400" />
          </div>
          <span className="text-sm font-bold text-violet-300">₮5,000</span>
          <span className="text-xs text-white/40">reward</span>
        </div>
        <span className="text-xs text-white/40">~8 min</span>
      </div>
    </div>
  )
}

// ── Quality badge mock ─────────────────────────────────────────────────────────
function QualityMock() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="h-4 w-4 text-violet-400" />
        <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">Quality Engine</span>
      </div>
      {[
        { label: 'Response time analysis', score: 94, color: 'from-emerald-500 to-green-400' },
        { label: 'Straight-line detection', score: 88, color: 'from-blue-500 to-indigo-400' },
        { label: 'Attention check pass', score: 100, color: 'from-violet-500 to-purple-400' },
        { label: 'Behavior fingerprint', score: 91, color: 'from-pink-500 to-rose-400' },
      ].map(({ label, score, color }) => (
        <div key={label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/60">{label}</span>
            <span className="font-semibold text-white">{score}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className={cn('h-full rounded-full bg-gradient-to-r', color)} style={{ width: `${score}%` }} />
          </div>
        </div>
      ))}
      <div className="mt-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 flex items-center gap-2">
        <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        <span className="text-xs text-emerald-300 font-medium">Quality score: 93 · Reward granted instantly</span>
      </div>
    </div>
  )
}

// ── Wallet mock ────────────────────────────────────────────────────────────────
function WalletMock() {
  const [balance, setBalance] = useState(45000)
  useEffect(() => {
    const t = setTimeout(() => {
      let v = 45000
      const i = setInterval(() => { v = Math.min(v + 200, 50000); setBalance(v); if (v >= 50000) clearInterval(i) }, 30)
      return () => clearInterval(i)
    }, 1200)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">Б</div>
        <div>
          <p className="text-sm font-medium text-white">Батаа Мөнхбаяр</p>
          <p className="text-xs text-white/40">Trust Level 4 · Premium</p>
        </div>
      </div>
      <div className="rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/20 p-4">
        <p className="text-xs text-white/50 mb-1">Available Balance</p>
        <p className="text-3xl font-bold text-white">₮{balance.toLocaleString()}</p>
        <p className="text-xs text-violet-300 mt-1">+₮5,000 just added</p>
      </div>
      <div className="space-y-2">
        {[
          { label: 'Consumer Survey', amount: '+₮5,000', time: 'just now', color: 'text-emerald-400' },
          { label: 'Brand Research', amount: '+₮3,000', time: '2h ago', color: 'text-emerald-400' },
          { label: 'Product Feedback', amount: '+₮2,000', time: 'yesterday', color: 'text-emerald-400' },
        ].map((t) => (
          <div key={t.label} className="flex items-center justify-between text-xs">
            <span className="text-white/60">{t.label}</span>
            <div className="text-right">
              <span className={cn('font-semibold', t.color)}>{t.amount}</span>
              <span className="text-white/30 ml-1.5">{t.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────────────
const PORTALS = [
  {
    id: 'respondent',
    route: ROUTES.LOGIN,
    badge: 'Respondent',
    badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
    icon: Users,
    iconBg: 'bg-sky-500/15 border-sky-500/20',
    iconColor: 'text-sky-400',
    title: 'iDap Respondent',
    subtitle: 'Earn MNT rewards by sharing your opinions on real surveys.',
    features: ['Personalized survey feed', 'Instant wallet payouts', 'QPay & Bonum withdrawal', 'Trust level progression'],
    cta: 'Join as Respondent',
    ctaClass: 'from-sky-600 to-blue-600 shadow-sky-500/20',
    stat: '12,000+ active users',
    glow: 'group-hover:shadow-sky-500/10',
    border: 'hover:border-sky-500/30',
  },
  {
    id: 'company',
    route: ROUTES.COMPANY_LOGIN,
    badge: 'Company',
    badgeBg: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
    icon: BarChart3,
    iconBg: 'bg-violet-500/15 border-violet-500/20',
    iconColor: 'text-violet-400',
    title: 'iDap Business',
    subtitle: 'Launch targeted surveys and receive quality-verified responses.',
    features: ['Drag-and-drop survey builder', 'Demographic targeting', 'Real-time analytics', 'Fraud-proof responses'],
    cta: 'Access Business Portal',
    ctaClass: 'from-violet-600 to-indigo-600 shadow-violet-500/20',
    stat: '340+ active companies',
    glow: 'group-hover:shadow-violet-500/10',
    border: 'hover:border-violet-500/30',
  },
  {
    id: 'admin',
    route: ROUTES.ADMIN_LOGIN,
    badge: 'Operator',
    badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
    icon: Shield,
    iconBg: 'bg-rose-500/15 border-rose-500/20',
    iconColor: 'text-rose-400',
    title: 'iDap Admin',
    subtitle: 'Manage companies, review fraud alerts, and process payouts.',
    features: ['Company approvals', 'Fraud detection queue', 'Payout processing', 'Platform analytics'],
    cta: 'Admin Console',
    ctaClass: 'from-rose-600 to-pink-600 shadow-rose-500/20',
    stat: 'Platform operators only',
    glow: 'group-hover:shadow-rose-500/10',
    border: 'hover:border-rose-500/30',
  },
]

export default function MarketingPage() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const statsRef = useInView()
  const respondents = useCounter(12400, 1800, statsRef.inView)
  const companies = useCounter(340, 1200, statsRef.inView)
  const surveys = useCounter(8200, 1600, statsRef.inView)
  const payouts = useCounter(186, 1400, statsRef.inView)

  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div className="min-h-screen bg-[#080811] text-white overflow-x-hidden">

      {/* ── Gradient blobs ─────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet-700/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-60 h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-purple-700/10 blur-[100px]" />
      </div>

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled ? 'bg-[#080811]/90 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'
      )}>
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/about" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-black text-white">i</div>
              <span className="text-lg font-black tracking-tight">iDap</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm text-white/60">
              <Link to="/" className="hover:text-white transition-colors font-medium text-white/80">Portals</Link>
              <a href="#how" className="hover:text-white transition-colors">How it works</a>
              <a href="#companies" className="hover:text-white transition-colors">For companies</a>
              <a href="#respondents" className="hover:text-white transition-colors">For respondents</a>
              <a href="#quality" className="hover:text-white transition-colors">Quality</a>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Sign in</Link>
            <Link to="/company/login" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors border border-white/10 rounded-lg hover:border-white/20">Company login</Link>
            <Link to="/register" className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20">
              Get started free
            </Link>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-white/60 hover:text-white">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-[#0d0d1a]/95 backdrop-blur-xl border-b border-white/5 px-6 py-4 space-y-3">
            {[
              { href: '#portals', label: 'Portals' },
              { href: '#how', label: 'How it works' },
              { href: '#companies', label: 'For companies' },
              { href: '#respondents', label: 'For respondents' },
              { href: '#quality', label: 'Quality' },
            ].map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block text-sm text-white/60 hover:text-white py-1">{l.label}</a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" className="text-center py-2.5 rounded-lg border border-white/10 text-sm text-white/70">Sign in</Link>
              <Link to="/register" className="text-center py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold">Get started free</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300 mb-8">
              <Sparkles className="h-3 w-3" />
              Mongolia's first intelligent survey platform
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6">
              Real insights from{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  real Mongolians.
                </span>
                <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-violet-500/0 via-violet-500/50 to-violet-500/0" />
              </span>
              {' '}Instantly.
            </h1>

            <p className="text-lg sm:text-xl text-white/50 leading-relaxed max-w-2xl mx-auto mb-10">
              iDap connects companies with thousands of verified Mongolian respondents.
              Launch a survey, set a budget, and receive quality-scored responses — all within hours.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="#portals"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-bold shadow-xl shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500 transition-all hover:shadow-violet-500/40 hover:-translate-y-0.5">
                Choose your portal <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#how"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 text-sm font-semibold text-white/80 hover:bg-white/5 hover:border-white/20 transition-all">
                <Play className="h-4 w-4" /> See how it works
              </a>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/30">
              {['No credit card required', '21 provinces covered', 'Free to join as respondent', 'QPay & Bonum payouts'].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-violet-500/70" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Hero cards grid */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <div className="md:translate-y-4">
              <SurveyCardMock delay={200} />
            </div>
            <div className="md:-translate-y-2">
              <QualityMock />
            </div>
            <div className="md:translate-y-6">
              <WalletMock />
            </div>
          </div>
        </div>
      </section>

      {/* ── PORTAL CHOOSER ─────────────────────────────────────────────── */}
      <section id="portals" className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">Choose your portal</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">Which one are you?</h2>
            <p className="mt-3 text-white/40 text-lg max-w-xl mx-auto">
              Three portals, one platform. Pick your role and dive right in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PORTALS.map((p) => {
              const Icon = p.icon
              return (
                <button
                  key={p.id}
                  onClick={() => navigate(p.route)}
                  className={cn(
                    'group relative flex flex-col rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-7 text-left',
                    'transition-all duration-300 hover:bg-white/6 hover:-translate-y-1.5 hover:shadow-2xl',
                    p.border, p.glow
                  )}
                >
                  {/* Badge */}
                  <div className={cn('inline-flex items-center self-start rounded-full border px-2.5 py-0.5 text-xs font-semibold mb-5', p.badgeBg)}>
                    {p.badge}
                  </div>

                  {/* Icon */}
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl border mb-5 transition-transform duration-300 group-hover:scale-110', p.iconBg)}>
                    <Icon className={cn('h-6 w-6', p.iconColor)} />
                  </div>

                  {/* Text */}
                  <h3 className="text-xl font-bold text-white mb-2">{p.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed mb-6">{p.subtitle}</p>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-white/60">
                        <CheckCircle className="h-3.5 w-3.5 shrink-0 text-white/25" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Stat */}
                  <p className="text-xs text-white/25 mb-4">{p.stat}</p>

                  {/* CTA button */}
                  <div className={cn(
                    'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold text-white',
                    'bg-gradient-to-r shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:opacity-95',
                    p.ctaClass
                  )}>
                    {p.cta}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────── */}
      <div ref={statsRef.ref} className="relative py-16 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-white/8">
            {[
              { value: respondents.toLocaleString() + '+', label: 'Registered Respondents', icon: Users },
              { value: companies + '+', label: 'Active Companies', icon: Building2 },
              { value: surveys.toLocaleString() + '+', label: 'Surveys Completed', icon: BarChart2 },
              { value: '₮' + payouts + 'M+', label: 'Rewards Paid Out', icon: DollarSign },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Icon className="h-5 w-5 text-violet-400 mb-3 opacity-70" />
                <p className="text-3xl font-black text-white mb-1">{value}</p>
                <p className="text-xs text-white/40 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section id="how" className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">Simple by design</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">How iDap works</h2>
            <p className="mt-4 text-white/40 text-lg max-w-xl mx-auto">From survey creation to quality-verified responses in hours, not weeks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Company flow */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-400">
                <Building2 className="h-3 w-3" /> For companies
              </div>
              {[
                { step: '01', title: 'Build your survey', desc: 'Use our drag-and-drop builder with 8 question types — single choice, matrix, ranking, and more. Set your demographic targets.' },
                { step: '02', title: 'Set budget & publish', desc: 'Choose reward per response, define max respondents, and fund with QPay or Bonum. Submit for instant approval.' },
                { step: '03', title: 'Receive verified responses', desc: 'Our 5-layer quality engine automatically scores every response. Only pay for responses that pass the quality threshold.' },
                { step: '04', title: 'Analyze real-time data', desc: 'View completion rates, response quality distribution, geographic breakdowns, and demographic analysis — all live.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4 group">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs font-black text-violet-400 group-hover:bg-violet-500/20 transition-colors">
                    {step}
                  </div>
                  <div className="pt-1">
                    <p className="font-bold text-white mb-1">{title}</p>
                    <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
              <Link to="/company/login" className="inline-flex items-center gap-2 mt-2 text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                Start your first survey <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Respondent flow */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
                <UserCheck className="h-3 w-3" /> For respondents
              </div>
              {[
                { step: '01', title: 'Complete your profile', desc: 'Set up your demographic profile in 4 steps. The more complete your profile, the more surveys you match — and the more you earn.' },
                { step: '02', title: 'Browse your personalized feed', desc: 'See surveys matched to your profile. Each card shows reward amount, time required, and match score so you can pick the best ones.' },
                { step: '03', title: 'Answer honestly, earn more', desc: 'High-quality responses earn more via our multiplier system (up to ×1.2). Quality responses are rewarded instantly to your wallet.' },
                { step: '04', title: 'Withdraw via QPay or Bonum', desc: 'Cash out anytime once you reach ₮10,000. Transfers process directly to your bank — no delays, no fees.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4 group">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-black text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                    {step}
                  </div>
                  <div className="pt-1">
                    <p className="font-bold text-white mb-1">{title}</p>
                    <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
              <Link to="/register" className="inline-flex items-center gap-2 mt-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                Start earning today <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR COMPANIES ──────────────────────────────────────────────── */}
      <section id="companies" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Visual */}
            <div className="relative">
              <div className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-white">Survey Analytics</p>
                    <p className="text-xs text-white/40">Consumer Preferences Study · 73 responses</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">Live</span>
                </div>
                {/* Fake chart bars */}
                <div className="flex items-end gap-2 h-28">
                  {[40, 65, 55, 80, 72, 88, 76, 93, 85, 70, 78, 90, 73].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-600/80 to-indigo-400/60"
                      style={{ height: `${h}%`, animationDelay: `${i * 50}ms` }} />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Completion rate', value: '82%', delta: '+4%', up: true },
                    { label: 'Avg quality score', value: '91', delta: '+2', up: true },
                    { label: 'Budget remaining', value: '₮135K', delta: null, up: false },
                  ].map(({ label, value, delta, up }) => (
                    <div key={label} className="rounded-xl bg-white/5 p-3">
                      <p className="text-xs text-white/40 mb-1">{label}</p>
                      <p className="text-lg font-bold text-white">{value}</p>
                      {delta && <p className={cn('text-xs font-medium', up ? 'text-emerald-400' : 'text-red-400')}>{delta}</p>}
                    </div>
                  ))}
                </div>
                {/* Province breakdown mini */}
                <div>
                  <p className="text-xs text-white/40 mb-2">Geographic reach</p>
                  <div className="space-y-1.5">
                    {[
                      { province: 'Ulaanbaatar', pct: 54 },
                      { province: 'Darkhan-Uul', pct: 18 },
                      { province: 'Erdenet', pct: 15 },
                      { province: 'Other provinces', pct: 13 },
                    ].map(({ province, pct }) => (
                      <div key={province} className="flex items-center gap-3 text-xs">
                        <span className="w-28 text-white/50 shrink-0">{province}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-indigo-400/60" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-white/40 w-8 text-right">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Copy */}
            <div className="space-y-8">
              <div>
                <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">For companies</p>
                <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                  Data-driven decisions,{' '}
                  <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                    without the wait.
                  </span>
                </h2>
                <p className="mt-4 text-white/40 text-lg leading-relaxed">
                  Mongolia's market research used to take weeks of paper surveys. iDap delivers verified responses from real consumers in hours.
                </p>
              </div>
              <div className="space-y-4">
                {[
                  { icon: Globe, title: 'Nationwide reach', desc: 'Target respondents across all 21 provinces of Mongolia with demographic precision.' },
                  { icon: ShieldCheck, title: 'Quality-guaranteed data', desc: 'Every response is scored by our 5-layer fraud detection engine. You only pay for valid data.' },
                  { icon: BarChart2, title: 'Real-time analytics', desc: 'Live dashboards with completion rates, quality distribution, and demographic breakdowns.' },
                  { icon: Zap, title: 'Launch in minutes', desc: 'Drag-and-drop survey builder with 8 question types. From idea to live in under 15 minutes.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/15">
                      <Icon className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{title}</p>
                      <p className="text-sm text-white/40 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/company/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-bold shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 transition-all">
                Launch your first survey <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR RESPONDENTS ────────────────────────────────────────────── */}
      <section id="respondents" className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Copy */}
            <div className="space-y-8 lg:order-1">
              <div>
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">For respondents</p>
                <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                  Share your opinion.{' '}
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    Earn real money.
                  </span>
                </h2>
                <p className="mt-4 text-white/40 text-lg leading-relaxed">
                  Complete surveys that match your profile and get paid directly to your wallet — withdrawable via QPay or Bonum any time.
                </p>
              </div>

              {/* Earning tiers */}
              <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-3">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Quality earns more</p>
                {[
                  { label: 'High quality response', reward: '×1.20 multiplier', color: 'text-emerald-400', bar: 'bg-emerald-400' },
                  { label: 'Good quality response', reward: '×1.10 multiplier', color: 'text-blue-400', bar: 'bg-blue-400' },
                  { label: 'Standard response', reward: '×1.00 base rate', color: 'text-white/60', bar: 'bg-white/30' },
                ].map(({ label, reward, color, bar }) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('h-2 w-2 rounded-full', bar)} />
                      <span className="text-sm text-white/70">{label}</span>
                    </div>
                    <span className={cn('text-sm font-bold shrink-0', color)}>{reward}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Star, title: 'Trust level system', desc: 'Unlock higher-paying surveys as your trust level grows from 1 to 5.' },
                  { icon: TrendingUp, title: 'Grow your earnings', desc: 'Average earner completes 12 surveys/month. Top earners make ₮150K+.' },
                  { icon: Lock, title: 'Secure payouts', desc: 'Your bank account is encrypted. Withdrawals process within 24 hours.' },
                  { icon: Globe, title: 'Available nationwide', desc: 'Join from anywhere in Mongolia — all 21 provinces participate.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-xl border border-white/8 bg-white/3 p-4">
                    <Icon className="h-5 w-5 text-emerald-400 mb-2" />
                    <p className="text-sm font-semibold text-white mb-1">{title}</p>
                    <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              <Link to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-bold shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 transition-all">
                Join free — start earning <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Visual: phone-style feed mockup */}
            <div className="lg:order-2 flex justify-center">
              <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-[#0d0d1a] p-4 space-y-3 shadow-2xl shadow-black/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-white">Survey Feed</p>
                  <span className="text-xs text-white/40">12 matches</span>
                </div>
                {[
                  { title: 'Mobile Banking Study', company: 'Khan Bank', reward: 8000, time: 6, match: 96, tag: 'Finance' },
                  { title: 'Snack Preferences', company: 'APU Group', reward: 5000, time: 4, match: 88, tag: 'FMCG' },
                  { title: 'Remote Work Survey', company: 'MCS Group', reward: 3000, time: 3, match: 79, tag: 'HR' },
                ].map(({ title, company, reward, time, match, tag }) => (
                  <div key={title} className="rounded-xl border border-white/8 bg-white/4 p-4 hover:bg-white/7 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-white leading-tight">{title}</p>
                        <p className="text-xs text-white/40 mt-0.5">{company}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-300 border border-violet-500/20">{tag}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-emerald-400">₮{reward.toLocaleString()}</span>
                        <span className="text-xs text-white/30">~{time} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-12 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-violet-400" style={{ width: `${match}%` }} />
                        </div>
                        <span className="text-xs text-violet-300 font-medium">{match}%</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/20">
                  + 9 more surveys matching your profile
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUALITY ENGINE ─────────────────────────────────────────────── */}
      <section id="quality" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/15 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">5-layer protection</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
              Quality you can{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">trust.</span>
            </h2>
            <p className="mt-4 text-white/40 text-lg max-w-2xl mx-auto">
              Every response goes through automated fraud detection before you see it. Junk data never reaches your dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {[
              { icon: Lock, title: 'Entry barriers', desc: 'Trust level gates, profile score minimums, and Cloudflare Turnstile prevent bots and unqualified respondents from the start.', num: '01' },
              { icon: ShieldCheck, title: 'Attention checks', desc: 'Sentinel questions are silently injected into surveys at varying rates based on trust level — invisible to respondents, crucial for quality.', num: '02' },
              { icon: Play, title: 'In-survey monitoring', desc: 'Response timing, tab visibility changes, scroll behavior, and device fingerprinting collected per question — without interrupting the user.', num: '03' },
              { icon: Zap, title: 'Quality scoring engine', desc: '10-factor penalty system: speed, straight-lining, position bias, attention checks, text quality, and more. Score 0–100 per response.', num: '04' },
              { icon: Star, title: 'Quality multipliers', desc: 'Respondents who consistently score high earn bonus multipliers (up to ×1.2), reinforcing honest behavior with real financial incentive.', num: '05' },
              { icon: TrendingUp, title: 'Only pay for quality', desc: 'Responses scoring below threshold are invalidated — no budget deducted, +1 warning to respondent. Companies never pay for junk data.', num: '06' },
            ].map(({ icon: Icon, title, desc, num }) => (
              <div key={title} className="rounded-2xl border border-white/8 bg-white/3 p-6 group hover:bg-white/5 hover:border-white/12 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/15 group-hover:bg-indigo-500/15 transition-colors">
                    <Icon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <span className="text-xs font-black text-white/10">{num}</span>
                </div>
                <p className="font-bold text-white mb-2">{title}</p>
                <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Penalty table excerpt */}
          <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden max-w-3xl mx-auto">
            <div className="px-6 py-4 border-b border-white/8">
              <p className="text-sm font-semibold text-white">Quality scoring — penalty system</p>
              <p className="text-xs text-white/40 mt-0.5">Starts at 100 · Penalties automatically deducted</p>
            </div>
            <div className="divide-y divide-white/5">
              {[
                { trigger: 'Total time < 30% of estimated', penalty: '−30', color: 'text-red-400' },
                { trigger: 'Straight-lining (≥5 questions, all same)', penalty: '−35', color: 'text-red-400' },
                { trigger: 'Attention check failed', penalty: '−50', color: 'text-red-400' },
                { trigger: 'Avg per question < 3 seconds', penalty: '−20', color: 'text-orange-400' },
                { trigger: 'Position bias (first choice >70%)', penalty: '−20', color: 'text-orange-400' },
                { trigger: 'Tab blur ratio > 40%', penalty: '−15', color: 'text-yellow-400' },
              ].map(({ trigger, penalty, color }) => (
                <div key={trigger} className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-white/60">{trigger}</span>
                  <span className={cn('text-sm font-bold', color)}>{penalty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST LEVELS ───────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">Progression system</p>
            <h2 className="text-4xl font-black tracking-tight">Grow your trust, earn more</h2>
            <p className="mt-3 text-white/40">Consistent quality unlocks higher-paying surveys and better multipliers.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              { level: 1, label: 'New', desc: 'Free surveys', color: 'from-gray-500 to-gray-400', dot: 'bg-gray-400' },
              { level: 2, label: 'Verified', desc: 'Low-reward surveys', color: 'from-blue-600 to-blue-400', dot: 'bg-blue-400' },
              { level: 3, label: 'Trusted', desc: 'All surveys', color: 'from-violet-600 to-violet-400', dot: 'bg-violet-400' },
              { level: 4, label: 'Premium', desc: 'Priority access', color: 'from-indigo-600 to-indigo-400', dot: 'bg-indigo-400' },
              { level: 5, label: 'Partner', desc: 'VIP-only surveys', color: 'from-amber-600 to-yellow-400', dot: 'bg-yellow-400' },
            ].map(({ level, label, desc, color, dot }) => (
              <div key={level} className="rounded-2xl border border-white/8 bg-white/3 p-5 text-center group hover:bg-white/5 transition-colors">
                <div className={cn('mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-sm font-black text-white shadow-lg', color)}>
                  {level}
                </div>
                <div className="flex justify-center gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={cn('h-1.5 w-1.5 rounded-full', i < level ? dot : 'bg-white/15')} />
                  ))}
                </div>
                <p className="font-bold text-white text-sm">{label}</p>
                <p className="text-xs text-white/40 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/60 via-indigo-950/40 to-purple-950/60 p-12 md:p-16 relative overflow-hidden">
            {/* Decorative blobs inside card */}
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

            <div className="relative">
              <Sparkles className="h-8 w-8 text-violet-400 mx-auto mb-5" />
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
                Ready to get started?
              </h2>
              <p className="text-white/50 text-lg mb-8 max-w-xl mx-auto">
                Join Mongolia's fastest-growing survey platform. Companies get real data. Respondents earn real money.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link to="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-base font-bold shadow-2xl shadow-violet-500/30 hover:from-violet-500 hover:to-indigo-500 transition-all hover:-translate-y-0.5">
                  Join as respondent <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/company/login"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/15 text-base font-semibold text-white/80 hover:bg-white/8 hover:border-white/25 transition-all">
                  <Building2 className="h-4 w-4" /> Company access
                </Link>
              </div>
              <p className="mt-6 text-xs text-white/25">No credit card required · Free to join · QPay & Bonum payouts</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-black text-white">i</div>
                <span className="font-black text-white">iDap</span>
              </div>
              <p className="text-sm text-white/30 leading-relaxed max-w-xs">
                Mongolia's intelligent survey platform connecting businesses with real consumers.
              </p>
              <p className="text-xs text-white/20 mt-4">© 2026 iDap Platform Inc. · Mongolia</p>
            </div>
            {[
              { heading: 'Platform', links: [{ label: 'Survey Feed', to: '/feed' }, { label: 'Wallet', to: '/wallet' }, { label: 'History', to: '/surveys/history' }, { label: 'Settings', to: '/settings' }] },
              { heading: 'Companies', links: [{ label: 'Dashboard', to: '/company/dashboard' }, { label: 'Build Survey', to: '/company/surveys/new' }, { label: 'Analytics', to: '/company/analytics' }, { label: 'Billing', to: '/company/billing' }] },
              { heading: 'Company', links: [{ label: 'About iDap', to: '/' }, { label: 'Privacy Policy', to: '/' }, { label: 'Terms of Service', to: '/' }, { label: 'Contact', to: '/' }] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">{heading}</p>
                <div className="space-y-2.5">
                  {links.map(({ label, to }) => (
                    <Link key={label} to={to} className="block text-sm text-white/30 hover:text-white/70 transition-colors">{label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6 text-xs text-white/20">
              <span>mn Монгол</span>
              <span>en English</span>
              <span>ko 한국어</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['Respondent Portal', 'Company Portal', 'Admin Console'].map((p, i) => (
                <Link key={p} to={i === 0 ? '/login' : i === 1 ? '/company/login' : '/admin/login'}
                  className="text-xs text-white/25 hover:text-white/50 transition-colors border border-white/8 rounded-full px-3 py-1 hover:border-white/15">
                  {p}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
