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
  isReply?: boolean;
  className?: string;
}

export function renderMentions(text: string) {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="text-blue-400 hover:underline cursor-pointer font-medium">
        {part}
      </span>
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
        'border-b border-zinc-900 bg-black px-4 py-3 transition-colors hover:bg-zinc-950 cursor-pointer select-none',
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
              size={40}
            />
          </button>
          {isReply && <div className="w-px flex-1 bg-zinc-800 mt-1 min-h-[8px]" />}
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0 pb-1">
          {/* Header row */}
          <div className="flex items-baseline gap-1.5 flex-wrap leading-none mb-1">
            <span className="font-bold text-[15px] text-white">
              <button
                onClick={e => {
                  e.stopPropagation();
                  onOpenProfile?.(post.author.id);
                }}
                className="hover:underline"
              >
                {post.author.displayName}
              </button>
            </span>
            <TierBadge tier={post.author.tier} />
            <button
              onClick={e => {
                e.stopPropagation();
                onOpenProfile?.(post.author.id);
              }}
              className="text-zinc-500 text-[14px] hover:underline"
            >
              @{post.author.username}
            </button>
            <span className="text-zinc-700 text-xs">·</span>
            <span className="text-zinc-500 text-xs">{timeAgo}</span>
          </div>

          {/* Occupation */}
          <div className="text-zinc-500 text-xs mb-1.5">{post.author.occupation}</div>

          {/* Post content with @mention rendering */}
          <p className="text-[15px] text-zinc-100 leading-snug whitespace-pre-wrap break-words mb-2">
            {renderMentions(post.content)}
          </p>

          {/* Hashtags */}
          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {post.hashtags.map(tag => (
                <span
                  key={tag}
                  onClick={e => e.stopPropagation()}
                  className="text-blue-400 text-sm hover:underline cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Emotional state */}
          {moodLabel && (
            <div className="mb-2 inline-flex rounded-full border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-500">
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
          <div className="flex items-center gap-5 mt-1 text-zinc-500 text-sm">
            <button
              onClick={e => { e.stopPropagation(); onOpen?.(post.id); }}
              className="group flex items-center gap-1.5 hover:text-blue-400 transition-colors"
            >
              <span className="p-1.5 rounded-full group-hover:bg-blue-400/10 transition-colors">
                <MessageCircle className="w-[18px] h-[18px]" />
              </span>
              {post.replyCount > 0 && <span>{post.replyCount}</span>}
            </button>

            <button
              onClick={e => { e.stopPropagation(); onLike?.(post.id); }}
              className={cn(
                'group flex items-center gap-1.5 transition-colors',
                liked ? 'text-red-500' : 'hover:text-red-500'
              )}
            >
              <span className="p-1.5 rounded-full group-hover:bg-red-500/10 transition-colors">
                <Heart
                  className={cn('w-[18px] h-[18px] transition-all', liked && 'fill-red-500 text-red-500')}
                />
              </span>
              {post.likeCount > 0 && <span>{post.likeCount}</span>}
            </button>

            <button
              onClick={e => {
                e.stopPropagation();
                onShare?.(post.id);
              }}
              className="group flex items-center hover:text-blue-400 transition-colors"
            >
              <span className="p-1.5 rounded-full group-hover:bg-blue-400/10 transition-colors">
                <Share2 className="w-[18px] h-[18px]" />
              </span>
            </button>

            {post.replyCount > 0 && (
              <button
                onClick={e => { e.stopPropagation(); onOpen?.(post.id); }}
                className="ml-auto text-xs text-zinc-500 transition-colors hover:text-blue-400"
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
