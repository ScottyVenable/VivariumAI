import type { APIRequestContext } from '@playwright/test';

interface TimelineResponse {
  id: string;
  name: string;
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
  const response = await request.delete(`/api/timelines/${timelineId}`);
  if (response.status() !== 404 && !response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to delete timeline ${timelineId}: ${response.status()} ${body}`);
  }
}
