import { useGameStore } from '../../state/store';
import { generatePosts, generateWelcomePosts } from '../../generators/message-board';
import type { MessageBoardPost } from '../../types/game';
import { useState, useEffect } from 'react';

export function MessageBoard() {
  const game = useGameStore((s) => s.game);
  const [posts, setPosts] = useState<MessageBoardPost[]>([]);

  useEffect(() => {
    // Generate posts based on current game state
    const seed = game.night * 1000 + game.completedRaceIds.length;
    if (game.completedRaceIds.length > 0) {
      const recentResults = game.completedRaceIds
        .map((id) => game.raceResults[id])
        .filter(Boolean);
      setPosts(generatePosts(seed, game.drivers, game.crews, recentResults, 8));
    } else {
      setPosts(generateWelcomePosts());
    }
  }, [game.night, game.completedRaceIds.length]);

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
