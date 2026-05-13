export function CityMap() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl text-neon-cyan font-display tracking-wide">City Map</h1>
      <div className="grid grid-cols-2 gap-3">
        {['Industrial', 'Downtown', 'Coastal', 'Mountain', 'Underground', 'The Strip'].map((d) => (
          <div
            key={d}
            className="bg-midnight border border-neon-cyan/20 rounded p-3 hover:border-neon-pink/50 cursor-pointer transition-colors"
          >
            <div className="text-sm text-neon-pink">{d}</div>
            <div className="text-xs text-gray-500 mt-1">Control: 0%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
