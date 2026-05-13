import { useGameStore } from '../../state/store';
import type { DebugEvent } from '../../types/game';

export function DebugScreen() {
  const debugEvents = useGameStore((s) => s.debugEvents);
  const game = useGameStore((s) => s.game);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
  };

  const formatData = (data: unknown): string => {
    if (data === undefined) return '';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-neon-cyan tracking-wide">Debug</h1>
        <span className="text-[10px] text-gray-500">{debugEvents.length} events</span>
      </div>

      {/* Current state snapshot */}
      <div className="bg-midnight border border-neon-amber/30 rounded p-3">
        <h2 className="text-xs text-neon-amber uppercase tracking-wider mb-2">Current State</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono">
          <span className="text-gray-500">Cash:</span>
          <span className="text-neon-amber">${game.economy.cash}</span>
          <span className="text-gray-500">Rep:</span>
          <span className="text-neon-cyan">{game.economy.rep}</span>
          <span className="text-gray-500">Night:</span>
          <span className="text-neon-pink">{game.night}</span>
          <span className="text-gray-500">Completed races:</span>
          <span className="text-green-400">{game.completedRaceIds.length}</span>
          <span className="text-gray-500">Active races:</span>
          <span className="text-yellow-400">{game.activeRaces.length}</span>
          <span className="text-gray-500">Drivers:</span>
          <span className="text-gray-300">{Object.keys(game.drivers).length}</span>
          <span className="text-gray-500">Cars:</span>
          <span className="text-gray-300">{Object.keys(game.cars).length}</span>
        </div>
        <div className="mt-2 text-[10px]">
          <span className="text-gray-500">District control: </span>
          {Object.entries(game.districts).map(([id, d]) => (
            <span key={id} className="ml-2">
              <span className="text-gray-600">{d.name}</span>{' '}
              <span className={d.controlPercent > 50 ? 'text-green-400' : d.controlPercent > 0 ? 'text-neon-amber' : 'text-gray-500'}>
                {d.controlPercent}%
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Debug event log */}
      <div className="bg-midnight border border-neon-cyan/20 rounded overflow-hidden">
        <div className="px-3 py-2 bg-neon-cyan/5 border-b border-neon-cyan/10 text-[9px] uppercase tracking-wider text-gray-500 flex justify-between">
          <span>Event Log (newest first)</span>
          <span># · Time · Message</span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {debugEvents.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-600">
              No debug events yet. Start a race to populate.
            </div>
          ) : (
            debugEvents.map((evt: DebugEvent) => (
              <div
                key={evt.id}
                className={`px-3 py-1.5 border-b border-neon-cyan/5 text-[10px] font-mono leading-relaxed ${
                  evt.message.includes('FAILED')
                    ? 'bg-red-500/10 text-red-400'
                    : evt.message.includes('SUCCESS') || evt.message.includes('updateGame')
                    ? 'bg-green-500/5 text-green-400'
                    : evt.message.includes('timeout')
                    ? 'bg-neon-amber/5 text-neon-amber'
                    : evt.message.includes('cleanup')
                    ? 'bg-purple-500/5 text-purple-400'
                    : 'text-gray-400'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-gray-600 shrink-0 w-5 text-right">#{evt.id}</span>
                  <span className="text-gray-500 shrink-0 w-20">{formatTime(evt.timestamp)}</span>
                  <span className="flex-1">{evt.message}</span>
                </div>
                {evt.data !== undefined && (
                  <pre className="mt-1 ml-7 text-[9px] text-gray-500 whitespace-pre-wrap break-all overflow-x-auto max-h-32">
                    {formatData(evt.data)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
