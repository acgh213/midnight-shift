import type { GameSettings } from '../../types/game';

export function Settings() {
  const settings: GameSettings = {
    crtScanlines: false,
    soundEnabled: true,
    musicVolume: 50,
    sfxVolume: 80,
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl text-neon-cyan font-display tracking-wide">Settings</h1>
      <div className="bg-midnight border border-neon-cyan/20 rounded p-4 space-y-3">
        <label className="flex items-center justify-between">
          <span className="text-sm">CRT Scanlines</span>
          <input type="checkbox" checked={settings.crtScanlines} readOnly className="accent-neon-pink" />
        </label>
        <label className="flex items-center justify-between">
          <span className="text-sm">Sound</span>
          <input type="checkbox" checked={settings.soundEnabled} readOnly className="accent-neon-pink" />
        </label>
        <div className="pt-4 border-t border-neon-cyan/10">
          <p className="text-xs text-gray-600 text-center">Midnight Shift v0.1.0</p>
        </div>
      </div>
    </div>
  );
}
