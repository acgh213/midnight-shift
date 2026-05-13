import { useEffect } from 'react';
import { useGameStore } from '../../state/store';
import type { LeaderboardEntry } from '../../types/game';

export function Leaderboard() {
  const leaderboard = useGameStore((s) => s.leaderboard);
  const sseConnected = useGameStore((s) => s.sseConnected);
  const setLeaderboard = useGameStore((s) => s.setLeaderboard);
  const game = useGameStore((s) => s.game);

  useEffect(() => {
    // Initial REST fetch — SSE will keep it live after
    fetch('/api/leaderboard?limit=10')
      .then((r) => r.json())
      .then((data) => {
        if (data.entries) setLeaderboard(data.entries);
      })
      .catch(() => {});
  }, []);

  const playerCrewName = game.crews.player?.name || 'Midnight Crew';

  if (leaderboard.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl text-neon-cyan tracking-wide">Leaderboard</h1>
        <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
          <p className="text-gray-500 text-sm">Loading standings…</p>
          <p className="text-gray-600 text-xs mt-2">
            {sseConnected ? 'Connected — live updates active.' : 'Connecting to server…'}
          </p>
        </div>
      </div>
    );
  }

  const rankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-neon-cyan tracking-wide">Leaderboard</h1>
        <span
          className={`text-[10px] px-2 py-0.5 rounded ${
            sseConnected ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'
          }`}
        >
          {sseConnected ? '● LIVE' : '○ offline'}
        </span>
      </div>

      <div className="bg-midnight border border-neon-cyan/20 rounded overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_80px_50px_50px] gap-2 px-3 py-2 bg-neon-cyan/5 border-b border-neon-cyan/10 text-[9px] uppercase tracking-wider text-gray-500">
          <span className="text-center">#</span>
          <span>Crew</span>
          <span className="text-right">Prestige</span>
          <span className="text-right">W</span>
          <span className="text-right">L</span>
        </div>

        {leaderboard.map((entry: LeaderboardEntry) => {
          const isPlayer = entry.crewName === playerCrewName;
          const topThree = entry.rank <= 3;
          return (
            <div
              key={entry.rank}
              className={`grid grid-cols-[40px_1fr_80px_50px_50px] gap-2 px-3 py-2.5 border-b border-neon-cyan/5 text-xs transition-colors ${
                isPlayer
                  ? 'bg-neon-pink/10 border-neon-pink/20'
                  : topThree
                  ? 'bg-neon-amber/5'
                  : 'hover:bg-white/5'
              }`}
            >
              <span
                className={`text-center font-bold ${
                  topThree ? 'text-neon-amber' : 'text-gray-500'
                }`}
              >
                {rankIcon(entry.rank)}
              </span>
              <span className={isPlayer ? 'text-neon-pink font-bold' : 'text-gray-200'}>
                {entry.crewName}
              </span>
              <span className="text-right text-neon-purple tabular-nums">{entry.prestige}</span>
              <span className="text-right text-green-400 tabular-nums">{entry.wins}</span>
              <span className="text-right text-red-400 tabular-nums">{entry.losses}</span>
            </div>
          );
        })}
      </div>

      <p className="text-[9px] text-gray-600 text-center">
        Rankings update live. Win races to climb.
      </p>
    </div>
  );
}
