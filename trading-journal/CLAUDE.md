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
- **Deploying to Vercel with Google sign-in working is the current priority**
