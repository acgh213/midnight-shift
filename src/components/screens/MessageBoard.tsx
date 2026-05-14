import { useGameStore } from '../../state/store';
import { generatePosts, generateWelcomePosts } from '../../generators/message-board';
import type { MessageBoardPost, GameEvent } from '../../types/game';
import { useState, useEffect, useRef } from 'react';

function eventToPost(event: GameEvent): MessageBoardPost {
  const handle = event.crewName || 'Unknown Crew';
  const eventTypeMap: Record<string, MessageBoardPost['eventType']> = {
    challenge: 'challenge',
    poach: 'drama',
    taunt: 'drama',
    upgrade: 'crew_news',
    recruit: 'crew_news',
  };

  const tagMap: Record<string, string[]> = {
    challenge: ['challenge', event.crewName.toLowerCase().replace(/\s+/g, '-')],
    poach: ['poaching', 'drama'],
    taunt: ['smack-talk'],
    upgrade: ['garage'],
    recruit: ['recruitment'],
  };

  return {
    id: event.id,
    handle,
    timestamp: event.timestamp,
    content: event.description,
    district: event.districtId as any,
    eventType: eventTypeMap[event.type] || 'rumor',
    tags: tagMap[event.type] || ['city'],
  };
}

interface ChallengeResult {
  narrative?: string;
  outcome?: string;
  rewards?: { cash: number; rep: number };
}

export function MessageBoard() {
  const game = useGameStore((s) => s.game);
  const updateGame = useGameStore((s) => s.updateGame);
  const [posts, setPosts] = useState<MessageBoardPost[]>([]);
  const [challenging, setChallenging] = useState<string | null>(null);
  const [challengeResult, setChallengeResult] = useState<ChallengeResult | null>(null);
  const eventMap = useRef<Map<string, GameEvent>>(new Map());

  useEffect(() => {
    const seed = game.night * 1000 + game.completedRaceIds.length;

    // Build event map for challenge lookup
    const newEventMap = new Map<string, GameEvent>();
    (game.recentEvents || []).forEach((e) => newEventMap.set(e.id, e));
    eventMap.current = newEventMap;

    // Convert rival events to posts
    const eventPosts: MessageBoardPost[] = (game.recentEvents || [])
      .slice(-10)
      .map(eventToPost)
      .reverse(); // newest first

    let generatedPosts: MessageBoardPost[];
    if (game.completedRaceIds.length > 0) {
      const recentResults = game.completedRaceIds
        .map((id) => game.raceResults[id])
        .filter(Boolean);
      generatedPosts = generatePosts(seed, game.drivers, game.crews, recentResults, 6);
    } else {
      generatedPosts = generateWelcomePosts();
    }

    // Merge: rival events first, then generated posts (no dupes by id)
    const seenIds = new Set(eventPosts.map((p) => p.id));
    const uniqueGenerated = generatedPosts.filter((p) => !seenIds.has(p.id));

    setPosts([...eventPosts, ...uniqueGenerated].slice(0, 15));
  }, [game.night, game.completedRaceIds.length, game.recentEvents]);

  const handleAcceptChallenge = async (post: MessageBoardPost) => {
    const event = eventMap.current.get(post.id);
    if (!event) return;

    setChallenging(post.id);

    const race = {
      districtId: event.districtId || 'downtown',
      stakes: 'medium' as const,
      posture: 'clean' as const,
      duration: '30m' as const,
      playerCarIds: game.crews.player.cars.slice(0, 2),
      playerDriverIds: game.crews.player.drivers.slice(0, 2),
      endTime: Date.now() + 30 * 60 * 1000,
    };

    const district = game.districts[race.districtId as keyof typeof game.districts];
    if (!district) {
      setChallenging(null);
      return;
    }

    try {
      const res = await fetch('/api/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengerId: 'player',
          challengerName: game.crews.player.name,
          defenderId: event.crewId,
          race,
          drivers: game.drivers,
          cars: game.cars,
          district: {
            id: district.id,
            hazardChance: district.hazardList.length * 0.05,
          },
        }),
      });

      const result: ChallengeResult = await res.json();
      setChallengeResult(result);

      // Apply rewards if they exist
      if (result.rewards) {
        updateGame({
          economy: {
            ...game.economy,
            cash: game.economy.cash + (result.rewards.cash || 0),
            rep: game.economy.rep + (result.rewards.rep || 0),
          },
        });
      }
    } catch {
      // silent
    } finally {
      setChallenging(null);
    }
  };

  if (posts.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl text-neon-cyan tracking-wide">Message Board</h1>
        <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
          <p className="text-gray-500 text-sm">The city is quiet tonight.</p>
          <p className="text-gray-600 text-xs mt-2">Race results and crew drama will appear here.</p>
        </div>
      </div>
    );
  }

  const getPostColor = (type: MessageBoardPost['eventType']) => {
    switch (type) {
      case 'race_result': return 'border-l-green-500';
      case 'drama': return 'border-l-neon-pink';
      case 'challenge': return 'border-l-neon-amber';
      case 'rumor': return 'border-l-neon-cyan';
      case 'crew_news': return 'border-l-neon-purple';
      default: return 'border-l-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl text-neon-cyan tracking-wide">Message Board</h1>

      {/* Challenge result modal */}
      {challengeResult && (
        <div className="bg-midnight border border-neon-amber/40 rounded p-4 space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-neon-amber text-sm font-bold">Challenge Result</h2>
            <button
              onClick={() => setChallengeResult(null)}
              className="text-gray-500 hover:text-gray-300 text-xs"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-gray-300">{challengeResult.narrative}</p>
          <p className="text-xs text-neon-cyan font-bold">{challengeResult.outcome}</p>
          {challengeResult.rewards && (
            <p className="text-[10px] text-green-400">
              +{challengeResult.rewards.cash} cash · +{challengeResult.rewards.rep} rep
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        {posts.map((post) => (
          <div
            key={post.id}
            className={`bg-midnight border border-neon-cyan/20 rounded p-3 border-l-2 ${getPostColor(post.eventType)}`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-neon-pink font-bold">{post.handle}</span>
              <span className="text-[9px] text-gray-600">
                {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">{post.content}</p>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {post.tags.map((tag) => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Challenge buttons */}
            {post.eventType === 'challenge' && !challengeResult && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleAcceptChallenge(post)}
                  disabled={challenging === post.id}
                  className="text-[10px] px-3 py-1 bg-neon-pink/20 text-neon-pink rounded hover:bg-neon-pink/30 disabled:opacity-50 disabled:cursor-wait"
                >
                  {challenging === post.id ? 'Racing…' : 'Accept Challenge'}
                </button>
                <button className="text-[10px] px-3 py-1 bg-gray-800 text-gray-500 rounded hover:bg-gray-700">
                  Decline
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
