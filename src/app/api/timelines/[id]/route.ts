import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
  await prisma.timeline.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
