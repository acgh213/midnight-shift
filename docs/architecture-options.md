# Midnight Shift — Architecture Options

*Written May 13, 2026 after shipping v1 (57 commits). The game works: race completion, rewards, district control, background processing, save persistence, leaderboard, SSE. But the React/Zustand frontend carried significant debugging cost — dependency arrays, StrictMode interference, dual sources of truth. This note outlines three paths forward.*

---

## Path 1: Continue React/Zustand — stricter command layer

Keep the full stack but add an action/dispatch pattern. Every state mutation goes through typed commands (`RACE_STARTED`, `RACE_COMPLETED`, `DRIVER_RECRUITED`) instead of ad-hoc `updateGame(partial)`. Zustand becomes a reducer. Effects subscribe to action types, not raw state diffs.

**What changes:**
- Add `dispatch(action: GameAction)` to the store
- Convert `updateGame(partial)` calls to dispatched actions
- Effects watch specific action streams, not dependency arrays
- `gameRef` pattern stays for cross-screen background ticks

**Pros:**
- No rewrite — 19 screens, 6 engine files, Go backend all stay
- Dependency-array bugs become structurally impossible
- Predictable state transitions
- Gradual: can migrate one screen at a time

**Cons:**
- Two sources of truth still exist (Zustand + localStorage + Go server)
- Save synchronization remains manual
- Offline play has divergence risk
- React's rendering model still requires careful ref management for effects

**Effort:** 2-3 sessions. Mostly refactoring the store and converting `updateGame` calls.

---

## Path 2: Partial refactor — gameplay state to Go/backend

Move race simulation, economy, district control, crew state, and prestige fully server-side. The Go API already exists and is tested (17/17 API tests). Extend it with endpoints for every game action. React becomes a rendering layer — it fetches state, renders UI, and POSTs actions. No local `applyRaceResult`. The server is the single source of truth.

**What changes:**
- New Go endpoints: `POST /api/crew/recruit`, `POST /api/garage/buy`, `POST /api/race/start`, etc.
- React screens call API, render response, update local display state only
- SSE already wired — leaderboard updates, challenge results stream live
- Zustand holds UI state only (selected driver, form inputs, current screen)
- `completeRace` runs entirely server-side → broadcasts via SSE → all clients update

**Pros:**
- Single source of truth (SQLite)
- Already 40% built — Go server, SSE hub, persistence, leaderboard, race sim
- No more "did the store update?" — the API response IS the truth
- Save persistence is automatic (every action writes to DB)
- SSE means other clients see your crew's progress live

**Cons:**
- Every action requires a network roundtrip (latency)
- Offline play becomes read-only (can't start races, buy cars)
- React still manages UI state — two frameworks coexisting
- SSE reconnection logic needed for spotty connections
- Race animation (live events) needs client-side sim or server-sent event stream

**Effort:** 4-6 sessions. Most backend work is done. Frontend needs systematic API wiring.

---

## Path 3: Full htmx/Astro/Go rewrite

Go serves HTML fragments. htmx swaps them on actions. Astro handles static shell + build optimization. No React, no Zustand, no dependency arrays. The server is the entire application: state lives in SQLite, UI is generated server-side, SSE pushes live fragment swaps.

**What changes:**
- Go templates render every screen as HTML fragments
- htmx attributes on buttons/forms: `hx-post="/api/race/start"`, `hx-target="#race-live"`
- Astro builds the static shell (navigation, layout, PWA manifest)
- Race animation: lightweight canvas web component for the live events feed
- SSE pushes HTML fragments for leaderboard updates, challenge results
- Single binary deployment: Go serves Astro output + API + SSE

**Pros:**
- Zero client-side state management. Impossible to have the bugs we debugged.
- Extremely fast page loads (server-rendered HTML, tiny htmx payload)
- Works on any device including low-end phones
- Single Go binary — no Node, no Vite, no npm in production
- State is always consistent (one database, one process)

**Cons:**
- Full rewrite — 19 screens, all game logic, all UI ported
- No offline mode (server-rendered, requires connection)
- Interactive race animation requires custom approach (web component or server-sent event stream)
- Different skillset (htmx patterns, Go templates, Astro)
- Mobile app-like feel harder to achieve (page transitions, gestures)
- Longer build time before visible progress

**Effort:** 8-12 sessions. Complete rebuild from database up through UI.

---

## Recommendation

**Path 2** as the next step. The Go backend is already solid — deterministic race sim, SSE hub, persistence, leaderboard. Extending it with a proper action API and thinning React to a rendering layer is the lowest-risk path that actually fixes the root cause (two sources of truth). We can go to Path 3 later if the React layer continues to cause friction.

If latency is a concern for Path 2: we can keep the client-side race simulator for instant feedback and only commit results to the server. The server becomes the authority, but the client provides optimistic UI. This hybrid approach gives us the best of both — instant feedback with server-side truth.
