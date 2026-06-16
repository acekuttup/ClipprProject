# Clipper — Membership & Premium System Plan

## Session context
Last updated: June 16, 2026
Repo: https://github.com/acekuttup/ClipprProject
Live URL: https://clipprproject.vercel.app

---

## What was completed this session

- Splash screen on every app launch (animated logo reveal)
- Walkthrough steps 3 & 4 now switch to the correct tab before highlighting
- Financial color consistency: income = green (text-success), expenses = red (text-destructive)
- Schedule C PDF fully redesigned (professional multi-section report)
- CSV export now includes metadata header (business, year, totals)
- Free badge in header is now clickable → opens premium modal
- Premium member card added to Settings (visible to subscribers only)

---

## Current premium state (what's broken / fake)

| Item | Status |
|---|---|
| `store.user?.isPremium` boolean in localStorage | Fake — resets on clear, no real source of truth |
| "Upgrade" button sets `isPremium: true` locally | Zero payment, anyone can unlock everything |
| No trial tracking | 7-day trial UI exists but never actually expires |
| No subscription management screen | Can't cancel, view billing date, or change plan |
| No cross-device sync | localStorage only — lose premium on new phone |
| Receipt photos ungated | Bug — should be premium only |
| Mileage logging ungated | Bug — should be premium only |

---

## Subscription tiers

### Free
- Log income + expenses manually
- History + search
- Monthly goal tracker
- Booth rent auto-logging
- CSV export
- 7-day data retention export

### Premium — $8.99/mo or $79/yr (save 27%)
- Everything in Free, plus:
- Schedule C PDF export (professional)
- Receipt photo vault
- Auto trip detection (mileage)
- Bank sync (Cash App / Venmo / Zelle)
- 1099-K reconciliation
- Annual tax summary
- Priority support

---

## Implementation plan

### 1. Payment — Stripe
Since this is a PWA (no App Store), Stripe Checkout is the right path.

Needs:
- Vercel serverless functions:
  - `POST /api/create-checkout-session` — creates a Stripe session and returns a URL
  - `POST /api/webhook` — Stripe sends subscription events here (created, cancelled, expired)
  - `GET /api/subscription-status?userId=X` — app checks status on load
- Store on user record: `subscriptionId`, `status`, `currentPeriodEnd`, `planType`
- On app load: verify subscription against server, update local state
- Stripe test keys to start — flip to live keys when ready

### 2. Trial management
- On "Start free trial" tap: record `trialStartedAt` timestamp in store
- Trial = 7 days from `trialStartedAt`
- After expiry: show "Your trial has ended" state, gate features again
- Show "X days remaining" badge on upgrade banner during active trial

### 3. Feature gating — consistent hook
Create `usePremiumFeature(featureName)` hook:
- Returns `{ locked: boolean, prompt: () => void }`
- Every premium touch point uses this single hook
- If locked → tap shows premium modal automatically
- Centralizes logic so tier changes only need one edit

Features to audit and gate:
- Schedule C PDF ✓ already gated
- CSV export → stays FREE (confirmed)
- Receipt photos → needs gate added (bug)
- Mileage logging → needs gate added (bug)
- Bank sync ✓ already gated
- 1099-K reconciliation ✓ already gated
- Auto trip detection ✓ already gated

### 4. Membership management screen (Settings)
**Free users see:**
- Side-by-side Free vs Premium comparison card
- Monthly / Annual pricing toggle with savings callout
- "Start 7-day free trial" CTA

**Premium users see (replaces upgrade banner):**
- Subscription status + next renewal date
- Plan name: Monthly or Annual
- Last 4 digits of card on file
- "Manage billing" → Stripe Customer Portal link
- "Cancel subscription" with confirmation sheet
- Invoice history

### 5. PremiumModal redesign
- Monthly / Annual toggle at top with live price update
- Feature comparison list (what you get vs what you have now)
- Trust line: "Cancel anytime · Secure payment via Stripe"
- Primary CTA: "Start 7-day free trial"
- Secondary: "Maybe later"

---

## Questions to confirm before building

1. **Real payments via Stripe?**
   Needs a backend (Vercel serverless functions + Stripe keys).
   We can wire up with test keys first — no real money until you flip to live.

2. **CSV export stays free?**
   Current assumption: yes, CSV is free. PDF is the premium hook.

3. **Gate receipt photos and mileage logging for premium?**
   Both are currently ungated (bug). Confirm before locking them.

---

## Files to touch when building

| File | Change |
|---|---|
| `src/components/clipper/PremiumModal.tsx` | Full redesign + toggle |
| `src/components/clipper/SettingsScreen.tsx` | Membership management section |
| `src/lib/clipper-store.ts` | Add `subscriptionId`, `trialStartedAt`, `currentPeriodEnd` to store type |
| `src/hooks/usePremiumFeature.ts` | New file — unified feature gate hook |
| `src/components/clipper/LogModals.tsx` | Gate receipt photo behind premium |
| `src/components/clipper/ClipperApp.tsx` | Gate mileage logging behind premium |
| `api/create-checkout-session.ts` | New Vercel serverless function |
| `api/webhook.ts` | New Vercel serverless function |
| `api/subscription-status.ts` | New Vercel serverless function |
