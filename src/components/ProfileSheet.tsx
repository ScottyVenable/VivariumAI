'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Briefcase, Sparkles, UserRound, X } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { TierBadge } from '@/components/ui/badge';
import { parseBotMemory } from '@/lib/ai/memory';

interface ProfilePost {
  id: string;
  content: string;
  hashtags: string[];
  createdAt: string;
  _count?: { replies: number; likes: number };
}

interface BotProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  tier: string;
  occupation: string;
  talkingStyle?: string | null;
  simulatedAge: number;
  emotionalState: string | null;
  followerCount: number;
  followingCount: number;
  postCount: number;
  memory?: string | null;
  posts: ProfilePost[];
  _count: {
    followedBy: number;
    following: number;
    posts: number;
  };
}

export function ProfileSheet({
  botId,
  onClose,
}: {
  botId: string;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<BotProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/bots/${botId}`);
      if (!res.ok) return;
      const data = await res.json() as BotProfile;
      setProfile(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [botId]);

  useEffect(() => {
    setLoading(true);
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const memory = useMemo(() => parseBotMemory(profile?.memory), [profile?.memory]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-[420px] flex-col overflow-hidden border-l border-zinc-800 bg-black shadow-2xl sm:rounded-l-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-800 bg-black/95 px-4 py-3 backdrop-blur">
          <button onClick={onClose} className="rounded-full border border-zinc-700 p-2 text-white hover:border-zinc-500">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="text-sm font-bold text-white">Profile</div>
            {profile && <div className="text-xs text-zinc-500">@{profile.username}</div>}
          </div>
          <button onClick={onClose} className="ml-auto rounded-full border border-zinc-700 p-2 text-zinc-500 hover:border-zinc-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
            </div>
          )}

          {!loading && profile && (
            <>
              <div className="border-b border-zinc-800 px-4 py-5">
                <div className="mb-4 flex items-start gap-4">
                  <Avatar src={profile.avatarUrl} alt={profile.displayName} size={56} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-lg font-bold text-white">{profile.displayName}</div>
                      <TierBadge tier={profile.tier} />
                    </div>
                    <div className="text-sm text-zinc-500">@{profile.username}</div>
                    <div className="mt-2 text-sm text-zinc-300">{profile.bio || 'No bio yet.'}</div>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-3 text-xs text-zinc-400">
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{profile.occupation}</span>
                  <span className="inline-flex items-center gap-1"><UserRound className="h-3.5 w-3.5" />Age {profile.simulatedAge}</span>
                  {profile.emotionalState && <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" />{profile.emotionalState}</span>}
                </div>
                {profile.talkingStyle && (
                  <div className="mb-3 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">
                    Talking style: {profile.talkingStyle}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
                    <div className="font-bold text-white">{profile._count.posts}</div>
                    <div className="text-xs text-zinc-500">Posts</div>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
                    <div className="font-bold text-white">{profile._count.followedBy}</div>
                    <div className="text-xs text-zinc-500">Followers</div>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
                    <div className="font-bold text-white">{profile._count.following}</div>
                    <div className="text-xs text-zinc-500">Following</div>
                  </div>
                </div>
              </div>

              <div className="border-b border-zinc-800 px-4 py-4">
                <div className="mb-3 text-sm font-semibold text-white">Memory</div>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Topics</div>
                    <div className="flex flex-wrap gap-2">
                      {memory.topics.length > 0 ? memory.topics.map(topic => (
                        <span key={topic} className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-blue-300">{topic}</span>
                      )) : <span className="text-zinc-600">No strong topic memory yet.</span>}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">People</div>
                    <div className="flex flex-wrap gap-2">
                      {memory.people.length > 0 ? memory.people.map(person => (
                        <span key={person} className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-emerald-300">{person}</span>
                      )) : <span className="text-zinc-600">No recurring people yet.</span>}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Recent memories</div>
                    <div className="space-y-2">
                      {memory.recent.length > 0 ? memory.recent.map(item => (
                        <div key={item} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-300">{item}</div>
                      )) : <div className="text-zinc-600">No recent memory events yet.</div>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-4">
                <div className="mb-3 text-sm font-semibold text-white">Recent posts</div>
                <div className="space-y-3">
                  {profile.posts.length > 0 ? profile.posts.map(post => (
                    <div key={post.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-3">
                      <div className="mb-2 text-xs text-zinc-500">{new Date(post.createdAt).toLocaleString()}</div>
                      <div className="whitespace-pre-wrap break-words text-sm text-zinc-100">{post.content}</div>
                      {post.hashtags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {post.hashtags.map(tag => (
                            <span key={tag} className="text-xs text-blue-400">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )) : <div className="text-sm text-zinc-600">No posts yet.</div>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
