# Midnight Shift — Go Backend Plan (Phases 7–8)

**Goal:** Add a Go API server that provides server-side persistence, race simulation, leaderboards, and live features to Midnight Shift.

**Context:** The game is a complete single-player Vite + React PWA at 34 commits. All state lives in localStorage. This backend moves persistence server-side, offloads race simulation for fairness/anti-tamper, and enables shared features (leaderboards, crew challenges).

## Phase 7: Go API Server

### Architecture

```
midnight-shift/
  server/                          # Go module
    cmd/midnight-shift/main.go     # Entry point
    internal/
      app/
        routes.go                  # chi router, handler struct, SSE hub
        handlers.go                # HTTP handlers
        middleware.go              # CORS, API key auth
      db/
        db.go                      # RunMigrations (go:embed), seed
        migrations/
          001_initial.sql          # saves + leaderboard tables
      services/
        persistence.go             # Save/load game state (JSON blob)
        simulator.go               # Server-side race sim (port from TS)
        leaderboard.go             # Global prestige rankings
        events.go                  # SSE event broker
      static/                      # Serves dist/ when built
  dist/                            # Vite build output (served by Go)
```

### Stack
- **Router:** chi v5
- **Database:** SQLite via mattn/go-sqlite3
- **Migrations:** embedded SQL via go:embed
- **Static serving:** Go serves `dist/` in production
- **Live updates:** SSE (server-sent events)

### Schema

```sql
-- 001_initial.sql
CREATE TABLE IF NOT EXISTS saves (
  id TEXT PRIMARY KEY,
  crew_name TEXT NOT NULL DEFAULT '',
  night INTEGER NOT NULL DEFAULT 1,
  prestige INTEGER NOT NULL DEFAULT 0,
  state_json TEXT NOT NULL,   -- full GameState JSON blob
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id TEXT PRIMARY KEY,        -- save_id
  crew_name TEXT NOT NULL,
  rep INTEGER NOT NULL DEFAULT 0,
  night INTEGER NOT NULL DEFAULT 1,
  prestige INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  signature_driver TEXT NOT NULL DEFAULT '',
  last_active TEXT NOT NULL,
  UNIQUE(crew_name)
);
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET /api/save` | Load game state | Returns full GameState JSON or 404 |
| `PUT /api/save` | Save game state | Accepts GameState JSON, persists to SQLite |
| `DELETE /api/save` | Delete save | Clears saved state |
| `POST /api/race/simulate` | Run server-side race | Accepts RaceSetup + driver/car/district data, returns RaceResult |
| `GET /api/leaderboard` | Top prestige rankings | Returns top 50 by rep, paginated |
| `GET /api/events` | SSE stream | Live event feed |

### Dev Flow
- `vite dev` on :5173 → proxies `/api/*` to Go :8080
- `go run ./cmd/midnight-shift` on :8080
- Production: Go serves `dist/` + API on single port

### Port the Simulator
- Mulberry32 PRNG (deterministic, seedable)
- Same tick-based simulation with driver/car stats
- Same event types, posture modifiers, hazard mechanics
- Returns identical RaceResult shape

### Phase 7 Completion Criteria
- [ ] Go project builds and serves API
- [ ] Save/load works round-trip (save, refresh page, load)
- [ ] Race simulator produces identical results to TS version
- [ ] Leaderboard returns top crews
- [ ] CORS allows localhost dev
- [ ] Tests for simulator and persistence

## Phase 8: Live Features

### SSE Event Stream
- Subscribe: `GET /api/events`
- Event types: `leaderboard_update`, `crew_challenge`, `night_change`
- Client reconnects on disconnect

### Crew-vs-Crew Challenges
- Challenge another player's crew (by crew name)
- Both sides get a race result
- Results posted to leaderboard and SSE stream

### Simple Auth
- Create save with crew name (acts as identity)
- API key auth for admin endpoints
- No passwords — this is a lightweight game, not a bank

### Phase 8 Completion Criteria
- [ ] SSE stream delivers live events
- [ ] Crew challenges work between two saves
- [ ] Leaderboard updates in real time

---

**Files changed:** New `server/` directory tree, new `vite.config.ts` proxy config  
**Risks:** SQLite write contention if multiple saves write simultaneously (low — single-player game)  
**Tradeoffs:** JSON blob storage gives flexibility but no querying sub-fields; acceptable for MVP
