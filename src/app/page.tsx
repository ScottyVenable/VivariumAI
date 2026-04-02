'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Globe, Cpu, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Timeline {
  id: string;
  name: string;
  worldType: string;
  globalMood: number;
  createdAt: string;
  _count: { bots: number; posts: number };
}

export default function HomePage() {
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [worldType, setWorldType] = useState('EARTH_MIRROR');
  const [botCount, setBotCount] = useState(20);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/timelines')
      .then(r => r.json())
      .then((data: Timeline[]) => setTimelines(data))
      .catch(console.error);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/timelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, worldType, initialBotCount: botCount }),
      });
      const timeline = await res.json() as Timeline;
      setTimelines(prev => [timeline, ...prev]);
      setCreating(false);
      setNewName('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex flex-col">
      <header className="border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-black text-white tracking-tight sm:text-2xl">
              V I V A R I U M
            </h1>
            <p className="text-gray-500 text-[11px] mt-0.5 sm:text-xs">
              Multi-agent social simulation engine
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            aria-label="New Timeline"
            className="flex items-center gap-2 whitespace-nowrap px-3 py-2 bg-white text-black font-bold text-xs rounded-full hover:bg-gray-200 transition-colors sm:px-4 sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Timeline</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full px-4 py-6 flex-1 sm:px-6 sm:py-8">
        {creating && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-950 border border-white/20 rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto sm:p-6">
              <h2 className="text-xl font-bold text-white mb-4">Create New Timeline</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label htmlFor="timeline-name" className="text-sm text-gray-400 block mb-1">
                    Timeline Name
                  </label>
                  <input
                    id="timeline-name"
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Terra Nova, Sector 7..."
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-white/40 text-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="world-type" className="text-sm text-gray-400 block mb-1">
                    World Type
                  </label>
                  <select
                    id="world-type"
                    value={worldType}
                    onChange={e => setWorldType(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white/40 text-sm appearance-none"
                  >
                    <option value="EARTH_MIRROR">🌍 Earth Mirror</option>
                    <option value="SYNTHETIC_WORLD">⚡ Synthetic World</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">
                    Initial Bot Population: {botCount}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={botCount}
                    onChange={e => setBotCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>5</span>
                    <span>100</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="flex-1 py-2.5 border border-white/20 text-gray-400 hover:text-white rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newName.trim()}
                    className="flex-1 py-2.5 bg-white text-black font-bold rounded-xl text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Generating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {timelines.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🌿</div>
            <h2 className="text-xl font-bold text-white mb-2">No timelines yet</h2>
            <p className="text-gray-500 text-sm mb-6">
              Create your first timeline to begin the simulation.
            </p>
            <button
              onClick={() => setCreating(true)}
              className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors text-sm sm:text-base"
            >
              Create Timeline
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {timelines.map(tl => (
              <Link
                key={tl.id}
                href={`/timeline/${tl.id}`}
                className="block bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white text-lg group-hover:text-blue-300 transition-colors">
                      {tl.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Globe className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-500 text-xs">
                        {tl.worldType === 'EARTH_MIRROR' ? 'Earth Mirror' : 'Synthetic World'}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                      tl.globalMood > 0.66
                        ? 'bg-green-400'
                        : tl.globalMood < 0.34
                        ? 'bg-red-400'
                        : 'bg-yellow-400'
                    }`}
                    title={`Global mood: ${Math.round(tl.globalMood * 100)}%`}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 sm:gap-4">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5" />
                    {tl._count.bots} entities
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    {tl._count.posts} posts
                  </span>
                  <span className="flex items-center gap-1 sm:ml-auto">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDistanceToNow(new Date(tl.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
