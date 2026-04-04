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

## Design System — KIANI Design System

This app follows the KIANI design system. Reference: kiani.vc/curriculum. **Do not deviate from this.**

### Colors (Dark Mode — DEFAULT)
- Background: `#0a0a0a` (near black)
- Surface/Cards: `#141414` (slightly lighter)
- Surface Hover: `#1a1a1a`
- Border: `#222222` (subtle, 1px)
- Text Primary: `#e8e8e8` (off-white)
- Text Secondary: `#888888` (muted grey)
- Text Tertiary/Muted: `#555555`
- Accent: `#e85d3a` (KIANI orange/coral — used sparingly)
- Accent Hover: `#f06a47`
- Green: `#4caf50` (wins)
- Red: `#e85d3a` or `#cf4436` (losses)
- Yellow: `#d4a843` (breakeven/caution)

### Colors (Light Mode — toggled)
- Background: `#fafafa`
- Surface/Cards: `#ffffff`
- Border: `#e0e0e0`
- Text Primary: `#1a1a1a`
- Text Secondary: `#666666`
- Accent: same `#e85d3a`

### Typography
- Font: `'IBM Plex Mono', monospace` — for EVERYTHING. No sans-serif.
- Page titles: `1.5rem`, font-weight 500
- Section headers / stat labels: `0.7rem`, uppercase, `letter-spacing: 0.12em`, text-secondary
- Body text: `0.85rem`, line-height 1.7
- Stat values (big numbers): `1.8rem`, font-weight 600
- Navigation items: `0.8rem`
- Small labels/hints: `0.7rem`
- Table header labels: `0.65rem`, uppercase, `letter-spacing: 0.1em`
- **NEVER** use font-weight 700/800/900. Max is 600, used sparingly.

### Spacing & Layout
- Sidebar: `260px` fixed, same bg as main, separated by 1px border-right
- Content area: `max-width: 900px`, `px-12 py-8` padding
- Card padding: `p-6` (1.5rem)
- Card border-radius: `6px` (`rounded-[6px]`)
- Card borders: `1px solid border`, NO box-shadows
- Gap between stat cards: `gap-4` (1rem)
- Section spacing: `mb-8` (2rem between major sections)

### Sidebar Design
- Logo: orange dot `●` + "TRADING JOURNAL" in `0.7rem`, `tracking-[0.15em]`, uppercase
- User email in text-muted, `0.7rem`
- Nav items: `0.8rem`, active = accent text + `bg-bg-surface-hover` + 2px left border
- Icons: 14px Lucide icons
- Bottom: Dark/Light toggle + Sign Out in text-muted

### Buttons
- Primary: `bg-accent text-white`, `0.75rem uppercase tracking-[0.1em]`, `rounded-[4px]`, NO shadow
- Secondary: transparent bg, `1px border`, text-secondary
- Hover: subtle, 150ms transitions max

### Stats Cards (Dashboard)
- 3 cards in a row: WIN RATE, PROFIT FACTOR, TRADING DAYS
- Surface bg, 1px border, 6px radius
- Label: `0.65rem` uppercase, `tracking-[0.12em]`, text-secondary
- Value: `1.8rem`, font-weight 600
- Sub-label: `0.7rem`, text-muted
- Icon in top-right, 14px, text-muted
- NO colored card backgrounds

### Trade Log / Table
- Subtle 1px bottom border per row
- Header: `0.65rem` uppercase, `tracking-[0.1em]`, text-secondary
- Cells: `0.8rem`, text-primary
- No alternating row backgrounds
- P&L values colored green/red

### Forms / Inputs
- Input bg: `bg-bg-input` (`#1a1a1a`), 1px border, `rounded-[4px]`
- Text: `0.8rem`, monospace
- Labels: `0.65rem` uppercase, `tracking-[0.1em]`, text-secondary, ABOVE input
- Focus: border changes to accent, no glow
- Padding: `px-3 py-2.5`

### Calendar
- Monthly grid, surface bg cells, 1px borders
- Colored dots (green/red/yellow) for trade days
- Current day: accent ring/border
- Nav: `"← Month Year →"` simple arrows

### Animations & Transitions
- 150ms max transitions
- No bouncing, sliding, or spring animations
- Simple fade (100ms) for page transitions

### General Rules — STRICT
- **NO** box-shadows anywhere
- **NO** gradients
- **NO** border-radius > 8px
- **NO** colored container backgrounds (only dots, badges, buttons)
- **NO** JetBrains Mono (replaced by IBM Plex Mono)
- **NO** font-semibold/bold (max font-weight: 600)
- Aesthetic: Bloomberg terminal × minimalist. Dense but clean.
- When in doubt, use LESS visual weight

### CSS Variable Mapping (Tailwind)
```
bg-bg-primary     → var(--bg-primary)
bg-bg-surface     → var(--bg-surface)
bg-bg-surface-hover → var(--bg-surface-hover)
bg-bg-input       → var(--bg-input)
text-text-primary  → var(--text-primary)
text-text-secondary → var(--text-secondary)
text-text-muted    → var(--text-muted)
border-border      → var(--border)
border-border-hover → var(--border-hover)
text-accent / bg-accent → var(--accent)
text-green / bg-green → var(--green)
text-red / bg-red → var(--red)
```

## Bugs Fixed

- **Dashboard redirect hijack**: The root `vercel.json` has a redirect sending `/dashboard/*` to `dashboard.kiani.vc` (for the main kiani.vc site). When we copied it into `trading-journal/vercel.json`, it hijacked the trading journal's own `/dashboard` route. Fix: `trading-journal/vercel.json` should be empty `{}`.
- **Layout width bug**: Content area was stuck at ~350px instead of filling available space. Caused by using `flex` container with a `fixed` sidebar — the flex layout was collapsing main. Fix: removed flex container, use simple `ml-[260px]` on main with `max-w-[900px]` inner container.

## Current Status

- App is scaffolded and built with all core pages
- Firebase Auth with Google + email/password is implemented
- Firestore CRUD for trades and journal entries is implemented
- Stripe subscription scaffolding exists but keys are not configured yet
- AI analysis route exists but ANTHROPIC_API_KEY is empty
- Screenshot upload is placeholder (URLs only, no actual upload to Storage yet)
- Tradovate integration is marked "coming soon"
- App is deployed on Vercel with Google sign-in working
- **Design system fully overhauled** to match kiani.vc/curriculum (IBM Plex Mono, dark mode default, KIANI color tokens)

## Change Log

> **IMPORTANT**: Continue logging all updates and context changes in this file. Every significant change, bug fix, design decision, or architectural update should be documented here so context is never lost between sessions.

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
