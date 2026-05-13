CREATE TABLE IF NOT EXISTS saves (
  id TEXT PRIMARY KEY,
  crew_name TEXT NOT NULL DEFAULT '',
  night INTEGER NOT NULL DEFAULT 1,
  prestige INTEGER NOT NULL DEFAULT 0,
  state_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id TEXT PRIMARY KEY,
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

CREATE INDEX IF NOT EXISTS idx_leaderboard_rep ON leaderboard(rep DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_prestige ON leaderboard(prestige DESC);
