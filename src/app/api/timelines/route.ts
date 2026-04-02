import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateBots } from '@/lib/bot-generator';
import { initializeImagePool } from '@/lib/avatars';

export async function GET() {
  const timelines = await prisma.timeline.findMany({
    include: {
      _count: {
        select: { bots: true, posts: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(timelines);
}

export async function POST(req: NextRequest) {
  const { name, worldType = 'EARTH_MIRROR', initialBotCount = 20 } = await req.json() as {
    name: string;
    worldType?: string;
    initialBotCount?: number;
  };

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  await initializeImagePool();

  const timeline = await prisma.timeline.create({
    data: { name, worldType },
  });

  await generateBots({
    tier: 'SIMPLE_USER',
    count: Math.floor(initialBotCount * 0.7),
    timelineId: timeline.id,
  });

  await generateBots({
    tier: 'STANDARD_USER',
    count: Math.floor(initialBotCount * 0.2),
    timelineId: timeline.id,
  });

  await generateBots({
    tier: 'SUPER_USER_AI',
    count: Math.max(1, Math.floor(initialBotCount * 0.1)),
    timelineId: timeline.id,
  });

  return NextResponse.json(timeline, { status: 201 });
}
