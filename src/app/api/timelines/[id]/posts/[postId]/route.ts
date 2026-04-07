import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sanitizeDisplayContent, sanitizeEmotionalState, sanitizeHashtags } from '@/lib/post-content';

const AUTHOR_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  tier: true,
  occupation: true,
} as const;

type RawReply = {
  id: string;
  content: string;
  hashtags: string;
  emotionalState: string | null;
  likeCount: number;
  replyCount: number;
  createdAt: Date;
  timelineId: string;
  authorId: string;
  parentId: string | null;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    tier: string;
    occupation: string;
  };
};

type ReplyNode = Omit<RawReply, 'hashtags'> & {
  hashtags: string[];
  replies: ReplyNode[];
};

function parseHashtags(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function buildReplyTree(replies: RawReply[], parentId: string | null): ReplyNode[] {
  return replies
    .filter(reply => reply.parentId === parentId)
    .map<ReplyNode>(reply => ({
      ...reply,
      content: sanitizeDisplayContent(reply.content),
      hashtags: sanitizeHashtags(reply.hashtags, reply.content),
      emotionalState: sanitizeEmotionalState(reply.emotionalState),
      replies: buildReplyTree(replies, reply.id),
    }));
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const { id: timelineId, postId } = await params;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: { select: AUTHOR_SELECT } },
    });

    if (!post || post.timelineId !== timelineId) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const allReplies: RawReply[] = [];
    let frontier = [postId];

    while (frontier.length > 0) {
      const batch = await prisma.post.findMany({
        where: {
          timelineId,
          parentId: { in: frontier },
        },
        include: {
          author: { select: AUTHOR_SELECT },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (batch.length === 0) {
        break;
      }

      allReplies.push(...batch);
      frontier = batch.map(reply => reply.id);
    }

    return NextResponse.json({
      ...post,
      content: sanitizeDisplayContent(post.content),
      hashtags: sanitizeHashtags(post.hashtags, post.content),
      emotionalState: sanitizeEmotionalState(post.emotionalState),
      replies: buildReplyTree(allReplies, postId),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
