@AGENTS.md

# Trading Journal - Project Context

## What This Is

A standalone Next.js trading journal app for Daniel Kiani's students (and eventually a standalone paid product). It lives at `journal.kiani.vc` and is part of the broader kiani.vc ecosystem. The main kiani.vc site is a static site deployed via Firebase Hosting; this trading journal is a separate Next.js app deployed on **Vercel**.

## Repo Structure

This is a **monorepo**. The trading journal lives in `/trading-journal/` alongside the main kiani.vc static site files (HTML, images, etc.) at the repo root.

```
dk1/
├── index.html              # Main kiani.vc static site (Firebase Hosting)
├── dashboard/              # Student dashboard (Firebase Hosting)
├── firebase.json           # Firebase config for static site hosting
├── firestore.rules         # Firestore security rules
├── vercel.json             # Redirects /dashboard/* -> dashboard.kiani.vc
└── trading-journal/        # <-- THIS PROJECT (Next.js on Vercel)
    ├── vercel.json          # Also needs to be here (Vercel Root Directory = trading-journal)
    ├── src/
    │   ├── app/
    │   │   ├── login/       # Auth page (email/password + Google OAuth)
    │   │   ├── subscribe/   # Subscription pricing page
    │   │   ├── (app)/       # Protected routes (auth guard in layout.tsx)
    │   │   │   ├── dashboard/
    │   │   │   ├── journal/
    │   │   │   ├── calendar/
    │   │   │   └── settings/
    │   │   └── api/
    │   │       ├── ai/analyze/   # Claude API trade analysis (premium)
    │   │       └── stripe/       # Checkout, portal, webhook routes
    │   ├── components/
    │   │   ├── providers.tsx     # Auth + Theme context providers
    │   │   └── layout/sidebar.tsx
    │   ├── lib/
    │   │   ├── firebase.ts       # Client SDK init
    │   │   ├── firebase-admin.ts # Admin SDK (server-side)
    │   │   ├── auth-context.ts   # Auth context type
    │   │   ├── trades.ts         # Firestore trade CRUD
    │   │   ├── journal.ts        # Firestore journal CRUD
    │   │   ├── stripe.ts         # Stripe client + plan defs
    │   │   └── theme.ts          # Theme context
    │   └── types/index.ts
    └── .env.local               # Firebase + Stripe + Anthropic keys
```

## Deployment

- **Platform**: Vercel
- **Vercel Root Directory**: `trading-journal` (set in Vercel project settings)
- **Domain**: `journal.kiani.vc`
- **Framework**: Next.js (auto-detected)
- **Important**: `vercel.json` must exist inside `trading-journal/` since that's the root directory Vercel uses. The one at the repo root is for the separate kiani.vc Vercel project.

### Environment Variables Needed in Vercel

All of these must be set in Vercel > Project Settings > Environment Variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN       (kianivc.firebaseapp.com)
NEXT_PUBLIC_FIREBASE_PROJECT_ID        (kianivc)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_ADMIN_PROJECT_ID              (kianivc)
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_STUDENT_PRICE_ID
STRIPE_PREMIUM_PRICE_ID
ANTHROPIC_API_KEY
```

### Google Sign-In Requirements

For Google OAuth (`signInWithPopup`) to work on the deployed site:
1. The deployment domain (`journal.kiani.vc` and any `*.vercel.app` preview URLs) must be added to **Firebase Console > Authentication > Settings > Authorized domains**
2. Google sign-in provider must be enabled in **Firebase Console > Authentication > Sign-in method**
3. All `NEXT_PUBLIC_FIREBASE_*` env vars must be set in Vercel

## Tech Stack

- **Framework**: Next.js 16 + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 + CSS variables for theming (dark/light)
- **Font**: IBM Plex Mono (Google Fonts import in globals.css)
- **Auth**: Firebase Auth (email/password + Google OAuth) - NOT NextAuth (installed but unused)
- **Database**: Firestore (project: `kianivc`)
- **Storage**: Firebase Storage (for chart screenshots)
- **Payments**: Stripe (two tiers: Student $49/mo, Premium $249/mo)
- **AI**: Anthropic Claude API (premium tier trade analysis)
- **Icons**: Lucide React

## Firebase Project

- **Project ID**: `kianivc`
- **Shared** with the main kiani.vc site
- **Collections**: `users`, `trades`, `journalEntries`
- **Journal entry limit**: 1000 per user (was 50, bumped)

## Auth Flow

1. User visits `/login`
2. Signs in via Google popup or email/password
3. On first sign-in, a `users` doc is created in Firestore (subscription: "free")
4. Redirected to `/dashboard`
5. All `/(app)/*` routes are protected by auth guard in `(app)/layout.tsx`
6. `providers.tsx` listens to `onAuthStateChanged()` and provides auth context app-wide

## Product Vision

- **Target audience**: Daniel's trading students (free access), then general public (paid)
- **Inspired by**: Tradezella and similar trading journals
- **Core features (MVP)**: Trade logging, chart screenshot uploads, prop firm journal uploads, P&L calendar, AI trade review agent
- **Future**: Tradovate API integration (auto-import trades), analytics dashboard, rule tracking
- **Business model**: Free tier for students, Student tier ($49/mo), Premium tier ($249/mo) with AI agent coaching

## Design System — KIANI JOURNAL (Premium Dark Fintech)

Premium dark fintech dashboard. Glassmorphism cards on deep dark background. Teal/cyan data accents. Bloomberg Terminal meets luxury crypto dashboard.

### Color Palette
- **Backgrounds (layered depth)**: `#060b14` base, `#0c1220` surface, `#111827` hover, `#141c2e` elevated, `#0a1018` inputs
- **Borders**: `rgba(255,255,255,0.06)` default, `rgba(255,255,255,0.12)` hover, `rgba(56,224,207,0.3)` active (teal glow)
- **Text**: `#e8ecf1` primary, `#8a94a6` secondary, `#4a5568` tertiary
- **Accent Teal**: `#38e0cf` — primary data color (charts, highlights, active states)
- **Accent Orange**: `#e85d3a` — CTA buttons, brand moments (use sparingly)
- **Semantic**: `#22c55e` wins, `#ef4444` losses, `#eab308` breakeven
- **Chart**: `#38e0cf` line, `rgba(56,224,207,0.08)` area fill, `rgba(255,255,255,0.04)` grid

### Typography
- **Two fonts**: Inter (headings, UI text) + IBM Plex Mono (data, numbers, labels, code)
- Page titles: Inter 600, 1.25rem
- Body text: Inter 400, 0.875rem
- Stat values: IBM Plex Mono 600, 1.75rem
- Labels: IBM Plex Mono 400, 0.7rem, uppercase, letter-spacing 0.1em
- Table data: IBM Plex Mono 400, 0.85rem
- CSS utility classes: `.text-h1`, `.text-h2`, `.text-stat-value`, `.text-label`, `.text-data`, `.text-body`, `.text-small`

### Component Patterns
- **Cards**: `.journal-card` class — glassmorphism, 14px radius, subtle teal glow on hover
- **Stat Cards**: icon (teal, 18px top-left) → label (mono uppercase) → value (large mono) → trend
- **Buttons**: Primary = orange bg, white text, `--radius-sm`. Teal pills for chart toggles
- **Inputs**: `--bg-input` bg, mono font, teal focus border with teal dim ring
- **Tables**: mono font data, 1px borders, hover bg, colored P&L, grade pills

### Layout
- Sidebar: 240px fixed left (was 260px), collapses to hamburger on mobile
- Content: `max-width: 1200px` (wider for data dashboard), 2rem padding
- Grid: auto-fit stat cards, 1rem gap. 2rem between sections
- Mobile responsive at 768px breakpoint

### Navigation
- Logo: orange dot + "KIANI" in mono uppercase
- Sections: "NAVIGATION" (Dashboard, Journal, New Trade, Calendar) + "APPS" (Chart Review, Coach K, Settings)
- Active: teal dim bg, teal left border, text-primary
- Icons: Lucide React, 18px

### Animations
- `fadeInUp` 400ms on cards with 60ms stagger
- `pulse-subtle` for loading states
- 150ms transitions, no bouncing/spring

### Key Design Rules
- NO default library styles — custom style everything
- Grade pills: A+ = teal, A = green, B = yellow, C/D = red
- Direction indicators: ▲ green for long, ▼ red for short
- Equity curve: Recharts AreaChart, teal line, gradient fill
- Empty states: clean and inviting with prominent CTA

### CSS Variable Mapping (Tailwind)
```
bg-bg-primary       → var(--bg-base)
bg-bg-surface       → var(--bg-surface)
bg-bg-surface-hover → var(--bg-surface-hover)
bg-bg-elevated      → var(--bg-elevated)
bg-bg-input         → var(--bg-input)
text-text-primary   → var(--text-primary)
text-text-secondary → var(--text-secondary)
text-text-tertiary  → var(--text-tertiary)
text-accent-teal    → var(--accent-teal)
bg-accent-teal-dim  → var(--accent-teal-dim)
border-border       → var(--border-primary)
border-border-hover → var(--border-hover)
text-accent / bg-accent → var(--accent-orange)
text-green / bg-green   → var(--color-win)
text-red / bg-red       → var(--color-loss)
```

## Bugs Fixed

- **Dashboard redirect hijack**: The root `vercel.json` has a redirect sending `/dashboard/*` to `dashboard.kiani.vc` (for the main kiani.vc site). When we copied it into `trading-journal/vercel.json`, it hijacked the trading journal's own `/dashboard` route. Fix: `trading-journal/vercel.json` should be empty `{}`.
- **Layout width bug**: Content area was stuck at ~350px instead of filling available space. Caused by using `flex` container with a `fixed` sidebar — the flex layout was collapsing main. Fix: removed flex container, use simple `ml-[260px]` on main with `max-w-[900px]` inner container.

## Current Status

- **Phase 1 complete**: Premium dark fintech design system, all core pages rebuilt
- Firebase Auth with Google + email/password is implemented
- Firestore CRUD for trades and journal entries is implemented
- Stripe subscription scaffolding exists but keys are not configured yet
- AI vision-based chart review with streaming SSE is implemented
- Screenshot upload is placeholder (URLs only, no actual upload to Storage yet)
- Tradovate integration is marked "coming soon"
- App is deployed on Vercel with Google sign-in working
- **Design system**: Premium dark fintech (KIANI JOURNAL theme) — Inter + IBM Plex Mono, teal/cyan accents, glassmorphism cards, equity curve with Recharts
- **New features**: Equity curve chart, setup grade/session/SL/TP fields, CSV export, advanced filters, mobile responsive sidebar, Coach K + Chart Review stub pages

## Change Log

> **IMPORTANT**: Continue logging all updates and context changes in this file. Every significant change, bug fix, design decision, or architectural update should be documented here so context is never lost between sessions.

### 2026-04-04 — KIANI JOURNAL Premium Dark Fintech Rebuild (Phase 1)
- **Complete design system overhaul**: Moved from minimalist monospace to premium dark fintech aesthetic
- **New design tokens**: Deep navy backgrounds (#060b14), teal/cyan accents (#38e0cf), glassmorphism cards, layered depth system
- **Dual fonts**: Inter for UI text + IBM Plex Mono for data/numbers/labels (was mono-only before)
- **New components**: `.journal-card` with hover glow, `.text-stat-value`, `.text-label`, `.text-data` utility classes
- **Dashboard rebuilt**: 4 stat cards (Avg Win, Avg Loss, Win Rate, Risk Reward), equity curve with Recharts, recent trades table with grade pills
- **Sidebar redesigned**: 240px (was 260px), two nav sections (Navigation + Apps), teal active state, mobile hamburger menu
- **Trade form expanded**: New fields — Stop Loss, Take Profit, Session, Setup Type, Setup Grade, Account
- **Trade table enhanced**: Advanced filters (Result, Session, Grade), CSV export, summary bar
- **Calendar improved**: Click day to expand trades, Mon-start week, selected day highlight
- **Settings redesigned**: Trading defaults, risk management, data export/delete sections
- **New routes**: `/journal/review` (stub), `/journal/coach` (stub) for Phase 2-3
- **Types updated**: Added `stopLoss`, `takeProfit`, `pnlTicks`, `result`, `setupType`, `setupGrade`, `session`, `account` to Trade interface
- **Mobile responsive**: Sidebar collapses at 768px, cards stack vertically
- **Dependencies**: Added `recharts` for equity curve chart
- **Files changed**: globals.css, layout.tsx (root + app), sidebar.tsx, types/index.ts, dashboard, journal/new, journal/trades, journal/[id], calendar, settings + 2 new pages — 13 files total

### 2026-04-04 — Complete Design System Overhaul v2
- **Problem**: Previous design overhaul still used wrong font (JetBrains Mono), wrong colors, wrong spacing, and had a broken layout (content stuck at 350px due to flex container bug with fixed sidebar)
- **Root cause**: Flex layout with `fixed` sidebar caused main content to collapse. Design tokens didn't match the actual kiani.vc/curriculum system.
- **Changes made**:
  - Switched from JetBrains Mono to IBM Plex Mono (Google Fonts import)
  - Dark mode is now DEFAULT (was light)
  - New color tokens: `#0a0a0a` bg, `#141414` surface, `#222222` border, `#e8e8e8` text, `#e85d3a` accent
  - Fixed layout: removed flex container, simple `ml-[260px]` with `max-w-[900px]`
  - Sidebar: 260px, same bg as page, 1px border-right, orange dot logo
  - Dashboard: 3 stat cards (Win Rate, Profit Factor, Trading Days), 1.8rem values
  - All pages: consistent `1.5rem` page titles, `0.65rem` uppercase labels, 6px border-radius
  - Forms: `0.8rem` input text, 4px radius, surface bg inputs
  - Calendar: colored dots instead of colored cell backgrounds
  - Login: Tailwind classes (removed inline CSS)
  - All transitions: 150ms max
  - Removed all box-shadows, removed all font-bold/semibold (max 600)
- **Files changed**: globals.css, layout.tsx (root + app), sidebar.tsx, providers.tsx, dashboard, journal, journal/new, journal/[id], calendar, settings, login, subscribe — 12 files total
