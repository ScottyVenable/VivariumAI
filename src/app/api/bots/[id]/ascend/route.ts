import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const TIER_ORDER = ['SIMPLE_USER', 'STANDARD_USER', 'ADVANCED_USER', 'SUPER_USER_AI'];

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bot = await prisma.bot.findUnique({ where: { id } });

  if (!bot) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
  }

  const currentIndex = TIER_ORDER.indexOf(bot.tier);
  if (currentIndex === -1 || currentIndex >= TIER_ORDER.length - 1) {
    return NextResponse.json({ error: 'Bot cannot be ascended further' }, { status: 400 });
  }

  const newTier = TIER_ORDER[currentIndex + 1];

  const updated = await prisma.bot.update({
    where: { id },
    data: { tier: newTier },
  });

  return NextResponse.json(updated);
}
