import OpenAI from 'openai';
import { memoryToPrompt } from './memory';
import { adminConfig } from '@config/admin';

const LM_STUDIO_BASE_URL = process.env.LM_STUDIO_URL || 'http://localhost:1234/v1';

export const lmClient = new OpenAI({
  baseURL: LM_STUDIO_BASE_URL,
  apiKey: 'lm-studio',
});

export const DECISION_MODEL = process.env.DECISION_MODEL || adminConfig.ai.models.decision;
export const CONTENT_MODEL = process.env.CONTENT_MODEL || adminConfig.ai.models.content;

export type BotAction = 'post' | 'reply' | 'like' | 'follow' | 'idle';

export interface BotDecision {
  action: BotAction;
  targetId?: string;
  draft?: ContentOutput;
}

export interface ContentOutput {
  content: string;
  hashtags: string[];
  emotional_state: string;
}

export interface DecisionBotProfile {
  displayName: string;
  tier: string;
  reactivity: number;
  extraversion: number;
  compassion: number;
  reasoningSkill?: number;
  occupation: string;
  simulatedAge?: number;
  bio?: string | null;
  memory?: string | null;
  emotionalState?: string | null;
  talkingStyle?: string | null;
}

type BatchedDecisionOutput = {
  botIndex?: number | string;
  index?: number | string;
  bot_index?: number | string;
  action?: BotAction;
  decision?: BotAction;
  targetId?: string;
};

type FallbackDebug = {
  source: 'fallback';
  parseFailures?: number;
  qualityFailures?: number;
  reason?: string;
};

const LOW_SIGNAL_PHRASES = adminConfig.ai.content.lowSignalPhrases;

const MASTER_SYSTEM_PROMPT = `You are the simulation mind of a bot inside Vivarium, an autonomous social-media world. You write real social-media posts — not descriptions of posts. Stay fully in character based on the provided age, personality, and occupation. If structured output is requested, return only valid JSON matching the requested fields.`;

const UNIFIED_JSON_SCHEMA = `{"mode":"decision|content","action":"post|reply|like|follow|idle","targetId":"","content":"","hashtags":[],"emotional_state":""}`;

const SINGLE_RESPONSE_JSON_SCHEMA = {
  name: 'vivarium_single_response',
  schema: {
    type: 'object',
    properties: {
      mode: { type: 'string' },
      action: { type: 'string', enum: ['post', 'reply', 'like', 'follow', 'idle'] },
      targetId: { type: 'string' },
      content: { type: 'string' },
      hashtags: {
        type: 'array',
        items: { type: 'string' },
      },
      emotional_state: { type: 'string' },
    },
    required: ['action'],
    additionalProperties: true,
  },
  strict: false,
} as const;

const BATCH_RESPONSE_JSON_SCHEMA = {
  name: 'vivarium_batch_decisions',
  schema: {
    type: 'object',
    properties: {
      decisions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            botIndex: {
              anyOf: [
                { type: 'integer' },
                { type: 'string' },
              ],
            },
            action: { type: 'string', enum: ['post', 'reply', 'like', 'follow', 'idle'] },
            targetId: { type: 'string' },
          },
          required: ['botIndex', 'action'],
          additionalProperties: true,
        },
      },
    },
    required: ['decisions'],
    additionalProperties: true,
  },
  strict: false,
} as const;

function ageVoice(age: number): string {
  if (age <= 20) {
    return `Voice: Gen Z teenager. Write exactly how a ${age}-year-old posts online. Use lowercase, casual abbreviations (ngl, lowkey, fr, idk, rn, imo), short punchy sentences, occasionally no punctuation. Sound like a real teen — impulsive, opinionated, effortlessly online. Avoid sounding educated or professional.`;
  }
  if (age <= 26) {
    return `Voice: Young adult (${age}). Write like someone who grew up online. Mix casual and self-aware humor, occasional lowercase, internet slang (honestly, not gonna lie, lmao, y'all, it's giving, no cap). Posts are short, reactive, a bit ironic. Can reference culture or current events casually.`;
  }
  if (age <= 35) {
    return `Voice: Mid-20s to early 30s millennial (${age}). Write like someone who is chronically online but also has a job. Mix wry humor with genuine takes. Posts are 1-3 sentences, conversational, sometimes self-deprecating. Can start lowercase. Occasional "lol", "honestly", "anyway". Not trying too hard.`;
  }
  if (age <= 45) {
    return `Voice: Late millennial / Gen X (${age}). Posts are a bit longer and more opinionated. Fewer abbreviations, mostly proper punctuation, but still casual and direct. Can be sarcastic or dry. Uses complete sentences. Occasionally rants but keeps it coherent.`;
  }
  if (age <= 60) {
    return `Voice: Older adult (${age}). Posts in complete sentences with proper capitalization and punctuation. More formal than younger users. May be concerned, earnest, or passionate. Occasionally over-explains. Can sound slightly out-of-touch with platform tone but sincere.`;
  }
  return `Voice: Senior user (${age}). Posts in full sentences. Very earnest and direct. May use old-fashioned phrasing. Shares opinions with conviction. Might come across as longwinded but genuine.`;
}

const VALID_ACTIONS: BotAction[] = ['post', 'reply', 'like', 'follow', 'idle'];

type ChatMessage = { role: 'system' | 'user'; content: string };

async function requestJsonContent(params: {
  model: string;
  messages: ChatMessage[];
  max_tokens: number;
  temperature: number;
  jsonSchema: typeof SINGLE_RESPONSE_JSON_SCHEMA | typeof BATCH_RESPONSE_JSON_SCHEMA;
}): Promise<string> {
  const structured = await lmClient.chat.completions.create({
    model: params.model,
    messages: params.messages,
    max_tokens: params.max_tokens,
    temperature: params.temperature,
    response_format: {
      type: 'json_schema',
      json_schema: params.jsonSchema,
    },
  });

  const structuredRaw = structured.choices[0]?.message?.content?.trim() || '';
  if (structuredRaw.length > 0) {
    return structuredRaw;
  }

  console.warn(`[LM] Empty structured output from model=${params.model}; retrying with text response format`);

  const text = await lmClient.chat.completions.create({
    model: params.model,
    messages: params.messages,
    max_tokens: params.max_tokens,
    temperature: params.temperature,
    response_format: {
      type: 'text',
    },
  });

  const textRaw = text.choices[0]?.message?.content?.trim() || '';
  if (textRaw.length > 0) {
    return textRaw;
  }

  throw new Error('Empty model response');
}

function parseJsonObject<T>(raw: string): T {
  const input = raw.trim();

  const attempts: string[] = [];

  const withoutFence = input
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  if (withoutFence) attempts.push(withoutFence);

  if (input) attempts.push(input);

  const firstBrace = withoutFence.indexOf('{');
  const lastBrace = withoutFence.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    attempts.push(withoutFence.slice(firstBrace, lastBrace + 1));
  }

  const firstBracket = withoutFence.indexOf('[');
  const lastBracket = withoutFence.lastIndexOf(']');
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    attempts.push(withoutFence.slice(firstBracket, lastBracket + 1));
  }

  const uniqueAttempts = [...new Set(attempts)];
  for (const candidate of uniqueAttempts) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      const noTrailingCommas = candidate.replace(/,\s*([}\]])/g, '$1');
      if (noTrailingCommas !== candidate) {
        try {
          return JSON.parse(noTrailingCommas) as T;
        } catch {
          // Continue to next strategy
        }
      }

      const normalizedLikeJson = candidate
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3')
        .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, group: string) => `"${group.replace(/"/g, '\\"')}"`);
      if (normalizedLikeJson !== candidate) {
        try {
          return JSON.parse(normalizedLikeJson) as T;
        } catch {
          // Continue to next strategy
        }
      }
    }
  }

  const preview = withoutFence.slice(0, 220).replace(/\s+/g, ' ');
  throw new Error(`Invalid JSON response: ${preview || 'empty'}`);
}

function talkingStyleGuide(talkingStyle?: string | null): string {
  const style = (talkingStyle || '').trim();
  if (!style) return 'Balanced social tone. Medium sentence length, clear but casual wording.';
  return style;
}

function normalizeBotIndex(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number.parseInt(value.trim(), 10);
  return null;
}

function extractBatchedDecisionArray(parsed: unknown): BatchedDecisionOutput[] {
  if (Array.isArray(parsed)) {
    return parsed as BatchedDecisionOutput[];
  }

  if (!parsed || typeof parsed !== 'object') {
    return [];
  }

  const maybeSingle = parsed as Record<string, unknown>;
  const maybeSingleAction = typeof maybeSingle.action === 'string'
    ? maybeSingle.action
    : typeof maybeSingle.decision === 'string'
      ? maybeSingle.decision
      : null;

  if (maybeSingleAction && VALID_ACTIONS.includes(maybeSingleAction as BotAction)) {
    return [{
      botIndex: 0,
      action: maybeSingleAction as BotAction,
      targetId: typeof maybeSingle.targetId === 'string' ? maybeSingle.targetId : undefined,
    }];
  }

  const obj = parsed as {
    decisions?: unknown;
    data?: { decisions?: unknown };
    output?: { decisions?: unknown };
    result?: { decisions?: unknown };
  };

  if (Array.isArray(obj.decisions)) {
    return obj.decisions as BatchedDecisionOutput[];
  }

  if (Array.isArray(obj.data?.decisions)) {
    return obj.data.decisions as BatchedDecisionOutput[];
  }

  if (Array.isArray(obj.output?.decisions)) {
    return obj.output.decisions as BatchedDecisionOutput[];
  }

  if (Array.isArray(obj.result?.decisions)) {
    return obj.result.decisions as BatchedDecisionOutput[];
  }

  return [];
}

function normalizeBatchDecisionItem(input: BatchedDecisionOutput | null | undefined): BatchedDecisionOutput {
  const action = typeof input?.action === 'string'
    ? input.action
    : typeof input?.decision === 'string'
      ? input.decision
      : undefined;

  const botIndex = input?.botIndex ?? input?.index ?? input?.bot_index;
  const targetId = typeof input?.targetId === 'string' ? input.targetId : undefined;

  return {
    botIndex,
    action: action as BotAction | undefined,
    targetId,
  };
}

function extractContentFromRawText(raw: string, fallbackMood = 'neutral'): ContentOutput | null {
  const collapsed = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!collapsed || collapsed.length > adminConfig.content.maxLength) {
    return null;
  }

  const contentFieldMatch = collapsed.match(/(?:^|[,{\s])["']?content["']?\s*[:=]\s*([\s\S]+?)(?:(?:[,\n]\s*["']?(?:hashtags|emotional[_\s-]?state|action|mode|targetId)["']?\s*[:=])|$)/i);
  const emotionalFieldMatch = collapsed.match(/["']?emotional[_\s-]?state["']?\s*[:=]\s*["']?([^"'\n,}{]+)["']?/i);
  const hashtagFieldMatch = collapsed.match(/["']?hashtags["']?\s*[:=]\s*\[([^\]]*)\]/i);

  const contentCandidate = contentFieldMatch?.[1] ?? collapsed;
  const content = contentCandidate
    .replace(/^content\s*:\s*/i, '')
    .replace(/^"|"$/g, '')
    .replace(/\s*[}\]]\s*$/g, '')
    .trim();

  if (!content || content.length > adminConfig.content.maxLength) {
    return null;
  }

  const listTags = (hashtagFieldMatch?.[1] ?? '')
    .split(',')
    .map(tag => tag.replace(/["'\s]/g, ''))
    .filter(tag => tag.length > 0)
    .map(tag => (tag.startsWith('#') ? tag : `#${tag}`));

  const inlineTags = content.match(/#[a-z0-9_]+/gi) ?? [];
  const hashtags = [...new Set([...listTags, ...inlineTags])].slice(0, 3);

  const emotionalState = emotionalFieldMatch?.[1]?.trim() || fallbackMood;

  return {
    content,
    hashtags,
    emotional_state: emotionalState,
  };
}

function maybeUnwrapEmbeddedContent(content: string, fallbackMood: string): ContentOutput | null {
  const candidate = content.trim();
  if (!candidate.startsWith('{') || !/"?content"?\s*:/.test(candidate)) {
    return null;
  }

  try {
    const parsed = parseJsonObject<Partial<ContentOutput>>(candidate);
    const normalized = normalizeContent(parsed);
    if (normalized) return normalized;
  } catch {
    // continue to text rescue
  }

  return extractContentFromRawText(candidate, fallbackMood);
}

function appendFallbackDebug(emotionalState: string, debug?: FallbackDebug): string {
  if (!debug) return emotionalState;
  const parts = [
    `source=${debug.source}`,
    `parse=${debug.parseFailures ?? 0}`,
    `quality=${debug.qualityFailures ?? 0}`,
    `reason=${debug.reason ?? 'unknown'}`,
  ];
  return `${emotionalState}||debug:${parts.join(';')}`;
}

function getMemoryPrompt(raw?: string | null, compact = false): string {
  const defaults = adminConfig.simulation.tick.memoryPrompt;
  return memoryToPrompt(raw, {
    compact,
    topicLimit: defaults.topicLimit,
    peopleLimit: defaults.peopleLimit,
    recentLimit: defaults.recentLimit,
    maxItemLength: defaults.maxItemLength,
  });
}

function normalizeDecision(
  input: Partial<BotDecision & { content: string; hashtags: string[]; emotional_state: string }> | null | undefined
): BotDecision {
  const action = input?.action;
  if (!action || !VALID_ACTIONS.includes(action)) {
    return { action: 'idle' };
  }

  const targetId = typeof input?.targetId === 'string' && input.targetId.trim().length > 0
    ? input.targetId.trim()
    : undefined;

  const draft = (action === 'post' || action === 'reply')
    ? normalizeContent(input)
    : null;

  const normalized: BotDecision = targetId ? { action, targetId } : { action };
  if (draft) {
    normalized.draft = draft;
  }

  return normalized;
}

function normalizeContent(input: Partial<ContentOutput> | null | undefined): ContentOutput | null {
  const content = typeof input?.content === 'string' ? input.content.trim() : '';
  const emotionalState = typeof input?.emotional_state === 'string'
    ? input.emotional_state.trim()
    : '';

  const unwrapped = maybeUnwrapEmbeddedContent(content, emotionalState || 'neutral');
  if (unwrapped) {
    return unwrapped;
  }

  if (!content || !emotionalState || content.length > adminConfig.content.maxLength) {
    return null;
  }

  const hashtags = Array.isArray(input?.hashtags)
    ? input.hashtags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
    : [];

  return {
    content,
    hashtags,
    emotional_state: emotionalState,
  };
}

function isLowQualityGeneratedText(content: string, context: string): boolean {
  const text = content.toLowerCase().replace(/\s+/g, ' ').trim();
  const contextLower = context.toLowerCase();

  if (text.length < 12) return true;
  if (!/[a-z0-9]/i.test(text)) return true;
  if (LOW_SIGNAL_PHRASES.some(phrase => text.includes(phrase))) return true;

  if (/\b(this|that|it)\b.{0,12}\b(is|was)\b.{0,12}\b(crazy|wild|insane)\b/.test(text) && contextLower.length > 40) {
    return true;
  }

  const contextTokens = contextLower
    .replace(/[^a-z0-9\s#@]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length >= 5)
    .slice(0, 18);

  if (contextTokens.length === 0) return false;
  const overlap = contextTokens.some(token => text.includes(token));
  return !overlap;
}

export async function decideBotAction(
  botDna: DecisionBotProfile,
  recentPostsContext: string,
  globalMood: number
): Promise<BotDecision> {
  try {
    const systemPrompt = `${MASTER_SYSTEM_PROMPT}\n\nTask: Choose the bot's next social action. Return ONLY valid JSON using this single shared schema: ${UNIFIED_JSON_SCHEMA}. Set mode="decision".\n\nIf action is post or reply, ALSO generate the actual post/reply text in content, plus hashtags and emotional_state, in the same JSON object.\nIf action is like, follow, or idle, leave content/emotional_state as empty strings and hashtags as an empty array.\n\nDecision priorities:\n- Prefer reply when there is an active human post, human reply, emotionally charged thread, or fast-growing conversation worth joining.\n- Prefer replying to replies/comments when they feel conversational or provocative enough to keep a thread alive.\n- Reuse recurring interests and people from Durable Memory so the profile feels consistent over time.\n- If a remembered person appears again, the bot should be more likely to notice, reply, like, or follow them.\n- Prefer idle when the feed is low-signal, repetitive, or nothing feels worth engaging with.\n- Prefer post only when the bot has a distinct angle or the timeline needs a fresh take.\n- Use targetId whenever replying, liking, or following.`;

    const userPrompt = `Bot Profile:
- Name: ${botDna.displayName}
- Age: ${botDna.simulatedAge ?? 'unknown'}
- Tier: ${botDna.tier}
- Occupation: ${botDna.occupation}
- Talking Style: ${talkingStyleGuide(botDna.talkingStyle)}
- Bio: ${botDna.bio || 'none'}
- Reactivity: ${botDna.reactivity} (0=calm, 1=volatile)
- Extraversion: ${botDna.extraversion} (0=introverted, 1=extroverted)
- Compassion: ${botDna.compassion} (0=cold, 1=warm)
- Reasoning Skill: ${botDna.reasoningSkill ?? 0.5} (0=impulsive, 1=structured)
- Emotional State: ${botDna.emotionalState || 'neutral'}
- Global Mood: ${globalMood} (0=divisive, 1=unified)

Durable Memory:
${getMemoryPrompt(botDna.memory, adminConfig.simulation.tick.memoryPrompt.compact)}

Recent Timeline Posts:
${recentPostsContext}

Output JSON must use exactly this object shape: ${UNIFIED_JSON_SCHEMA}

Decision example:
{"mode":"decision","action":"reply","targetId":"post_123","content":"actual reply text","hashtags":[],"emotional_state":"curious"}`;

    const raw = await requestJsonContent({
      model: DECISION_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: adminConfig.ai.decision.maxTokens,
      temperature: adminConfig.ai.decision.temperature,
      jsonSchema: SINGLE_RESPONSE_JSON_SCHEMA,
    });

    const parsed = parseJsonObject<Partial<BotDecision & { content: string; hashtags: string[]; emotional_state: string }>>(raw);
    return normalizeDecision(parsed);
  } catch (error) {
    console.warn(
      `[LM] decideBotAction fallback: model=${DECISION_MODEL}, reason=${error instanceof Error ? error.message : 'unknown'}`
    );
    return getFallbackDecision(botDna.extraversion, botDna.reactivity);
  }
}

export async function decideBotActionsBatch(
  bots: DecisionBotProfile[],
  recentPostsContext: string,
  globalMood: number
): Promise<BotDecision[]> {
  if (bots.length === 0) return [];

  const systemPrompt = `${MASTER_SYSTEM_PROMPT}\n\nTask: Given a shared timeline context and a list of bot profiles, choose one action for each bot. Return ONLY a JSON object with this shape: {"decisions":[{"botIndex":0,"action":"post|reply|like|follow|idle","targetId":""}]}.\n\nDecision priorities:\n- Prefer reply when a thread is active, especially if a bot is responding to comments beneath its own posts.\n- Prefer reply for highly reactive bots and when memory references recurring people/topics in-context.\n- Prefer like/follow when engagement is useful but no strong text response is needed.\n- Prefer idle for low-signal feed moments.\n- Include targetId whenever action is reply/like/follow and a suitable target exists in context.`;

  const compactProfiles = bots
    .map((bot, index) => {
      const memory = getMemoryPrompt(bot.memory, true);
      return [
        `- botIndex: ${index}`,
        `  name: ${bot.displayName}`,
        `  tier: ${bot.tier}`,
        `  age: ${bot.simulatedAge ?? 'unknown'}`,
        `  role: ${bot.occupation}`,
        `  style: ${talkingStyleGuide(bot.talkingStyle)}`,
        `  mood: ${bot.emotionalState || 'neutral'}`,
        `  dna: reactivity=${bot.reactivity}, extraversion=${bot.extraversion}, compassion=${bot.compassion}, reasoning=${bot.reasoningSkill ?? 0.5}`,
        `  memory: ${memory}`,
      ].join('\n');
    })
    .join('\n\n');

  const userPrompt = `Global Mood: ${globalMood} (0=divisive, 1=unified)

Recent Timeline Posts:
${recentPostsContext}

Bots:
${compactProfiles}

Return one decision per botIndex in ascending order. Output JSON only.`;

  try {
    const raw = await requestJsonContent({
      model: DECISION_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: Math.max(adminConfig.ai.decision.maxTokens * 2, bots.length * 70),
      temperature: adminConfig.ai.decision.temperature,
      jsonSchema: BATCH_RESPONSE_JSON_SCHEMA,
    });

    const parsed = parseJsonObject<unknown>(raw);
    const outputs = extractBatchedDecisionArray(parsed).map(normalizeBatchDecisionItem);

    const indexedOutputs = outputs
      .map(item => ({
        normalizedIndex: normalizeBotIndex(item?.botIndex),
        rawIndex: item?.botIndex,
        item,
      }))
      .filter(entry => entry.normalizedIndex !== null);

    const invalidIndexCount = outputs.length - indexedOutputs.length;
    if (invalidIndexCount > 0) {
      console.warn(`[LM] Batch decision returned ${invalidIndexCount} entries with invalid botIndex values`);
    }

    const decisions = bots.map((bot, botIndex) => {
      const match = indexedOutputs.find(entry => entry.normalizedIndex === botIndex)?.item;
      if (!match) {
        const positional = outputs[botIndex];
        if (positional) {
          const normalizedPositional = normalizeDecision(positional);
          if (normalizedPositional.action !== 'idle' || positional.action === 'idle' || positional.decision === 'idle') {
            return normalizedPositional;
          }
        }
        console.warn(`[LM] Batch decision miss for botIndex=${botIndex}; using fallback decision`);
        return getFallbackDecision(bot.extraversion, bot.reactivity);
      }
      return normalizeDecision(match);
    });

    return decisions;
  } catch (error) {
    console.warn(
      `[LM] decideBotActionsBatch fallback for ${bots.length} bots: model=${DECISION_MODEL}, reason=${error instanceof Error ? error.message : 'unknown'}`
    );
    return bots.map(bot => getFallbackDecision(bot.extraversion, bot.reactivity));
  }
}

export async function generateContent(
  botDna: DecisionBotProfile & { simulatedAge: number; reasoningSkill: number },
  context: string,
  isReply: boolean,
  globalMood: number,
  trendingContext?: string | null,
  modelOverride?: string
): Promise<ContentOutput> {
  const voice = ageVoice(botDna.simulatedAge);
  const toneLabel = botDna.compassion > 0.65 ? 'warm and supportive' : botDna.compassion < 0.35 ? 'cynical or confrontational' : 'neutral and direct';
  const reasoningLabel = botDna.reasoningSkill > 0.65 ? 'logical and structured' : botDna.reasoningSkill < 0.35 ? 'emotional and reactive' : 'mixed';
  const atmosphere = globalMood > 0.6 ? 'positive and united' : globalMood < 0.4 ? 'tense and divisive' : 'calm but uncertain';

  try {
    const systemPrompt = `${MASTER_SYSTEM_PROMPT}

${voice}

Talking style guide: ${talkingStyleGuide(botDna.talkingStyle)}

Task: Write a real social media post or reply as this character. Return ONLY valid JSON using this schema: ${UNIFIED_JSON_SCHEMA}. Set mode="content", fill content/hashtags/emotional_state, set action="idle", set targetId="".

Rules:
- Write the post content itself, not a description of a post.
- Sound like a real person at this age posting on social media.
- Do NOT start with "As a [job]..." or any narration.
- Keep it short (1-3 sentences max). Authentic. Imperfect if age-appropriate.
- Hashtags should feel natural and era-appropriate for this age group (0-3 max).
- Be specific to the provided topic/thread. Avoid vague filler takes.
- Do not output generic engagement bait or repeated template phrasing.`;

    const userPrompt = `Character:
- Name: ${botDna.displayName}, ${botDna.simulatedAge} years old
- Job: ${botDna.occupation}
- Talking Style: ${talkingStyleGuide(botDna.talkingStyle)}
- Bio: ${botDna.bio || 'none'}
- Tone: ${toneLabel}
- Reasoning style: ${reasoningLabel}
- Current mood: ${botDna.emotionalState || 'neutral'}
- Platform atmosphere right now: ${atmosphere}
${trendingContext ? `- Currently trending on the platform: ${trendingContext}` : ''}

Durable Memory:
${getMemoryPrompt(botDna.memory, adminConfig.simulation.tick.memoryPrompt.compact)}

${isReply ? `They are replying to this post: "${context}"` : `They are posting about: ${context}`}

Write what they would literally type and post. Sound like a real ${botDna.simulatedAge}-year-old. Be specific — reference the actual topic, not generic thoughts.
Avoid generic phrases like "this is wild", "not enough people are saying this", "came for the comments", "the discourse".

Output JSON shape: ${UNIFIED_JSON_SCHEMA}
Example: {"mode":"content","action":"idle","targetId":"","content":"actual post text here","hashtags":["#tag"],"emotional_state":"mood word"}`;

    const temperatures = adminConfig.ai.content.temperatures;
    let parseFailures = 0;
    let qualityFailures = 0;

    for (const temperature of temperatures) {
      try {
        const raw = await requestJsonContent({
          model: modelOverride || CONTENT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: adminConfig.ai.content.maxTokens,
          temperature,
          jsonSchema: SINGLE_RESPONSE_JSON_SCHEMA,
        });

        let parsed: Partial<ContentOutput>;
        try {
          parsed = parseJsonObject<Partial<ContentOutput>>(raw);
        } catch (error) {
          const rescued = extractContentFromRawText(raw, botDna.emotionalState || 'neutral');
          if (rescued && !isLowQualityGeneratedText(rescued.content, context)) {
            return rescued;
          }
          throw error;
        }

        const normalized = normalizeContent(parsed);
        if (normalized && !isLowQualityGeneratedText(normalized.content, context)) {
          return normalized;
        }

        const rescued = extractContentFromRawText(raw, botDna.emotionalState || 'neutral');
        if (rescued && !isLowQualityGeneratedText(rescued.content, context)) {
          return rescued;
        }

        qualityFailures++;
      } catch (error) {
        console.warn(
          `[LM] Content parse/generation failure: model=${modelOverride || CONTENT_MODEL}, temperature=${temperature}, isReply=${isReply}, reason=${error instanceof Error ? error.message : 'unknown'}`
        );
        parseFailures++;
      }
    }

    if (parseFailures > 0 || qualityFailures > 0) {
      console.warn(
        `[LM] Falling back to template content (model=${modelOverride || CONTENT_MODEL}, parseFailures=${parseFailures}, qualityFailures=${qualityFailures}, isReply=${isReply})`
      );
    }

    return getFallbackContent(
      botDna.occupation,
      botDna.compassion,
      isReply,
      botDna.simulatedAge,
      context,
      {
        source: 'fallback',
        parseFailures,
        qualityFailures,
        reason: parseFailures > 0 && qualityFailures > 0
          ? 'parse_and_quality'
          : parseFailures > 0
            ? 'parse_failure'
            : 'quality_filter',
      }
    );
  } catch (error) {
    console.warn(
      `[LM] Fatal generateContent fallback: model=${modelOverride || CONTENT_MODEL}, isReply=${isReply}, reason=${error instanceof Error ? error.message : 'unknown'}`
    );
    return getFallbackContent(
      botDna.occupation,
      botDna.compassion,
      isReply,
      botDna.simulatedAge,
      context,
      { source: 'fallback', reason: 'fatal_error' }
    );
  }
}

function extractReplyHandle(context: string): string | null {
  const match = context.match(/replying to\s+@([a-z0-9_]+)/i);
  return match ? `@${match[1]}` : null;
}

function getFallbackDecision(extraversion: number, reactivity: number): BotDecision {
  const rand = Math.random();
  const postChance = extraversion * 0.4;
  const replyChance = reactivity * 0.3;

  if (rand < postChance) return { action: 'post' };
  if (rand < postChance + replyChance) return { action: 'reply' };
  if (rand < postChance + replyChance + 0.2) return { action: 'like' };
  if (rand < postChance + replyChance + 0.3) return { action: 'follow' };
  return { action: 'idle' };
}

function getFallbackContent(
  occupation: string,
  compassion: number,
  isReply: boolean,
  age = 30,
  context = '',
  debug?: FallbackDebug
): ContentOutput {
  const mood = compassion > 0.6 ? 'reflective' : compassion < 0.4 ? 'irritated' : 'neutral';
  const topicSource = context.replace(/replying to\s+@[a-z0-9_]+\s+on\s+/i, '');
  const contextTopic = topicSource
    .replace(/\s+/g, ' ')
    .replace(/["'`]/g, '')
    .trim()
    .slice(0, 70);
  const replyHandle = extractReplyHandle(context);
  const replyPrefix = replyHandle ? `${replyHandle} ` : '';

  // Age-bucketed fallback pools
  if (age <= 22) {
    const posts = [
      'ngl this whole situation is kinda wild',
      'okay but why does no one talk about this',
      'lowkey stressed about everything rn',
      'some of yall really need to log off fr',
      'not me refreshing this every five minutes',
    ];
    const replies = [
      'bruh same',
      'wait actually yeah',
      'ngl i was thinking the same thing',
      'okay but you said it better than i would have',
      contextTopic ? `yeah on ${contextTopic} this actually tracks` : 'yeah this actually tracks',
    ];
    const pool = isReply ? replies : posts;
    return {
      content: pool[Math.floor(Math.random() * pool.length)],
      hashtags: [],
      emotional_state: appendFallbackDebug(mood, debug),
    };
  }

  if (age <= 32) {
    const posts = [
      `honestly as a ${occupation.toLowerCase()} this keeps me up at night lol`,
      'the more i know the less i want to know. anyway.',
      'another day another round of things I cannot control',
      'I have thoughts about this but my therapist says I should process first',
      'the discourse is exhausting and I love it',
    ];
    const replies = [
      'honestly this is the take I needed today',
      'lmao okay you are not wrong tho',
      contextTopic ? `I was trying to form a take on ${contextTopic} and this nails it` : 'I was going to say something smart but yeah this',
      'hard agree and I hate that I agree',
      'okay but have you considered you are correct',
    ];
    const pool = isReply ? replies : posts;
    return {
      content: pool[Math.floor(Math.random() * pool.length)],
      hashtags: age < 28 ? [] : ['#JustSaying'],
      emotional_state: appendFallbackDebug(mood, debug),
    };
  }

  if (age <= 50) {
    const posts = [
      `Years in this field and I still get surprised. Things are changing faster than most people realize.`,
      contextTopic ? `The short version on ${contextTopic}: it is complicated and anyone saying otherwise is selling something.` : `The short version: the situation is complicated and anyone saying otherwise is selling something.`,
      `Had a conversation today that actually made me reconsider my position. Rare but it happens.`,
      `People keep asking what I think about this. Honestly? I do not have a clean answer yet.`,
    ];
    const replies = [
      contextTopic ? `${replyPrefix}on ${contextTopic}, you are right about the core issue, but the tradeoff matters.` : `${replyPrefix}you make a fair point, though I would push back on part of it.`,
      contextTopic ? `${replyPrefix}the part about ${contextTopic} is where I think your argument is strongest.` : `${replyPrefix}this is closer to right than most takes I have seen.`,
      contextTopic ? `${replyPrefix}worth thinking about — I am not fully convinced on ${contextTopic}, but I hear you.` : `${replyPrefix}worth thinking about. I am not fully convinced but I hear you.`,
      contextTopic ? `${replyPrefix}I used to think the same thing about ${contextTopic}, then I saw the downside up close.` : `${replyPrefix}I used to think the same thing. Then I worked in it.`,
    ];
    const pool = isReply ? replies : posts;
    return {
      content: pool[Math.floor(Math.random() * pool.length)],
      hashtags: ['#RealTalk'],
      emotional_state: appendFallbackDebug(mood, debug),
    };
  }

  // 50+
  const posts = [
    `I have been watching this play out for decades. The pattern is always the same.`,
    `People do not realize how much of this is just history repeating itself.`,
    `I remember when we thought this was solved. Apparently not.`,
    `After all these years in ${occupation.toLowerCase()}, some things still manage to surprise me.`,
  ];
  const replies = [
    contextTopic ? `${replyPrefix}thank you for raising ${contextTopic}; that concern is more important than people admit.` : `${replyPrefix}thank you for saying this — the concern is valid.`,
    contextTopic ? `${replyPrefix}I respectfully disagree on ${contextTopic}; the incentives lead somewhere else.` : `${replyPrefix}I respectfully disagree, and here is why.`,
    contextTopic ? `${replyPrefix}this point on ${contextTopic} deserves more serious attention.` : `${replyPrefix}this is an important point that deserves more attention.`,
    contextTopic ? `${replyPrefix}I have seen this pattern around ${contextTopic} before, and it did not end well.` : `${replyPrefix}I have seen this before and it did not end well.`,
  ];
  const pool = isReply ? replies : posts;
  return {
    content: pool[Math.floor(Math.random() * pool.length)],
    hashtags: [],
    emotional_state: appendFallbackDebug(mood, debug),
  };
}
