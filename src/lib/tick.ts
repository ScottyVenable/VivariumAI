import { prisma } from './db';
import { decideBotAction, generateContent, BotDecision, DECISION_MODEL } from './lmstudio';
import { parseBotMemory, remember } from './memory';
import { adminConfig } from '@config/admin';

function fisherYatesShuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Extract up to `limit` trending hashtags across a set of posts. */
function extractTrending(
  posts: { hashtags: string }[],
  limit = 4
): string[] {
  const counts: Record<string, number> = {};
  for (const post of posts) {
    let tags: unknown;
    try { tags = JSON.parse(post.hashtags || '[]'); } catch { tags = []; }
    if (!Array.isArray(tags)) continue;
    for (const tag of tags) {
      if (typeof tag === 'string' && tag.trim()) {
        counts[tag.trim()] = (counts[tag.trim()] || 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

/** Derive a simple emotional state from post content sentiment. */
function sentimentShift(content: string, fallback: string): string {
  const lower = content.toLowerCase();
  if (/\b(love|amazing|great|wonderful|excited|happy|beautiful|fantastic)\b/.test(lower)) return 'uplifted';
  if (/\b(angry|hate|terrible|awful|furious|disgusting|outraged|upset)\b/.test(lower)) return 'agitated';
  if (/\b(sad|disappointed|worried|anxious|scared|helpless)\b/.test(lower)) return 'uneasy';
  if (/\b(lol|lmao|haha|hilarious|funny|lmfao)\b/.test(lower)) return 'amused';
  return fallback;
}

type FeedPost = {
  id: string;
  content: string;
  hashtags: string;
  likeCount: number;
  replyCount: number;
  parentId: string | null;
  author: { username: string; displayName: string; tier: string; isHuman: boolean };
};

type AmbientHuman = {
  id: string;
  username: string;
  displayName: string;
};

function parseHashtagArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

function summarizeTopic(post: Pick<FeedPost, 'content' | 'hashtags'>): string {
  const tags = parseHashtagArray(post.hashtags);
  if (tags.length > 0) return tags[0];
  return post.content.split(/\s+/).slice(0, 6).join(' ').replace(/["'.,!?]+$/g, '');
}

function buildPostContext(memoryRaw: string | null | undefined, fallback: string): string {
  const memory = parseBotMemory(memoryRaw);
  if (memory.topics.length > 0) {
    return `${memory.topics[0]} — something this profile keeps caring about lately. Tie it to what's happening now.`;
  }

  return fallback;
}

function ambientReplyText(target: FeedPost, trendingTags: string[]): string {
  const topic = summarizeTopic(target);
  const tag = trendingTags[0];
  const author = target.author.username;
  const content = target.content.trim().replace(/\s+/g, ' ');
  const lead = content.slice(0, 80);
  const asksQuestion = /\?$/.test(content) || /\b(why|how|what|should|can)\b/i.test(content);
  const mentionsPolicy = /\b(policy|law|rules|regulation|ban|rights|tax|public)\b/i.test(content);

  if (asksQuestion) {
    return `@${author} good question — on ${topic}, most people miss the tradeoff in the middle.`;
  }

  if (mentionsPolicy) {
    return `@${author} this lands for me. The policy angle around ${topic} is where the real debate is.`;
  }

  const pool = [
    `@${author} this is exactly why people keep talking about ${topic}`,
    `@${author} the part about "${lead}" is what people keep skipping over`,
    tag ? `@${author} ${tag} has been everywhere, and this is one of the better takes on it` : `@${author} this adds needed context to the thread`,
    `@${author} fair point — especially the way you framed ${topic}`,
    `@${author} I do not fully agree, but this is way more grounded than most replies`,
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

async function ensureAmbientHumans(timelineId: string, desiredCount = 3): Promise<AmbientHuman[]> {
  const existing = await prisma.bot.findMany({
    where: { timelineId, isHuman: true, username: { startsWith: 'ambient_' } },
    select: { id: true, username: true, displayName: true },
    take: desiredCount,
  });

  if (existing.length >= desiredCount) {
    return existing;
  }

  const names = ['Mia', 'Chris', 'Sam', 'Nina', 'Leo', 'Ava', 'Jay', 'Zoe'];
  const created: AmbientHuman[] = [];

  for (let i = existing.length; i < desiredCount; i++) {
    const seed = `${timelineId.slice(-4)}_${i}`;
    const displayName = `${names[i % names.length]} Park`;
    const bot = await prisma.bot.create({
      data: {
        timelineId,
        isHuman: true,
        tier: 'STANDARD_USER_HUMAN',
        username: `ambient_${seed}`,
        displayName,
        occupation: 'Viewer',
        bio: 'Ambient audience account',
        memory: '{}',
        reactivity: 0.45,
        extraversion: 0.45,
        compassion: 0.55,
        reasoningSkill: 0.5,
        humanSentiment: 0.65,
        influenceability: 0.5,
        simulatedAge: 24 + i,
      } as any,
      select: { id: true, username: true, displayName: true },
    });
    created.push(bot);
  }

  return [...existing, ...created];
}

async function getAncestorIds(postId: string): Promise<string[]> {
  const ids: string[] = [];
  let currentId: string | null = postId;

  while (currentId) {
    ids.push(currentId);
    const postRecord: { parentId: string | null } | null = await prisma.post.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    currentId = postRecord?.parentId ?? null;
  }

  return ids;
}

async function simulateAmbientHumanActivity(
  timelineId: string,
  feedPosts: FeedPost[],
  hotPosts: FeedPost[],
  conversationalPosts: FeedPost[],
  trendingTags: string[],
  actions: TickResult['actions']
): Promise<void> {
  if (!adminConfig.simulation.ambient.enabled) return;
  if (feedPosts.length === 0) return;

  const humans = await ensureAmbientHumans(timelineId, adminConfig.simulation.ambient.desiredHumans);
  if (humans.length === 0) return;

  const likeTarget = weightedPick(conversationalPosts.length > 0 ? conversationalPosts : hotPosts.length > 0 ? hotPosts : feedPosts);
  if (likeTarget) {
    const actor = humans[Math.floor(Math.random() * humans.length)];
    const existing = await prisma.like.findUnique({
      where: { botId_postId: { botId: actor.id, postId: likeTarget.id } },
      select: { id: true },
    });

    if (!existing) {
      await prisma.$transaction([
        prisma.like.create({ data: { botId: actor.id, postId: likeTarget.id } }),
        prisma.post.update({ where: { id: likeTarget.id }, data: { likeCount: { increment: 1 } } }),
      ]);

      actions.push({
        botId: actor.id,
        botName: actor.displayName,
        action: 'like',
      });
    }
  }

  if (Math.random() < adminConfig.simulation.ambient.replyChance) {
    const replyTarget = weightedPick(conversationalPosts.length > 0 ? conversationalPosts : hotPosts.length > 0 ? hotPosts : feedPosts);
    if (!replyTarget) return;
    if (!replyTarget.author.isHuman && engagementScore(replyTarget) < adminConfig.simulation.ambient.minNonHumanTargetScoreForReply) return;

    const actor = humans[Math.floor(Math.random() * humans.length)];
    const content = ambientReplyText(replyTarget, trendingTags);
    const ancestorIds = await getAncestorIds(replyTarget.id);

    const created = await prisma.$transaction(async tx => {
      const reply = await tx.post.create({
        data: {
          content,
          hashtags: '[]',
          emotionalState: sentimentShift(content, 'engaged'),
          authorId: actor.id,
          timelineId,
          parentId: replyTarget.id,
        },
      });

      await Promise.all(
        ancestorIds.map(id =>
          tx.post.update({
            where: { id },
            data: { replyCount: { increment: 1 } },
          })
        )
      );

      return reply;
    });

    actions.push({
      botId: actor.id,
      botName: actor.displayName,
      action: 'reply',
      postId: created.id,
    });
  }
}

function engagementScore(post: FeedPost): number {
  return post.likeCount + post.replyCount * 2 + (post.author.isHuman ? 4 : 0) + (post.parentId ? 2 : 0);
}

function weightedPick(posts: FeedPost[]): FeedPost | undefined {
  if (posts.length === 0) return undefined;

  const totalWeight = posts.reduce((sum, post) => sum + Math.max(1, engagementScore(post)), 0);
  let roll = Math.random() * totalWeight;

  for (const post of posts) {
    roll -= Math.max(1, engagementScore(post));
    if (roll <= 0) {
      return post;
    }
  }

  return posts[posts.length - 1];
}

const TICK_MIN_INTERVAL_MS = adminConfig.simulation.tick.minIntervalMs;
const TICK_MAX_INTERVAL_MS = adminConfig.simulation.tick.maxIntervalMs;
const BOTS_PER_TICK_RATIO = adminConfig.simulation.tick.botsPerTickRatio;

function getRandomTickIntervalMs(): number {
  return Math.floor(
    Math.random() * (TICK_MAX_INTERVAL_MS - TICK_MIN_INTERVAL_MS + 1) + TICK_MIN_INTERVAL_MS
  );
}

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
      bio: true,
      memory: true,
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
  } as any);

  if (allBots.length === 0) {
    return { tickId, botsProcessed: 0, actions, timestamp: new Date() };
  }

  const numToWake = Math.max(1, Math.floor(allBots.length * BOTS_PER_TICK_RATIO));
  const shuffled = fisherYatesShuffle([...allBots]);
  const awakeBots = shuffled.slice(0, numToWake);

  const recentPosts = await prisma.post.findMany({
    where: { timelineId },
    orderBy: { createdAt: 'desc' },
    take: adminConfig.simulation.tick.recentPostsToLoad,
    select: {
      id: true,
      content: true,
      hashtags: true,
      likeCount: true,
      replyCount: true,
      parentId: true,
      author: { select: { username: true, displayName: true, tier: true, isHuman: true } },
    },
  });

  const feedPosts: FeedPost[] = recentPosts;

  // Derive trending hashtags and hot posts from engagement signals
  const trendingTags = extractTrending(feedPosts);
  const hotPosts = [...feedPosts]
    .sort((a, b) => engagementScore(b) - engagementScore(a))
    .slice(0, adminConfig.simulation.tick.hotPostsToTrack);
  const conversationalPosts = feedPosts.filter(post => post.author.isHuman || post.parentId);

  const trendingLine = trendingTags.length > 0
    ? `Trending now: ${trendingTags.join('  ')}`
    : '';
  const hotLine = hotPosts.length > 0
    ? `Hot posts:\n${hotPosts.map(p => `  [id:${p.id}] [${p.author.isHuman ? 'HUMAN' : 'BOT'} ${p.parentId ? 'REPLY' : 'POST'}] [${p.likeCount}❤ ${p.replyCount}↩] @${p.author.displayName}: ${p.content.slice(0, 120)}`).join('\n')}`
    : '';
  const recentLine = `Recent:\n${feedPosts.slice(0, adminConfig.simulation.tick.recentPostsInPrompt).map(p => `  [id:${p.id}] [${p.author.isHuman ? 'HUMAN' : 'BOT'} ${p.parentId ? 'REPLY' : 'POST'}] @${p.author.displayName}: ${p.content.slice(0, 100)}`).join('\n')}`;

  const recentPostsContext = [trendingLine, hotLine, recentLine].filter(Boolean).join('\n\n');
  const trendingContext = trendingTags.length > 0 ? trendingTags.join(' ') : null;

  // Post context for bots choosing to post something new — draw from trending topics
  const newPostContext = trendingTags.length > 0
    ? `${trendingTags[0]} — there's a lot of discussion about this right now`
    : feedPosts.length > 0
      ? `"${feedPosts[0].content.slice(0, 80)}" (and similar things being talked about)`
      : 'what is on their mind';

  for (const bot of awakeBots) {
    try {
      const decision = await decideBotAction(bot, recentPostsContext, timeline.globalMood);
      const result = await executeAction(
        bot, decision, timelineId, feedPosts, hotPosts, conversationalPosts,
        timeline.globalMood, newPostContext, trendingContext
      );
      
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

  await simulateAmbientHumanActivity(
    timelineId,
    feedPosts,
    hotPosts,
    conversationalPosts,
    trendingTags,
    actions
  );

  // Drift global mood based on active bots' compassion (slow, small nudge per tick)
  if (awakeBots.length > 0) {
    const avgCompassion = awakeBots.reduce((s, b) => s + b.compassion, 0) / awakeBots.length;
    const moodDelta = (avgCompassion - 0.5) * 0.04;
    const newMood = Math.min(1, Math.max(0, timeline.globalMood + moodDelta));
    await prisma.timeline.update({
      where: { id: timelineId },
      data: { globalMood: newMood },
    });
  }

  return { tickId, botsProcessed: awakeBots.length, actions, timestamp: new Date() };
}

async function executeAction(
  bot: {
    id: string;
    displayName: string;
    bio: string | null;
    memory?: string | null;
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
  recentPosts: FeedPost[],
  hotPosts: FeedPost[],
  conversationalPosts: FeedPost[],
  globalMood: number,
  newPostContext: string,
  trendingContext?: string | null
): Promise<{ postId?: string } | null> {
  switch (decision.action) {
    case 'post': {
      const postContext = buildPostContext(bot.memory, newPostContext);
      const output = decision.draft || await generateContent(
        bot,
        postContext,
        false,
        globalMood,
        trendingContext,
        DECISION_MODEL
      );
      
      const rememberedTopic = output.hashtags[0] || postContext.slice(0, 48);
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
          memory: remember(bot.memory, {
            topic: rememberedTopic,
            event: `Posted about ${rememberedTopic}`,
          }),
          postCount: { increment: 1 },
        } as any,
      });

      return { postId: post.id };
    }

    case 'reply': {
      // Prefer human posts/comments and active threads, but still allow some drift.
      let target = decision.targetId
        ? recentPosts.find(p => p.id === decision.targetId)
        : undefined;

      if (!target) {
        if (Math.random() < adminConfig.simulation.decision.preferConversationalChance && conversationalPosts.length > 0) {
          target = weightedPick(conversationalPosts);
        } else if (Math.random() < adminConfig.simulation.decision.preferHotPostChance && hotPosts.length > 0) {
          target = weightedPick(hotPosts);
        } else {
          target = weightedPick(recentPosts);
        }
      }

      if (!target) return null;

      if (
        engagementScore(target) <= adminConfig.simulation.decision.skipLowSignalScoreThreshold &&
        bot.reactivity < adminConfig.simulation.decision.skipLowSignalReactivityThreshold &&
        !target.author.isHuman
      ) {
        await prisma.bot.update({
          where: { id: bot.id },
          data: {
            memory: remember(bot.memory, {
              topic: summarizeTopic(target),
              person: `@${target.author.username}`,
              event: `Ignored low-signal post from @${target.author.username}`,
            }),
          } as any,
        });
        return null;
      }

      const output = decision.draft || await generateContent(
        bot,
        `Replying to @${target.author.username} on ${summarizeTopic(target)}: ${target.content}`,
        true,
        globalMood,
        trendingContext,
        DECISION_MODEL
      );
      const ancestorIds = await getAncestorIds(target.id);

      // Emotional contagion: bot is slightly influenced by what it replies to
      const shiftedMood = sentimentShift(target.content, output.emotional_state);
      const topic = output.hashtags[0] || summarizeTopic(target);

      const post = await prisma.post.create({
        data: {
          content: output.content,
          hashtags: JSON.stringify(output.hashtags),
          emotionalState: shiftedMood,
          authorId: bot.id,
          timelineId,
          parentId: target.id,
        },
      });

      await prisma.$transaction([
        prisma.bot.update({
          where: { id: bot.id },
          data: {
            emotionalState: shiftedMood,
            memory: remember(bot.memory, {
              topic,
              person: `@${target.author.username}`,
              event: `Replied to @${target.author.username} about ${topic}`,
            }),
            postCount: { increment: 1 },
          } as any,
        }),
        ...ancestorIds.map(id =>
          prisma.post.update({
            where: { id },
            data: { replyCount: { increment: 1 } },
          })
        ),
      ]);

      return { postId: post.id };
    }

    case 'like': {
      // Prefer liking human posts/comments and content with traction.
      let target = decision.targetId
        ? recentPosts.find(p => p.id === decision.targetId)
        : undefined;

      if (!target) {
        const pool = conversationalPosts.length > 0 && Math.random() < 0.6
          ? conversationalPosts
          : hotPosts.length > 0
            ? hotPosts
            : recentPosts;
        target = weightedPick(pool);
      }

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

        // Emotional contagion from liked content
        const shiftedMood = sentimentShift(target.content, bot.emotionalState || 'neutral');
        await prisma.bot.update({
          where: { id: bot.id },
          data: {
            emotionalState: shiftedMood,
            memory: remember(bot.memory, {
              topic: summarizeTopic(target),
              person: `@${target.author.username}`,
              event: `Liked a ${target.author.isHuman ? 'human' : 'bot'} ${target.parentId ? 'reply' : 'post'} from @${target.author.username}`,
            }),
          } as any,
        });
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
            data: {
              followingCount: { increment: 1 },
              memory: remember(bot.memory, {
                person: `@${targetBot.username}`,
                event: `Followed @${targetBot.username}`,
              }),
            } as any,
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

let tickInterval: ReturnType<typeof setTimeout> | null = null;
let activeTimelineId: string | null = null;

export function isTickLoopRunning(): boolean {
  return tickInterval !== null;
}

export function getActiveTimelineId(): string | null {
  return activeTimelineId;
}

export function startTickLoop(timelineId: string): void {
  if (tickInterval) {
    clearTimeout(tickInterval);
  }
  activeTimelineId = timelineId;

  const scheduleNextTick = () => {
    const nextInterval = getRandomTickIntervalMs();

    tickInterval = setTimeout(async () => {
      if (activeTimelineId) {
        try {
          await runTick(activeTimelineId);
          console.log(`[TICK] Completed tick for timeline ${activeTimelineId}`);
        } catch (err) {
          console.error('[TICK] Error during tick:', err);
        }
        scheduleNextTick();
      }
    }, nextInterval);
  };

  scheduleNextTick();

  console.log(
    `[TICK] Started stochastic tick loop for timeline ${timelineId} (${TICK_MIN_INTERVAL_MS / 1000}-${TICK_MAX_INTERVAL_MS / 1000}s)`
  );
}

export function stopTickLoop(): void {
  if (tickInterval) {
    clearTimeout(tickInterval);
    tickInterval = null;
    activeTimelineId = null;
    console.log('[TICK] Stopped tick loop');
  }
}
