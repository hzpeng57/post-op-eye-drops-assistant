# Post-Op Eye Drops Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready local-first Next.js App Router web app for post-op eye-drop scheduling, guided flows, history, settings, PWA installability, and future notification integration.

**Architecture:** Pure TypeScript modules own the treatment plan, schedule engine, progress summaries, LocalStorage persistence, and notification jobs. A client React shell renders the current action, today timeline, medication cards, history, and settings from that state. UI components follow shadcn/ui conventions and Tailwind CSS tokens.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn/ui-style components, Lucide icons, Vitest, LocalStorage, PWA manifest/service worker.

---

### Task 1: Project Skeleton And Tests

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `components.json`
- Create: `tests/schedule-engine.test.ts`, `tests/progress.test.ts`

- [x] Write failing tests for schedule and progress behavior before production code.
- [ ] Install dependencies.
- [ ] Run `npm test` and confirm tests fail because production modules do not exist.

### Task 2: Core Domain

**Files:**
- Create: `src/types.ts`
- Create: `src/lib/time.ts`
- Create: `src/lib/default-plan.ts`
- Create: `src/lib/schedule-engine.ts`
- Create: `src/lib/progress.ts`

- [ ] Implement the minimum domain types and helpers needed by tests.
- [ ] Run `npm test` and confirm schedule/progress tests pass.
- [ ] Refactor names and boundaries while keeping tests green.

### Task 3: Local State And Notifications

**Files:**
- Create: `src/lib/storage.ts`
- Create: `src/lib/notifications.ts`
- Create: `src/hooks/use-treatment-state.ts`

- [ ] Add schema-versioned LocalStorage state with treatment plan, dose records, active session, and settings.
- [ ] Add notification job generation and a no-op local notification service interface.
- [ ] Add React hook actions for onboarding, starting a session, completing steps, changing settings, regenerating plans, and reset.

### Task 4: UI Foundation

**Files:**
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/input.tsx`, `src/components/ui/progress.tsx`
- Create: `src/lib/utils.ts`

- [ ] Add app metadata, viewport, manifest references, and service worker registration.
- [ ] Add Tailwind theme tokens for the medical product palette.
- [ ] Add shadcn/ui-style primitives.

### Task 5: Product Screens

**Files:**
- Create: `src/components/app-shell.tsx`
- Create: `src/components/onboarding.tsx`
- Create: `src/components/now-card.tsx`
- Create: `src/components/dose-flow.tsx`
- Create: `src/components/today-timeline.tsx`
- Create: `src/components/medication-status.tsx`
- Create: `src/components/history-panel.tsx`
- Create: `src/components/settings-panel.tsx`

- [ ] Build onboarding for start date.
- [ ] Build the dashboard current-action card and guided dose flow.
- [ ] Build today timeline with completed, active, waiting, pending, and missed states.
- [ ] Build medication status cards, history ranges, and settings controls.

### Task 6: PWA And Documentation

**Files:**
- Create: `public/manifest.webmanifest`
- Create: `public/sw.js`
- Create: `public/icon.svg`
- Create: `README.md`

- [ ] Add installable PWA metadata and a lightweight service worker.
- [ ] Document setup, scripts, architecture, schedule rules, notification extension point, and future Supabase path.

### Task 7: Verification

- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Start the dev server.
- [ ] Verify desktop and mobile views in the browser.
- [ ] Audit each user requirement against files and command output before marking the goal complete.
