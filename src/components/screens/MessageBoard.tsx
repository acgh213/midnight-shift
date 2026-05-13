export function MessageBoard() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl text-neon-cyan font-display tracking-wide">Message Board</h1>
      <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
        <p className="text-gray-500 text-sm">The city is quiet tonight.</p>
        <p className="text-gray-600 text-xs mt-2">Race results and crew drama will appear here.</p>
      </div>
    </div>
  );
}
