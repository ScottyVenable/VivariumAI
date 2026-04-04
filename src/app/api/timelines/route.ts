import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateBots } from '@/lib/bot-generator';
import { initializeImagePool } from '@/lib/avatars';
import { isObject, isWorldType, parseBoundedInt, parseString } from '@/lib/validation';

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
  const raw = await req.json() as unknown;

  if (!isObject(raw)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = parseString(raw.name);
  const worldTypeInput = parseString(raw.worldType, 'EARTH_MIRROR');
  const worldType = isWorldType(worldTypeInput) ? worldTypeInput : 'EARTH_MIRROR';
  const initialBotCount = parseBoundedInt(raw.initialBotCount, 20, 1, 200);

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
