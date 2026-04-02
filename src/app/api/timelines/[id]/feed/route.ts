import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { timelineId: id, parentId: null },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            tier: true,
            occupation: true,
          },
        },
        _count: { select: { replies: true, likes: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.post.count({ where: { timelineId: id, parentId: null } }),
  ]);

  return NextResponse.json({
    posts: posts.map(p => ({
      ...p,
      hashtags: JSON.parse(p.hashtags) as string[],
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
