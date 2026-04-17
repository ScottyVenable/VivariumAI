'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { TierBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { adminConfig } from '@config/admin';

export type PostDebugInfo = {
  mood: string;
  source?: string;
  parseFailures?: number;
  qualityFailures?: number;
  reason?: string;
  rawEmotionalState?: string;
};

export interface PostAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  tier: string;
  occupation: string;
}

export interface Post {
  id: string;
  content: string;
  hashtags: string[];
  emotionalState?: string | null;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  author: PostAuthor;
}

interface PostCardProps {
  post: Post;
  liked?: boolean;
  onLike?: (postId: string) => void;
  onOpen?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onOpenProfile?: (botId: string) => void;
  onMentionClick?: (username: string) => void;
  isReply?: boolean;
  className?: string;
}

export function renderMentions(text: string, onMentionClick?: (username: string) => void) {
  // Match @username, @username_suffix, and @username.suffix (period-separated usernames)
  // The (?:\.\w+)* part ensures trailing periods (end of sentence) are NOT consumed
  const parts = text.split(/(@\w+(?:\.\w+)*)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <button
        key={i}
        onClick={() => {
          const username = part.substring(1); // Remove @
          onMentionClick?.(username);
        }}
        className="cursor-pointer font-medium text-blue-400 transition-colors hover:text-blue-300 hover:underline"
      >
        {part}
      </button>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function parsePostDebugInfo(emotionalState?: string | null): PostDebugInfo | null {
  if (!emotionalState || emotionalState.trim().length === 0) return null;

  const [moodRaw, debugRaw] = emotionalState.split('||debug:');
  const mood = (moodRaw || '').trim();

  if (!debugRaw) {
    return { mood, source: 'model', rawEmotionalState: emotionalState };
  }

  const entries = debugRaw
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const [key, ...valueParts] = part.split('=');
      return { key: key?.trim(), value: valueParts.join('=').trim() };
    });

  const lookup = (key: string) => entries.find(entry => entry.key === key)?.value;
  const parseFailuresRaw = lookup('parse');
  const qualityFailuresRaw = lookup('quality');

  return {
    mood,
    source: lookup('source') || 'model',
    parseFailures: parseFailuresRaw && /^\d+$/.test(parseFailuresRaw) ? Number.parseInt(parseFailuresRaw, 10) : undefined,
    qualityFailures: qualityFailuresRaw && /^\d+$/.test(qualityFailuresRaw) ? Number.parseInt(qualityFailuresRaw, 10) : undefined,
    reason: lookup('reason') || undefined,
    rawEmotionalState: emotionalState,
  };
}

async function copyText(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-1000px';
      textarea.style.left = '-1000px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (copied) return;
    } catch {
      // ignore and fall through to warning
    }
    console.warn('[Debug] Clipboard write failed (clipboard api + fallback)');
  }
}

export function PostCard({
  post,
  liked = false,
  onLike,
  onOpen,
  onShare,
  onOpenProfile,
  onMentionClick,
  isReply = false,
  className,
}: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  const isDev = process.env.NODE_ENV !== 'production';
  const debugInfo = parsePostDebugInfo(post.emotionalState);
  const [debugTooltip, setDebugTooltip] = useState<{ x: number; y: number } | null>(null);

  const moodLabel = debugInfo?.mood || post.emotionalState || null;

  return (
    <article
      onClick={() => onOpen?.(post.id)}
      onContextMenu={event => {
        if (!isDev || !debugInfo) return;
        event.preventDefault();
        event.stopPropagation();
        setDebugTooltip({ x: event.clientX, y: event.clientY });
      }}
      onMouseLeave={() => {
        if (debugTooltip) setDebugTooltip(null);
      }}
      className={cn(
        'group cursor-pointer select-none rounded-xl border border-zinc-800 bg-black p-4 text-left transition hover:bg-zinc-950',
        isReply && 'bg-zinc-950',
        className
      )}
    >
      <div className="flex gap-3">
        {/* Avatar column */}
        <div className="flex flex-col items-center flex-shrink-0">
          <button
            onClick={e => {
              e.stopPropagation();
              onOpenProfile?.(post.author.id);
            }}
            className="rounded-full"
          >
            <Avatar
              src={post.author.avatarUrl}
              alt={post.author.displayName}
              size={44}
            />
          </button>
          {isReply && <div className="w-px flex-1 bg-zinc-800 mt-1 min-h-[8px]" />}
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0 pb-1">
          {/* Header row */}
          <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
            <button
              onClick={e => {
                e.stopPropagation();
                onOpenProfile?.(post.author.id);
              }}
              className="font-semibold text-white hover:underline"
            >
              {post.author.displayName}
            </button>
            <TierBadge tier={post.author.tier} />
            <button
              onClick={e => {
                e.stopPropagation();
                onOpenProfile?.(post.author.id);
              }}
              className="text-xs text-zinc-500 transition hover:text-white"
            >
              @{post.author.username}
            </button>
            <span className="text-zinc-600 text-xs">· {timeAgo}</span>
          </div>

          <div className="mb-2 text-xs text-zinc-500">
            {post.author.occupation}
          </div>

          {/* Post content with @mention rendering */}
          <p className="mb-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-zinc-100">
            {renderMentions(post.content, onMentionClick)}
          </p>

          {/* Hashtags */}
          {post.hashtags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {post.hashtags.map(tag => (
                <span
                  key={tag}
                  onClick={e => e.stopPropagation()}
                  className="cursor-pointer text-sm text-blue-400 hover:underline"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Emotional state */}
          {moodLabel && (
            <div className="mb-3 inline-flex rounded-full border border-zinc-700 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-400">
              mood: {moodLabel}
            </div>
          )}

          {isDev && debugTooltip && debugInfo && (
            <div
              className="fixed z-[999] w-[320px] rounded-lg border border-zinc-700 bg-zinc-950/95 px-3 py-2 text-xs text-zinc-200 shadow-2xl"
              style={{ left: debugTooltip.x + 8, top: debugTooltip.y + 8 }}
              onClick={event => event.stopPropagation()}
            >
              <div className="font-semibold text-white">Post Debug</div>
              <div>Mood: {debugInfo.mood || 'unknown'}</div>
              <div>Source: {debugInfo.source || 'model'}</div>
              <div>Post ID: {post.id}</div>
              <div>Author: @{post.author.username}</div>
              <div>Length: {post.content.length} chars</div>
              <div>Decision model: {adminConfig.ai.models.decision}</div>
              <div>Content model: {adminConfig.ai.models.content}</div>
              {typeof debugInfo.parseFailures === 'number' && <div>Parse failures: {debugInfo.parseFailures}</div>}
              {typeof debugInfo.qualityFailures === 'number' && <div>Quality failures: {debugInfo.qualityFailures}</div>}
              {debugInfo.reason && <div>Reason: {debugInfo.reason}</div>}
              {debugInfo.rawEmotionalState && <div className="truncate">Raw state: {debugInfo.rawEmotionalState}</div>}
              <div className="mt-2 grid grid-cols-2 gap-1">
                <button
                  className="rounded border border-zinc-700 px-2 py-1 text-left text-[11px] text-zinc-200 hover:bg-zinc-800"
                  onClick={async event => {
                    event.stopPropagation();
                    await copyText(post.id);
                  }}
                >
                  Copy Post ID
                </button>
                <button
                  className="rounded border border-zinc-700 px-2 py-1 text-left text-[11px] text-zinc-200 hover:bg-zinc-800"
                  onClick={async event => {
                    event.stopPropagation();
                    await copyText(
                      JSON.stringify(
                        {
                          postId: post.id,
                          author: post.author.username,
                          source: debugInfo.source,
                          mood: debugInfo.mood,
                          parseFailures: debugInfo.parseFailures,
                          qualityFailures: debugInfo.qualityFailures,
                          reason: debugInfo.reason,
                          emotionalState: debugInfo.rawEmotionalState,
                          models: {
                            decision: adminConfig.ai.models.decision,
                            content: adminConfig.ai.models.content,
                          },
                        },
                        null,
                        2
                      )
                    );
                  }}
                >
                  Copy Debug JSON
                </button>
                <button
                  className="rounded border border-zinc-700 px-2 py-1 text-left text-[11px] text-zinc-200 hover:bg-zinc-800"
                  onClick={event => {
                    event.stopPropagation();
                    onOpenProfile?.(post.author.id);
                  }}
                >
                  Open Author
                </button>
                <button
                  className="rounded border border-zinc-700 px-2 py-1 text-left text-[11px] text-zinc-200 hover:bg-zinc-800"
                  onClick={event => {
                    event.stopPropagation();
                    onOpen?.(post.id);
                  }}
                >
                  Open Thread
                </button>
              </div>
              <div className="mt-1 text-[10px] text-zinc-500">(Dev only, right-click post)</div>
            </div>
          )}

          {/* Action bar */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <button
              onClick={e => { e.stopPropagation(); onOpen?.(post.id); }}
              className="group inline-flex items-center gap-1 text-sm transition hover:text-blue-400"
            >
              <MessageCircle className="h-4 w-4" />
              {post.replyCount > 0 && <span>{post.replyCount}</span>}
            </button>

            <button
              onClick={e => { e.stopPropagation(); onLike?.(post.id); }}
              className={cn(
                'inline-flex items-center gap-1 text-sm transition',
                liked ? 'text-red-400' : 'hover:text-red-400'
              )}
            >
              <Heart
                className={cn('h-4 w-4 transition', liked && 'fill-red-400 text-red-400')}
              />
              {post.likeCount > 0 && <span>{post.likeCount}</span>}
            </button>

            <button
              onClick={e => {
                e.stopPropagation();
                onShare?.(post.id);
              }}
              className="inline-flex items-center gap-1 text-sm transition hover:text-blue-400"
            >
              <Share2 className="h-4 w-4" />
            </button>

            {post.replyCount > 0 && (
              <button
                onClick={e => { e.stopPropagation(); onOpen?.(post.id); }}
                className="ml-auto text-xs font-medium text-zinc-400 transition hover:text-white"
              >
                View thread
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
