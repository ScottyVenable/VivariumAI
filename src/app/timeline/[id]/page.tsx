'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Cpu, Trash2 } from 'lucide-react';
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

    return copy.sort((a, b) => {
      const scoreA = a.likeCount + a.replyCount * 2 + (+new Date(a.createdAt) / 1_000_000_000_000);
      const scoreB = b.likeCount + b.replyCount * 2 + (+new Date(b.createdAt) / 1_000_000_000_000);
      return scoreB - scoreA;
    });
  }, [feedMode, posts]);

  const loadData = useCallback(async () => {
    try {
      const [timelineRes, feedRes, botsRes] = await Promise.all([
        fetch(`/api/timelines/${timelineId}`),
        fetch(`/api/timelines/${timelineId}/feed?limit=30`),
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
      setBots(botsData || []);
    } catch (err) {
      console.error(err);
    }
  }, [timelineId]);

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <div className="text-gray-400 text-sm">Initializing timeline...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-black">
      <header className="sticky top-0 z-40 border-b border-zinc-900 bg-black/95">
        <div className="max-w-6xl mx-auto px-4 py-3 min-h-14 flex items-center gap-3 sm:gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-white text-sm truncate sm:text-base">{timeline?.name}</h1>
            <div className="text-gray-500 text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                {timeline?._count.bots ?? 0} entities
              </span>
              <span>{timeline?._count.posts ?? 0} posts</span>
              <span className={isSimRunning ? 'text-green-400' : 'text-zinc-500'}>
                {isSimRunning ? 'Simulation live' : 'Simulation paused'}
              </span>
              {llmChipMeta && (
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${llmChipMeta.className}`}>
                  <Cpu className="h-3 w-3" />
                  {llmChipMeta.label}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-lg border border-zinc-800 bg-[#111111] p-2 text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => void handleDeleteTimeline()}
            disabled={deletingTimeline}
            className="rounded-lg border border-zinc-800 bg-[#111111] p-2 text-zinc-400 transition-colors hover:border-red-900 hover:text-red-300 disabled:opacity-50"
            aria-label="Delete timeline"
            title="Delete timeline"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {shareMessage && (
          <div className="border-t border-zinc-900 px-4 py-2 text-center text-xs text-zinc-300">
            {shareMessage}
          </div>
        )}
        {timelineDeleteError && (
          <div className="border-t border-red-900/60 bg-red-950/30 px-4 py-2 text-center text-xs text-red-300">
            {timelineDeleteError}
          </div>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 min-h-0 flex-col gap-4 overflow-hidden lg:flex-row lg:gap-6">
        <PulseSidebar timelineId={timelineId} />

        <main className="order-2 lg:order-1 min-w-0 flex-1 overflow-y-auto border-x border-zinc-900 pb-24 lg:pb-6">
          <div className="sticky top-0 z-20 border-b border-zinc-900 bg-black/95 backdrop-blur">
            <div className="border-b border-zinc-900 px-4 py-2">
              <div className="flex gap-6 text-sm">
                <button
                  onClick={() => setFeedMode('for-you')}
                  className={feedMode === 'for-you' ? 'border-b-2 border-white pb-2 font-bold text-white' : 'pb-2 text-zinc-500'}
                >
                  For you
                </button>
                <button
                  onClick={() => setFeedMode('latest')}
                  className={feedMode === 'latest' ? 'border-b-2 border-white pb-2 font-bold text-white' : 'pb-2 text-zinc-500'}
                >
                  Latest
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-zinc-900 px-4 py-3">
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/80 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.01)]">
              <div className="mb-3 flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-white">
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
                    className="min-h-[72px] w-full resize-none bg-transparent text-[20px] leading-snug text-white placeholder:text-zinc-600 focus:outline-none"
                  />
                  <div className="mb-3 text-xs text-blue-400">Everyone can reply</div>
                  {composerError && <div className="mb-3 text-xs text-red-400">{composerError}</div>}
                  <div className="flex items-center justify-between border-t border-zinc-900 pt-3">
                    <div className="text-xs text-zinc-500">Cmd/Ctrl + Enter to post</div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${newPostText.trim().length > adminConfig.content.warningLength ? 'text-orange-400' : 'text-zinc-500'}`}>
                        {newPostText.trim().length}/{adminConfig.content.maxLength}
                      </span>
                      <button
                        onClick={() => void handleCreatePost()}
                        disabled={!newPostText.trim() || posting || newPostText.trim().length > adminConfig.content.maxLength}
                        className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
                      >
                        {posting ? 'Posting…' : 'Post'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="py-16 text-center border-b border-zinc-900">
              <div className="text-zinc-400 text-sm">
                The timeline is silent. Press Play in the Control panel to wake the entities.
              </div>
            </div>
          ) : (
            sortedPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                liked={likedPostIds.has(post.id)}
                onLike={handleLike}
                onOpen={handleOpenPost}
                onShare={handleSharePost}
                onOpenProfile={handleOpenProfile}
              />
            ))
          )}
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
