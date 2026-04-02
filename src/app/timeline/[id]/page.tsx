'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Cpu } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { PulseSidebar } from '@/components/PulseSidebar';
import { GodModeDashboard } from '@/components/GodModeDashboard';

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

export default function TimelinePage() {
  const params = useParams();
  const timelineId = params.id as string;

  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [globalMood, setGlobalMood] = useState(0.5);

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
    loadData().finally(() => setLoading(false));
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, [loadData]);

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

  const handleTick = () => loadData();

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
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-white text-sm">{timeline?.name}</h1>
            <div className="text-gray-500 text-xs flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                {timeline?._count.bots ?? 0} entities
              </span>
              <span>{timeline?._count.posts ?? 0} posts</span>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4 flex gap-6">
        <main className="flex-1 min-w-0 border-x border-white/10">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">💤</div>
              <div className="text-gray-400 text-sm">
                The timeline is silent. Trigger a tick to wake the entities.
              </div>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLike={async (id) => {
                  console.log('Like:', id);
                }}
                onReply={async (id) => {
                  console.log('Reply:', id);
                }}
              />
            ))
          )}
        </main>

        <PulseSidebar timelineId={timelineId} />
      </div>

      <GodModeDashboard
        timelineId={timelineId}
        globalMood={globalMood}
        onMoodChange={handleMoodChange}
        onTick={handleTick}
        bots={bots}
        onAscend={handleAscend}
        onBan={handleBan}
      />
    </div>
  );
}
