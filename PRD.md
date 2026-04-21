# iDap — Product Requirements Document
## Intelligent Data Analytics Platform

> A reward-based survey platform connecting Mongolian businesses with everyday respondents.
> Companies post surveys + budget. Users answer, get paid in MNT (₮).
> Core value: replace paper surveys with a fully digital, fraud-proof, quality-scored pipeline.

---

## 1. At a glance

| | |
|---|---|
| **Product** | iDap (Intelligent Data Analytics Platform) |
| **Market** | Mongolia — Ulaanbaatar first, nationwide after |
| **Currency** | MNT — Mongolian Tögrög (₮) |
| **Languages** | Mongolian (Cyrillic) default · English / Korean optional |
| **Domains** | `idap.mn` · `api.idap.mn` · `files.idap.mn` |
| **Version** | 1.0.0 |

---

## 2. Who uses it (the 4 portals)

The app opens on a **Portal Chooser** (`/`) with 4 cards. This is the front door:

### 🟦 Respondent — `iDap Respondent`
Individual users earning MNT by answering surveys.
- Personalized survey feed (matched to profile)
- Instant wallet payouts
- QPay & Bonum withdrawals
- Trust Level progression (1 → 5)
- Entry: `/auth/register/respondent` · Dashboard: `/respondent/*`

### 🟪 Company — `iDap Business`
Businesses launching surveys and collecting quality-verified responses.
- Drag-and-drop survey builder (`@dnd-kit`)
- Demographic targeting
- Real-time analytics dashboard
- Fraud-proof responses (quality-scored)
- Business verification required
- Entry: `/auth/register/company` · Dashboard: `/client/*`

### 🟥 Admin — `iDap Admin`
Platform operators.
- Company approvals
- Fraud detection queue (Sentinel)
- Payout processing
- Platform-wide analytics
- Roles: `super_admin`, `operator`, `viewer`
- Dashboard: `/admin/*`

### 🟩 Website — `iDap Website`
Public marketing site (no login). Product overview, how it works, pricing, "For companies" / "For respondents".

---

## 3. Core business rules

### 3.1 Platform fee
- Default: **4.00%** of every company top-up
- Range: 0–20%
- Per-company override supported (`company_fee_overrides` table)
- Applied at **charge time**, snapshotted on each payment
- Priority: company override → platform default → hardcoded 4% fallback

### 3.2 Reward logic
- Per-survey reward: **₮0 – ₮100,000**
- Hold window: **24h** pending quality review
- Quality gating:

  | Score | Outcome |
  |---|---|
  | **≥ 80** | Paid instantly |
  | **50–79** | Held 24h, then auto-paid |
  | **20–49** | **Invalidated** — no budget deducted, user gets warning +1 |
  | **0–19** | Account flagged for suspension, admin alerted |

### 3.3 Withdrawals
- Minimum: **₮10,000**
- Gateways: **QPay**, **Bonum**
- Async processing via Bull Queue
- No withdrawal fee

### 3.4 Trust Levels (respondent progression)

| Lvl | Label | Access | Min responses | Min avg quality |
|---|---|---|---|---|
| 1 | Newcomer | Free surveys only | 0 | — |
| 2 | Verified | + low-reward | 3 | 75 |
| 3 | Trusted | All surveys | 10 | 80 |
| 4 | Elite | Priority placement | 30 | 85 |
| 5 | Partner | VIP-only surveys | 100 | 90 |

### 3.5 Quality reward multipliers
Rolling average quality determines payout multiplier:

| Avg score | Multiplier |
|---|---|
| ≥ 90 | **× 1.20** |
| ≥ 85 | × 1.10 |
| ≥ 80 | × 1.00 (base) |
| ≥ 75 | × 0.90 |
| < 75 | × 0.80 |

---

## 4. Tech stack

### Frontend (this repo — `idap-client/`)
- **React 19** + **TypeScript 5.9** + **Vite 8**
- Architecture: **Feature-Sliced Design (FSD)** — `app / pages / widgets / features / entities / shared`
- UI: **Radix UI** primitives + **Tailwind CSS v4**
- Server state: **TanStack Query v5**
- Client state: **Zustand v5**
- Forms: **react-hook-form + Zod**
- DnD: **@dnd-kit** (survey builder)
- Routing: **react-router v7**
- i18n: **react-i18next**
- Mock API: **MSW** (for prototype mode)

### Backend (separate repo)
- **Node.js 20 LTS** + Express + TypeScript
- Raw SQL via `node-postgres` (no ORM, by policy)
- Zod validation everywhere
- JWT auth · bcrypt (12 rounds) · AES-256-GCM for PII

### Data layer
- **PostgreSQL 16** (primary + read replica)
- **Redis 7** (cache, sessions, Bull queues)
- Migrations: `node-pg-migrate`

### Infra
- Contabo VPS (6–12 vCPU, 16–48 GB RAM)
- Docker Compose + PM2 + Nginx
- Cloudflare: Pages, Tunnel, WAF, Turnstile (captcha), R2 (object storage)
- Sentry + UptimeRobot
- GitHub Actions → GHCR → VPS

### External services
- Payments: **QPay**, **Bonum**
- Push: Firebase FCM
- Email: SendGrid
- SMS: Mobicom / Unitel (Mongolia)

---

## 5. What's in this repo (`idap-client/`)

### Page inventory

```
src/pages/
├── platform-select/   ← Portal chooser (the / landing)
├── auth/              ← Login / register for all roles
├── profile-setup/     ← Respondent onboarding
│
├── survey-feed/       ← Respondent: matched survey list
├── survey-detail/     ← Survey preview before starting
├── survey-player/     ← Answer-taking UI
├── survey-complete/   ← Reward confirmation
├── survey-history/    ← Past responses
│
├── wallet/            ← Balance, withdraw, earnings
├── wallet-history/    ← Transaction log
├── notifications/     ← Respondent notifications
├── settings/          ← Profile, language, preferences
│
├── company/
│   ├── dashboard/     ← Company home — KPIs, active surveys
│   ├── surveys/       ← List + drag-drop builder
│   ├── analytics/     ← Charts, segments, export
│   ├── billing/       ← Top-ups, invoices, fee history
│   ├── notifications/
│   ├── settings/
│   └── login/
│
├── admin/
│   ├── dashboard/     ← Platform KPIs
│   ├── companies/     ← Approval queue, fee overrides
│   ├── respondents/   ← User management, trust levels
│   ├── surveys/       ← All surveys oversight
│   ├── fraud/         ← Sentinel fraud queue
│   ├── payouts/       ← Withdrawal processing
│   ├── notifications/
│   ├── settings/
│   └── login/
│
└── marketing/         ← /about — public marketing page
```

### Key shared modules
- `shared/config/routes.ts` — all route constants
- `shared/lib/` — cn(), formatters, hooks
- `shared/ui/` — Radix-wrapped primitives (Button, Dialog, etc.)
- `entities/` — domain types (user, survey, wallet, …)
- `features/` — cross-page actions (start-survey, withdraw, approve-company, …)
- `widgets/` — composite UI blocks (survey-card, wallet-balance, …)

---

## 6. Quality system (Sentinel)

Every response runs through fraud/quality checks before reward is granted:

1. **Speeding** — per-question dwell time vs. expected
2. **Straight-lining** — same answer across matrix questions
3. **Contradiction detection** — conflicting answers to anchor pairs
4. **Gibberish** — open-text NLP checks
5. **Device / IP fingerprint** — multi-account detection
6. **Attention checks** — embedded in long surveys

Score → determines the reward-release path from §3.2.

---

## 7. Roadmap signals

- **v1.0** (current): 4 portals live, MNT wallet, QPay/Bonum, FSD frontend, quality gating
- **Next**:
  - VIP/Partner-tier exclusive survey pool
  - Company self-serve API + webhooks
  - Offline paper-survey OCR ingestion (the original "digitize paper" pitch)
  - Regional expansion beyond Ulaanbaatar

---

## 8. Running locally

```bash
cd idap-client
npm install
npm run dev            # → http://localhost:5174
```

Open `/` → Portal Chooser → pick a role → dashboard prototype.

Mock API runs via MSW — no backend needed for UI review.

---

*Source of truth: `iDAP_PLATFORM_SPEC.md` (v1.0, 2547 lines). This PRD is the human-readable summary.*
