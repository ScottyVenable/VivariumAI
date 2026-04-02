import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bot = await prisma.bot.findUnique({
    where: { id },
    include: {
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          _count: { select: { replies: true, likes: true } },
        },
      },
      _count: {
        select: { followedBy: true, following: true, posts: true },
      },
    },
  });

  if (!bot) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
  }

  return NextResponse.json(bot);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const updates = await req.json() as Record<string, unknown>;
  
  const bot = await prisma.bot.update({
    where: { id },
    data: updates,
  });

  return NextResponse.json(bot);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.bot.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
