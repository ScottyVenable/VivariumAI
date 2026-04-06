import { expect, test } from '@playwright/test';
import { adminConfig } from '@config/admin';
import { createTimeline, deleteTimeline } from './helpers/timeline';

test.describe.serial('admin config + timeline lifecycle', () => {
  let timelineId = '';
  let seedPostId = '';

  test.beforeAll(async ({ request }) => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const timeline = await createTimeline(request, `Admin Suite ${suffix}`, 10);
    timelineId = timeline.id;

    const postResponse = await request.post(`/api/timelines/${timelineId}/posts`, {
      data: {
        content: 'Seed post for API test replies #seed',
      },
    });

    expect(postResponse.ok()).toBeTruthy();
    const postPayload = await postResponse.json() as { id: string };
    seedPostId = postPayload.id;
  });

  test.afterAll(async ({ request }) => {
    if (timelineId) {
      await deleteTimeline(request, timelineId);
    }
  });

  test('uses centralized max post length validation', async ({ request }) => {
    const tooLong = 'x'.repeat(adminConfig.content.maxLength + 1);

    const response = await request.post(`/api/timelines/${timelineId}/posts`, {
      data: { content: tooLong },
    });

    expect(response.status()).toBe(400);
    const payload = await response.json() as { error?: string };
    expect(payload.error).toContain(String(adminConfig.content.maxLength));
  });

  test('uses centralized max reply length validation', async ({ request }) => {
    const tooLong = 'y'.repeat(adminConfig.content.maxLength + 1);

    const response = await request.post(`/api/timelines/${timelineId}/posts/${seedPostId}/reply`, {
      data: { content: tooLong },
    });

    expect(response.status()).toBe(400);
    const payload = await response.json() as { error?: string };
    expect(payload.error).toContain(String(adminConfig.content.maxLength));
  });

  test('supports shared human actor flow for post, like, and reply', async ({ request }) => {
    const postResponse = await request.post(`/api/timelines/${timelineId}/posts`, {
      data: { content: 'Operator writes one test post' },
    });
    expect(postResponse.status()).toBe(201);

    const createdPost = await postResponse.json() as { id: string };

    const likeResponse = await request.post(`/api/timelines/${timelineId}/posts/${createdPost.id}/like`);
    expect(likeResponse.ok()).toBeTruthy();

    const replyResponse = await request.post(`/api/timelines/${timelineId}/posts/${createdPost.id}/reply`, {
      data: { content: 'Operator leaves one test reply' },
    });
    expect(replyResponse.status()).toBe(201);
  });

  test('deleting an active timeline stops its simulation loop', async ({ request }) => {
    const startResponse = await request.post(`/api/timelines/${timelineId}/tick`, {
      data: { running: true },
    });
    expect(startResponse.ok()).toBeTruthy();
    const startPayload = await startResponse.json() as { running?: boolean };
    expect(startPayload.running).toBe(true);

    const deleteResponse = await request.delete(`/api/timelines/${timelineId}`);
    expect(deleteResponse.ok()).toBeTruthy();

    const deletedId = timelineId;
    timelineId = '';

    const postDeleteStatus = await request.get(`/api/timelines/${deletedId}/tick`);
    const statusPayload = await postDeleteStatus.json() as { running: boolean };
    expect(statusPayload.running).toBeFalsy();
  });
});
