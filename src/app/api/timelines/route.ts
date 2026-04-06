import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateBots } from '@/lib/bot-generator';
import { initializeImagePool } from '@/lib/avatars';
import { isObject, isWorldType, parseBoundedInt, parseString } from '@/lib/validation';
import { adminConfig } from '@config/admin';

export async function GET() {
  try {
    const timelines = await prisma.timeline.findMany({
      include: {
        _count: {
          select: { bots: true, posts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(timelines);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load timelines';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json() as unknown;

    if (!isObject(raw)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const name = parseString(raw.name);
    const worldTypeInput = parseString(raw.worldType, adminConfig.timeline.defaultWorldType);
    const worldType = isWorldType(worldTypeInput) ? worldTypeInput : adminConfig.timeline.defaultWorldType;
    const initialBotCount = parseBoundedInt(
      raw.initialBotCount,
      adminConfig.timeline.initialBotCount.default,
      adminConfig.timeline.initialBotCount.min,
      adminConfig.timeline.initialBotCount.max
    );

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await initializeImagePool();

    const timeline = await prisma.timeline.create({
      data: { name, worldType },
    });

    await generateBots({
      tier: 'SIMPLE_USER',
      count: Math.floor(initialBotCount * adminConfig.timeline.initialBotCount.distribution.simple),
      timelineId: timeline.id,
    });

    await generateBots({
      tier: 'STANDARD_USER',
      count: Math.floor(initialBotCount * adminConfig.timeline.initialBotCount.distribution.standard),
      timelineId: timeline.id,
    });

    await generateBots({
      tier: 'SUPER_USER_AI',
      count: Math.max(1, Math.floor(initialBotCount * adminConfig.timeline.initialBotCount.distribution.superAi)),
      timelineId: timeline.id,
    });

    const timelineWithCounts = await prisma.timeline.findUnique({
      where: { id: timeline.id },
      include: {
        _count: {
          select: { bots: true, posts: true },
        },
      },
    });

    if (!timelineWithCounts) {
      return NextResponse.json({ error: 'Timeline created but could not be loaded' }, { status: 500 });
    }

    return NextResponse.json(timelineWithCounts, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create timeline';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
