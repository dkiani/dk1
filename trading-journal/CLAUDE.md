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

## Design System — Matching kiani.vc/curriculum Quality

The trading journal must match the exact design quality and aesthetic of the `/curriculum` page on kiani.vc. This is the gold standard for all UI work.

### Core Design Principles (from curriculum)
1. **No box shadows** — completely flat design, hierarchy comes from borders only
2. **3px border radius** — `rounded-[3px]` everywhere, never `rounded-md` or `rounded-lg`
3. **Font weight 300** (light) as default body weight, 500 (medium) for headings/labels
4. **Never use `font-semibold` (600) or `font-bold` (700)** — too heavy for this aesthetic
5. **Precise px-based sizing** — `text-[11px]`, `text-[12px]`, `text-[13px]` not Tailwind defaults
6. **JetBrains Mono** monospace font throughout
7. **Custom easing** — `cubic-bezier(0.16, 1, 0.3, 1)` for all major transitions
8. **Transitions**: `0.3s` default, `0.2s` for list items, `0.5s` for major state changes
9. **Labels**: `text-[10px] uppercase tracking-[0.06em] font-medium text-text-muted`
10. **Content max-width**: `720px` (matching curriculum main content area)
11. **Sidebar width**: `280px` (matching curriculum sidebar at standard breakpoint)
12. **Warm color palette**: `#e85d2a` accent (rust orange), beige backgrounds in light mode, true blacks in dark mode

### CSS Variable System
- Light: `--bg-primary: #f0ede8`, `--bg-card: #ffffff`, `--bg-tertiary: #f7f5f2`, `--bg-input: #f0ede8`
- Dark: `--bg-primary: #0a0a0a`, `--bg-card: #111111`, `--bg-tertiary: #181818`, `--bg-input: #0a0a0a`
- These match the curriculum's exact color tokens

### What NOT To Do
- No `rounded-lg` or `rounded-md` anywhere
- No `box-shadow` or `var(--shadow)` — removed from the design system entirely
- No `font-semibold` or `font-bold` — use `font-medium` (500) max
- No `text-lg` or `text-xl` for page titles — use `text-[13px] font-medium`
- No thick borders (`border-2`) — always `border` (1px)
- No `bg-bg-secondary` for card backgrounds — use `bg-bg-card`

## Bugs Fixed

- **Dashboard redirect hijack**: The root `vercel.json` has a redirect sending `/dashboard/*` to `dashboard.kiani.vc` (for the main kiani.vc site). When we copied it into `trading-journal/vercel.json`, it hijacked the trading journal's own `/dashboard` route. Fix: `trading-journal/vercel.json` should be empty `{}` — it does NOT need the same redirects as the main site.

## Current Status

- App is scaffolded and built with all core pages
- Firebase Auth with Google + email/password is implemented
- Firestore CRUD for trades and journal entries is implemented
- Stripe subscription scaffolding exists but keys are not configured yet
- AI analysis route exists but ANTHROPIC_API_KEY is empty
- Screenshot upload is placeholder (URLs only, no actual upload to Storage yet)
- Tradovate integration is marked "coming soon"
- App is deployed on Vercel with Google sign-in working

## Change Log

> **IMPORTANT**: Continue logging all updates and context changes in this file. Every significant change, bug fix, design decision, or architectural update should be documented here so context is never lost between sessions.

### 2026-04-04 — Design System Overhaul (match /curriculum quality)
- **Problem**: The trading journal UI looked low-quality compared to the curriculum page — rounded corners too large (8px), box shadows making it look soft, font weights too heavy (semibold/bold), content area too narrow (840px), sidebar too wide (256px)
- **Root cause**: Used generic Tailwind classes (`rounded-lg`, `rounded-md`, `font-semibold`) instead of the precise, minimal design language from the curriculum
- **Changes made**:
  - `globals.css`: Removed all `--shadow` variables, changed `--bg-tertiary` to match curriculum (`#f7f5f2` light / `#181818` dark), changed `--bg-input` to match curriculum (`#f0ede8` light / `#0a0a0a` dark), added `--ease` CSS variable, added Firefox scrollbar styling
  - `sidebar.tsx`: Changed width from `w-64` (256px) to `w-[280px]` (matching curriculum sidebar), changed font weights to `font-light` for nav items
  - `(app)/layout.tsx`: Changed `ml-64` to `ml-[280px]`, added `min-w-0` to prevent flex overflow
  - `dashboard/page.tsx`: Removed `box-shadow`, changed `max-w-[840px]` → `max-w-[720px]`, changed all `rounded-md/lg` → `rounded-[3px]`, changed title from `text-sm` to `text-[13px]`, changed value font from `text-lg` to `text-[18px]`
  - `journal/page.tsx`: Changed `max-w-5xl` → `max-w-[720px]`, title to `text-[13px]`
  - `journal/new/page.tsx`: All `rounded-md` → `rounded-[3px]`, all `font-semibold` → `font-medium`, extracted shared input/label classes, `border-2 border-dashed` → `border border-dashed`, title to `text-[13px]`
  - `journal/[id]/page.tsx`: All `rounded-lg` → `rounded-[3px]`, all `font-semibold` → `font-medium`, `text-lg` → `text-[13px]`, `text-2xl` → `text-[24px]`, P&L banner given border instead of just bg
  - `settings/page.tsx`: All `rounded-lg` → `rounded-[3px]`, all `font-semibold` → `font-medium`, `text-lg` → `text-[13px]`, all `text-xs` → precise px sizes, toggle switch sizing tightened
  - `calendar/page.tsx`: `max-w-5xl` → `max-w-[720px]`, title to `text-[13px]`
  - `subscribe/page.tsx`: All `rounded-lg/md` → `rounded-[3px]`, all `font-semibold/bold` → `font-medium`, matched pricing card style to curriculum paywall design, brand dot matches sidebar dot
- **Files changed**: 10 files across the entire UI layer
- **Result**: Every page now uses consistent 3px radius, no shadows, light font weights, precise sizing — identical design language to /curriculum
