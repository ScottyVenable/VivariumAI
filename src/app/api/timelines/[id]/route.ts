import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getActiveTimelineId, stopTickLoop } from '@/lib/tick';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const timeline = await prisma.timeline.findUnique({
    where: { id },
    include: {
      _count: { select: { bots: true, posts: true } },
    },
  });

  if (!timeline) {
    return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
  }

  return NextResponse.json(timeline);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const updates = await req.json() as Record<string, unknown>;
  
  const timeline = await prisma.timeline.update({
    where: { id },
    data: updates,
  });

  return NextResponse.json(timeline);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    if (getActiveTimelineId() === id) {
      stopTickLoop();
    }

    const existing = await prisma.timeline.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }

    await prisma.$transaction(async tx => {
      await tx.like.deleteMany({
        where: {
          OR: [
            { post: { timelineId: id } },
            { bot: { timelineId: id } },
          ],
        },
      });

      await tx.follow.deleteMany({
        where: {
          OR: [
            { source: { timelineId: id } },
            { target: { timelineId: id } },
          ],
        },
      });

      await tx.post.deleteMany({ where: { timelineId: id } });
      await tx.bot.deleteMany({ where: { timelineId: id } });
      await tx.timeline.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete timeline' }, { status: 500 });
  }
}
