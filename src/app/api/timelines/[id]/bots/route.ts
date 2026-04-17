import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateBots } from '@/lib/bots/bot-generator';
import { isBotTier, isObject, parseBoundedInt, parseString } from '@/lib/validation';

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
  const raw = await req.json() as unknown;

  if (!isObject(raw)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const tierInput = parseString(raw.tier, 'SIMPLE_USER');
  const tier = isBotTier(tierInput) ? tierInput : 'SIMPLE_USER';
  const count = parseBoundedInt(raw.count, 1, 1, 100);

  const ids = await generateBots({
    tier,
    count,
    timelineId: id,
  });

  return NextResponse.json({ created: ids.length, ids }, { status: 201 });
}
