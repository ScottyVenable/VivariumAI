'use client';

import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { TierBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onReply?: (postId: string) => void;
  className?: string;
}

export function PostCard({ post, onLike, onReply, className }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <article
      className={cn(
        'border-b border-white/10 px-4 py-4 hover:bg-white/5 transition-colors cursor-pointer',
        className
      )}
    >
      <div className="flex gap-3">
        <Avatar
          src={post.author.avatarUrl}
          alt={post.author.displayName}
          size={44}
          className="flex-shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-white text-sm hover:underline">
              {post.author.displayName}
            </span>
            <TierBadge tier={post.author.tier} />
            <span className="text-gray-500 text-sm">@{post.author.username}</span>
            <span className="text-gray-600 text-xs">·</span>
            <span className="text-gray-500 text-xs">{timeAgo}</span>
          </div>
          
          <div className="text-xs text-indigo-400/70 mb-1.5">
            {post.author.occupation}
          </div>

          <p className="text-gray-100 text-sm leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>

          {post.hashtags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {post.hashtags.map(tag => (
                <span key={tag} className="text-blue-400 text-sm hover:underline cursor-pointer">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {post.emotionalState && (
            <div className="mt-1 text-xs text-gray-600 italic">
              feeling: {post.emotionalState}
            </div>
          )}

          <div className="mt-3 flex items-center gap-6 text-gray-500">
            <button
              onClick={() => onReply?.(post.id)}
              className="flex items-center gap-1.5 text-sm hover:text-blue-400 transition-colors group"
            >
              <MessageCircle className="w-4 h-4 group-hover:text-blue-400" />
              <span>{post.replyCount}</span>
            </button>
            <button
              onClick={() => onLike?.(post.id)}
              className="flex items-center gap-1.5 text-sm hover:text-red-400 transition-colors group"
            >
              <Heart className="w-4 h-4 group-hover:text-red-400" />
              <span>{post.likeCount}</span>
            </button>
            <button className="flex items-center gap-1.5 text-sm hover:text-green-400 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
