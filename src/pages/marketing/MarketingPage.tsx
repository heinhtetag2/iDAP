import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/shared/lib'
import { ROUTES } from '@/shared/config/routes'

// ─── Asset URLs (replace with local assets for production) ────────────────────
const ASSETS = {
  logo: 'https://placehold.co/60x20/0f0f0f/white?text=iDap',
  heroImage: 'https://placehold.co/1920x900/1b2333/ffffff?text=iDap+Dashboard+Preview',
  tabWallet: 'https://placehold.co/680x400/ffb199/0f0f0f?text=Wallet+Preview',
  tabTrust: 'https://placehold.co/680x400/ff764d/ffffff?text=Trust+Levels+Preview',
  testimonialAvatar1: 'https://placehold.co/254x253/ffb199/0f0f0f?text=NB',
  testimonialPreview: 'https://placehold.co/518x518/fff8f2/0f0f0f?text=Preview',
  testimonialAvatar2: 'https://placehold.co/254x253/ff764d/ffffff?text=TB',
  footerLogo: 'https://placehold.co/60x20/0f0f0f/white?text=iDap',
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Earn More', href: '#earn-more' },
    { label: 'Trust Levels', href: '#trust' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Enterprise', href: '#enterprise' },
  ]

  return (
    <nav className={cn(
      'sticky top-0 z-50 flex items-center justify-between h-20 transition-all duration-200 font-[family-name:var(--font-body)]',
      'px-5 md:px-10 xl:px-12 2xl:px-[100px]',
      scrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-white',
    )}>
      <div className="flex items-center gap-8">
        <Link to="/">
          <img src={ASSETS.logo} alt="iDap" className="h-5 w-[60px]" />
        </Link>
        <ul className="hidden lg:flex items-center gap-6">
          {links.map(l => (
            <li key={l.label}>
              <a href={l.href} className="text-sm text-[var(--color-mkt-text)] hover:text-[var(--color-accent)] transition-colors">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="hidden lg:flex items-center gap-5">
        <a href="#contact" className="text-sm text-[var(--color-mkt-text)] whitespace-nowrap">Contact us</a>
        <Link to={ROUTES.LOGIN} className="text-sm text-[var(--color-mkt-text)] whitespace-nowrap">Log in</Link>
        <Link
          to={ROUTES.REGISTER}
          className="border border-[var(--color-accent)] text-[var(--color-accent)] rounded-full px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-accent)] hover:text-white transition-colors"
        >
          Create Account
        </Link>
      </div>

      {/* Mobile menu toggle */}
      <button className="lg:hidden p-2" onClick={() => setOpen(!open)}>
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile dropdown */}
      {open && (
        <div className="absolute top-20 left-0 right-0 bg-white shadow-lg border-t lg:hidden z-50">
          <div className="flex flex-col p-6 gap-4">
            {links.map(l => (
              <a key={l.label} href={l.href} className="text-base text-[var(--color-mkt-text)] py-2" onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
            <hr className="border-[var(--color-mkt-border)]" />
            <Link to={ROUTES.LOGIN} className="text-base text-[var(--color-mkt-text)] py-2">Log in</Link>
            <Link
              to={ROUTES.REGISTER}
              className="bg-[var(--color-accent)] text-white rounded-full px-6 py-3 text-center font-medium"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Announcement Banner ─────────────────────────────────────────────────────
function AnnouncementBanner() {
  return (
    <div className="bg-[var(--color-surface-dark)] flex items-center justify-center gap-4 sm:gap-6 h-10 px-4 text-white text-sm font-[family-name:var(--font-heading)]">
      <span className="text-center text-xs sm:text-sm whitespace-nowrap">
        🎉  New: QPay withdrawal now available instantly — no waiting period
      </span>
      <button className="bg-[var(--color-accent)] rounded-lg px-3 py-1 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0">
        Withdraw now
      </button>
    </div>
  )
}

// ─── Hero Section ────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="flex flex-col items-center">
      <AnnouncementBanner />
      <Navbar />
      <div className="flex flex-col gap-10 xl:gap-20 items-center pt-16 xl:pt-40 pb-10 w-full">
        {/* Text content */}
        <div className="flex flex-col gap-6 xl:gap-10 items-center px-5 xl:px-10 w-full text-center font-[family-name:var(--font-heading)]">
          <div className="flex flex-col gap-4 items-center text-[var(--color-mkt-text)]">
            <p className="text-base">iDap</p>
            <h1 className="text-4xl sm:text-5xl xl:text-[68px] xl:leading-[72px] tracking-[-3.5px]">
              Earn real <span className="text-[var(--color-accent)]">MNT</span> by sharing
              <br />your honest opinions
            </h1>
            <p className="text-base xl:text-lg text-[var(--color-mkt-text)] max-w-[700px] leading-7 tracking-[-0.2px]">
              Join 12,000+ Mongolians earning from home. Take surveys matched to your profile, get paid
              the moment your response is verified, and withdraw to QPay anytime.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              to={ROUTES.REGISTER}
              className="bg-[var(--color-accent)] border border-[var(--color-accent)] text-white rounded-full px-5 sm:px-6 py-3 sm:py-3.5 text-base font-medium hover:opacity-90 transition-opacity"
            >
              Start Earning Free
            </Link>
            <a href="#" className="flex items-center gap-1 text-[var(--color-mkt-text)] text-base">
              Create your free account
              <ArrowRight size={16} />
            </a>
          </div>
        </div>

        {/* Hero image */}
        <div className="w-full px-5 xl:px-10">
          <div className="w-full rounded-3xl overflow-hidden aspect-[16/9] max-h-[900px]">
            <img
              src={ASSETS.heroImage}
              alt="iDap Dashboard"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Stats / Logos Section ───────────────────────────────────────────────────
function StatsSection() {
  const logos = ['ORACLE', 'DELL', '🏢', 'LG CNS', 'FUJITSU']
  return (
    <section className="flex items-center justify-center gap-8 xl:gap-16 py-10 xl:py-16 px-5 overflow-x-auto font-[family-name:var(--font-body)]">
      <p className="text-xs text-[var(--color-mkt-text-tertiary)] whitespace-nowrap hidden xl:block">
        Join 500+ companies sending surveys via iDap
      </p>
      {logos.map(logo => (
        <span key={logo} className="text-[var(--color-mkt-text)] text-lg xl:text-xl font-bold tracking-tight opacity-60 whitespace-nowrap">
          {logo}
        </span>
      ))}
    </section>
  )
}

// ─── Meet iDap Section ───────────────────────────────────────────────────────
function MeetIdapSection() {
  const features = [
    {
      title: 'Get Matched to Real Surveys',
      description: 'Our matching engine pairs you with surveys that fit your demographics, interests, and expertise — so every invitation is relevant.',
      bg: 'bg-[var(--color-surface-warm)]',
    },
    {
      title: 'Know What You Earn Upfront',
      description: 'Every survey shows the exact MNT reward and estimated time before you start. No surprises, no wasted effort.',
      bg: 'bg-[var(--color-accent-light)]',
    },
    {
      title: 'Track Every Togrog You Earn',
      description: 'Your wallet updates in real time. See pending, verified, and withdrawn amounts — all in one place.',
      bg: 'bg-[var(--color-surface-muted)]',
    },
    {
      title: 'Level Up, Earn Even More',
      description: "The more quality responses you give, the higher your Trust Level grows. Higher levels unlock premium surveys worth up to ₮15,000 each.",
      bg: 'bg-[#ffe0d6]',
    },
  ]

  return (
    <section className="flex flex-col items-center py-16 xl:py-24 px-5 xl:px-10 font-[family-name:var(--font-heading)]">
      <div className="max-w-[1380px] w-full flex flex-col gap-10 xl:gap-16">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl xl:text-5xl tracking-[-2px] text-[var(--color-mkt-text)]">
            Meet <span className="text-[var(--color-accent)]">iDap</span>
          </h2>
          <p className="text-sm xl:text-base text-[var(--color-mkt-text-secondary)] mt-2">
            Built for people who share honest opinions
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className={cn(
                'rounded-[20px] p-6 xl:p-8 flex flex-col gap-4 min-h-[280px] xl:min-h-[360px]',
                f.bg,
              )}
            >
              <h3 className="text-2xl xl:text-[32px] xl:leading-10 tracking-[-1px] text-[var(--color-mkt-text)]">
                {f.title}
              </h3>
              <p className="text-sm text-[var(--color-mkt-text)] leading-[18px] mt-auto">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How It Works Section ────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    {
      label: 'Account Verification',
      title: 'Sign Up Free',
      description: 'Create your account with your Mongolian phone number. No ID, no credit card, no setup fees — just 2 minutes.',
      bg: 'bg-white',
    },
    {
      label: 'Profile Matching',
      title: 'Complete Your Profile',
      description: 'Tell us your age, location, interests, and background. Better profile = better survey matches = more money.',
      bg: 'bg-[var(--color-surface-muted)]',
    },
    {
      label: 'Survey Feed',
      title: 'Answer Surveys',
      description: 'Browse your personal feed. Each survey shows the reward, time, and topic upfront. Answer honestly and thoroughly.',
      bg: 'bg-[var(--color-accent-light)]',
    },
    {
      label: 'QPay & Bonus',
      title: 'Withdraw Anytime',
      description: 'Cash out to QPay or Bonum wallet when your balance reaches ₮10,000. Your money, your timeline, zero hassle.',
      bg: 'bg-[var(--color-accent-mid)]',
    },
  ]

  return (
    <section id="how-it-works" className="bg-[var(--color-surface-warm)] flex flex-col items-center px-4 font-[family-name:var(--font-heading)]">
      <div className="max-w-[1380px] w-full py-8">
        <div className="flex flex-col gap-8 xl:gap-12 items-center pt-16 xl:pt-[120px]">
          <h2 className="text-3xl xl:text-5xl tracking-[-2px] text-[var(--color-mkt-text)] text-center">
            How it <span className="text-[var(--color-accent)]">works</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 w-full">
            {steps.map((step, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-[20px] p-6 flex flex-col h-[400px] xl:h-[604px]',
                  step.bg,
                )}
              >
                <div className="flex flex-col gap-4 text-[var(--color-mkt-text)]">
                  <p className="text-base leading-[22px]">{step.label}</p>
                  <h3 className="text-2xl xl:text-[32px] xl:leading-10 tracking-[-1px]">{step.title}</h3>
                </div>
                <div className="flex-1 flex items-center justify-center py-6 xl:py-9">
                  <div className="w-32 h-32 xl:w-48 xl:h-48 rounded-full border-2 border-dashed border-[var(--color-accent)]/30 flex items-center justify-center text-4xl xl:text-6xl text-[var(--color-accent)]/40 font-bold">
                    {i + 1}
                  </div>
                </div>
                <p className="text-sm text-[var(--color-mkt-text)] leading-[18px]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Tab Features Section ────────────────────────────────────────────────────
function TabFeaturesSection() {
  const [activeTab, setActiveTab] = useState(0)
  const tabs = ['Your Wallet', 'Trust Levels', 'Quality Scoring']

  const panels = [
    {
      left: {
        heading: 'Your earnings, always in reach',
        body: "Your wallet updates the moment a quality check passes. Track your balance, pending rewards, and full transaction history — then cash out whenever you want.",
      },
      right: {
        heading: 'The more you give, the more you earn',
        body: 'Your Trust Level grows with every quality response. Higher levels unlock surveys worth up to ₮15,000 each and faster reward releases.',
      },
    },
  ]

  return (
    <section id="earn-more" className="flex flex-col gap-10 xl:gap-14 items-center pt-16 xl:pt-[120px] pb-5 px-4 font-[family-name:var(--font-heading)]">
      {/* Header */}
      <div className="max-w-[1380px] w-full flex flex-col gap-4 items-center">
        <h2 className="text-3xl xl:text-5xl tracking-[-2px] text-[var(--color-mkt-text)] text-center">
          Your iDap <span className="text-[var(--color-accent)]">Experience</span>
        </h2>
        <p className="text-base xl:text-2xl text-[var(--color-mkt-text-secondary)] text-center max-w-[900px] xl:leading-8 tracking-[-0.5px]">
          Everything in iDap is designed to reward honest, consistent respondents — your time has real value here.
        </p>

        {/* Tab navigation */}
        <div className="bg-[var(--color-accent-lighter)] rounded-full flex items-center gap-2 xl:gap-4 p-2 mt-4 xl:mt-6">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={cn(
                'rounded-full px-4 xl:px-6 py-2.5 xl:py-3 text-sm xl:text-lg transition-colors whitespace-nowrap',
                activeTab === i
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10',
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab panels */}
      <div className="max-w-[1380px] w-full flex flex-col gap-5">
        {/* Panel row 1 - text left, image right */}
        <div className="flex flex-col xl:flex-row items-center justify-between gap-6 xl:gap-10 py-5">
          <div className="flex flex-col gap-4 xl:w-[534px] px-4">
            <h3 className="text-2xl xl:text-[32px] xl:leading-10 tracking-[-1px] text-[var(--color-mkt-text)]">
              {panels[0].left.heading}
            </h3>
            <p className="text-base text-[var(--color-mkt-text)] leading-[22px]">
              {panels[0].left.body}
            </p>
          </div>
          <div className="w-full xl:w-[680px] h-[250px] sm:h-[300px] xl:h-[400px] rounded-[30px] xl:rounded-[60px] overflow-hidden">
            <img
              src={ASSETS.tabWallet}
              alt="Wallet preview"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Panel row 2 - image left, text right */}
        <div className="flex flex-col-reverse xl:flex-row items-center justify-between gap-6 xl:gap-10 py-5">
          <div className="w-full xl:w-[680px] h-[250px] sm:h-[300px] xl:h-[400px] rounded-[30px] xl:rounded-[60px] overflow-hidden">
            <img
              src={ASSETS.tabTrust}
              alt="Trust levels preview"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-4 xl:w-[534px] px-4">
            <h3 className="text-2xl xl:text-[32px] xl:leading-10 tracking-[-1px] text-[var(--color-mkt-text)]">
              {panels[0].right.heading}
            </h3>
            <p className="text-base text-[var(--color-mkt-text)] leading-[22px]">
              {panels[0].right.body}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials Section ────────────────────────────────────────────────────
function TestimonialsSection() {
  const testimonials = [
    {
      quote: "I was skeptical at first, but iDap genuinely pays. I hit ₮10,000 in my first week and withdrew straight to QPay the same day. My whole department is signed up now.",
      name: 'Nominchimeg B.',
      role: 'Teacher',
      location: 'Darkhan',
      avatar: ASSETS.testimonialAvatar1,
    },
    {
      quote: "I was skeptical at first, but iDap genuinely pays. I hit ₮10,000 in my first week and withdrew straight to QPay the same day. My whole department is signed up now.",
      name: 'Nominchimeg B.',
      role: 'Teacher',
      location: 'Darkhan',
      avatar: ASSETS.testimonialAvatar2,
    },
  ]

  const [current, setCurrent] = useState(0)

  return (
    <section className="flex flex-col items-center pt-16 xl:pt-20 pb-8 xl:pb-12 px-4 xl:px-8 font-[family-name:var(--font-heading)]">
      <div className="max-w-[1380px] w-full">
        {/* Mobile: stacked layout */}
        <div className="flex flex-col xl:hidden gap-6">
          <div className="bg-[var(--color-surface-warm)] border border-[var(--color-mkt-border)] rounded-[20px] p-6">
            <h3 className="text-xl tracking-[-0.5px] text-[var(--color-mkt-text)]">Real members, real earnings</h3>
            <p className="text-sm text-[var(--color-mkt-text)] mt-1">Mongolians earning with iDap every day</p>
          </div>

          <div className="bg-white rounded-[30px] p-6 sm:p-8 shadow-sm">
            <span className="text-4xl text-[var(--color-accent-light)] font-bold">&ldquo;</span>
            <p className="text-lg tracking-[-0.5px] text-[var(--color-mkt-text)] leading-8 mt-2">
              {testimonials[current].quote}
            </p>
            <div className="mt-6">
              <p className="text-base font-medium text-[var(--color-mkt-text)]">{testimonials[current].name}</p>
              <p className="text-sm text-[var(--color-mkt-text)]">{testimonials[current].role}</p>
              <p className="text-sm text-[var(--color-mkt-text)]">{testimonials[current].location}</p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setCurrent(c => (c - 1 + testimonials.length) % testimonials.length)}
              className="bg-[var(--color-accent-light)] rounded-full p-4 text-[var(--color-mkt-text)]"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrent(c => (c + 1) % testimonials.length)}
              className="bg-[var(--color-accent-light)] rounded-full p-4 text-[var(--color-mkt-text)]"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Desktop: horizontal layout */}
        <div className="hidden xl:flex gap-3 items-center overflow-hidden">
          {/* Left panel: label + avatar */}
          <div className="flex flex-col gap-3 w-[254px] items-end shrink-0">
            <div className="bg-[var(--color-surface-warm)] border border-[var(--color-mkt-border)] rounded-[40px] p-6 w-full h-[254px]">
              <h3 className="text-2xl tracking-[-0.5px] text-[var(--color-mkt-text)] leading-8">Real members, real earnings</h3>
              <p className="text-sm text-[var(--color-mkt-text)] mt-1">Mongolians earning with iDap every day</p>
            </div>
            <div className="w-full h-[253px] rounded-[56px] overflow-hidden">
              <img
                src={testimonials[current].avatar}
                alt={testimonials[current].name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Quote card */}
          <div className="bg-white rounded-[60px] p-12 h-[518px] w-[584px] flex flex-col justify-between shrink-0 shadow-sm">
            <div>
              <span className="text-5xl text-[var(--color-accent-light)] font-bold leading-[48px]">&ldquo;</span>
              <p className="text-2xl tracking-[-0.5px] text-[var(--color-mkt-text)] leading-8 mt-4">
                {testimonials[current].quote}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-lg text-[var(--color-mkt-text)]">{testimonials[current].name}</p>
              <p className="text-sm text-[var(--color-mkt-text)]">{testimonials[current].role}</p>
              <p className="text-sm text-[var(--color-mkt-text)]">{testimonials[current].location}</p>
            </div>
          </div>

          {/* Navigation block */}
          <div className="relative size-[518px] shrink-0">
            <div className="absolute inset-0 rounded-[60px] overflow-hidden">
              <img src={ASSETS.testimonialPreview} alt="" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-1/2 w-[253px] h-[253px] rounded-[56px] overflow-hidden">
                <img src={testimonials[(current + 1) % testimonials.length].avatar} alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            <button
              onClick={() => setCurrent(c => (c + 1) % testimonials.length)}
              className="absolute top-0 right-0 bg-[var(--color-accent-light)] rounded-[70px] size-[259px] overflow-hidden flex items-end cursor-pointer"
            >
              <div className="flex items-end justify-between w-full p-8">
                <div className="text-base text-[var(--color-mkt-text)] text-left leading-[22px]">
                  <p>Next</p>
                  <p>Testimonial</p>
                </div>
                <ChevronRight size={24} />
              </div>
            </button>

            <button
              onClick={() => setCurrent(c => (c - 1 + testimonials.length) % testimonials.length)}
              className="absolute bottom-0 left-0 bg-[var(--color-accent-light)] rounded-[70px] size-[259px] overflow-hidden flex items-end cursor-pointer"
            >
              <div className="flex items-end justify-between w-full p-8">
                <ChevronLeft size={24} />
                <div className="text-base text-[var(--color-mkt-text)] text-right leading-[22px]">
                  <p>Previous</p>
                  <p>Testimonial</p>
                </div>
              </div>
            </button>
          </div>

          {/* Second quote card for wide screens */}
          <div className="bg-white rounded-[60px] p-12 h-[518px] w-[584px] flex-col justify-between shrink-0 shadow-sm hidden 2xl:flex">
            <div>
              <span className="text-5xl text-[var(--color-accent-light)] font-bold leading-[48px]">&ldquo;</span>
              <p className="text-2xl tracking-[-0.5px] text-[var(--color-mkt-text)] leading-8 mt-4">
                {testimonials[(current + 1) % testimonials.length].quote}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-lg text-[var(--color-mkt-text)]">{testimonials[(current + 1) % testimonials.length].name}</p>
              <p className="text-sm text-[var(--color-mkt-text)]">{testimonials[(current + 1) % testimonials.length].role}</p>
              <p className="text-sm text-[var(--color-mkt-text)]">{testimonials[(current + 1) % testimonials.length].location}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── For Companies Section ───────────────────────────────────────────────────
function ForCompaniesSection() {
  const stats = [
    { label: 'Manage survey panels', value: '0' },
    { label: 'Registered respondents', value: '90,000' },
    { label: 'Responses delivered', value: '800,000' },
  ]

  const cards = [
    {
      title: 'Survey Builder',
      description: 'Design targeted surveys with our drag-and-drop builder.',
    },
    {
      title: 'Analytics Dashboard',
      description: 'Real-time insights with response quality metrics.',
    },
    {
      title: 'Respondent Network',
      description: "90,000+ verified Mongolians segmented by demographics.",
    },
    {
      title: 'Quality Assurance',
      description: 'AI-powered fraud detection ensures genuine responses.',
    },
  ]

  return (
    <section id="enterprise" className="flex flex-col items-center px-4 xl:px-6 py-8 xl:py-12 font-[family-name:var(--font-heading)]">
      <div className="bg-white rounded-[24px] xl:rounded-[46px] max-w-[1380px] w-full px-6 xl:px-16 py-8">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 xl:gap-8 mb-8 xl:mb-12">
          <div>
            <h2 className="text-3xl xl:text-5xl tracking-[-2px] text-[var(--color-mkt-text)]">
              Want to <span className="text-[var(--color-accent)]">survey</span> Mongolia?
            </h2>
            <p className="text-base text-[var(--color-mkt-text-secondary)] mt-2">
              Access 90,000+ verified respondents across all 21 provinces.
            </p>
          </div>
          <div className="flex gap-3">
            <a href="#" className="bg-[var(--color-mkt-text)] text-white rounded-full px-5 py-3 text-sm font-medium whitespace-nowrap">
              Schedule Demo
            </a>
            <a href="#" className="border border-[var(--color-mkt-border)] text-[var(--color-mkt-text)] rounded-full px-5 py-3 text-sm font-medium whitespace-nowrap">
              Enterprise Pricing
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 xl:gap-6 mb-8 xl:mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="text-center py-4">
              <p className="text-3xl xl:text-4xl font-bold text-[var(--color-mkt-text)] tracking-[-1px]">{stat.value}</p>
              <p className="text-sm text-[var(--color-mkt-text-secondary)] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {cards.map((card, i) => (
            <div
              key={i}
              className="bg-[var(--color-surface-warm)] rounded-[20px] p-5 xl:p-6 flex flex-col gap-3"
            >
              <h4 className="text-lg xl:text-xl tracking-[-0.5px] text-[var(--color-mkt-text)]">{card.title}</h4>
              <p className="text-sm text-[var(--color-mkt-text-secondary)] leading-5">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  const columns = [
    {
      title: 'For Respondents',
      links: ['Survey Feed', 'How it Works', 'Trust Levels'],
    },
    {
      title: 'For Companies',
      links: ['Survey Builder', 'Analytics', 'Respondent Network', 'Pricing', 'Contact Sales'],
    },
    {
      title: 'Resources',
      links: ['Help Center', 'Blog'],
    },
    {
      title: 'Company',
      links: ['About iDap', 'Privacy Policy', 'Terms of Use'],
    },
  ]

  return (
    <footer className="flex flex-col gap-6 items-center px-5 xl:px-10 py-12 xl:py-20 font-[family-name:var(--font-heading)]">
      <div className="max-w-[1380px] w-full">
        <div className="flex flex-col xl:flex-row xl:justify-between gap-10 xl:gap-0">
          {/* Left: logo + newsletter */}
          <div className="flex flex-col gap-6 xl:gap-9 xl:w-[388px]">
            <div className="flex flex-col gap-6">
              <img src={ASSETS.footerLogo} alt="iDap" className="h-5 w-[60px]" />
              <p className="text-base text-[var(--color-accent)]">Stay in the loop with iDap.</p>
              <p className="text-xs text-[var(--color-mkt-text-tertiary)] leading-[14px]">
                Stay up to date with platform news,<br />
                new features, and earning tips.
              </p>
            </div>
            <div className="flex items-center border-b border-[var(--color-mkt-text)] pb-2 w-full max-w-[325px]">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 text-sm text-[var(--color-mkt-text-secondary)] bg-transparent outline-none placeholder:text-[var(--color-mkt-text-secondary)]"
              />
              <button className="ml-2 text-[var(--color-mkt-text)]">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Right: link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 xl:gap-0 xl:w-[888px] xl:justify-between">
            {columns.map(col => (
              <div key={col.title} className="flex flex-col gap-6 xl:gap-8 xl:w-[210px]">
                <p className="text-base font-medium text-[var(--color-mkt-text)]">{col.title}</p>
                <div className="flex flex-col gap-3">
                  {col.links.map(link => (
                    <a key={link} href="#" className="text-sm text-[var(--color-mkt-text)] hover:text-[var(--color-accent)] transition-colors">
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social icons */}
        <div className="flex flex-col items-end pt-20 xl:pt-40">
          <div className="flex gap-4">
            {['Li', 'Di', 'X', 'Su'].map(s => (
              <a key={s} href="#" className="size-5 rounded flex items-center justify-center text-[10px] text-[var(--color-mkt-text)] opacity-60 hover:opacity-100 transition-opacity">
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="max-w-[1380px] w-full flex flex-wrap items-center justify-end gap-3 text-xs text-[var(--color-mkt-text)]">
        <span>iDap © 2026</span>
        <a href="#" className="hover:text-[var(--color-accent)]">Privacy</a>
        <a href="#" className="hover:text-[var(--color-accent)]">Terms of Use</a>
        <a href="#" className="hover:text-[var(--color-accent)]">Cookie Policy</a>
        <a href="#" className="hover:text-[var(--color-accent)]">Manage Cookies</a>
        <span>English</span>
      </div>
    </footer>
  )
}

// ─── Main Marketing Page ─────────────────────────────────────────────────────
export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <StatsSection />
      <MeetIdapSection />
      <HowItWorksSection />
      <TabFeaturesSection />
      <TestimonialsSection />
      <ForCompaniesSection />
      <Footer />
    </div>
  )
}
