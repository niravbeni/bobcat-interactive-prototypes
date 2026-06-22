# Bobcat — Retirement Onboarding Prototype

An interactive, pixel-matched prototype of the WTW "Bobcat" retirement planning
flow, built with Next.js (App Router), TypeScript and Tailwind CSS. The app is
structured so new interaction variations (chat-led flow, card-sort goals, the
"happiness chapter", etc.) can be layered on top of the shared base flow.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dev server can also be
run detached (useful for automated checks) with `npm run dev:daemon`, and stopped
with `npm run dev:stop`.

## The flow

The home page (`/`) is a dashboard for picking a variation. The base flow runs as
URL-addressable steps so browser back/forward and deep links work:

```
/income   → 5-question Future Income wizard
/summary  → derived income summary (editable chips + breakdown)
/spending → 5-question Retirement Spending wizard (with a detail breakdown)
/goals    → "Time and Goals" conversational AI mockup (WhatsApp-style chat)
/complete → placeholder for where the rest of the app continues
```

Unknown routes redirect to the first step.

## Architecture

- `src/lib/flow.ts` — config-driven step machine (`STEPS`) and deterministic
  `previousStep()` for back navigation derived from the flow graph.
- `src/lib/questions.ts` — data definitions for the income/spending wizards and
  the goals chat prompts/keyword helpers.
- `src/lib/types.ts` — flow answer model and `StepId`s.
- `src/components/flow/FlowProvider.tsx` — central state (answers, wizard
  indices, chat transcript) and navigation helpers via the `useFlow()` hook.
- `src/components/flow/QuestionWizard.tsx` — generic multiple-choice wizard that
  reveals money fields, a spending detail block, or an inline placeholder.
- `src/components/chrome/` — shared `Navbar`, `Sidebar`, `AppShell` layout.
- `src/components/screens/` — one component per step.
- `src/components/ui/` — reusable primitives.

Design tokens (colors, type, radii) live in `src/app/globals.css`.

## Scripts

- `npm run dev` / `dev:daemon` / `dev:stop`
- `npm run build` / `start`
- `npm run lint`
