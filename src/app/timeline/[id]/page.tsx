'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Cpu, Globe, Trash2 } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { PostDetailModal } from '@/components/PostDetailModal';
import { ProfileSheet } from '@/components/ProfileSheet';
import { PulseSidebar } from '@/components/PulseSidebar';
import { GodModeDashboard } from '@/components/GodModeDashboard';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { adminConfig } from '@config/admin';

const LIKED_STORAGE_KEY = 'vivarium_liked_posts';

interface Post {
  id: string;
  content: string;
  hashtags: string[];
  emotionalState?: string | null;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    tier: string;
    occupation: string;
  };
}

interface Timeline {
  id: string;
  name: string;
  worldType: string;
  globalMood: number;
  _count: { bots: number; posts: number };
}

const WORLD_TYPE_LABELS: Record<string, string> = {
  EARTH_MIRROR: 'Earth Mirror',
  SYNTHETIC_WORLD: 'Synthetic World',
};

const formatWorldBadge = (value?: string) => {
  if (!value) return 'Simulation';
  return WORLD_TYPE_LABELS[value] ?? value.replace(/_/g, ' ');
};

interface Bot {
  id: string;
  displayName: string;
  tier: string;
  username: string;
}

interface FeedData {
  posts: Post[];
  total: number;
  page: number;
  totalPages: number;
}

type TickLastResult = 'idle' | 'success' | 'error';
type LlmChipState = 'idle' | 'active' | 'failed' | 'complete';

interface TickRuntimeStatus {
  inProgress: boolean;
  lastResult: TickLastResult;
  lastUpdatedAt: string | null;
  lastError: string | null;
}

interface TickStatusResponse {
  running: boolean;
  llm?: TickRuntimeStatus;
}

export default function TimelinePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const timelineId = params.id as string;

  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedPage, setFeedPage] = useState(1);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [globalMood, setGlobalMood] = useState(0.5);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [isSimRunning, setIsSimRunning] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [feedMode, setFeedMode] = useState<'for-you' | 'latest'>('for-you');
  const [deletingTimeline, setDeletingTimeline] = useState(false);
  const [timelineDeleteError, setTimelineDeleteError] = useState<string | null>(null);
  const [llmChipState, setLlmChipState] = useState<LlmChipState>('idle');
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const deriveLlmChipState = useCallback((status?: TickRuntimeStatus): LlmChipState => {
    if (!status) return 'idle';
    if (status.inProgress) return 'active';

    const updatedAt = status.lastUpdatedAt ? Date.parse(status.lastUpdatedAt) : NaN;
    const ageMs = Number.isFinite(updatedAt) ? Date.now() - updatedAt : Number.POSITIVE_INFINITY;

    if (status.lastResult === 'error' && ageMs <= 15000) return 'failed';
    if (status.lastResult === 'success' && ageMs <= 7000) return 'complete';
    return 'idle';
  }, []);

  const loadTickStatus = useCallback(async () => {
    try {
      const simRes = await fetch(`/api/timelines/${timelineId}/tick`);
      const simData = await simRes.json() as TickStatusResponse;
      setIsSimRunning(Boolean(simData.running));
      setLlmChipState(deriveLlmChipState(simData.llm));
    } catch (err) {
      console.error(err);
    }
  }, [deriveLlmChipState, timelineId]);

  // Hydrate liked state from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LIKED_STORAGE_KEY);
      if (raw) {
        setLikedPostIds(new Set(JSON.parse(raw) as string[]));
      }
    } catch {
      // ignore
    }
  }, []);

  const persistLike = (postId: string) => {
    setLikedPostIds(prev => {
      const next = new Set(prev);
      next.add(postId);
      try {
        localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const sortedPosts = useMemo(() => {
    const copy = [...posts];
    if (feedMode === 'latest') {
      return copy.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }

    // For-You: engagement-weighted with a 48-hour recency decay
    const now = Date.now();
    return copy.sort((a, b) => {
      const ageHoursA = (now - +new Date(a.createdAt)) / (1000 * 60 * 60);
      const ageHoursB = (now - +new Date(b.createdAt)) / (1000 * 60 * 60);
      const recencyA = Math.max(0, 48 - ageHoursA) * 1.5;
      const recencyB = Math.max(0, 48 - ageHoursB) * 1.5;
      const scoreA = a.likeCount * 3 + a.replyCount * 5 + recencyA;
      const scoreB = b.likeCount * 3 + b.replyCount * 5 + recencyB;
      return scoreB - scoreA;
    });
  }, [feedMode, posts]);

  const loadData = useCallback(async () => {
    try {
      const [timelineRes, feedRes, botsRes] = await Promise.all([
        fetch(`/api/timelines/${timelineId}`),
        fetch(`/api/timelines/${timelineId}/feed?limit=30&page=1`),
        fetch(`/api/timelines/${timelineId}/bots`),
      ]);

      const [tl, feedData, botsData] = await Promise.all([
        timelineRes.json() as Promise<Timeline>,
        feedRes.json() as Promise<FeedData>,
        botsRes.json() as Promise<Bot[]>,
      ]);

      setTimeline(tl);
      setGlobalMood(tl.globalMood ?? 0.5);
      setPosts(feedData.posts || []);
      setFeedPage(1);
      setFeedHasMore((feedData.posts?.length ?? 0) >= 30 && feedData.page < feedData.totalPages);
      setBots(botsData || []);
    } catch (err) {
      console.error(err);
    }
  }, [timelineId]);

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !feedHasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = feedPage + 1;
      const res = await fetch(`/api/timelines/${timelineId}/feed?limit=30&page=${nextPage}`);
      if (!res.ok) return;
      const feedData = await res.json() as Promise<FeedData>;
      const data = await (Promise.resolve(feedData) as Promise<FeedData>);
      const newPosts = data.posts || [];
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        return [...prev, ...newPosts.filter(p => !existingIds.has(p.id))];
      });
      setFeedPage(nextPage);
      setFeedHasMore(newPosts.length >= 30 && nextPage < data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [feedPage, feedHasMore, loadingMore, timelineId]);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        await loadData();
        await loadTickStatus();
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void initialize();
    const interval = setInterval(() => {
      void loadData();
    }, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [loadData, loadTickStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadTickStatus();
    }, isSimRunning ? 2500 : 6000);

    return () => clearInterval(interval);
  }, [isSimRunning, loadTickStatus]);

  useEffect(() => {
    const postFromQuery = searchParams.get('post');
    if (postFromQuery) {
      setSelectedPostId(postFromQuery);
    } else {
      setSelectedPostId(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!shareMessage) return;
    const timeout = setTimeout(() => setShareMessage(null), 1800);
    return () => clearTimeout(timeout);
  }, [shareMessage]);

  useEffect(() => {
    const textarea = composerRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [newPostText]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleMoodChange = async (mood: number) => {
    setGlobalMood(mood);
    await fetch(`/api/timelines/${timelineId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ globalMood: mood }),
    });
  };

  const handleAscend = async (botId: string) => {
    await fetch(`/api/bots/${botId}/ascend`, { method: 'POST' });
    await loadData();
  };

  const handleBan = async (botId: string) => {
    if (!confirm('Permanently ban this entity?')) return;
    await fetch(`/api/bots/${botId}`, { method: 'DELETE' });
    await loadData();
  };

  const handleToggleSim = async () => {
    const next = !isSimRunning;
    setIsSimRunning(next);
    try {
      await fetch(`/api/timelines/${timelineId}/tick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ running: next }),
      });
      if (next) {
        // Start polling while sim is running
        void loadData();
      }
      await loadTickStatus();
    } catch (err) {
      console.error(err);
      setIsSimRunning(!next); // revert on error
    }
  };

  const llmChipMeta = useMemo(() => {
    switch (llmChipState) {
      case 'active':
        return {
          label: 'LLM generating',
          className: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
        };
      case 'failed':
        return {
          label: 'LLM failed',
          className: 'border-red-500/40 bg-red-500/10 text-red-300',
        };
      case 'complete':
        return {
          label: 'LLM complete',
          className: 'border-green-500/40 bg-green-500/10 text-green-300',
        };
      case 'idle':
      default:
        return null;
    }
  }, [llmChipState]);

  const handleDeleteTimeline = async () => {
    if (!timeline) return;
    const confirmed = window.confirm(`Delete timeline "${timeline.name}"? This cannot be undone.`);
    if (!confirmed) return;

    setTimelineDeleteError(null);
    setDeletingTimeline(true);
    try {
      const res = await fetch(`/api/timelines/${timelineId}`, { method: 'DELETE' });
      const payload = await res.json().catch(() => null) as { error?: string } | null;

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to delete timeline');
      }

      router.push('/');
    } catch (error) {
      console.error(error);
      setTimelineDeleteError(error instanceof Error ? error.message : 'Failed to delete timeline');
      setDeletingTimeline(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (likedPostIds.has(postId)) return; // prevent double-like
    persistLike(postId);
    setPosts(prev =>
      prev.map(post =>
        post.id === postId ? { ...post, likeCount: post.likeCount + 1 } : post
      )
    );

    try {
      await fetch(`/api/timelines/${timelineId}/posts/${postId}/like`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPost = (postId: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('post', postId);
    router.replace(`/timeline/${timelineId}?${next.toString()}`, { scroll: false });
  };

  const handleOpenProfile = (botId: string) => {
    setSelectedProfileId(botId);
  };

  const handleMentionClick = useCallback((username: string) => {
    // Look up the bot id from the bots list and open their profile
    const found = bots.find(b => b.username.toLowerCase() === username.toLowerCase());
    if (found) {
      setSelectedProfileId(found.id);
    }
  }, [bots]);

  const handleSharePost = async (postId: string) => {
    try {
      const url = `${window.location.origin}/timeline/${timelineId}?post=${postId}`;
      await navigator.clipboard.writeText(url);
      setShareMessage('Link copied');
    } catch {
      setShareMessage('Could not copy link');
    }
  };

  const handleCreatePost = async () => {
    const content = newPostText.trim();
    if (!content || posting || content.length > adminConfig.content.maxLength) return;

    setPosting(true);
    setComposerError(null);
    try {
      const res = await fetch(`/api/timelines/${timelineId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Could not post right now' }));
        setComposerError(typeof data.error === 'string' ? data.error : 'Could not post right now');
        return;
      }

      const created = await res.json() as Post;
      setPosts(prev => [created, ...prev]);
      setNewPostText('');
      await loadData();
    } catch (err) {
      console.error(err);
      setComposerError('Network error while posting');
    } finally {
      setPosting(false);
    }
  };

  const handleClosePost = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete('post');
    const query = next.toString();
    router.replace(query ? `/timeline/${timelineId}?${query}` : `/timeline/${timelineId}`, { scroll: false });
    void loadData(); // refresh counts after modal closes
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
          <div className="text-sm text-zinc-400">Initializing timeline...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-black">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-black/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="rounded-xl border border-zinc-700 p-2 text-zinc-400 transition hover:text-white"
            aria-label="Back to timelines"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              <span className="rounded-full border border-zinc-700 px-2 py-0.5">
                {formatWorldBadge(timeline?.worldType)}
              </span>
              <span className="text-zinc-600">
                {timeline ? `ID·${timeline.id.slice(0, 6)}` : 'Local run'}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-white sm:text-2xl">{timeline?.name}</h1>
              {llmChipMeta && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${llmChipMeta.className}`}
                >
                  <Cpu className="h-3 w-3" />
                  {llmChipMeta.label}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5 text-zinc-400" />
                {timeline?._count.bots ?? 0} entities
              </span>
              <span className="inline-flex items-center gap-1">
                <Globe className="h-3.5 w-3.5 text-zinc-400" />
                {timeline?._count.posts ?? 0} posts
              </span>
              <span className={isSimRunning ? 'text-emerald-300' : 'text-zinc-500'}>
                {isSimRunning ? 'Simulation live' : 'Simulation paused'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-xl border border-zinc-700 p-2 text-zinc-400 transition hover:text-white disabled:opacity-40"
              title="Refresh feed"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => void handleDeleteTimeline()}
              disabled={deletingTimeline}
              className="rounded-xl border border-zinc-700 p-2 text-zinc-400 transition hover:border-red-400 hover:text-red-200 disabled:opacity-40"
              aria-label="Delete timeline"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        {shareMessage && (
          <div className="border-t border-zinc-800 bg-black px-4 py-2 text-center text-xs text-zinc-300">
            {shareMessage}
          </div>
        )}
        {timelineDeleteError && (
          <div className="border-t border-red-400/40 bg-red-500/10 px-4 py-2 text-center text-xs text-red-200">
            {timelineDeleteError}
          </div>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 pb-[5.5rem] sm:gap-5 sm:px-6 lg:flex-row">
        <PulseSidebar timelineId={timelineId} />

        <main className="order-2 min-w-0 flex-1 overflow-y-auto rounded-2xl border border-zinc-800 bg-black pb-24 lg:order-1 lg:pb-10">
          <div className="sticky top-0 z-20 border-b border-zinc-800 bg-black px-4 py-3">
            <div className="inline-flex rounded-full border border-zinc-700 bg-black p-1 text-[11px] font-semibold text-zinc-500">
              <button
                type="button"
                onClick={() => setFeedMode('for-you')}
                className={`rounded-full px-4 py-1 transition ${
                  feedMode === 'for-you' ? 'bg-white text-black' : 'text-zinc-500'
                }`}
              >
                For you
              </button>
              <button
                type="button"
                onClick={() => setFeedMode('latest')}
                className={`rounded-full px-4 py-1 transition ${
                  feedMode === 'latest' ? 'bg-white text-black' : 'text-zinc-500'
                }`}
              >
                Latest
              </button>
            </div>
          </div>

          <div className="space-y-6 px-2 py-4 sm:px-4">
            <section className="mx-auto max-w-3xl rounded-2xl border border-zinc-800 bg-black p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
                  Y
                </div>
                <div className="min-w-0 flex-1">
                  <textarea
                    ref={composerRef}
                    value={newPostText}
                    onChange={e => {
                      setNewPostText(e.target.value);
                      if (composerError) setComposerError(null);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void handleCreatePost();
                    }}
                    rows={3}
                    style={{ caretColor: 'auto' }}
                    placeholder="What's happening in your Vivarium?"
                    className="min-h-[72px] w-full resize-none bg-transparent text-lg leading-snug text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-blue-400">
                    <span className="rounded-full border border-zinc-700 px-2 py-0.5">
                      Everyone can reply
                    </span>
                  </div>
                  {composerError && (
                    <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                      {composerError}
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
                    <span>Cmd/Ctrl + Enter to post</span>
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          newPostText.trim().length > adminConfig.content.warningLength
                            ? 'text-orange-300'
                            : 'text-zinc-400'
                        }
                      >
                        {newPostText.trim().length}/{adminConfig.content.maxLength}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCreatePost()}
                        disabled={!newPostText.trim() || posting || newPostText.trim().length > adminConfig.content.maxLength}
                        className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-zinc-100 disabled:opacity-40"
                      >
                        {posting ? 'Posting…' : 'Post'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mx-auto max-w-3xl space-y-4">
              {posts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-700 px-6 py-12 text-center text-sm text-zinc-400">
                  The timeline is silent. Press Play in God Mode to wake the entities.
                </div>
              ) : (
                <>
                  {sortedPosts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      liked={likedPostIds.has(post.id)}
                      onLike={handleLike}
                      onOpen={handleOpenPost}
                      onShare={handleSharePost}
                      onOpenProfile={handleOpenProfile}
                      onMentionClick={handleMentionClick}
                    />
                  ))}
                  {feedHasMore && (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => void loadMorePosts()}
                        disabled={loadingMore}
                        className="rounded-full border border-zinc-700 bg-black px-6 py-2 text-sm font-semibold text-white transition hover:border-zinc-500 disabled:opacity-50"
                      >
                        {loadingMore ? 'Loading…' : 'Load more posts'}
                      </button>
                    </div>
                  )}
                  {!feedHasMore && posts.length > 0 && (
                    <div className="py-6 text-center text-xs text-zinc-500">
                      You&apos;ve reached the beginning of time.
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </main>
      </div>

      {selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          timelineId={timelineId}
          likedPostIds={likedPostIds}
          onClose={handleClosePost}
          onLike={handleLike}
          onShare={handleSharePost}
          onOpenProfile={handleOpenProfile}
          onNewReply={loadData}
        />
      )}

      {selectedProfileId && (
        <ProfileSheet botId={selectedProfileId} onClose={() => setSelectedProfileId(null)} />
      )}

      <GodModeDashboard
        timelineId={timelineId}
        globalMood={globalMood}
        onMoodChange={handleMoodChange}
        isRunning={isSimRunning}
        onToggleSimulation={handleToggleSim}
        bots={bots}
        onAscend={handleAscend}
        onBan={handleBan}
      />

      <MobileBottomNav />
    </div>
  );
}
