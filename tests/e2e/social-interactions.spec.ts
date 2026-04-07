import { expect, test } from '@playwright/test';
import { prisma } from '../../src/lib/db';
import { captureFlowScreenshot } from './helpers/screenshots';
import { createBots, createTimeline, deleteTimeline } from './helpers/timeline';

interface TimelineBot {
  id: string;
  username: string;
  displayName: string;
}

interface ThreadReply {
  content: string;
  author: {
    username: string;
  };
  replies: ThreadReply[];
}

interface PostDetailResponse {
  replies: ThreadReply[];
}

function flattenReplies(replies: ThreadReply[]): ThreadReply[] {
  return replies.flatMap(reply => [reply, ...flattenReplies(reply.replies)]);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('supports bot activity, human replies, and profile inspection', async ({ page, request }, testInfo) => {
  test.setTimeout(60_000);

  const suffix = `${testInfo.project.name}-${Date.now()}`;
  const timeline = await createTimeline(request, `Social Flow ${suffix}`, 2);
  const seededBotPost = `Bot update ${suffix}: the Vivarium feels unusually observant today.`;
  const humanReply = `Operator reply ${suffix} checking in on the simulation.`;

  try {
    await createBots(request, timeline.id, 1);

    const botsResponse = await request.get(`/api/timelines/${timeline.id}/bots`);
    expect(botsResponse.ok()).toBeTruthy();
    const bots = await botsResponse.json() as TimelineBot[];
    const targetBot = bots[0];

    expect(targetBot).toBeTruthy();

    await prisma.$transaction(async tx => {
      await tx.post.create({
        data: {
          content: seededBotPost,
          hashtags: JSON.stringify(['#Vivarium', '#SignalCheck']),
          emotionalState: 'curious',
          authorId: targetBot.id,
          timelineId: timeline.id,
        },
      });

      await tx.bot.update({
        where: { id: targetBot.id },
        data: {
          emotionalState: 'curious',
          postCount: { increment: 1 },
        },
      });
    });

    const postSnippet = seededBotPost.slice(0, 80);

    await page.goto(`/timeline/${timeline.id}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: timeline.name })).toBeVisible();
    await captureFlowScreenshot(page, testInfo, 'social-flow-timeline-loaded');

    const postCard = page
      .locator('article')
      .filter({ hasText: targetBot.displayName })
      .filter({ hasText: postSnippet })
      .first();

    await expect(postCard).toBeVisible();
    await postCard.click();

    await expect(page.getByText(/thread view/i)).toBeVisible();
    await captureFlowScreenshot(page, testInfo, 'social-flow-thread-open');

    const replyBox = page.getByPlaceholder(
      new RegExp(`Reply to @${escapeRegExp(targetBot.username)}`)
    );

    await expect(replyBox).toBeVisible();
    await replyBox.fill(humanReply);
    await replyBox.press('Control+Enter');
    await expect(replyBox).toHaveValue('', { timeout: 10_000 });
    await captureFlowScreenshot(page, testInfo, 'social-flow-reply-submitted');

    const seededPost = await prisma.post.findFirst({
      where: {
        timelineId: timeline.id,
        authorId: targetBot.id,
        content: seededBotPost,
      },
      select: { id: true },
    });

    expect(seededPost?.id).toBeTruthy();

    await expect.poll(async () => {
      const detailResponse = await request.get(`/api/timelines/${timeline.id}/posts/${seededPost?.id}`);
      if (!detailResponse.ok()) return false;

      const detailPayload = await detailResponse.json() as PostDetailResponse;
      const allReplies = flattenReplies(detailPayload.replies);

      return allReplies.some(
        reply => reply.content === humanReply && reply.author.username === `human_${timeline.id}`
      );
    }).toBe(true);

    await page.keyboard.press('Escape');
    await expect(page.getByText(/thread view/i)).toBeHidden();

    await postCard.getByRole('button', { name: targetBot.displayName }).first().click();
    await expect(page.getByText('Profile')).toBeVisible();
    await expect(page.getByText('Recent posts')).toBeVisible();
    await expect(page.getByText('Memory')).toBeVisible();
    await captureFlowScreenshot(page, testInfo, 'social-flow-profile-open');
  } finally {
    await deleteTimeline(request, timeline.id);
  }
});