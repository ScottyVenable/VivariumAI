import { prisma } from '../db';
import { decideBotActionsBatch, generateContent, BotDecision } from './lmstudio';
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
  if (/\b(love|adore|amazing|great|wonderful|excited|happy|beautiful|fantastic|thrilled|joyful|elated|delighted|brilliant|blessed|grateful|awesome|incredible|magnificent|superb|exhilarated|euphoric|proud|hopeful|optimistic|inspired|radiant|ecstatic)\b/.test(lower)) return 'uplifted';
  if (/\b(angry|anger|hate|hatred|terrible|awful|furious|disgusting|outraged|upset|enraged|livid|infuriated|appalled|revolting|despicable|vile|disgusted|hostile|irate|bitter|resentful|seething|incensed|contempt|loathe|loathing)\b/.test(lower)) return 'agitated';
  if (/\b(sad|sadness|disappointed|disappointment|worried|anxious|anxiety|scared|fear|fearful|helpless|hopeless|depressed|miserable|lonely|heartbroken|grief|devastated|crushed|shattered|desperate|dread|dreadful|gloomy|melancholy|sorrowful|anguish|distressed|troubled|overwhelmed|exhausted)\b/.test(lower)) return 'uneasy';
  if (/\b(lol|lmao|haha|hilarious|funny|lmfao|laughing|rofl|😂|hysterical|absurd|ridiculous|comical|jest|joke|joking|humor|humorous|witty|silly|playful|whimsical|goofy|lighthearted)\b/.test(lower)) return 'amused';
  if (/\b(fascinating|curious|interesting|wonder|wondering|intrigued|why|how|what if|question|explore|discover|think about|ponder|consider|speculate|mysterious|enigmatic|puzzling|unusual|strange|odd|weird|unexpected|surprising|remarkable|notable)\b/.test(lower)) return 'curious';
  if (/\b(inspire|inspired|inspiring|motivate|motivated|motivating|encourage|encouragement|breakthrough|achievement|progress|momentum|driven|determined|passionate|purpose|vision|possibility|potential|growth|evolve|transform|empower|enlighten|awaken)\b/.test(lower)) return 'inspired';
  if (/\b(nostalgic|nostalgia|remember|memory|memories|reminisce|reminiscing|used to|back then|childhood|miss|missed|missing|those days|past|history|simpler times|good old|throwback|decades ago|years ago|long ago)\b/.test(lower)) return 'nostalgic';
  return fallback;
}

function splitEmotionalStateDebug(value: string): { mood: string; debugSuffix: string } {
  const [moodRaw, debugRaw] = value.split('||debug:');
  const mood = moodRaw.trim();
  if (!debugRaw) return { mood, debugSuffix: '' };
  return { mood, debugSuffix: `||debug:${debugRaw}` };
}

function attachEmotionalDebug(mood: string, debugSuffix: string): string {
  const cleanMood = mood.trim();
  if (!debugSuffix) return cleanMood;
  return `${cleanMood}${debugSuffix}`;
}

type FeedPost = {
  id: string;
  content: string;
  hashtags: string;
  likeCount: number;
  replyCount: number;
  parentId: string | null;
  parentAuthorId: string | null;
  author: { username: string; displayName: string; tier: string; isHuman: boolean };
};

type AmbientHuman = {
  id: string;
  username: string;
  displayName: string;
};

type NewsBot = {
  id: string;
  username: string;
  displayName: string;
  memory: string | null;
};

const NEWS_TOPICS = [
  'transport strike',
  'city council vote',
  'technology regulation',
  'public health advisory',
  'severe weather alert',
  'international summit',
  'education budget update',
  'energy market shift',
  'infrastructure outage',
  'election campaign trail',
  'sports championship',
  'death of public figure',
  'viral social media trend',
  'major scientific discovery',
  'cultural festival',
  'economic policy change',
  'public safety incident',
  'entertainment industry news',
  'space exploration milestone',
  'groundbreaking medical research',
  'cryptocurrency market volatility',
  'environmental regulation',
  'labor union negotiation',
  'startup funding round',
  'cybersecurity breach',
  'climate report release',
  'university research findings',
  'housing market trends',
  'food safety recall',
  'airline scandal',
  'tech startup acquisition',
  'pharmaceutical trial results',
  'traffic accident investigation',
  'museum exhibition opening',
  'music festival announcement',
  'stock market movement',
  'infrastructure project completion',
  'diplomatic crisis',
  'gaming industry development',
  'retail store closure',
  'renewable energy milestone',
  'patent dispute settlement',
  'film festival premiere',
  'social media platform update',
  'autonomous vehicle test',
  'archaeological discovery',
  'corruption investigation',
  'natural disaster relief',
  'artificial intelligence breakthrough',
  'supply chain disruption',
  'vaccine distribution update',
  'tourism recovery',
  'manufacturing plant expansion',
  'data privacy announcement',
  'wildlife conservation effort',
  'construction project delay',
  'merger and acquisition deal',
  'regulatory agency report',
  'protest movement update',
  'immigration policy change',
  'streaming service launch',
  'agricultural innovation',
  'transportation infrastructure upgrade',
  'court ruling announcement',
  'podcast sensation',
  'book publishing milestone',
  'ocean research expedition',
  'solar power initiative',
  'artificial intelligence ethics debate',
  'pandemic recovery milestone',
  'quantum computing advance',
  'urban planning proposal',
  'financial fraud case',
  'mental health awareness campaign',
  'wildlife sighting',
  'engineering achievement',
  'literature award',
  'marine conservation project',
  'military technology test',
  'disaster preparedness drill',
  'biodiversity survey',
  'robotics competition',
  'cultural heritage preservation',
  'water management initiative',
  'financial market regulation',
  'entertainment deal announcement',
  'scientific ethics debate',
  'transportation accident',
  'community development project',
  'technology acquisition',
  'weather phenomenon observation',
  'fitness trend emergence',
  'travel industry recovery',
  'education technology rollout',
  'political debate',
  'business merger announcement',
  'infrastructure inspection',
];

const NEWS_REGIONS = ['US', 'UK', 'EU', 'APAC', 'LATAM', 'Middle East'];

const NEWS_HASHTAGS = [
  '#Breaking',
  '#NewsUpdate',
  '#DevelopingStory',
  '#WorldNews',
  '#PolicyWatch',
  '#MarketWatch',
  '#WeatherAlert',
  '#PublicSafety',
  '#LiveCoverage',
  '#FactCheck',
  '#Investigation',
  '#Exclusive',
  '#Analysis',
  '#Opinion',
  '#InDepth',
  '#DocumentedEvidence',
  '#FirstResponders',
  '#CommunityImpact',
  '#EconomicNews',
  '#TechNews',
  '#HealthAlert',
  '#EnvironmentNews',
  '#PoliticalNews',
  '#BusinessNews',
  '#ScienceNews',
  '#CultureNews',
  '#SportsNews',
  '#EntertainmentNews',
];

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

function buildPostContext(memoryRaw: string | null | undefined, fallback: string, occupation?: string): string {
  const memory = parseBotMemory(memoryRaw);
  const occ = occupation ? occupation.toLowerCase() : '';

  if (memory.topics.length >= 2 && Math.random() < 0.25) {
    // Occasionally blend two recurring topics for a richer angle
    return `${memory.topics[0]} and how it connects to ${memory.topics[1]} — a recurring thread for this profile. Post a fresh take or observation that links the two.`;
  }

  if (memory.topics.length >= 1) {
    const topic = memory.topics[0];
    const occupationAngles = occ
      ? [
          `${topic} — something this profile keeps returning to lately. Post a specific observation from the perspective of someone in ${occ}.`,
          `${topic} — a recurring concern for this profile. As someone with a background in ${occ}, share what most people miss about this.`,
          `${topic} — post an opinion or reaction to this topic. Let your ${occ} experience shape your angle.`,
        ]
      : [
          `${topic} — something this profile keeps caring about lately. Tie it to what's happening now.`,
          `${topic} — share a genuine take, question, or observation about this. Be specific.`,
        ];
    return occupationAngles[Math.floor(Math.random() * occupationAngles.length)];
  }

  if (memory.recent.length >= 1) {
    const recentEvent = memory.recent[0].slice(0, 80);
    return `Take inspiration from something on your mind lately: "${recentEvent}". Post your own angle${occ ? ` as someone in ${occ}` : ''}.`;
  }

  return fallback;
}

function ambientReplyText(target: FeedPost, trendingTags: string[]): string {
  const topic = summarizeTopic(target);
  const tag = trendingTags[0];
  const author = target.author.username;
  const content = target.content.trim().replace(/\s+/g, ' ');
  const lead = content.slice(0, 75);
  const asksQuestion = /\?$/.test(content) || /\b(why|how|what|should|can)\b/i.test(content);
  const mentionsPolicy = /\b(policy|law|rules|regulation|ban|rights|tax|public)\b/i.test(content);
  const isEmotional = /\b(angry|sad|love|hate|scared|excited|furious|devastated|thrilled)\b/i.test(content);
  const isOpinion = /\b(think|believe|opinion|honestly|personally|IMO|take)\b/i.test(content);

  // Contextual high-fit responses first
  if (asksQuestion) {
    const questionReplies = [
      `@${author} good question — on ${topic}, most people miss the tradeoff in the middle`,
      `@${author} honestly I've been wondering the same thing about ${topic}`,
      `@${author} the answer depends on who you ask but I lean toward yes on this one`,
      `@${author} nobody talks about it because it's complicated but someone had to ask`,
    ];
    return questionReplies[Math.floor(Math.random() * questionReplies.length)];
  }

  if (mentionsPolicy) {
    const policyReplies = [
      `@${author} this lands for me. The policy angle around ${topic} is where the real debate is`,
      `@${author} there are a lot of takes on ${topic} right now but this one actually has teeth`,
      `@${author} the moment someone brings laws into ${topic} the whole conversation shifts`,
      `@${author} yeah the regulatory side of this is what everyone's dancing around`,
    ];
    return policyReplies[Math.floor(Math.random() * policyReplies.length)];
  }

  if (isEmotional) {
    const emotionalReplies = [
      `@${author} okay I felt that`,
      `@${author} this is the post that got me today ngl`,
      `@${author} the emotional honesty here is something`,
      `@${author} thank you for saying this out loud`,
    ];
    return emotionalReplies[Math.floor(Math.random() * emotionalReplies.length)];
  }

  if (isOpinion) {
    const opinionReplies = [
      `@${author} I would push back on part of this but you're not wrong where it matters`,
      `@${author} disagree on the framing but the core point is solid`,
      `@${author} this is closer to correct than most takes I have seen today`,
      `@${author} you said what a lot of people are thinking on this`,
    ];
    return opinionReplies[Math.floor(Math.random() * opinionReplies.length)];
  }

  // General reaction pool — varied tones
  const agreementPool = [
    `@${author} this is exactly why people keep talking about ${topic}`,
    `@${author} fair point — especially the way you framed ${topic}`,
    `@${author} yeah this one's been sitting with me since I read it`,
    `@${author} I did not expect to agree this much but here we are`,
    `@${author} the part about "${lead}" is what people keep glossing over`,
  ];

  const challengePool = [
    `@${author} I do not fully agree but this is way more grounded than most replies`,
    `@${author} interesting take — the counterargument people will reach for is obvious though`,
    `@${author} you're asking the right question even if the answer changes everything`,
    `@${author} worth a follow-up thread because this needs more unpacking`,
  ];

  const casualPool = [
    tag ? `@${author} ${tag} has been everywhere and this is one of the better takes` : `@${author} this adds needed context to the thread`,
    `@${author} saw this pop up twice now — the algorithm agrees with you`,
    `@${author} okay but why does this have fewer likes than it deserves`,
    `@${author} filed this under things worth bookmarking`,
    `@${author} this is the conversation I was looking for today`,
  ];

  const combinedPool = [...agreementPool, ...challengePool, ...casualPool];
  return combinedPool[Math.floor(Math.random() * combinedPool.length)];
}

function buildNewsBulletin(now: Date, outletName?: string): { content: string; hashtags: string[]; topic: string } {
  const topic = NEWS_TOPICS[Math.floor(Math.random() * NEWS_TOPICS.length)];
  const region = NEWS_REGIONS[Math.floor(Math.random() * NEWS_REGIONS.length)];
  const minuteMark = now.toISOString().slice(11, 16);
  const hour = now.getUTCHours();
  const timeLabel = hour < 12 ? 'this morning' : hour < 17 ? 'this afternoon' : 'this evening';

  const outlet = (outletName ?? '').toLowerCase();
  const isBroadcast = /\b(cbs|nbc|abc)\b/.test(outlet);
  const isWire = /\b(reuters|ap|associated press)\b/.test(outlet);
  const isCable = /\b(cnn|fox|msnbc)\b/.test(outlet);
  const isBBC = /\bbbc\b/.test(outlet);

  let pool: string[];

  if (isWire) {
    // Wire-service style: terse, passive voice, formal
    pool = [
      `${region.toUpperCase()} — Officials issue new statement on ${topic}. Additional details pending confirmation.`,
      `DEVELOPING: Reports emerging from ${region} on ${topic}. Authorities have not yet commented.`,
      `UPDATE (${minuteMark} UTC): Earlier reports on ${topic} in ${region} partially confirmed. Story continues to develop.`,
      `${region.toUpperCase()}, ${now.toDateString()} — Sources familiar with situation confirm movement on ${topic}. Full briefing expected.`,
      `FLASH: Initial reports indicate developments in ${topic} near ${region}. Monitoring underway.`,
    ];
  } else if (isBBC) {
    // BBC style: measured, global perspective, slightly formal
    pool = [
      `${region}: Authorities are monitoring the situation around ${topic} after fresh developments ${timeLabel}. Our correspondents are following this closely.`,
      `We are continuing to cover the story around ${topic} in ${region}. Officials have been briefed but have not yet made a formal statement.`,
      `Live updates: the situation relating to ${topic} in ${region} remains fluid. Analysis from our World Affairs team to follow.`,
      `${timeLabel.charAt(0).toUpperCase() + timeLabel.slice(1)}: our ${region} desk has received confirmation of new developments around ${topic}. More when we have it.`,
      `Newsroom: our team is tracking what appears to be a significant development around ${topic} across ${region}. No casualty reports at this stage.`,
    ];
  } else if (isBroadcast) {
    // Network broadcast style: accessible, audience-friendly, slightly urgent
    pool = [
      `We're following a developing story ${timeLabel} out of ${region} involving ${topic}. Stay with us for the latest.`,
      `Breaking ${timeLabel}: new reports are coming in about ${topic} in ${region}. Our team is on the ground.`,
      `Just in: officials in ${region} are expected to hold a briefing on ${topic} later ${timeLabel}. We will carry it live.`,
      `Developing story: what we know so far about ${topic} in ${region} — and what questions remain unanswered.`,
      `A quick update on the situation surrounding ${topic} in ${region}. Authorities are asking for patience as they gather more information.`,
    ];
  } else if (isCable) {
    // Cable news style: punchy, slightly editorialized, fast-moving
    pool = [
      `BREAKING: ${region} at the center of escalating concerns over ${topic}. Here's what we know so far.`,
      `UPDATE — ${topic} situation in ${region} is moving fast. Multiple sources confirming key details to our team right now.`,
      `This ${topic} story out of ${region} is not going away. Three things you need to know. Thread below. ↓`,
      `We've been tracking ${topic} all day. ${region} just became the center of this. Watch this space. #Breaking`,
      `The ${topic} developments coming out of ${region} ${timeLabel} — and why the numbers matter more than the headlines.`,
    ];
  } else {
    // Generic / fallback — broader variety
    pool = [
      `Breaking: ${region} desk tracking fresh developments around ${topic}. More details expected shortly.`,
      `News update (${minuteMark} UTC): early reports indicate movement on ${topic} in ${region}. Verification ongoing.`,
      `Developing: officials in ${region} issue a new statement related to ${topic}.`,
      `Live desk: we are monitoring ${topic} across ${region} and will post confirmed updates as they arrive.`,
      `${region} update: the situation around ${topic} has shifted in the last hour. Here's what we know.`,
      `Our team is on the ground in ${region} tracking the latest on ${topic}. First confirmed details now in.`,
      `Analysis: the broader context around ${topic} in ${region} — and why this week's developments matter.`,
      `Key data now confirmed: the ${topic} story out of ${region} is larger than initial reports suggested.`,
    ];
  }

  const content = pool[Math.floor(Math.random() * pool.length)];
  const hashtags = [
    NEWS_HASHTAGS[Math.floor(Math.random() * NEWS_HASHTAGS.length)],
    NEWS_HASHTAGS[Math.floor(Math.random() * NEWS_HASHTAGS.length)],
  ].filter((tag, index, arr) => arr.indexOf(tag) === index);

  return { content, hashtags, topic };
}

async function simulateNewsSourceActivity(
  timelineId: string,
  newsBots: NewsBot[],
  actions: TickResult['actions']
): Promise<void> {
  if (!adminConfig.simulation.news.enabled) return;
  if (newsBots.length === 0) return;
  if (Math.random() >= adminConfig.simulation.news.postChancePerTick) return;

  const actor = newsBots[Math.floor(Math.random() * newsBots.length)];
  if (!actor) return;

  const bulletin = buildNewsBulletin(new Date(), actor.displayName);

  const post = await prisma.post.create({
    data: {
      content: bulletin.content,
      hashtags: JSON.stringify(bulletin.hashtags),
      emotionalState: 'informative',
      authorId: actor.id,
      timelineId,
    },
    select: { id: true },
  });

  await prisma.bot.update({
    where: { id: actor.id },
    data: {
      emotionalState: 'informative',
      postCount: { increment: 1 },
      memory: remember(actor.memory, {
        topic: bulletin.topic,
        event: `Published bulletin on ${bulletin.topic}`,
      }),
    } as any,
  });

  actions.push({
    botId: actor.id,
    botName: actor.displayName,
    action: 'post',
    postId: post.id,
  });
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
        talkingStyle: 'Casual audience tone, short reactions with social-media phrasing',
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

function rebalanceDecisionMix(
  awakeBots: {
    id: string;
    extraversion: number;
    reactivity: number;
  }[],
  botDecisions: Map<string, BotDecision>,
  feedPosts: FeedPost[]
): void {
  if (awakeBots.length === 0) return;

  const hasRecentHumanActivity = feedPosts.some(post => post.author.isHuman);
  if (!hasRecentHumanActivity) return;

  const activeBotIds = awakeBots
    .map(bot => bot.id)
    .filter(botId => {
      const action = botDecisions.get(botId)?.action;
      return action === 'post' || action === 'reply';
    });

  if (activeBotIds.length === 0) return;

  const maxReplyShareWhenHumanActive = 0.65;
  const minPostsWhenHumanActive = 1;

  const replyBotIds = activeBotIds.filter(botId => botDecisions.get(botId)?.action === 'reply');
  const postCount = activeBotIds.length - replyBotIds.length;

  const maxReplies = Math.max(1, Math.floor(activeBotIds.length * maxReplyShareWhenHumanActive));
  const requiredPostCount = Math.max(minPostsWhenHumanActive, activeBotIds.length - maxReplies);
  const postsNeeded = Math.max(0, requiredPostCount - postCount);

  if (postsNeeded === 0 || replyBotIds.length === 0) return;

  const awakeBotLookup = new Map(awakeBots.map(bot => [bot.id, bot]));
  const convertible = replyBotIds
    .map(botId => {
      const decision = botDecisions.get(botId);
      const bot = awakeBotLookup.get(botId);
      return {
        botId,
        decision,
        extraversion: bot?.extraversion ?? 0.5,
        reactivity: bot?.reactivity ?? 0.5,
      };
    })
    .filter(item => item.decision)
    .sort((a, b) => {
      const aHasTarget = a.decision?.targetId ? 1 : 0;
      const bHasTarget = b.decision?.targetId ? 1 : 0;
      if (aHasTarget !== bHasTarget) {
        return aHasTarget - bHasTarget;
      }

      if (a.extraversion !== b.extraversion) {
        return b.extraversion - a.extraversion;
      }

      return a.reactivity - b.reactivity;
    });

  for (let i = 0; i < Math.min(postsNeeded, convertible.length); i++) {
    const selected = convertible[i];
    if (!selected?.decision) continue;

    botDecisions.set(selected.botId, {
      action: 'post',
    });
  }
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

type TickLastResult = 'idle' | 'success' | 'error';

type TickRuntimeState = {
  inProgressCount: number;
  lastResult: TickLastResult;
  lastUpdatedAt: number | null;
  lastError: string | null;
};

const tickRuntimeByTimeline = new Map<string, TickRuntimeState>();

function ensureTickRuntimeState(timelineId: string): TickRuntimeState {
  const existing = tickRuntimeByTimeline.get(timelineId);
  if (existing) {
    return existing;
  }

  const created: TickRuntimeState = {
    inProgressCount: 0,
    lastResult: 'idle',
    lastUpdatedAt: null,
    lastError: null,
  };
  tickRuntimeByTimeline.set(timelineId, created);
  return created;
}

export async function runTickWithStatus(timelineId: string): Promise<TickResult> {
  const state = ensureTickRuntimeState(timelineId);
  state.inProgressCount += 1;

  try {
    const result = await runTick(timelineId);
    state.lastResult = 'success';
    state.lastUpdatedAt = Date.now();
    state.lastError = null;
    return result;
  } catch (error) {
    state.lastResult = 'error';
    state.lastUpdatedAt = Date.now();
    state.lastError = error instanceof Error ? error.message : 'Tick failed';
    throw error;
  } finally {
    state.inProgressCount = Math.max(0, state.inProgressCount - 1);
  }
}

export function getTickRuntimeStatus(timelineId: string): {
  inProgress: boolean;
  lastResult: TickLastResult;
  lastUpdatedAt: string | null;
  lastError: string | null;
} {
  const state = ensureTickRuntimeState(timelineId);
  return {
    inProgress: state.inProgressCount > 0,
    lastResult: state.lastResult,
    lastUpdatedAt: state.lastUpdatedAt ? new Date(state.lastUpdatedAt).toISOString() : null,
    lastError: state.lastError,
  };
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
      talkingStyle: true,
      simulatedAge: true,
      emotionalState: true,
      humanSentiment: true,
    },
  } as any);

  if (allBots.length === 0) {
    return { tickId, botsProcessed: 0, actions, timestamp: new Date() };
  }

  const newsBots: NewsBot[] = allBots
    .filter(bot => bot.username.startsWith('news_'))
    .map(bot => ({
      id: bot.id,
      username: bot.username,
      displayName: bot.displayName,
      memory: bot.memory ?? '{}',
    }));

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
      parent: {
        select: {
          authorId: true,
        },
      },
      author: { select: { username: true, displayName: true, tier: true, isHuman: true } },
    },
  });

  const feedPosts: FeedPost[] = recentPosts.map(post => ({
    ...post,
    parentAuthorId: post.parent?.authorId ?? null,
  }));

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

  const decisionBatchSize = Math.max(1, adminConfig.simulation.tick.decisionBatchSize);
  const botDecisions = new Map<string, BotDecision>();

  for (let i = 0; i < awakeBots.length; i += decisionBatchSize) {
    const batch = awakeBots.slice(i, i + decisionBatchSize);
    try {
      const decisions = await decideBotActionsBatch(batch, recentPostsContext, timeline.globalMood);
      decisions.forEach((decision, index) => {
        const bot = batch[index];
        if (bot) {
          botDecisions.set(bot.id, decision);
        }
      });
    } catch {
      for (const bot of batch) {
        botDecisions.set(bot.id, { action: 'idle' });
      }
    }
  }

  rebalanceDecisionMix(awakeBots, botDecisions, feedPosts);

  for (const bot of awakeBots) {
    try {
      const decision = botDecisions.get(bot.id) ?? { action: 'idle' };
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
      console.error(`Tick error for bot ${bot.username} (decision=${botDecisions.get(bot.id)?.action ?? 'unknown'}):`, err);
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

  await simulateNewsSourceActivity(timelineId, newsBots, actions);

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
    username: string;
    displayName: string;
    bio: string | null;
    memory?: string | null;
    tier: string;
    compassion: number;
    reasoningSkill: number;
    occupation: string;
    talkingStyle?: string | null;
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
      const postContext = buildPostContext(bot.memory, newPostContext, bot.occupation);
      const output = decision.draft || await generateContent(
        bot,
        postContext,
        false,
        globalMood,
        trendingContext
      );
      const outputState = splitEmotionalStateDebug(output.emotional_state);
      
      const rememberedTopic = output.hashtags[0] || postContext.slice(0, 48);
      const post = await prisma.post.create({
        data: {
          content: output.content,
          hashtags: JSON.stringify(output.hashtags),
          emotionalState: attachEmotionalDebug(outputState.mood, outputState.debugSuffix),
          authorId: bot.id,
          timelineId,
        },
      });

      await prisma.bot.update({
        where: { id: bot.id },
        data: {
          emotionalState: outputState.mood,
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

      const ownThreadReplies = conversationalPosts.filter(post => post.parentAuthorId === bot.id && post.author.username !== bot.username);

      if (!target) {
        if (
          ownThreadReplies.length > 0 &&
          Math.random() < Math.min(0.95, adminConfig.simulation.decision.preferOwnThreadReplyChance * Math.max(0.2, bot.reactivity))
        ) {
          target = weightedPick(ownThreadReplies);
        } else if (Math.random() < adminConfig.simulation.decision.preferConversationalChance && conversationalPosts.length > 0) {
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

      // Build thread context: include grandparent post if target is itself a reply
      const parentPost = target.parentId
        ? recentPosts.find(p => p.id === target.parentId)
        : null;
      const threadContext = parentPost
        ? `Thread context:\n  @${parentPost.author.displayName}: "${parentPost.content.slice(0, 120)}"\n  @${target.author.displayName} replied: "${target.content.slice(0, 160)}"\n\nYou are replying to @${target.author.username}'s comment above (on topic: ${summarizeTopic(target)}).`
        : `Replying to @${target.author.username} on ${summarizeTopic(target)}: ${target.content}`;

      const output = decision.draft || await generateContent(
        bot,
        threadContext,
        true,
        globalMood,
        trendingContext
      );
      const ancestorIds = await getAncestorIds(target.id);
      const outputState = splitEmotionalStateDebug(output.emotional_state);

      // Emotional contagion: bot is slightly influenced by what it replies to
      const shiftedMood = sentimentShift(target.content, outputState.mood);
      const shiftedWithDebug = attachEmotionalDebug(shiftedMood, outputState.debugSuffix);
      const topic = output.hashtags[0] || summarizeTopic(target);

      const post = await prisma.post.create({
        data: {
          content: output.content,
          hashtags: JSON.stringify(output.hashtags),
          emotionalState: shiftedWithDebug,
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

      // De-duplicate by displayName and pick randomly — don't always follow the most recent poster
      const uniqueTargets = [...new Map(targets.map(a => [a.displayName, a])).values()];
      const pickedAuthor = uniqueTargets[Math.floor(Math.random() * uniqueTargets.length)];

      const targetBot = await prisma.bot.findFirst({
        where: {
          timelineId,
          displayName: pickedAuthor.displayName,
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
// Monotonically increasing generation counter. Each startTickLoop() call
// bumps this; stopTickLoop() also bumps it. Any in-flight async callback
// that sees a stale generation aborts before re-scheduling, eliminating
// orphaned timers and duplicate loops after a stop/switch mid-tick.
let currentLoopGeneration = 0;

export function isTickLoopRunning(): boolean {
  return tickInterval !== null;
}

export function getActiveTimelineId(): string | null {
  return activeTimelineId;
}

export function startTickLoop(timelineId: string): void {
  // Invalidate any currently in-flight tick callback.
  currentLoopGeneration++;
  const loopGeneration = currentLoopGeneration;

  if (tickInterval) {
    clearTimeout(tickInterval);
  }
  activeTimelineId = timelineId;

  const scheduleNextTick = () => {
    const nextInterval = getRandomTickIntervalMs();

    tickInterval = setTimeout(async () => {
      // Guard: bail out if stop() or a new start() was called while we waited.
      if (loopGeneration !== currentLoopGeneration || !activeTimelineId) return;

      try {
        await runTickWithStatus(activeTimelineId);
        console.log(`[TICK] Completed tick for timeline ${activeTimelineId}`);
      } catch (err) {
        console.error('[TICK] Error during tick:', err);
      }

      // Guard again after the async work: stop/switch could have happened
      // during the await, so re-check before scheduling the next interval.
      if (loopGeneration !== currentLoopGeneration || !activeTimelineId) return;

      scheduleNextTick();
    }, nextInterval);
  };

  scheduleNextTick();

  console.log(
    `[TICK] Started stochastic tick loop for timeline ${timelineId} (${TICK_MIN_INTERVAL_MS / 1000}-${TICK_MAX_INTERVAL_MS / 1000}s)`
  );
}

export function stopTickLoop(): void {
  // Bump the generation so any in-flight tick callback self-aborts after its
  // current await resolves, even if clearTimeout already fired too late.
  currentLoopGeneration++;
  if (tickInterval) {
    clearTimeout(tickInterval);
    tickInterval = null;
    activeTimelineId = null;
    console.log('[TICK] Stopped tick loop');
  }
}
