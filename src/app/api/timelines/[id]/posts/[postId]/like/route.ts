import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrCreateHumanActor } from '@/lib/human-actor';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const { id: timelineId, postId } = await params;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, timelineId: true },
    });

    if (!post || post.timelineId !== timelineId) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const actorId = await getOrCreateHumanActor(timelineId);

    const existing = await prisma.like.findUnique({
      where: { botId_postId: { botId: actorId, postId } },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ liked: true, deduped: true });
    }

    await prisma.$transaction([
      prisma.like.create({ data: { botId: actorId, postId } }),
      prisma.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ liked: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to like post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
