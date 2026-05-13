import { useGameStore } from '../../state/store';
import { generatePosts, generateWelcomePosts } from '../../generators/message-board';
import type { MessageBoardPost, GameEvent } from '../../types/game';
import { useState, useEffect } from 'react';

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

export function MessageBoard() {
  const game = useGameStore((s) => s.game);
  const [posts, setPosts] = useState<MessageBoardPost[]>([]);

  useEffect(() => {
    const seed = game.night * 1000 + game.completedRaceIds.length;

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
            <div className="flex gap-1 mt-1.5">
              {post.tags.map((tag) => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
