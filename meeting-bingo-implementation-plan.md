# Meeting Bingo — Implementation Plan

## Review Summary

Reviewed: 2026-06-23 | Reviewers: VP Product, VP Engineering, VP Design (via plan-review-skill, 2 rounds)

### Changes Applied — Round 2

| # | Change |
|---|---------------------------------------------------------------|
| 15 | Rewrote Step 0: remote is already confirmed (`https://github.com/cguliani/meetingbingo.git`, repointed from the original third-party fork per explicit user instruction) and pushed — normal commit/push is expected going forward, no more "don't push" hedge |
| 16 | Expanded Unresolved Items to enumerate which PRD success metrics (Share Rate, Games Started, Return Visits, Auto-fill Accuracy) are unmeasurable without a backend, not just "Analytics" generically |
| 17 | Added explicit Out-of-Scope bullet for UXR's "Join Game" / "Invite Others" / shareable game-link flow (Scenes 3, 5, 10) |
| 18 | Specified `detectedWords` (last-5 list) lives in `GameState`/reducer, not a parallel local `useState` in `TranscriptPanel` |
| 19 | Extended speech auto-restart guard to also clear on `onerror`, not just manual stop/unmount |
| 20 | Added `aria-live="polite"` requirement for `TranscriptPanel` updates and toast notifications (screen-reader feedback) |
| 21 | Carried manual/auto-fill visual distinction into WinScreen's winning-card display and the shareable text summary |

### Changes Applied — Round 1

| # | Change |
|---|---------------------------------------------------------------|
| 1 | Added Step 0: verify repo/remote state before any commits (this folder may carry its own git history/remote separate from the outer repo — confirm before pushing anything) |
| 2 | Added in-app mic-permission trust modal at the actual permission moment (UXR Scene 5), not just a landing-page note |
| 3 | Added explicit accessibility step: ARIA roles/labels on the grid and squares, keyboard navigation, `prefers-reduced-motion` handling, non-color-only state indicators |
| 4 | Clarified single source of truth for game state (Context/`useGame` reducer only — no duplicate local `useState`) |
| 5 | Wired `useBingoDetection` and `getClosestToWin` into the actual render path instead of leaving them dead code |
| 6 | Added explicit auto-restart guard in the speech hook to prevent restart loops when the user manually stops listening |
| 7 | Added a unit-testing step (Vitest) for the pure logic in `lib/` |
| 8 | Made persistence (Step 5) a hard requirement, not a "if implemented" hedge in Verification |
| 9 | Added toast queueing/stacking spec for multi-word-per-utterance detections |
| 10 | Pulled mobile responsiveness earlier (own step) instead of a last-bullet afterthought, and added it to Verification |
| 11 | Added Firefox/non-HTTPS Web Speech API caveats to the speech step and Verification |
| 12 | Added local `SpeechRecognition` type declarations (no official `@types` package covers this API) |
| 13 | Added explicit "Silent Celebration" (no sound) and "one away from BINGO" hint as testable Verification criteria |
| 14 | Explicitly listed dark theme as deferred/out-of-scope (was silently dropped) and specified manual-fill vs. auto-fill visual distinction |

### Unresolved Items

- [ ] Analytics/instrumentation for PRD success metrics — deferred; no backend exists to receive events, and adding one is out of scope for this single-player, no-backend app. This specifically leaves the following PRD §1.3/§11 success metrics unmeasurable as built: Share Rate (>30% of wins), Games Started, Return Visits, Auto-fill Accuracy. Revisit if/when a metrics backend is introduced.

---

## Context

This folder contains three product docs: a PRD (`meeting-bingo-prd.md`), an Architecture Plan (`meeting-bingo-architecture.md`), and UX Research (`meeting-bingo-uxr.md`) — but no application code yet. The Architecture doc already specifies a concrete, nearly-complete React/TypeScript/Vite design (types, core logic, key components, data). This plan turns that spec into a working app, built directly inside this `MeetingBingo/` folder alongside the existing docs.

Goal: a single-player, browser-only bingo game that generates a 5x5 buzzword card from one of three categories, listens via the Web Speech API to auto-fill squares when buzzwords are spoken, supports manual tap-to-fill, detects BINGO (row/col/diagonal), celebrates with confetti, and lets the user share/reset. No backend, no auth — `localStorage` only.

## Tech Stack (per architecture doc)

- Vite + React 18 + TypeScript
- Tailwind CSS
- `canvas-confetti` for win celebration
- Web Speech API (browser-native, feature-detected with manual-fill fallback)
- React `useReducer` + Context for state (single source of truth — see Step 5); `localStorage` for persistence

## Project Structure

```
MeetingBingo/
├── meeting-bingo-prd.md, meeting-bingo-architecture.md, meeting-bingo-uxr.md   # existing docs, untouched
├── meeting-bingo-implementation-plan.md   # this file
├── index.html
├── package.json, tsconfig.json, vite.config.ts, tailwind.config.js, postcss.config.js
├── public/favicon.svg
└── src/
    ├── main.tsx, App.tsx, index.css
    ├── types/index.ts            # CategoryId, BingoSquare, BingoCard, GameState, WinningLine, SpeechRecognitionState, Toast
    ├── types/speech.d.ts          # local SpeechRecognition/webkitSpeechRecognition ambient types (no official @types package)
    ├── data/categories.ts        # CATEGORIES: agile / corporate / tech word lists
    ├── lib/
    │   ├── cardGenerator.ts      # shuffle + generateCard(categoryId)
    │   ├── bingoChecker.ts       # checkForBingo, countFilled, getClosestToWin
    │   ├── wordDetector.ts       # detectWords / detectWordsWithAliases, regex word-boundary + phrase matching
    │   ├── shareUtils.ts         # clipboard / Web Share API result formatting
    │   └── utils.ts              # cn() classnames helper
    ├── hooks/
    │   ├── useSpeechRecognition.ts  # wraps SpeechRecognition/webkitSpeechRecognition, continuous+interim, guarded auto-restart
    │   ├── useGame.ts                # single source of truth: useReducer game state transitions (idle→setup→playing→won)
    │   ├── useBingoDetection.ts      # runs checkForBingo + getClosestToWin on card changes, triggers onWin / onCloseToWin
    │   └── useLocalStorage.ts        # generic persisted-state hook
    ├── context/GameContext.tsx
    └── components/
        ├── LandingPage.tsx, CategorySelect.tsx
        ├── MicPermissionModal.tsx    # in-app trust modal shown before requesting mic access (UXR Scene 5)
        ├── GameBoard.tsx, BingoCard.tsx, BingoSquare.tsx
        ├── TranscriptPanel.tsx, GameControls.tsx, CloseToWinHint.tsx
        ├── WinScreen.tsx
        └── ui/Button.tsx, ui/Card.tsx, ui/Toast.tsx, ui/ToastQueue.tsx
```

## Implementation Steps

0. **Repo state (resolved)**: `MeetingBingo/` is its own git repo, separate from the outer workspace repo. Its `origin` remote was originally a third party's fork (`wrsmith108/MeetingBingo.git`); it has since been repointed to `https://github.com/cguliani/meetingbingo.git` per explicit user instruction and force-pushed. Normal commit/push to `origin main` is expected for the rest of this work — no further confirmation needed before pushing.

1. **Scaffold**: `npm create vite@latest . -- --template react-ts` inside `MeetingBingo/` (reusing the existing dir, alongside the 3 doc files), then `npm install canvas-confetti`, `npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react jsdom` + `npx tailwindcss init -p`. Configure `tailwind.config.js` content globs and the color/animation tokens from the architecture doc (§6.6, vite.config.ts, tailwind.config.js already specified verbatim).

2. **Types & data**: Add `src/types/index.ts`, `src/types/speech.d.ts` (ambient `SpeechRecognition`/`webkitSpeechRecognition` interfaces — TypeScript's DOM lib doesn't include these), and `src/data/categories.ts` using the exact interfaces and word lists from `meeting-bingo-architecture.md` (§ Core Type Definitions, § Buzzword Data) — these are copy-adapted, not redesigned.

3. **Core game logic** (`src/lib/`): Port `cardGenerator.ts` (Fisher-Yates shuffle, 5x5 grid with center free space), `bingoChecker.ts` (12 winning lines: 5 rows, 5 cols, 2 diagonals + `getClosestToWin` for "one away" UI hint), `wordDetector.ts` (word-boundary regex for single words, substring match for multi-word phrases, alias table for things like "CI/CD"). Add Vitest unit tests for each (`cardGenerator`: uniqueness/shuffle distribution, free space placement; `bingoChecker`: all 12 lines, edge cases around the free space; `wordDetector`: word-boundary false-positive guards, alias matching, short-acronym edge cases like "CI" inside "ci-cd" or "social"). These functions are pure and cheap to test — do not skip this.

4. **Speech hook** (`src/hooks/useSpeechRecognition.ts`): wrap `window.SpeechRecognition`/`webkitSpeechRecognition`, `continuous: true`, `interimResults: true`. Auto-restart in `onend` only while a `isListeningRef` flag is still true (set false on manual stop, component unmount, *or* recognition error via `onerror` — not just manual stop/unmount) — this guard prevents the restart-loop race condition where `onend` fires after a deliberate stop, an error (e.g. permission revoked mid-session), or unmount, and immediately re-requests the mic. Expose `isSupported` for feature detection so the UI can fall back to manual-only mode, and surface a specific error/notice for browsers (e.g. Firefox) or non-HTTPS contexts where the API is unavailable or blocked, per PRD risk mitigation.

5. **Game state**: `useGame.ts` (the single source of truth via `useReducer`) + `GameContext.tsx` managing `GameState` (status/category/card/isListening/timestamps/winningLine/`detectedWords: string[]` — the last-5 detected-words list shown in `TranscriptPanel` lives here too, not as a local `useState` in the component). No component keeps parallel local `useState` for any value owned by `GameState` — read/derive from context only. On each transcript chunk: run `detectWordsWithAliases`, mark matched squares `isFilled + isAutoFilled`, dispatch through the reducer; `useBingoDetection.ts` watches the card via the reducer's state and calls `checkForBingo` (triggers win transition) and `getClosestToWin` (drives `CloseToWinHint`) — this hook must actually be invoked from `GameBoard`, not left unused. On manual square click toggle `isFilled` (skip free space). `useLocalStorage.ts` persists/restores in-progress game on every state change; this is a required part of this step, not optional polish — Step 5 is not done until refresh-restore works.

6. **Screens** (`App.tsx` drives a 4-state screen switch: landing → category → game → win, matching the architecture doc's `App.tsx`):
   - `LandingPage`: hero + "New Game" CTA + privacy note + "How it works".
   - `CategorySelect`: 3 category cards (Agile/Corporate/Tech) with word previews.
   - `MicPermissionModal`: shown the first time the user would start listening (not just mentioned once on the landing page) — explains what's heard, that audio never leaves the browser, and offers "Allow & Listen" or "Skip, I'll tap manually" per UXR Scene 5.
   - `GameBoard` → `BingoCard`/`BingoSquare` (5x5 grid, free space styled distinctly; auto-filled squares get a pulse animation *and* a distinct fill color/icon from manually-filled squares, so state isn't color-only), `TranscriptPanel` (listening indicator, last-100-char transcript, last 5 detected words from `GameState.detectedWords`), `GameControls` (New Card / Start-Stop Listening), `CloseToWinHint` (surfaces `getClosestToWin` output, e.g. "1 away — needs 'sprint'").
   - `WinScreen`: `canvas-confetti` burst (skips/reduces animation when `prefers-reduced-motion` is set), winning line highlighted, stats (time to bingo, winning word, squares filled, category), the winning card's manual-vs-auto-fill distinction carried over from gameplay (not reset to a single "filled" style), Share button (Clipboard API text summary + Web Share API on mobile, per `shareUtils.ts` — the share text/markers also distinguish auto- vs. manually-filled squares, per UXR Scene 9), Play Again / Home.

7. **Shared UI primitives** (`components/ui/`): `Button`, `Card`, `Toast`/`ToastQueue` (queues multiple "✨ word detected" notifications so a multi-word utterance doesn't drop or overwrite toasts — show up to N stacked, auto-dismiss oldest first), plus `lib/utils.ts`'s `cn()` helper for conditional Tailwind classes (used throughout `BingoSquare`).

8. **Accessibility**: `BingoCard` grid uses `role="grid"`/`role="row"`/`role="gridcell"` (or an equivalent ARIA pattern) with each `BingoSquare` as a real `<button>` carrying `aria-pressed` for filled state; full keyboard navigation (Tab/Arrow keys + Enter/Space to toggle); confetti and pulse/auto-fill animations respect `prefers-reduced-motion`; filled/auto-filled/free-space states are distinguishable without relying on color alone (icon, border style, or pattern); `TranscriptPanel`'s transcript/detected-word updates and toast notifications use `aria-live="polite"` (or `role="status"`) so screen-reader users get non-visual feedback when a word is auto-detected.

9. **Responsiveness**: Build the 5x5 grid and screens mobile-first per PRD §2.1 from the start (not as a final pass) — verify at common breakpoints (≤375px, 768px, desktop) as part of building `GameBoard`/`BingoCard`, not deferred to a later polish step.

## Out of Scope (per PRD §2.2, explicitly not building)

Accounts/auth, multiplayer sync, custom word lists, backend/DB, sound effects, leaderboards, calendar integration, analytics/event instrumentation (no backend to receive events), dark theme (UXR mentions it as a "nice to have"; this build ships light theme only), "Join Game" / "Invite Others" / shareable or recurring game links (UXR Scenes 3, 5, 10) — single-player only, no game-joining mechanism beyond the post-win Share button's static text/result summary.

## Verification

1. `npm run dev`, open in Chrome (best Web Speech API support); separately confirm the app loads and falls back gracefully in Firefox or over non-HTTPS (no Web Speech API available there).
2. Click New Game → select each of the 3 categories → confirm a 5x5 card renders with 24 unique words + center free space pre-filled.
3. Click squares manually → confirm toggle on/off (free space stays locked), and confirm manually-filled squares look visually distinct from auto-filled squares (not just by color).
4. Force a row/column/diagonal fill via manual taps → confirm BINGO triggers, confetti plays (and is reduced/skipped under `prefers-reduced-motion`), correct winning line highlighted, WinScreen shows correct stats, and no sound plays (Silent Celebration is intentional).
5. Trigger the mic-permission modal on first "Start Listening" → confirm it explains the privacy model before the browser's native permission prompt appears. Grant mic permission, speak category words aloud (or play meeting audio near mic) → confirm transcript panel updates, matching squares auto-fill within ~500ms, a toast shows the detected word, and multiple words spoken in quick succession produce stacked (not dropped) toasts.
6. Deny mic permission / test in a browser without Web Speech API support → confirm graceful fallback to manual-only mode (no crash), and that manual fill remains fully usable.
7. Fill 4 of 5 squares in a line → confirm the "closest to win" hint surfaces the missing word.
8. `npm run build`, `npm run typecheck`, and `npm run test` (Vitest unit tests for `cardGenerator`, `bingoChecker`, `wordDetector`) all pass with no errors.
9. Refresh mid-game → confirm `localStorage` restores state exactly (category, filled squares, listening state).
10. Resize to mobile widths (≤375px) and tablet (768px) → confirm the grid and controls remain usable without horizontal scrolling.
11. Tab through the entire game screen using only the keyboard → confirm every square and control is reachable and operable, with visible focus states.
