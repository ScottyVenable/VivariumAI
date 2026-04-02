import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateBots } from '@/lib/bot-generator';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const tier = searchParams.get('tier');

  const bots = await prisma.bot.findMany({
    where: {
      timelineId: id,
      ...(tier ? { tier } : {}),
    },
    orderBy: [{ followerCount: 'desc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json(bots);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { tier = 'SIMPLE_USER', count = 1 } = await req.json() as {
    tier?: string;
    count?: number;
  };

  const ids = await generateBots({
    tier,
    count,
    timelineId: id,
  });

  return NextResponse.json({ created: ids.length, ids }, { status: 201 });
}
