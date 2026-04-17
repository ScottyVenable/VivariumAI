'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, Cpu, Globe, Plus } from 'lucide-react';
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

const WORLD_COPY: Record<string, string> = {
  EARTH_MIRROR: 'Earth Mirror',
  SYNTHETIC_WORLD: 'Synthetic World',
};

const formatWorldType = (type: string) => WORLD_COPY[type] ?? 'Custom';

const moodTag = (value: number) => {
  if (value >= 0.66) return { label: 'Positive', dotClass: 'bg-emerald-400' };
  if (value <= 0.33) return { label: 'Tense', dotClass: 'bg-amber-400' };
  return { label: 'Neutral', dotClass: 'bg-zinc-400' };
};

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
  const router = useRouter();
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [worldType, setWorldType] = useState<WorldType>(adminConfig.timeline.defaultWorldType);
  const [botCount, setBotCount] = useState<number>(adminConfig.timeline.initialBotCount.default);
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingTimelineId, setDeletingTimelineId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/timelines')
      .then(async r => {
        const contentType = r.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Timelines API returned a non-JSON response.');
        }

        const payload = (await r.json()) as unknown;
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
    if (!newName.trim() || loading) return;
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

      const payload = (await res.json()) as unknown;

      if (!res.ok) {
        const message =
          payload &&
          typeof payload === 'object' &&
          'error' in payload &&
          typeof (payload as { error?: unknown }).error === 'string'
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
      router.push(`/timeline/${timeline.id}`);
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
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;

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

  useEffect(() => {
    if (creating) {
      setTimeout(() => nameInputRef.current?.focus(), 80);
    }
  }, [creating]);

  const stats = useMemo(() => {
    const totalBots = timelines.reduce((acc, item) => acc + (item._count?.bots ?? 0), 0);
    const totalPosts = timelines.reduce((acc, item) => acc + (item._count?.posts ?? 0), 0);
    const avgMood =
      timelines.length > 0
        ? Math.round((timelines.reduce((acc, item) => acc + item.globalMood, 0) / timelines.length) * 100)
        : 0;
    return { totalBots, totalPosts, avgMood };
  }, [timelines]);

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-black">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-black/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">Vivarium</h1>
            <p className="text-xs text-zinc-500">Local social simulation</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-100"
          >
            <Plus className="h-4 w-4" />
            New Timeline
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto px-4 py-5 pb-24 sm:px-6">
        {creating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-black p-5">
              <h2 className="mb-1 text-xl font-semibold text-white">Create timeline</h2>
              <p className="mb-4 text-sm text-zinc-400">
                Start a new simulation feed.
              </p>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label htmlFor="timeline-name" className="mb-1 block text-xs font-medium text-zinc-400">
                    Timeline Name
                  </label>
                  <input
                    id="timeline-name"
                    ref={nameInputRef}
                    type="text"
                    value={newName}
                    onChange={e => {
                      setNewName(e.target.value);
                      if (createError) setCreateError(null);
                    }}
                    placeholder="e.g. The World"
                    className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white placeholder:text-zinc-500"
                  />
                </div>

                <div>
                  <label htmlFor="world-type" className="mb-1 block text-xs font-medium text-zinc-400">
                    World Type
                  </label>
                  <select
                    id="world-type"
                    value={worldType}
                    onChange={e => setWorldType(e.target.value as WorldType)}
                    className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white"
                  >
                    <option value="EARTH_MIRROR">Earth Mirror</option>
                    <option value="SYNTHETIC_WORLD">Synthetic World</option>
                  </select>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
                    <span>Initial bots</span>
                    <span>{botCount}</span>
                  </div>
                  <input
                    type="range"
                    min={String(adminConfig.timeline.initialBotCount.min)}
                    max={String(adminConfig.timeline.initialBotCount.max)}
                    value={botCount}
                    onChange={e => setBotCount(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="flex-1 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm text-zinc-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newName.trim()}
                    className="flex-1 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                </div>

                {createError && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {createError}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        <section className="mb-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5">
            <div className="text-xs text-zinc-500">Timelines</div>
            <div className="mt-1 text-lg font-semibold text-white">{timelines.length}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5">
            <div className="text-xs text-zinc-500">Entities</div>
            <div className="mt-1 text-lg font-semibold text-white">{stats.totalBots}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5">
            <div className="text-xs text-zinc-500">Mood</div>
            <div className="mt-1 text-lg font-semibold text-white">{stats.avgMood}%</div>
          </div>
        </section>

        {timelines.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 px-6 py-16 text-center">
            <h2 className="text-xl font-semibold text-white">No timelines yet</h2>
            <p className="mt-2 text-sm text-zinc-500">Create your first simulation timeline.</p>
            <button
              onClick={() => setCreating(true)}
              className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
            >
              Create timeline
            </button>
          </div>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-black">
            {timelines.map(tl => {
              const mood = moodTag(tl.globalMood);
              return (
                <article
                  key={tl.id}
                  className="border-b border-zinc-800 px-4 py-4 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <Link href={`/timeline/${tl.id}`} className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold text-white">{tl.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5" />
                          {formatWorldType(tl.worldType)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Cpu className="h-3.5 w-3.5" />
                          {tl._count?.bots ?? 0} entities
                        </span>
                        <span>{tl._count?.posts ?? 0} posts</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDistanceToNow(new Date(tl.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </Link>

                    <div className="flex flex-col items-end gap-2">
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                        <span className={`h-2 w-2 rounded-full ${mood.dotClass}`} />
                        {mood.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/timeline/${tl.id}`}
                          className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-white hover:border-zinc-500"
                        >
                          Open
                        </Link>
                        <button
                          type="button"
                          disabled={deletingTimelineId === tl.id}
                          onClick={() => void handleDeleteTimeline(tl)}
                          className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-red-400 hover:text-red-200 disabled:opacity-40"
                        >
                          {deletingTimelineId === tl.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {deleteError && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {deleteError}
          </div>
        )}
      </div>

      <MobileBottomNav />
    </main>
  );
}
