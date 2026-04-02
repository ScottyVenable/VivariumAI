import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentPosts = await prisma.post.findMany({
    where: { timelineId: id, createdAt: { gte: since } },
    select: { hashtags: true, likeCount: true },
  });

  const hashtagCounts: Record<string, number> = {};
  for (const post of recentPosts) {
    const tags = JSON.parse(post.hashtags) as string[];
    for (const tag of tags) {
      hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
    }
  }

  const trending = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  const timeline = await prisma.timeline.findUnique({
    where: { id },
    select: { globalMood: true },
  });

  return NextResponse.json({
    trending,
    globalMood: timeline?.globalMood ?? 0.5,
    recentPostCount: recentPosts.length,
  });
}
