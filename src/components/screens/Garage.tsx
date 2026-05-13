export function Garage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl text-neon-cyan font-display tracking-wide">Garage</h1>
      <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
        <p className="text-gray-500 text-sm">No cars in your garage yet.</p>
        <p className="text-gray-600 text-xs mt-2">Win races to earn cash and build your fleet.</p>
      </div>
    </div>
  );
}
