# ARCHITECTURE.md — Single Source of Truth

> **Last updated**: 2026-04-08
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

- **Location**: `~/kiani-journal/functions/index.js`
- **Type**: HTTP function (2nd gen, Cloud Run), public invoker (allUsers)
- **Runtime**: Node.js 24
- **Purpose**: Proxies requests to the Anthropic API for AI coaching
- **Function URL**: `https://coachk-yt7qiavpiq-uc.a.run.app`
- **API key**: Stored as Firebase secret `ANTHROPIC_API_KEY` (set via `firebase functions:secrets:set`)
- **Region**: `us-central1`

#### Authentication (added 2026-04-07)

The function now **requires a valid Firebase ID token** in the `Authorization: Bearer <token>` header. Requests without a token or with an invalid/expired token return `401`. The token is verified via `admin.auth().verifyIdToken()`.

**Any non-journal-repo client** that was hitting the `coachK` URL is now broken until updated to pass an ID token. If the dashboard or any other surface ever calls Coach K, it must send an ID token.

#### Authorization & Usage Cap

After token verification, the function:
1. Reads `users/{uid}` from Firestore to get `products.journal`, `stripePriceId`, and `coachKUsage`
2. Returns `403` if the user doesn't have `products.journal === true` AND isn't an admin
3. Determines whether the user is "unlimited":
   - Admins → unlimited
   - `stripePriceId === "price_1TJSIeBF92YC6aePISdAceUU"` ($169 Inner Journal Unlimited) → unlimited
   - Anyone else → capped at **200 messages/month**
4. If capped and current usage >= 200, returns `429 { error: "monthly_cap_reached", message: "...", usage: { count, cap, month } }`
5. Otherwise, calls Anthropic, then increments `coachKUsage.count` (resetting to 1 if the month string has changed)
6. Returns the Anthropic response with an additional top-level `_usage` field: `{ count, cap, month, unlimited }`

**Month boundary**: Cap resets are calendar month in UTC, not rolling 30 days, not user-local timezone.

#### Constants in the function

```js
const ADMIN_UIDS = ["Tt3oWfwFdnZi75Zvc5WlYNwcXjM2"];
const INNER_JOURNAL_UNLIMITED_PRICE_ID = "price_1TJSIeBF92YC6aePISdAceUU";
const COACH_K_MONTHLY_CAP = 200;
```

If the price ID for the unlimited tier ever changes, this constant needs to be updated. (Future: move to a Firestore config doc so it can be updated without redeploying.)

### Cloud Function — `stripeWebhook` (added 2026-04-07)

- **Location**: `~/kiani-journal/functions/index.js`
- **Type**: HTTP function (2nd gen), public invoker (allUsers)
- **Runtime**: Node.js 24
- **Function URL**: `https://us-central1-kianivc.cloudfunctions.net/stripeWebhook`
- **Region**: `us-central1`
- **Purpose**: Auto-grants and revokes journal access on Stripe payment lifecycle events. Replaces the manual admin-panel toggle workflow.

#### Stripe Events

| Event | Trigger |
|---|---|
| `checkout.session.completed` | User completes a Stripe Checkout payment |
| `customer.subscription.deleted` | Subscription is canceled (immediately or at period end) |

Signing secret stored in Firebase secret `STRIPE_WEBHOOK_SECRET`. Live mode endpoint registered in Stripe dashboard.

#### On `checkout.session.completed`

1. Verifies the Stripe signature against `STRIPE_WEBHOOK_SECRET`
2. Reads `client_reference_id` from the session (this is the Firebase UID, passed via the paywall — see below)
3. Calls `stripe.checkout.sessions.retrieve()` with `expand: ["line_items"]` to get the price ID
4. Writes to `users/{uid}` via `set({}, { merge: true })`:
   - `products.journal: true`
   - `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`
   - `journalActivatedAt: serverTimestamp`
5. Returns `200 { received: true }`

#### On `customer.subscription.deleted`

1. Verifies the Stripe signature
2. Looks up the user by `stripeCustomerId` (querying `users` collection, limit 1)
3. Writes `products.journal: false` and `journalRevokedAt: serverTimestamp`
4. **Does NOT delete** `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`, or `journalActivatedAt` — preserved as historical record
5. Returns `200 { received: true }`

#### Defensive behaviors

- If `client_reference_id` is missing on a checkout event, logs the error and returns `200` (prevents infinite Stripe retries — failure recoverable from logs)
- All Stripe/Firestore errors caught, logged, returned as `500` (Stripe retries per standard backoff)

#### Frontend integration (paywall)

The paywall in `~/kiani-journal/src/App.jsx` appends `?client_reference_id=${user.uid}` to Stripe payment links. This carries the Firebase UID through Stripe Checkout to the webhook. **Without this, the webhook cannot match the payment to a Firebase user.**

#### Known issue: idempotency on webhook resends

Manually resending a `checkout.session.completed` event from the Stripe dashboard will re-grant access **even if the subscription has since been canceled**. **Fix (deferred):** before granting access, check whether the `stripeSubscriptionId` is still active via `stripe.subscriptions.retrieve()` and confirm `status === 'active'`, or compare the event timestamp against any existing `journalRevokedAt`.

### New `firebase.js` exports (journal repo)

```js
// ID token for authenticated Cloud Function calls
export const getIdToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  return await user.getIdToken();
};
```

The existing `incrementCoachUsage(uid)` and `getCoachUsage(uid)` helpers are now actively used by the `CoachK` component (were stubbed before, fully wired now).

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
| `journal` | `boolean` | `stripeWebhook` (primary), admin panel (manual override) | Trading journal (`trade.kiani.vc`) | Gates access to the trading journal app. Set `true` by webhook on checkout, `false` on subscription cancellation. Admin overrides and webhook updates can race — webhook is "ground truth". |

### Stripe & Usage Fields on `users/{uid}` (added 2026-04-07)

These fields appear after the relevant lifecycle event fires. None are required.

| Field | Type | Set by | Description |
|---|---|---|---|
| `stripeCustomerId` | string | `stripeWebhook` on checkout | Stripe customer ID, e.g. `cus_UlKmHQxtU8KtJP` |
| `stripeSubscriptionId` | string | `stripeWebhook` on checkout | Stripe subscription ID |
| `stripePriceId` | string | `stripeWebhook` on checkout | Stripe price ID — distinguishes $69 vs $169 tier |
| `journalActivatedAt` | timestamp | `stripeWebhook` on checkout | When journal access was granted |
| `journalRevokedAt` | timestamp | `stripeWebhook` on subscription deletion | When journal access was revoked |
| `coachKUsage` | map | `coachK` function on each successful call | `{ month: "YYYY-MM", count: <int> }` |

### Security Rules Summary (`firestore.rules`)

- **users/{userId}**: Owner can read/create/update (but not `products` field). Admins can read and update all. The `products` field protection covers all keys (`curriculum`, `innerCircle`, `journal`, etc.) — no rule changes needed when adding new product flags.
- **users/{userId}/journal/{entryId}**: Owner can read/write. Admins can read.
- **users/{userId}/journal_trades/{tradeId}**: Owner can read/write. Admins can read.
- **trades/{tradeId}**: Owner (matched by `userId` field) can CRUD. Admins can read.
- **journalEntries/{entryId}**: Owner (matched by `userId` field) can CRUD. Admins can read.
- **admin/{docId}**: Admins can read. No writes (Console only).

> **Note**: The `stripeWebhook` and `coachK` Cloud Functions write via `firebase-admin` SDK, which **bypasses Firestore security rules**. This is intentional — security rules govern client writes; Cloud Functions are server-side privileged code.

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

| Secret | Location | Used by | Purpose |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Firebase secret (`firebase functions:secrets:set`) | `coachK` | Anthropic API key for AI coaching |
| `STRIPE_SECRET_KEY` | Firebase secret | `stripeWebhook` | Live mode `sk_live_...` (was rotated 2026-04-07 after a screenshot leak) |
| `STRIPE_WEBHOOK_SECRET` | Firebase secret | `stripeWebhook` | Live mode `whsec_...` from the registered webhook endpoint |

---

## Known Issues (as of 2026-04-08)

### Dashboard bugs (observed during journal testing)

1. **Admin panel: "Failed to load users"** — When signing into `dashboard.kiani.vc` as admin, the admin panel shows "Failed to load users." instead of the user list. The All / With Access / Inner Circle filters don't load. Probably a Firestore query issue or recent rules change — this was working when originally built, so it's a regression.

2. **Dashboard doesn't surface "KIANI Journal" as a product** — When a user has `products.journal: true`, the "Your Products" section only shows "Trading Curriculum." Need to add a "KIANI Journal" product card linking to `https://trade.kiani.vc`, only rendered when `products.journal === true`. Now important because the webhook automation means more users will get journal access without touching the admin panel.

### Webhook idempotency bug

Manually resending a `checkout.session.completed` event from Stripe dashboard re-grants access even if the subscription has since been canceled. See the `stripeWebhook` section above for the deferred fix plan.

---

## Key Decisions & Context

1. **Two repos, one Firebase project**: `~/dk1/` and `~/kiani-journal/` both deploy to Firebase project `kianivc` but are maintained independently.
2. **Two Claude sessions**: Dashboard repo changes happen in one Claude chat; trading journal changes happen in another. Neither should modify the other's codebase.
3. **`trading-journal/` directory is dead**: The Next.js app at `~/dk1/trading-journal/` was an abandoned attempt. The real trading journal is at `~/kiani-journal/` using Vite + React on Firebase Hosting.
4. **ARCHITECTURE.md is the sync mechanism**: At the start of each session, paste this file as the first message to give Claude full context.
5. **Firestore rules are shared**: `firestore.rules` in `~/dk1/` covers all collections used by both apps. Deploy with `firebase deploy --only firestore:rules` from `~/dk1/`.
6. **Stripe webhook is ground truth for journal access**: User pays → Stripe Checkout → webhook fires → Firestore updated → access granted/revoked automatically. Admin panel toggles still work but should be rare — the webhook is the authoritative source.
7. **Coach K requires authentication**: All callers must pass a Firebase ID token. Usage is tracked per-user per calendar month with a 200/month cap for $69 tier users.

---

## Change Log

| Date | Change | Commit |
|---|---|---|
| 2026-04-07 | Created ARCHITECTURE.md as single source of truth | _(initial)_ |
| 2026-04-07 | Added `products.innerCircle` field, admin panel Inner Circle controls | _(this commit)_ |
| 2026-04-08 | Merged journal repo updates: `stripeWebhook` function, `coachK` auth + usage caps, new Firestore fields, new secrets, known issues | _(this commit)_ |
| 2026-04-08 | Added KIANI Journal product card to dashboard | _(this commit)_ |
