import type { APIRequestContext } from '@playwright/test';
import { prisma } from '../../../src/lib/db';

interface TimelineResponse {
  id: string;
  name: string;
}

export interface FeedPostAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  tier: string;
  occupation: string;
}

export interface FeedPost {
  id: string;
  content: string;
  hashtags: string[];
  emotionalState?: string | null;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  author: FeedPostAuthor;
}

interface FeedResponse {
  posts: FeedPost[];
  total: number;
  page: number;
  totalPages: number;
}

export async function createTimeline(
  request: APIRequestContext,
  name: string,
  initialBotCount = 12
): Promise<TimelineResponse> {
  const response = await request.post('/api/timelines', {
    data: {
      name,
      worldType: 'EARTH_MIRROR',
      initialBotCount,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to create timeline: ${response.status()} ${body}`);
  }

  const payload = await response.json() as TimelineResponse;
  return payload;
}

export async function deleteTimeline(
  request: APIRequestContext,
  timelineId: string
): Promise<void> {
  try {
    const response = await request.delete(`/api/timelines/${timelineId}`);
    if (response.status() === 404 || response.ok()) {
      return;
    }

    const body = await response.text();
    throw new Error(`Failed to delete timeline ${timelineId}: ${response.status()} ${body}`);
  } catch {
    // Fallback for timeout/closed request contexts: remove all timeline data directly.
    await prisma.$transaction(async tx => {
      await tx.like.deleteMany({ where: { post: { timelineId } } });
      await tx.follow.deleteMany({ where: { source: { timelineId } } });
      await tx.follow.deleteMany({ where: { target: { timelineId } } });
      await tx.post.deleteMany({ where: { timelineId } });
      await tx.bot.deleteMany({ where: { timelineId } });
      await tx.timeline.deleteMany({ where: { id: timelineId } });
    });
  }
}

export async function createBots(
  request: APIRequestContext,
  timelineId: string,
  count: number,
  tier = 'SIMPLE_USER'
): Promise<void> {
  const response = await request.post(`/api/timelines/${timelineId}/bots`, {
    data: { count, tier },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to create bots for ${timelineId}: ${response.status()} ${body}`);
  }
}

export async function getTimelineFeed(
  request: APIRequestContext,
  timelineId: string,
  page = 1,
  limit = 30
): Promise<FeedResponse> {
  const response = await request.get(`/api/timelines/${timelineId}/feed?limit=${limit}&page=${page}`);

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to load feed for ${timelineId}: ${response.status()} ${body}`);
  }

  return await response.json() as FeedResponse;
}

export async function runManualTick(
  request: APIRequestContext,
  timelineId: string
): Promise<void> {
  const response = await request.post(`/api/timelines/${timelineId}/tick`, {
    data: {},
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Manual tick failed for ${timelineId}: ${response.status()} ${body}`);
  }
}

export async function waitForBotPost(
  request: APIRequestContext,
  timelineId: string,
  maxTicks = 12
): Promise<FeedPost> {
  const humanUsername = `human_${timelineId}`;

  for (let attempt = 0; attempt < maxTicks; attempt++) {
    const feed = await getTimelineFeed(request, timelineId);
    const botPost = feed.posts.find(post => post.author.username !== humanUsername);

    if (botPost) {
      return botPost;
    }

    await runManualTick(request, timelineId);
  }

  const finalFeed = await getTimelineFeed(request, timelineId);
  throw new Error(
    `No bot-authored post found for ${timelineId} after ${maxTicks} manual ticks. Feed size: ${finalFeed.posts.length}`
  );
}
