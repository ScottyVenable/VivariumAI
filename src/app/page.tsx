'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Globe, Cpu, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { adminConfig } from '@config/admin';
import type { WorldType } from '@/lib/validation';

interface Timeline {
  id: string;
  name: string;
  worldType: string;
  globalMood: number;
  createdAt: string;
  _count: { bots: number; posts: number };
}

function normalizeTimeline(input: unknown): Timeline | null {
  if (!input || typeof input !== 'object') return null;
  const value = input as Partial<Timeline> & { _count?: Partial<Timeline['_count']> };

  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.worldType !== 'string' ||
    typeof value.globalMood !== 'number' ||
    typeof value.createdAt !== 'string'
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    worldType: value.worldType,
    globalMood: value.globalMood,
    createdAt: value.createdAt,
    _count: {
      bots: typeof value._count?.bots === 'number' ? value._count.bots : 0,
      posts: typeof value._count?.posts === 'number' ? value._count.posts : 0,
    },
  };
}

export default function HomePage() {
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [worldType, setWorldType] = useState<WorldType>(adminConfig.timeline.defaultWorldType);
  const [botCount, setBotCount] = useState<number>(adminConfig.timeline.initialBotCount.default);
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingTimelineId, setDeletingTimelineId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/timelines')
      .then(async r => {
        const contentType = r.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Timelines API returned a non-JSON response.');
        }

        const payload = await r.json() as unknown;
        if (!r.ok) {
          const message =
            payload && typeof payload === 'object' && 'error' in payload
              ? String((payload as { error?: unknown }).error || 'Failed to load timelines.')
              : 'Failed to load timelines.';
          throw new Error(message);
        }

        const list = Array.isArray(payload)
          ? payload.map(normalizeTimeline).filter((item): item is Timeline => item !== null)
          : [];

        setTimelines(list);
      })
      .catch(console.error);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/timelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, worldType, initialBotCount: botCount }),
      });

      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (!isJson) {
        const fallbackText = await res.text();
        throw new Error(
          fallbackText?.trim() || 'Timeline creation failed with a non-JSON response.'
        );
      }

      const payload = await res.json() as unknown;

      if (!res.ok) {
        const message =
          payload && typeof payload === 'object' && 'error' in payload && typeof (payload as { error?: unknown }).error === 'string'
            ? (payload as { error: string }).error
            : 'Timeline creation failed.';
        throw new Error(message);
      }

      const timeline = normalizeTimeline(payload);
      if (!timeline) {
        throw new Error('Timeline was created but response format was invalid.');
      }

      setTimelines(prev => [timeline, ...prev]);
      setCreating(false);
      setNewName('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Timeline creation failed.';
      setCreateError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimeline = async (timeline: Timeline) => {
    if (deletingTimelineId) return;
    const shouldDelete = window.confirm(`Delete timeline "${timeline.name}"? This cannot be undone.`);
    if (!shouldDelete) return;

    setDeleteError(null);
    setDeletingTimelineId(timeline.id);
    try {
      const res = await fetch(`/api/timelines/${timeline.id}`, { method: 'DELETE' });
      const payload = await res.json().catch(() => null) as { error?: string } | null;

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to delete timeline.');
      }

      setTimelines(prev => prev.filter(item => item.id !== timeline.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete timeline.';
      setDeleteError(message);
      console.error(err);
    } finally {
      setDeletingTimelineId(null);
    }
  };

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-black">
      <header className="border-b border-zinc-900 px-4 py-3 sm:px-6 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-black text-white tracking-tight sm:text-2xl">
              V I V A R I U M
            </h1>
            <p className="text-zinc-500 text-[11px] mt-0.5 sm:text-xs">
              Multi-agent social simulation engine
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            aria-label="New Timeline"
            className="flex items-center gap-2 whitespace-nowrap rounded-xl border border-zinc-800 bg-[#111111] px-3 py-2 text-xs font-semibold text-zinc-100 transition-colors hover:bg-zinc-900 sm:px-4 sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Timeline</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-10">
        {creating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-800 bg-[#111111] p-5 sm:p-6">
              <h2 className="text-xl font-bold text-white mb-4">Create New Timeline</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label htmlFor="timeline-name" className="text-sm text-zinc-400 block mb-1">
                    Timeline Name
                  </label>
                  <input
                    id="timeline-name"
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Terra Nova, Sector 7..."
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="world-type" className="text-sm text-zinc-400 block mb-1">
                    World Type
                  </label>
                  <select
                    id="world-type"
                    value={worldType}
                    onChange={e => setWorldType(e.target.value as WorldType)}
                    className="w-full appearance-none rounded-xl border border-zinc-800 bg-black px-4 py-2.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                  >
                    <option value="EARTH_MIRROR">Earth Mirror</option>
                    <option value="SYNTHETIC_WORLD">Synthetic World</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 block mb-1">
                    Initial Bot Population: {botCount}
                  </label>
                  <input
                    type="range"
                    min={String(adminConfig.timeline.initialBotCount.min)}
                    max={String(adminConfig.timeline.initialBotCount.max)}
                    value={botCount}
                    onChange={e => setBotCount(parseInt(e.target.value))}
                    className="w-full accent-zinc-400"
                  />
                  <div className="mt-1 flex justify-between text-xs text-zinc-600">
                    <span>{adminConfig.timeline.initialBotCount.min}</span>
                    <span>{adminConfig.timeline.initialBotCount.max}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="flex-1 rounded-xl border border-zinc-800 py-2.5 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newName.trim()}
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-100 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'Create'}
                  </button>
                </div>
                {createError && (
                  <div className="rounded-lg border border-red-900 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                    {createError}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {timelines.length === 0 ? (
          <div className="text-center py-24">
            <h2 className="text-xl font-bold text-white mb-2">No timelines yet</h2>
            <p className="text-zinc-500 text-sm mb-6">
              Create your first timeline to begin the simulation.
            </p>
            <button
              onClick={() => setCreating(true)}
              className="rounded-xl border border-zinc-700 bg-zinc-100 px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-white sm:text-base"
            >
              Create Timeline
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {timelines.map(tl => (
              <div
                key={tl.id}
                className="group rounded-3xl border border-zinc-900/50 bg-[#111111] p-5 transition-colors hover:border-zinc-800/70 hover:bg-[#141414]"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <Link href={`/timeline/${tl.id}`} className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold text-white transition-colors group-hover:text-zinc-200">
                      {tl.name}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-zinc-500" />
                      <span className="text-xs text-zinc-500">
                        {tl.worldType === 'EARTH_MIRROR' ? 'Earth Mirror' : 'Synthetic World'}
                      </span>
                    </div>
                  </Link>
                  <button
                    type="button"
                    disabled={deletingTimelineId === tl.id}
                    onClick={() => void handleDeleteTimeline(tl)}
                    className="rounded-lg border border-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-red-800 hover:text-red-300 disabled:opacity-50"
                    aria-label={`Delete ${tl.name}`}
                  >
                    {deletingTimelineId === tl.id ? 'Deleting…' : 'Delete'}
                  </button>
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
                <Link href={`/timeline/${tl.id}`} className="block">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 sm:gap-4">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5" />
                      {tl._count?.bots ?? 0} entities
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      {tl._count?.posts ?? 0} posts
                    </span>
                    <span className="flex items-center gap-1 sm:ml-auto">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDistanceToNow(new Date(tl.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
        {deleteError && (
          <div className="mt-4 rounded-lg border border-red-900 bg-red-950/30 px-3 py-2 text-xs text-red-300">
            {deleteError}
          </div>
        )}
      </div>

      <MobileBottomNav />
    </main>
  );
}
