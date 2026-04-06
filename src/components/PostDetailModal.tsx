'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Heart, MessageCircle, Send, Share2, X } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { TierBadge } from '@/components/ui/badge';
import { parsePostDebugInfo, renderMentions, type Post } from '@/components/PostCard';
import { cn } from '@/lib/utils';
import { adminConfig } from '@config/admin';

interface Reply extends Post {
  parentId?: string | null;
  replies: Reply[];
}

interface DetailPost extends Post {
  replies: Reply[];
}

interface PostDetailModalProps {
  postId: string;
  timelineId: string;
  likedPostIds: Set<string>;
  onClose: () => void;
  onLike: (postId: string) => void;
  onShare?: (postId: string) => void;
  onOpenProfile?: (botId: string) => void;
  onNewReply?: () => void | Promise<void>;
}

function updateReplyTreeLike(replies: Reply[], targetId: string): Reply[] {
  return replies.map(reply => {
    if (reply.id === targetId) {
      return { ...reply, likeCount: reply.likeCount + 1 };
    }

    if (reply.replies.length > 0) {
      return { ...reply, replies: updateReplyTreeLike(reply.replies, targetId) };
    }

    return reply;
  });
}

function countAllReplies(replies: Reply[]): number {
  return replies.reduce((sum, reply) => sum + 1 + countAllReplies(reply.replies), 0);
}

function ReplyThread({
  reply,
  depth = 0,
  postAuthorUsername,
  likedPostIds,
  onLike,
  onReplyTo,
  onOpenProfile,
}: {
  reply: Reply;
  depth?: number;
  postAuthorUsername: string;
  likedPostIds: Set<string>;
  onLike: (id: string) => void;
  onReplyTo: (reply: Reply) => void;
  onOpenProfile?: (botId: string) => void;
}) {
  const liked = likedPostIds.has(reply.id);
  const timeAgo = formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true });
  const isDev = process.env.NODE_ENV !== 'production';
  const debugInfo = parsePostDebugInfo(reply.emotionalState);
  const [debugTooltip, setDebugTooltip] = useState<{ x: number; y: number } | null>(null);
  const moodLabel = debugInfo?.mood || reply.emotionalState || null;

  return (
    <div className="relative">
      <div
        className="border-b border-zinc-900 bg-black px-4 py-3 transition-colors hover:bg-zinc-950"
        onContextMenu={event => {
          if (!isDev || !debugInfo) return;
          event.preventDefault();
          event.stopPropagation();
          setDebugTooltip({ x: event.clientX, y: event.clientY });
        }}
        onMouseLeave={() => {
          if (debugTooltip) setDebugTooltip(null);
        }}
      >
        <div className="flex gap-3">
          <div className="relative flex flex-col items-center">
            <button onClick={() => onOpenProfile?.(reply.author.id)} className="rounded-full">
              <Avatar src={reply.author.avatarUrl} alt={reply.author.displayName} size={36} />
            </button>
            {reply.replies.length > 0 && <div className="mt-1 w-px flex-1 bg-zinc-800" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-baseline gap-1.5 leading-none">
              <button onClick={() => onOpenProfile?.(reply.author.id)} className="text-[14px] font-bold text-white hover:underline">{reply.author.displayName}</button>
              <TierBadge tier={reply.author.tier} />
              <button onClick={() => onOpenProfile?.(reply.author.id)} className="text-xs text-zinc-500 hover:underline">@{reply.author.username}</button>
              <span className="text-xs text-zinc-700">·</span>
              <span className="text-xs text-zinc-500">{timeAgo}</span>
            </div>

            {depth > 0 && (
              <div className="mb-1 text-xs text-zinc-500">Replying in thread</div>
            )}

            <p className="mb-2 whitespace-pre-wrap break-words text-[14px] leading-snug text-zinc-100">
              {renderMentions(reply.content)}
            </p>

            {moodLabel && (
              <div className="mb-2 inline-flex rounded-full border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-500">
                mood: {moodLabel}
              </div>
            )}

            {reply.hashtags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {reply.hashtags.map(tag => (
                  <span key={tag} className="cursor-pointer text-xs text-blue-400 hover:underline">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-1 flex items-center gap-5 text-xs text-zinc-500">
              <button
                onClick={() => onReplyTo(reply)}
                className="group flex items-center gap-1 transition-colors hover:text-blue-400"
              >
                <span className="rounded-full p-1 group-hover:bg-blue-400/10 transition-colors">
                  <MessageCircle className="h-4 w-4" />
                </span>
                {reply.replyCount > 0 && <span>{reply.replyCount}</span>}
              </button>

              <button
                onClick={() => onLike(reply.id)}
                className={cn(
                  'group flex items-center gap-1 transition-colors',
                  liked ? 'text-red-500' : 'hover:text-red-500'
                )}
              >
                <span className="rounded-full p-1 group-hover:bg-red-500/10 transition-colors">
                  <Heart className={cn('h-4 w-4 transition-all', liked && 'fill-red-500 text-red-500')} />
                </span>
                {reply.likeCount > 0 && <span>{reply.likeCount}</span>}
              </button>

              <span className="text-zinc-600">↳ @{postAuthorUsername}</span>
            </div>

            {isDev && debugTooltip && debugInfo && (
              <div
                className="fixed z-[999] rounded-lg border border-zinc-700 bg-zinc-950/95 px-3 py-2 text-xs text-zinc-200 shadow-2xl"
                style={{ left: debugTooltip.x + 8, top: debugTooltip.y + 8 }}
              >
                <div className="font-semibold text-white">Reply Debug</div>
                <div>Mood: {debugInfo.mood || 'unknown'}</div>
                <div>Source: {debugInfo.source || 'model/unknown'}</div>
                {typeof debugInfo.parseFailures === 'number' && <div>Parse failures: {debugInfo.parseFailures}</div>}
                {typeof debugInfo.qualityFailures === 'number' && <div>Quality failures: {debugInfo.qualityFailures}</div>}
                {debugInfo.reason && <div>Reason: {debugInfo.reason}</div>}
                <div className="mt-1 text-[10px] text-zinc-500">(Dev only, right-click reply)</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {reply.replies.length > 0 && (
        <div className="ml-8 border-l border-zinc-900/80">
          {reply.replies.map(child => (
            <ReplyThread
              key={child.id}
              reply={child}
              depth={depth + 1}
              postAuthorUsername={postAuthorUsername}
              likedPostIds={likedPostIds}
              onLike={onLike}
              onReplyTo={onReplyTo}
              onOpenProfile={onOpenProfile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PostDetailModal({
  postId,
  timelineId,
  likedPostIds,
  onClose,
  onLike,
  onShare,
  onOpenProfile,
  onNewReply,
}: PostDetailModalProps) {
  const [post, setPost] = useState<DetailPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyingToLabel, setReplyingToLabel] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [debugTooltip, setDebugTooltip] = useState<{ x: number; y: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isDev = process.env.NODE_ENV !== 'production';

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/timelines/${timelineId}/posts/${postId}`);
      if (!res.ok) {
        return;
      }
      const data = await res.json() as DetailPost;
      setPost(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [postId, timelineId]);

  useEffect(() => {
    setLoading(true);
    void fetchPost();
  }, [fetchPost]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, [replyText]);

  const focusReplyBox = (prefill = '') => {
    setReplyText(prefill);
    setTimeout(() => {
      textareaRef.current?.focus();
      const len = prefill.length;
      textareaRef.current?.setSelectionRange(len, len);
    }, 50);
  };

  const handleReplyToReply = (reply: Reply) => {
    setReplyTargetId(reply.id);
    setReplyingToLabel(`Replying to @${reply.author.username}`);
    const tags = [`@${post?.author.username ?? ''}`, `@${reply.author.username}`]
      .filter(Boolean)
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .join(' ') + ' ';
    focusReplyBox(tags);
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    setReplyError(null);

    const targetId = replyTargetId ?? postId;

    try {
      const res = await fetch(`/api/timelines/${timelineId}/posts/${targetId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Could not send reply' }));
        setReplyError(typeof data.error === 'string' ? data.error : 'Could not send reply');
        return;
      }

      setReplyText('');
      setReplyTargetId(null);
      setReplyingToLabel(null);
      await fetchPost();
      await onNewReply?.();
    } catch (err) {
      console.error(err);
      setReplyError('Network error while sending reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (id: string) => {
    if (likedPostIds.has(id)) return;

    onLike(id);
    setPost(prev => {
      if (!prev) return prev;
      if (prev.id === id) return { ...prev, likeCount: prev.likeCount + 1 };
      return {
        ...prev,
        replies: updateReplyTreeLike(prev.replies, id),
      };
    });
  };

  const liked = likedPostIds.has(postId);
  const timeAgo = post ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : '';
  const totalReplies = useMemo(() => countAllReplies(post?.replies ?? []), [post?.replies]);
  const characterCount = replyText.trim().length;
  const postDebugInfo = parsePostDebugInfo(post?.emotionalState);
  const postMoodLabel = postDebugInfo?.mood || post?.emotionalState || null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative flex h-full w-full max-w-[640px] flex-col overflow-hidden bg-black shadow-2xl sm:border-x sm:border-zinc-900">
        <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-zinc-900 bg-black/90 px-4 py-3 backdrop-blur">
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white transition-colors hover:bg-zinc-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="text-[17px] font-bold text-white">Post</div>
            {post && <div className="text-xs text-zinc-500">Thread view · {totalReplies} replies</div>}
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
            </div>
          )}

          {!loading && post && (
            <>
              <div
                className="border-b border-zinc-900 px-4 pb-3 pt-4"
                onContextMenu={event => {
                  if (!isDev || !postDebugInfo) return;
                  event.preventDefault();
                  event.stopPropagation();
                  setDebugTooltip({ x: event.clientX, y: event.clientY });
                }}
                onMouseLeave={() => {
                  if (debugTooltip) setDebugTooltip(null);
                }}
              >
                <div className="mb-3 flex gap-3">
                  <button onClick={() => onOpenProfile?.(post.author.id)} className="rounded-full">
                    <Avatar src={post.author.avatarUrl} alt={post.author.displayName} size={44} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => onOpenProfile?.(post.author.id)} className="text-[15px] font-bold text-white hover:underline">{post.author.displayName}</button>
                      <TierBadge tier={post.author.tier} />
                    </div>
                    <button onClick={() => onOpenProfile?.(post.author.id)} className="text-sm text-zinc-500 hover:underline">@{post.author.username}</button>
                    <div className="mt-1 text-xs text-zinc-500">{post.author.occupation}</div>
                  </div>
                </div>

                <p className="mb-3 whitespace-pre-wrap break-words text-[18px] leading-snug text-zinc-100">
                  {renderMentions(post.content)}
                </p>

                {postMoodLabel && (
                  <div className="mb-3 inline-flex rounded-full border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-500">
                    mood: {postMoodLabel}
                  </div>
                )}

                {post.hashtags.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {post.hashtags.map(tag => (
                      <span key={tag} className="cursor-pointer text-sm text-blue-400 hover:underline">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mb-3 border-b border-zinc-900 pb-3 text-sm text-zinc-500">
                  {timeAgo}
                </div>

                <div className="mb-3 flex gap-5 border-b border-zinc-900 pb-3 text-sm">
                  <span>
                    <span className="font-bold text-white">{totalReplies}</span>
                    <span className="ml-1 text-zinc-500">Replies</span>
                  </span>
                  <span>
                    <span className="font-bold text-white">{post.likeCount}</span>
                    <span className="ml-1 text-zinc-500">Likes</span>
                  </span>
                </div>

                <div className="flex items-center gap-5 border-b border-zinc-900 pb-3 text-zinc-500">
                  <button
                    onClick={() => {
                      setReplyTargetId(null);
                      setReplyingToLabel(`Replying to @${post.author.username}`);
                      focusReplyBox(`@${post.author.username} `);
                    }}
                    className="group flex items-center gap-1.5 transition-colors hover:text-blue-400"
                  >
                    <span className="rounded-full p-2 group-hover:bg-blue-400/10 transition-colors">
                      <MessageCircle className="h-5 w-5" />
                    </span>
                  </button>
                  <button
                    onClick={() => handleLike(post.id)}
                    disabled={liked}
                    className={cn(
                      'group flex items-center gap-1.5 transition-colors',
                      liked ? 'cursor-default text-red-500' : 'hover:text-red-500'
                    )}
                  >
                    <span className="rounded-full p-2 group-hover:bg-red-500/10 transition-colors">
                      <Heart className={cn('h-5 w-5', liked && 'fill-red-500 text-red-500')} />
                    </span>
                  </button>
                  <button
                    onClick={() => onShare?.(post.id)}
                    className="group flex items-center gap-1.5 transition-colors hover:text-blue-400"
                  >
                    <span className="rounded-full p-2 group-hover:bg-blue-400/10 transition-colors">
                      <Share2 className="h-5 w-5" />
                    </span>
                  </button>
                </div>

                {isDev && debugTooltip && postDebugInfo && (
                  <div
                    className="fixed z-[999] rounded-lg border border-zinc-700 bg-zinc-950/95 px-3 py-2 text-xs text-zinc-200 shadow-2xl"
                    style={{ left: debugTooltip.x + 8, top: debugTooltip.y + 8 }}
                  >
                    <div className="font-semibold text-white">Post Debug</div>
                    <div>Mood: {postDebugInfo.mood || 'unknown'}</div>
                    <div>Source: {postDebugInfo.source || 'model/unknown'}</div>
                    {typeof postDebugInfo.parseFailures === 'number' && <div>Parse failures: {postDebugInfo.parseFailures}</div>}
                    {typeof postDebugInfo.qualityFailures === 'number' && <div>Quality failures: {postDebugInfo.qualityFailures}</div>}
                    {postDebugInfo.reason && <div>Reason: {postDebugInfo.reason}</div>}
                    <div className="mt-1 text-[10px] text-zinc-500">(Dev only, right-click post)</div>
                  </div>
                )}
              </div>

              {post.replies.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-zinc-500">
                  No replies yet. Be the first to start the thread.
                </div>
              ) : (
                post.replies.map(reply => (
                  <ReplyThread
                    key={reply.id}
                    reply={reply}
                    postAuthorUsername={post.author.username}
                    likedPostIds={likedPostIds}
                    onLike={handleLike}
                    onReplyTo={handleReplyToReply}
                    onOpenProfile={onOpenProfile}
                  />
                ))
              )}
            </>
          )}
        </div>

        <div className="border-t border-zinc-900 bg-black px-4 py-3">
          {replyingToLabel && (
            <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
              <span>{replyingToLabel}</span>
              <button
                onClick={() => {
                  setReplyTargetId(null);
                  setReplyingToLabel(null);
                }}
                className="text-zinc-600 hover:text-white"
              >
                Clear
              </button>
            </div>
          )}
          {replyError && <div className="mb-2 text-xs text-red-400">{replyError}</div>}
          <div className="flex items-end gap-3">
            <Avatar src={null} alt="You" size={36} />
            <div className="relative flex-1 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-3 py-2">
              <textarea
                ref={textareaRef}
                value={replyText}
                onChange={e => {
                  setReplyText(e.target.value);
                  if (replyError) setReplyError(null);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void handleSubmitReply();
                }}
                placeholder={replyTargetId ? 'Post your reply to this comment…' : `Reply to @${post?.author.username ?? ''}…`}
                rows={1}
                style={{ caretColor: 'auto' }}
                className="min-h-[36px] max-h-[140px] w-full resize-none overflow-y-auto bg-transparent text-[15px] leading-snug text-zinc-100 placeholder-zinc-600 focus:outline-none"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                <span>⌘/Ctrl + Enter to send</span>
                <span className={cn(characterCount > adminConfig.content.warningLength && 'text-orange-400', characterCount > adminConfig.content.maxLength && 'text-red-400')}>
                  {characterCount}/{adminConfig.content.maxLength}
                </span>
              </div>
            </div>
            <button
              onClick={() => void handleSubmitReply()}
              disabled={!replyText.trim() || submitting || characterCount > adminConfig.content.maxLength}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
              Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
