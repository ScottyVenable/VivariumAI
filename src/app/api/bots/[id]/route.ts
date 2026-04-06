import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  clamp01,
  isBotTier,
  isObject,
  parseNonNegativeNumber,
  parseString,
} from '@/lib/validation';

const EDITABLE_FIELDS = new Set([
  'displayName',
  'bio',
  'memory',
  'avatarUrl',
  'tier',
  'influenceability',
  'reactivity',
  'compassion',
  'extraversion',
  'reasoningSkill',
  'humanSentiment',
  'simulatedAge',
  'occupation',
  'talkingStyle',
  'netWorth',
  'emotionalState',
]);

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

  return NextResponse.json({
    ...bot,
    posts: bot.posts.map(post => ({
      ...post,
      hashtags: JSON.parse(post.hashtags || '[]') as string[],
    })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const raw = await req.json() as unknown;

  if (!isObject(raw)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (!EDITABLE_FIELDS.has(key)) continue;

    if (key === 'tier' && typeof value === 'string') {
      const tier = parseString(value);
      if (isBotTier(tier)) {
        updates.tier = tier;
      }
      continue;
    }

    if (key === 'displayName' || key === 'bio' || key === 'memory' || key === 'avatarUrl' || key === 'occupation' || key === 'talkingStyle' || key === 'emotionalState') {
      updates[key] = parseString(value);
      continue;
    }

    if (
      key === 'influenceability' ||
      key === 'reactivity' ||
      key === 'compassion' ||
      key === 'extraversion' ||
      key === 'reasoningSkill' ||
      key === 'humanSentiment'
    ) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        updates[key] = clamp01(value);
      }
      continue;
    }

    if (key === 'simulatedAge' && typeof value === 'number' && Number.isFinite(value)) {
      updates.simulatedAge = Math.max(13, Math.min(120, Math.floor(value)));
      continue;
    }

    if (key === 'netWorth') {
      updates.netWorth = parseNonNegativeNumber(value, 0);
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
  }
  
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
