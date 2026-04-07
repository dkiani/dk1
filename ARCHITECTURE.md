# ARCHITECTURE.md — Single Source of Truth

> **Last updated**: 2026-04-07
>
> This document is the canonical reference for both Claude sessions (dashboard repo and trading journal repo).
> **Rule**: Any meaningful architectural change (new collection, rule, hosting site, env var, service, deploy target, dependency) MUST update this file in the same commit.

---

## Firebase Project

- **Project ID**: `kianivc`
- **Console**: https://console.firebase.google.com/project/kianivc
- **Services in use**: Firestore, Firebase Auth, Firebase Hosting, Cloud Functions, Firebase Storage
- **Admin UID** (hardcoded in rules): `Tt3oWfwFdnZi75Zvc5WlYNwcXjM2`
- **Dynamic admin list**: `admin/config` document → `adminUIDs` array

---

## Repositories

### 1. Dashboard Repo — `~/dk1/` (this repo)

The main kiani.vc repo. Contains the marketing site, student dashboard, curriculum, and Firebase/Firestore config.

**NOT** the trading journal — the `trading-journal/` directory in this repo is an **abandoned old attempt** and is not deployed anywhere.

### 2. Trading Journal Repo — `~/kiani-journal/` (separate repo)

The production trading journal app. Maintained in a **separate Claude chat** — do not modify from the dashboard repo session. If changes are needed, flag to the user.

---

## Hosting & Domains

| Domain | Platform | Target / Site ID | Source |
|---|---|---|---|
| `kiani.vc` | Firebase Hosting | `main` → site `kianivc` | `~/dk1/` (repo root, static HTML) |
| `dashboard.kiani.vc` | Firebase Hosting | `dashboard` → site `kianivc-dashboard` | `~/dk1/dashboard/` |
| `trade.kiani.vc` | Firebase Hosting | site `kiani-trade` (`kiani-trade.web.app`) | `~/kiani-journal/` |

### Redirects (firebase.json in dk1)

- `kiani.vc/dashboard` → `https://dashboard.kiani.vc` (301)
- `kiani.vc/dashboard/**` → `https://dashboard.kiani.vc` (301)

---

## Dashboard Repo Structure (`~/dk1/`)

```
dk1/
├── index.html                  # kiani.vc landing page (static)
├── firebase.json               # Hosting targets + Firestore config
├── .firebaserc                 # Project & target mappings
├── firestore.rules             # Security rules (shared across all apps)
├── firestore.indexes.json      # Firestore indexes
├── vercel.json                 # Legacy Vercel redirects (kiani.vc)
├── ARCHITECTURE.md             # ← This file
│
├── dashboard/                  # dashboard.kiani.vc (Firebase Hosting)
│   ├── index.html
│   └── curriculum/
│
├── trading-journal/            # ⚠️ ABANDONED — old Next.js attempt, not deployed
│
├── curriculum/                 # Shared curriculum content
├── apply/                      # Application page (static)
├── onboarding/                 # Onboarding flow (static)
├── start/                      # Getting started page (static)
├── terms/                      # Terms of service (static)
├── journey/                    # Student journey page (static)
├── ready/                      # Ready page (static)
├── responses/                  # Response templates (static)
└── images/                     # Shared image assets
```

### Deploy Commands (dk1)

```bash
# Deploy main site (kiani.vc)
firebase deploy --only hosting:main

# Deploy dashboard (dashboard.kiani.vc)
firebase deploy --only hosting:dashboard

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy everything
firebase deploy
```

---

## Trading Journal (`~/kiani-journal/`) — Separate Repo

> **Maintained in a separate Claude chat.** Do not modify from the dashboard session.

### Stack

- **Framework**: Vite + React (single-file architecture)
- **Main files**: `src/App.jsx`, `src/firebase.js`
- **Deploy target**: Firebase Hosting site `kiani-trade`
- **Custom domain**: `trade.kiani.vc` → CNAME → `kiani-trade.web.app`

### Cloud Function — `coachK`

- **Location**: `~/kiani-journal/functions/`
- **Type**: HTTP function (publicly invokable via Cloud Run)
- **Purpose**: Proxies requests to the Anthropic API for AI coaching
- **Function URL**: `https://coachk-yt7qiavpiq-uc.a.run.app`
- **API key**: Stored as Firebase secret `ANTHROPIC_API_KEY` (set via `firebase functions:secrets:set`)
- **Access**: Must remain publicly invokable in Cloud Run

### Firebase Project

Same as everything else — `kianivc`

---

## Firestore Collections

| Collection | Owner | Used By | Purpose |
|---|---|---|---|
| `users/{userId}` | Per-user | Both apps | User profiles, subscription info, `products` field |
| `users/{userId}/journal/{entryId}` | Per-user | Trading journal | Journal entries |
| `users/{userId}/journal_trades/{tradeId}` | Per-user | Trading journal (`trade.kiani.vc`) | Individual trade records |
| `trades/{tradeId}` | Per-user (`userId` field) | Dashboard app (abandoned) | Trade documents (legacy) |
| `journalEntries/{entryId}` | Per-user (`userId` field) | Dashboard app (abandoned) | Journal entries (legacy) |
| `admin/{docId}` | Admin only | Dashboard | Admin config (read-only via rules, write via Console) |

### `products` Field Schema (`users/{userId}.products`)

| Key | Type | Set By | Read By | Purpose |
|---|---|---|---|---|
| `curriculum` | `boolean` | Admin (dashboard) | Dashboard | Gates access to the trading curriculum |
| `innerCircle` | `boolean` | Admin (dashboard) | Trading journal (`trade.kiani.vc`) | Gates the $69/mo "Inner Journal" pricing tier on the paywall. `true` = user sees the discounted Inner Circle pricing. Defaults to `false`/undefined. **Does NOT grant journal access on its own** — `products.journal: true` is still required for that. Inner Circle only unlocks the discounted pricing tier. |
| `journal` | `boolean` | (TBD — Stripe/admin) | Trading journal (`trade.kiani.vc`) | Gates access to the trading journal app |

### Security Rules Summary (`firestore.rules`)

- **users/{userId}**: Owner can read/create/update (but not `products` field). Admins can read and update all. The `products` field protection covers all keys (`curriculum`, `innerCircle`, `journal`, etc.) — no rule changes needed when adding new product flags.
- **users/{userId}/journal/{entryId}**: Owner can read/write. Admins can read.
- **users/{userId}/journal_trades/{tradeId}**: Owner can read/write. Admins can read.
- **trades/{tradeId}**: Owner (matched by `userId` field) can CRUD. Admins can read.
- **journalEntries/{entryId}**: Owner (matched by `userId` field) can CRUD. Admins can read.
- **admin/{docId}**: Admins can read. No writes (Console only).

### Admin Access

1. Hardcoded UID: `Tt3oWfwFdnZi75Zvc5WlYNwcXjM2`
2. Dynamic: any UID listed in `admin/config.adminUIDs` array

---

## Authentication

- **Provider**: Firebase Auth
- **Methods**: Email/password, Google OAuth
- **Auth domain**: Default Firebase auth domain for project `kianivc`
- **User creation flow**: On first sign-in, a `users/{uid}` document is created in Firestore

---

## Environment Variables

### Dashboard Repo (`~/dk1/`)

No `.env` file — static HTML sites don't need env vars. Firebase config is in `firebase.json` / `.firebaserc`.

### Trading Journal (`~/kiani-journal/`)

Firebase client config is embedded in `src/firebase.js`. The Cloud Function uses:

| Variable | Location | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Firebase secret (`firebase functions:secrets:set`) | Anthropic API key for `coachK` function |

---

## Key Decisions & Context

1. **Two repos, one Firebase project**: `~/dk1/` and `~/kiani-journal/` both deploy to Firebase project `kianivc` but are maintained independently.
2. **Two Claude sessions**: Dashboard repo changes happen in one Claude chat; trading journal changes happen in another. Neither should modify the other's codebase.
3. **`trading-journal/` directory is dead**: The Next.js app at `~/dk1/trading-journal/` was an abandoned attempt. The real trading journal is at `~/kiani-journal/` using Vite + React on Firebase Hosting.
4. **ARCHITECTURE.md is the sync mechanism**: At the start of each session, paste this file as the first message to give Claude full context.
5. **Firestore rules are shared**: `firestore.rules` in `~/dk1/` covers all collections used by both apps. Deploy with `firebase deploy --only firestore:rules` from `~/dk1/`.

---

## Change Log

| Date | Change | Commit |
|---|---|---|
| 2026-04-07 | Created ARCHITECTURE.md as single source of truth | _(initial)_ |
| 2026-04-07 | Added `products.innerCircle` field, admin panel Inner Circle controls | _(this commit)_ |
