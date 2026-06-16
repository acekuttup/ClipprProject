# Barber's Ledger — Bug & UX Fix Plan

**Status:** Analysis complete. Ready to implement.
**Last updated:** 2026-06-15

---

## What Was Built (Session Summary)

All 10 features were implemented and verified with a live browser smoke test. The build is clean (`tsc --noEmit` + `bun run build` both pass). Dev server at `http://192.168.68.54:8080`.

Features added:
- History: tap-to-edit/delete, search bar, All/Income/Expense filter chips
- Expenses: real receipt photo capture with thumbnail preview
- Booth rent: auto-logging on weekly/monthly schedule, config in Settings
- Taxes: past-year selector, real CSV export, real Schedule C PDF (premium-gated)
- Home: monthly income goal progress bar + weekly recharts bar chart
- Settings: monthly income goal modal, JSON backup/restore buttons

---

## Confirmed Bugs (user-reported)

### BUG 1 — Sheet has no scroll (HIGH PRIORITY)
**Root cause:** `Sheet` component in `src/components/clipper/LogModals.tsx` line 60
```jsx
<div className="w-full card-luxe rounded-b-none p-5 pb-8 animate-in slide-in-from-bottom duration-300">
```
No `max-h` and no `overflow-y-auto`. When sheet content is taller than the viewport, it overflows off the top of the screen and the user cannot scroll to see or interact with fields above the numpad.

**Affects:**
- Edit Expense modal (Activity tab) — category grid + description + photo + numpad + buttons is ~800px+ on iPhone. You land on the numpad and can't scroll up to change category/description/photo.
- Booth Rent modal (Settings tab) — amount + 3 freq buttons + 7 day buttons + toggle + numpad + 2 action buttons overflows. User says "have to scroll to the very bottom to see it."
- Log Income/Expense from Home tab — same issue on smaller phones.

**Fix plan:**
Split `Sheet` into a two-zone layout:
1. **Scrollable top zone** — title bar + all form fields (category buttons, inputs, photo, toggles)
2. **Pinned bottom zone** — numpad + submit + delete button (stays fixed at the bottom of the sheet, never scrolls away)

New Sheet structure:
```jsx
<div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm"
     onClick={onClose}>  {/* backdrop tap to dismiss — see BUG 3 */}
  <div className="w-full card-luxe max-h-[92dvh] flex flex-col rounded-b-none animate-in slide-in-from-bottom duration-300"
       onClick={e => e.stopPropagation()}>
    {/* Header — always visible */}
    <div className="flex items-center justify-between p-5 pb-3 flex-shrink-0">
      <div className="font-display text-xl">{title}</div>
      <button onClick={onClose}>...</button>
    </div>
    {/* Scrollable content area */}
    <div className="overflow-y-auto flex-1 px-5 pb-2">
      {children}
    </div>
    {/* Pinned footer (numpad + actions passed via footer prop) */}
    {footer && (
      <div className="flex-shrink-0 px-5 pb-8">
        {footer}
      </div>
    )}
  </div>
</div>
```

Each modal that uses a numpad passes `numpad + save + delete` as the `footer` prop. Form fields go in `children`. This keeps the numpad pinned and form fields scrollable.

**Files to edit:**
- `src/components/clipper/LogModals.tsx` — Sheet component + LogIncomeModal + LogExpenseModal layout
- `src/components/clipper/BoothRentModal.tsx` — same split
- `src/components/clipper/SettingsScreen.tsx` — GoalModal same split

---

## Additional Issues Found (Code Audit)

### BUG 2 — Receipt photo: `capture="environment"` forces camera only
**File:** `src/components/clipper/LogModals.tsx` line 332
```jsx
<input type="file" accept="image/*" capture="environment" ... />
```
`capture="environment"` bypasses iOS's "Take Photo or Choose from Library" action sheet and opens the rear camera directly. Users can't select an existing receipt photo from their camera roll.

**Fix:** Remove the `capture` attribute entirely. iOS will show the standard picker (camera or library). Android does the same.

---

### BUG 3 — Backdrop tap doesn't close Sheet modals
**File:** `src/components/clipper/LogModals.tsx` line 59
The dark overlay behind the sheet has no `onClick` handler. Tapping outside the sheet on mobile does nothing. This is expected native behavior on iOS (action sheets dismiss on outside tap).

**Fix:** Add `onClick={onClose}` to the backdrop div, `onClick={e => e.stopPropagation()}` on the inner content div. Already shown in BUG 1's fix plan above.

---

### BUG 4 — Auth modal pops up on every launch when not signed in
**File:** `src/components/clipper/ClipperApp.tsx` lines 28-33
```js
if (store.hasCompletedOnboarding && !store.user) {
  const t = setTimeout(() => setAuthOpen(true), 400);
}
```
On every cold launch of the PWA, if the user skipped or dismissed sign-in, the auth modal fires again 400ms after mount. This is especially jarring as a PWA on the home screen — it feels broken.

**Fix:** Track a `hasSeenAuthPrompt` flag in the store (one-time prompt), or only show it right after onboarding completes (not on every subsequent launch). Could also add a "Continue without account" button that sets this flag.

---

### BUG 5 — `confirm()` dialogs blocked in PWA standalone mode on iOS
**File:** `src/components/clipper/SettingsScreen.tsx` lines 40-43, 68
`confirm()` and `alert()` are suppressed in some iOS PWA standalone contexts. The "Erase all data" confirmation and "Restore backup" confirmation will silently fail (never resolve) on certain iOS versions.

**Fix:** Replace `confirm()` calls with a small inline confirmation Sheet/modal that uses the existing Sheet component.

---

### BUG 6 — "Booth Rent" appears as a manual expense category
**File:** `src/components/clipper/LogModals.tsx` line 293-301
The Log Expense modal lists `boothRent` as a selectable category alongside Clippers, Products, Gas, etc. This conflicts with the auto-logging system. A user might manually log a booth rent expense AND have auto-logging on, creating duplicates.

**Fix:** Remove `boothRent` from the manual expense category list in `LogExpenseModal`. Auto-logged entries already carry `category: "boothRent"` — these are fine in History. The manual form just shouldn't offer it.

---

### BUG 7 — Monthly booth rent: June setup silently skips June
**File:** `src/components/clipper/BoothRentModal.tsx` line 43-45
When a user sets up monthly booth rent mid-month (e.g., June 15), `lastLoggedDate` is set to June 1. `applyBoothRentAutoLog` then computes the next entry as July 1 — so June rent is never auto-logged. The user pays June rent manually and expects it to be tracked, but the app won't create that entry.

**Fix:** Change monthly `lastLoggedDate` to be first of the *previous* month (i.e., May 1 when setting up in June). This means July triggers normally, but more importantly the June entry would appear right away if it's past June 1 when they save. OR: add a note in the modal "Your next auto-log: [date]" so users know when to expect the first entry.

---

### BUG 8 — History screen: search persists when navigating months
**File:** `src/components/clipper/HistoryScreen.tsx`
If a user types "fade" in the search box and then clicks the `<` arrow to go to last month, the search query stays active and filters the previous month's data too. The `query` state is not cleared on month change.

**Fix:** Reset `query` to `""` inside the `prev()` and `next()` functions.

---

## UX Improvements (not bugs, but polish)

### IMPROVEMENT 1 — Log Income/Expense from Home: fields visible above numpad
Tied to BUG 1 fix. Once Sheet has a scrollable top zone, the user can see the amount, method chips, and note field while the numpad stays pinned. Currently nothing above the numpad is visible without scrolling.

### IMPROVEMENT 2 — History "edit" indication
When you tap a transaction row, there's no visual hint that it's editable (no pencil icon, no disclosure chevron). Users may not discover the edit feature.

**Fix:** Add a subtle edit indicator — either a small pencil icon on the right side of each transaction row, or a "Tap to edit" hint in the header/empty state.

### IMPROVEMENT 3 — Goal progress bar: show % text
The progress bar on Home only shows `$220 / $2,000`. Adding a percentage (`11%`) or a sentence like "You're 11% of the way" makes the progress more scannable at a glance.

### IMPROVEMENT 4 — Booth Rent "active" toggle off state
When booth rent is configured but `active: false`, the Settings row shows "$120 weekly · off". The BoothRentModal correctly shows the toggle as off. But there's no visual distinction on the Home page or Taxes page — a "paused" rent still shows in deductions. This is actually correct (past entries stay), just worth noting that the toggle only affects *future* auto-logging.

### IMPROVEMENT 5 — Empty History state when no entries at all
When the store has zero entries, the History tab shows "No entries this month" but there's no onboarding hint to log your first income/expense. Could add a CTA button linking to the Home tab.

---

## Files Involved in Fixes

| File | Changes needed |
|------|---------------|
| `src/components/clipper/LogModals.tsx` | Sheet: max-h + scroll zones + backdrop dismiss; LogExpenseModal: remove `capture` attr, remove boothRent from category list |
| `src/components/clipper/BoothRentModal.tsx` | Split content/footer for scroll; fix monthly lastLoggedDate |
| `src/components/clipper/SettingsScreen.tsx` | GoalModal scroll split; replace `confirm()` with Sheet modals |
| `src/components/clipper/HistoryScreen.tsx` | Reset search on month change; add edit indicators to rows |
| `src/components/clipper/ClipperApp.tsx` | One-time auth prompt flag |
| `src/components/clipper/HomeScreen.tsx` | Add % to goal progress bar |

---

## Priority Order for Implementation

1. **BUG 1** — Sheet scroll (blocks all modal workflows)
2. **BUG 2** — Receipt: remove `capture` (usability)
3. **BUG 3** — Backdrop dismiss (mobile UX standard)
4. **BUG 6** — Remove boothRent from manual categories (logic conflict)
5. **BUG 8** — Search resets on month nav (minor annoyance)
6. **BUG 5** — Replace `confirm()` with modal (PWA reliability)
7. **BUG 4** — One-time auth prompt (polish)
8. **BUG 7** — Monthly booth rent setup date (edge case)
9. **IMPROVEMENT 2** — Edit indicators in History
10. **IMPROVEMENT 3** — Goal % text
