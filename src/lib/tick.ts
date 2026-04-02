import { prisma } from './db';
import { decideBotAction, generateContent, BotDecision } from './lmstudio';

const TICK_INTERVAL_MS = 45000;
const BOTS_PER_TICK_RATIO = 0.3;

export interface TickResult {
  tickId: string;
  botsProcessed: number;
  actions: {
    botId: string;
    botName: string;
    action: string;
    postId?: string;
  }[];
  timestamp: Date;
}

export async function runTick(timelineId: string): Promise<TickResult> {
  const tickId = `tick_${Date.now()}`;
  const actions: TickResult['actions'] = [];

  const timeline = await prisma.timeline.findUnique({
    where: { id: timelineId },
  });

  if (!timeline) {
    return { tickId, botsProcessed: 0, actions, timestamp: new Date() };
  }

  const allBots = await prisma.bot.findMany({
    where: { timelineId, isHuman: false },
    select: {
      id: true,
      username: true,
      displayName: true,
      tier: true,
      reactivity: true,
      extraversion: true,
      compassion: true,
      reasoningSkill: true,
      occupation: true,
      simulatedAge: true,
      emotionalState: true,
      humanSentiment: true,
    },
  });

  if (allBots.length === 0) {
    return { tickId, botsProcessed: 0, actions, timestamp: new Date() };
  }

  const numToWake = Math.max(1, Math.floor(allBots.length * BOTS_PER_TICK_RATIO));
  const shuffled = [...allBots].sort(() => Math.random() - 0.5);
  const awakeBots = shuffled.slice(0, numToWake);

  const recentPosts = await prisma.post.findMany({
    where: { timelineId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      content: true,
      hashtags: true,
      author: { select: { displayName: true, tier: true } },
    },
  });

  const recentPostsContext = recentPosts
    .map(p => `[${p.author.displayName}]: ${p.content}`)
    .join('\n');

  for (const bot of awakeBots) {
    try {
      const decision = await decideBotAction(bot, recentPostsContext, timeline.globalMood);
      const result = await executeAction(bot, decision, timelineId, recentPosts, timeline.globalMood);
      
      actions.push({
        botId: bot.id,
        botName: bot.displayName,
        action: decision.action,
        postId: result?.postId,
      });
    } catch (err) {
      console.error(`Tick error for bot ${bot.username}:`, err);
    }
  }

  return { tickId, botsProcessed: awakeBots.length, actions, timestamp: new Date() };
}

async function executeAction(
  bot: {
    id: string;
    displayName: string;
    tier: string;
    compassion: number;
    reasoningSkill: number;
    occupation: string;
    simulatedAge: number;
    emotionalState?: string | null;
    reactivity: number;
    extraversion: number;
    humanSentiment: number;
  },
  decision: BotDecision,
  timelineId: string,
  recentPosts: { id: string; content: string; hashtags: string; author: { displayName: string; tier: string } }[],
  globalMood: number
): Promise<{ postId?: string } | null> {
  switch (decision.action) {
    case 'post': {
      const context = 'the current state of the timeline';
      const output = await generateContent(bot, context, false, globalMood);
      
      const post = await prisma.post.create({
        data: {
          content: output.content,
          hashtags: JSON.stringify(output.hashtags),
          emotionalState: output.emotional_state,
          authorId: bot.id,
          timelineId,
        },
      });

      await prisma.bot.update({
        where: { id: bot.id },
        data: {
          emotionalState: output.emotional_state,
          postCount: { increment: 1 },
        },
      });

      return { postId: post.id };
    }

    case 'reply': {
      const target = decision.targetId
        ? recentPosts.find(p => p.id === decision.targetId)
        : recentPosts[Math.floor(Math.random() * recentPosts.length)];
      
      if (!target) return null;

      const output = await generateContent(bot, target.content, true, globalMood);
      
      const post = await prisma.post.create({
        data: {
          content: output.content,
          hashtags: JSON.stringify(output.hashtags),
          emotionalState: output.emotional_state,
          authorId: bot.id,
          timelineId,
          parentId: target.id,
        },
      });

      await prisma.$transaction([
        prisma.bot.update({
          where: { id: bot.id },
          data: {
            emotionalState: output.emotional_state,
            postCount: { increment: 1 },
          },
        }),
        prisma.post.update({
          where: { id: target.id },
          data: { replyCount: { increment: 1 } },
        }),
      ]);

      return { postId: post.id };
    }

    case 'like': {
      const target = decision.targetId
        ? recentPosts.find(p => p.id === decision.targetId)
        : recentPosts[Math.floor(Math.random() * recentPosts.length)];
      
      if (!target) return null;

      const existing = await prisma.like.findUnique({
        where: { botId_postId: { botId: bot.id, postId: target.id } },
      });
      
      if (!existing) {
        await prisma.$transaction([
          prisma.like.create({
            data: { botId: bot.id, postId: target.id },
          }),
          prisma.post.update({
            where: { id: target.id },
            data: { likeCount: { increment: 1 } },
          }),
        ]);
      }

      return null;
    }

    case 'follow': {
      if (recentPosts.length === 0) return null;
      
      const targets = recentPosts.map(p => p.author).filter(a => a.displayName !== bot.displayName);
      if (targets.length === 0) return null;
      
      const targetBot = await prisma.bot.findFirst({
        where: {
          timelineId,
          displayName: targets[0].displayName,
          id: { not: bot.id },
        },
      });
      
      if (!targetBot) return null;

      const existing = await prisma.follow.findUnique({
        where: { sourceId_targetId: { sourceId: bot.id, targetId: targetBot.id } },
      });

      if (!existing) {
        await prisma.$transaction([
          prisma.follow.create({
            data: { sourceId: bot.id, targetId: targetBot.id },
          }),
          prisma.bot.update({
            where: { id: bot.id },
            data: { followingCount: { increment: 1 } },
          }),
          prisma.bot.update({
            where: { id: targetBot.id },
            data: { followerCount: { increment: 1 } },
          }),
        ]);
      }

      return null;
    }

    case 'idle':
    default:
      return null;
  }
}

let tickInterval: ReturnType<typeof setInterval> | null = null;
let activeTimelineId: string | null = null;

export function startTickLoop(timelineId: string): void {
  if (tickInterval) {
    clearInterval(tickInterval);
  }
  activeTimelineId = timelineId;
  
  tickInterval = setInterval(async () => {
    if (activeTimelineId) {
      try {
        await runTick(activeTimelineId);
        console.log(`[TICK] Completed tick for timeline ${activeTimelineId}`);
      } catch (err) {
        console.error('[TICK] Error during tick:', err);
      }
    }
  }, TICK_INTERVAL_MS);
  
  console.log(`[TICK] Started tick loop for timeline ${timelineId}`);
}

export function stopTickLoop(): void {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
    activeTimelineId = null;
    console.log('[TICK] Stopped tick loop');
  }
}
