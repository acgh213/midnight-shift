import { useEffect, useRef } from 'react';
import { useGameStore } from '../state/store';
import type { LeaderboardEntry } from '../types/game';

export function useSSE() {
  const setLeaderboard = useGameStore((s) => s.setLeaderboard);
  const setSseConnected = useGameStore((s) => s.setSseConnected);
  const addLiveEvent = useGameStore((s) => s.addLiveEvent);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/events');
    esRef.current = es;

    es.onopen = () => {
      setSseConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data } = payload;

        switch (type) {
          case 'leaderboard_update':
            setLeaderboard(data as LeaderboardEntry[]);
            break;
          case 'crew_challenge':
          case 'night_change':
            addLiveEvent(type, data);
            break;
        }
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      setSseConnected(false);
      // EventSource auto-reconnects
    };

    return () => {
      es.close();
      setSseConnected(false);
    };
  }, []);
}
