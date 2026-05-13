# Midnight Shift — v1 Plan

> **Status:** Planning | **v0:** 23 commits, feature-complete per DESIGN.md Must-Have

---

## What v0 ships

- 6 districts with rival crews (curated leaders, bios, signature cars)
- 15 hero cars across 5 archetypes, 4 classes
- Procedural driver generator (12 personalities, name pools, backstories)
- Junkyard recruitment screen (3 candidates, hire, scout refresh)
- Car Market (buy hero cars, class filter, $200–$3000 pricing)
- Race engine (Mulberry32 PRNG, tick-based sim with event log)
- Race Setup + Race Live (district/ stakes/posture picker, event viewer)
- City Map (6 interactive district cards, control bars, perks)
- Idle income with offline catchup
- Prestige system (New Night, signature driver carryover, permanent bonuses)
- Message Board (procedural posts: drama, challenges, rumors, results)
- CRT scanlines toggle, audio stubs, PWA icons
- localStorage save/load with version gating
- ErrorBoundary with save reset
- 9 navigation tabs

## What v0 is missing (prioritized for v1)

### Client track (no backend needed)
1. **Path System** — Racer vs Boss choice (was Phase 8 of v0 plan)
2. **Rival Crew AI** — they challenge YOU, they upgrade cars, they poach your drivers
3. **Visual Customization** — paint, decals, neon underglow, body kits on owned cars
4. **Special Events** — midnight tournaments, police crackdowns, street takeovers
5. **Upgrades/Parts** — buy and install engine/tires/suspension/nitro/aero parts
6. **Sound** — ambient synth loop, engine SFX for race replay, UI sounds

### Server track (Go backend, same stack as MC)
7. **Backend foundation** — Go + chi + SQLite, deploy on hermes-sera
8. **Accounts** — optional sign-in, local play always works
9. **Leaderboards** — fastest night clear, most rep, crew standings
10. **Shared city state** — one crew controls downtown on YOUR map, different on MINE

---

## Phase Plan

### Phase 1: Path System (was v0 Phase 8)
**Files:** `src/engine/paths.ts`, `src/components/screens/PathSelect.tsx`

Racer path:
- Own a driver slot (drive personally in solo events)
- Personal XP and stat growth
- Can challenge crew leaders 1v1

Boss path:
- Boss Vision overlay on City Map (see rival movement, heat levels)
- Crew orders (send drivers on missions)
- Recruitment discount from Underground district perk
- Can poach rival drivers with enough rep

**Verification:** Choosing a path changes available actions. Boss sees rival movement. Racer has personal stats.

**Commit:** `feat: add Racer vs Boss path system`

---

### Phase 2: Rival Crew AI
**Files:** `src/engine/rival-ai.ts`

Rival crews become active:
- They schedule races against YOU (not just you against them)
- They upgrade their cars and recruit new drivers over time
- They challenge for territory you control
- They can poach your low-loyalty drivers (with a warning first — Message Board rumor)
- Crew leaders send taunts/challenges via Message Board

AI personality per crew:
- Iron Dogs: aggressive, challenges often, brute force upgrades
- Glass Tigers: precise, challenges when they have stat advantage
- Salt Devils: speed-obsessed, challenges on Coastal Highway
- Ridge Runners: defensive, upgrades control, rarely challenges first
- Hollow Men: unpredictable, random timing, poaching attempts
- Velvet Cartel: uses cash to buy best cars, challenges for The Strip only

**Verification:** Let the game idle for several simulated days. Rival crews evolve. Player gets challenged.

**Commit:** `feat: add rival crew AI with challenges and poaching`

---

### Phase 3: Visual Customization
**Files:** `src/components/screens/Customization.tsx` (or extend `CarCard`)

Per-car customization screen:
- Paint color picker (preset palette + hex input)
- Decal slots (stripes, flames, numbers, crew logo)
- Neon underglow color (pink #ff2d95, cyan #00d4ff, purple #b347ea, amber #ffb800, green #00ff88)
- Body kit presets (stock, widebody, drift, drag)
- License plate text
- Preview rendered via colored div blocks (CSS) — no canvas needed

Cost: cash per change, scaled by car class.

**Verification:** Customize a car, see changes reflected in CarCard and race views.

**Commit:** `feat: add visual car customization`

---

### Phase 4: Special Events
**Files:** `src/engine/events.ts`

Random events that interrupt the routine:
- **Midnight Tournament** — 4-crew bracket, high stakes, big rep payout
- **Police Crackdown** — all races in a district get heat modifier, risk of car impound
- **Street Takeover** — spontaneous meet in a district, free rep for showing up
- **Parts Shipment** — limited-time discount at Car Market
- **Crew War** — rival challenges you to best-of-3, loser loses territory
- **The Wangan Run** — pure top-speed race on Coastal Highway, no turns, highest cash prize

Events appear on Message Board with timers. Some are optional, some force a response.

**Verification:** After N nights, events fire. Tournament bracket resolves correctly.

**Commit:** `feat: add special event system`

---

### Phase 5: Upgrades & Parts
**Files:** `src/components/screens/PartsShop.tsx`, extend `src/types/game.ts`

Parts shop screen:
- Buy parts for specific cars (engine, tires, suspension, nitro, aero)
- 5 tiers per part type, increasing cost and bonus
- Parts have side effects (nitro boosts speed but reduces durability)
- Install/swap parts on owned cars
- Parts cost scales with car class

Parts data (tiers 1–5):
| Part | Tier 1 | Tier 5 |
|------|--------|--------|
| Engine | +5 top speed, $100 | +25 top speed, $2500 |
| Tires | +5 control, $80 | +25 control, $2000 |
| Suspension | +5 control +3 durability, $120 | +25/+15, $3000 |
| Nitro | +10 aggression -5 durability, $200 | +50 aggression -25 durability, $4000 |
| Aero | +3 all stats, $300 | +15 all stats, $5000 |

**Verification:** Install parts on a car, verify stat changes in CarCard and race simulation.

**Commit:** `feat: add parts shop and upgrade system`

---

### Phase 6: Sound
**Files:** `src/hooks/useAudio.ts` (replace stubs)

Replace audio stubs with real Web Audio API:
- Ambient synth loop (low-pass drone, plays in background, respects music volume)
- Race engine sounds (pitch-shifted based on speed stat during race replay)
- UI sounds (button click, purchase confirm, prestige fanfare)
- Crash SFX, finish line SFX
- All volume-controlled via Settings screen

Audio assets: generated procedurally (Web Audio oscillators + noise) or small embedded samples. No external audio files needed.

**Verification:** Toggle sound in Settings. Hear ambient loop. Race replay has engine + event SFX.

**Commit:** `feat: implement Web Audio sound system`

---

### Phase 7: Backend Foundation
**Files:** New repo `midnight-shift-api` or `cmd/` in existing

Go + chi router + SQLite:
- POST /api/register — create account (username, password hash)
- POST /api/login — return session token
- GET /api/leaderboard/:category — top crews by rep, nights cleared, etc.
- POST /api/city-state — submit your city state for shared view
- GET /api/city-state — get aggregated city state

Same stack as Mission Control: Go, chi, SQLite, systemd deploy on hermes-sera.exe.xyz.

**Verification:** Register account, login, see empty leaderboard.

**Commit:** `feat: scaffold Go backend with accounts and leaderboards`

---

### Phase 8: Multiplayer Lite
**Files:** `src/state/online.ts`, extend backend

- Shared city state: when you control Industrial, other players see your crew name there
- Crew vs Crew: challenge another player's crew (async — race resolves on both clients)
- Leaderboard updates on prestige
- "Ghost races" — race against another player's best time on a district

**Verification:** Two accounts, one controls Industrial, the other sees it.

**Commit:** `feat: add shared city state and async crew challenges`

---

## Implementation Order

Execute phases in order — each builds on previous:
1. Path System (unlocks Boss Vision for Rival AI context)
2. Rival Crew AI (makes the city feel alive)
3. Visual Customization (gives cash more purpose)
4. Special Events (variety and urgency)
5. Upgrades & Parts (deeper garage loop)
6. Sound (atmosphere — biggest feel upgrade per effort)
7. Backend Foundation (only when client features are solid)
8. Multiplayer Lite (only when there's actually a player base)

**Phases 1–6 are pure client-side. Phases 7–8 need the Go backend.**

---

## Testing Strategy

- **Vitest** for engine functions (paths, rival AI decisions, event resolution, parts calculations)
- **Component tests** for new screens (PathSelect, Customization, PartsShop)
- **Integration tests** for full loops: pick path → get challenged by rival → customize car → install parts → enter tournament
- Backend: Go table-driven tests for API handlers, SQLite integration tests

---

## Deliverables

- v0: 23 commits, ~250KB bundle, 51 modules, 9 screens, playable loop
- v1 target: ~40 commits, full client feature set, optional backend
- v1 ships when Phases 1–6 are done. Phases 7–8 are v1.5 / v2 depending on interest.
