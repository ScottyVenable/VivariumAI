import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrCreateHumanActor } from '@/lib/human-actor';
import { adminConfig } from '@config/admin';

const AUTHOR_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  tier: true,
  occupation: true,
} as const;

function parseContent(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseHashtags(content: string): string[] {
  const matches = content.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  return [...new Set(matches)].slice(0, adminConfig.content.maxHashtagsPerPost);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: timelineId } = await params;

  try {
    const timeline = await prisma.timeline.findUnique({
      where: { id: timelineId },
      select: { id: true },
    });

    if (!timeline) {
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }

    const raw = await req.json().catch(() => ({}));
    const content = parseContent((raw as { content?: unknown }).content);

    if (!content) {
      return NextResponse.json({ error: 'Post content is required' }, { status: 400 });
    }

    if (content.length > adminConfig.content.maxLength) {
      return NextResponse.json({ error: `Posts must be ${adminConfig.content.maxLength} characters or less` }, { status: 400 });
    }

    const actorId = await getOrCreateHumanActor(timelineId);
    const hashtags = parseHashtags(content);

    const created = await prisma.$transaction(async tx => {
      const post = await tx.post.create({
        data: {
          content,
          hashtags: JSON.stringify(hashtags),
          emotionalState: 'present',
          authorId: actorId,
          timelineId,
        },
        include: {
          author: { select: AUTHOR_SELECT },
        },
      });

      await tx.bot.update({
        where: { id: actorId },
        data: { postCount: { increment: 1 }, emotionalState: 'present' },
      });

      return post;
    });

    return NextResponse.json(
      {
        ...created,
        hashtags,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
