import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrCreateHumanActor } from '@/lib/bots/human-actor';
import { adminConfig } from '@config/admin';

function parseContent(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

async function getAncestorIds(postId: string) {
  const ids: string[] = [];
  let currentId: string | null = postId;

  while (currentId) {
    ids.push(currentId);
    const postRecord: { parentId: string | null } | null = await prisma.post.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    currentId = postRecord?.parentId ?? null;
  }

  return ids;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const { id: timelineId, postId } = await params;

  try {
    const raw = await req.json().catch(() => ({}));
    const content = parseContent((raw as { content?: unknown }).content);

    if (!content) {
      return NextResponse.json({ error: 'Reply content is required' }, { status: 400 });
    }

    if (content.length > adminConfig.content.maxLength) {
      return NextResponse.json({ error: `Replies must be ${adminConfig.content.maxLength} characters or less` }, { status: 400 });
    }

    const parentPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, timelineId: true },
    });

    if (!parentPost || parentPost.timelineId !== timelineId) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const actorId = await getOrCreateHumanActor(timelineId);

    const ancestorIds = await getAncestorIds(postId);

    const reply = await prisma.$transaction(async tx => {
      const created = await tx.post.create({
        data: {
          content,
          hashtags: '[]',
          emotionalState: 'engaged',
          authorId: actorId,
          timelineId,
          parentId: postId,
        },
      });

      await Promise.all(
        ancestorIds.map(id =>
          tx.post.update({
            where: { id },
            data: { replyCount: { increment: 1 } },
          })
        )
      );

      return created;
    });

    return NextResponse.json(reply, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create reply';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
