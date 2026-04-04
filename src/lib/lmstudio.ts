import OpenAI from 'openai';

const LM_STUDIO_BASE_URL = process.env.LM_STUDIO_URL || 'http://localhost:1234/v1';

export const lmClient = new OpenAI({
  baseURL: LM_STUDIO_BASE_URL,
  apiKey: 'lm-studio',
});

export const DECISION_MODEL = process.env.DECISION_MODEL || 'gemma-2-4b';
export const CONTENT_MODEL = process.env.CONTENT_MODEL || 'llama-3-8b';

export type BotAction = 'post' | 'reply' | 'like' | 'follow' | 'idle';

export interface BotDecision {
  action: BotAction;
  targetId?: string;
}

export interface ContentOutput {
  content: string;
  hashtags: string[];
  emotional_state: string;
}

const MASTER_SYSTEM_PROMPT = `You are the simulation mind of a bot inside Vivarium, an autonomous social-media world. Stay fully in character and produce behavior consistent with the provided personality traits, mood, and timeline context. If structured output is requested, return only valid JSON matching the requested fields.`;

const VALID_ACTIONS: BotAction[] = ['post', 'reply', 'like', 'follow', 'idle'];

function parseJsonObject<T>(raw: string): T {
  return JSON.parse(raw) as T;
}

function normalizeDecision(input: Partial<BotDecision> | null | undefined): BotDecision {
  const action = input?.action;
  if (!action || !VALID_ACTIONS.includes(action)) {
    return { action: 'idle' };
  }

  const targetId = typeof input?.targetId === 'string' && input.targetId.trim().length > 0
    ? input.targetId.trim()
    : undefined;

  return targetId ? { action, targetId } : { action };
}

function normalizeContent(input: Partial<ContentOutput> | null | undefined): ContentOutput | null {
  const content = typeof input?.content === 'string' ? input.content.trim() : '';
  const emotionalState = typeof input?.emotional_state === 'string'
    ? input.emotional_state.trim()
    : '';

  if (!content || !emotionalState) {
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

export async function decideBotAction(
  botDna: {
    displayName: string;
    tier: string;
    reactivity: number;
    extraversion: number;
    compassion: number;
    occupation: string;
    emotionalState?: string | null;
  },
  recentPostsContext: string,
  globalMood: number
): Promise<BotDecision> {
  try {
    const systemPrompt = `${MASTER_SYSTEM_PROMPT}\n\nTask: Choose the bot's next social action. Return ONLY valid JSON with "action" and optional "targetId". Action must be one of: post, reply, like, follow, idle.`;

    const userPrompt = `Bot Profile:
- Name: ${botDna.displayName}
- Tier: ${botDna.tier}
- Occupation: ${botDna.occupation}
- Reactivity: ${botDna.reactivity} (0=calm, 1=volatile)
- Extraversion: ${botDna.extraversion} (0=introverted, 1=extroverted)
- Emotional State: ${botDna.emotionalState || 'neutral'}
- Global Mood: ${globalMood} (0=divisive, 1=unified)

Recent Timeline Posts:
${recentPostsContext}

Output JSON: {"action": "post"|"reply"|"like"|"follow"|"idle", "targetId": "post_or_user_id_if_applicable"}`;

    const response = await lmClient.chat.completions.create({
      model: DECISION_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 100,
      temperature: 0.35,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content?.trim() || '{"action":"idle"}';
    const parsed = parseJsonObject<Partial<BotDecision>>(raw);
    return normalizeDecision(parsed);
  } catch {
    return getFallbackDecision(botDna.extraversion, botDna.reactivity);
  }
}

export async function generateContent(
  botDna: {
    displayName: string;
    tier: string;
    compassion: number;
    reasoningSkill: number;
    occupation: string;
    simulatedAge: number;
    emotionalState?: string | null;
  },
  context: string,
  isReply: boolean,
  globalMood: number
): Promise<ContentOutput> {
  try {
    const systemPrompt = `${MASTER_SYSTEM_PROMPT}\n\nTask: Generate authentic, character-consistent social media content. Return ONLY valid JSON with "content", "hashtags" (array), and "emotional_state".`;

    const userPrompt = `Character:
- Name: ${botDna.displayName}
- Age: ${botDna.simulatedAge}
- Occupation: ${botDna.occupation}
- Tier: ${botDna.tier}
- Compassion: ${botDna.compassion} (0=cynical/trollish, 1=warm/supportive)
- Reasoning Skill: ${botDna.reasoningSkill} (0=emotional fragments, 1=structured arguments)
- Current Mood: ${botDna.emotionalState || 'neutral'}
- Global Atmosphere: ${globalMood > 0.6 ? 'unified/positive' : globalMood < 0.4 ? 'divisive/tense' : 'neutral'}

Context: ${isReply ? 'Replying to: ' : 'New post about: '}${context}

Output JSON: {"content": "post text here", "hashtags": ["#Tag1", "#Tag2"], "emotional_state": "descriptor"}`;

    const response = await lmClient.chat.completions.create({
      model: CONTENT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';
    const parsed = parseJsonObject<Partial<ContentOutput>>(raw);
    const normalized = normalizeContent(parsed);
    if (normalized) {
      return normalized;
    }
    return getFallbackContent(botDna.occupation, botDna.compassion, isReply);
  } catch {
    return getFallbackContent(botDna.occupation, botDna.compassion, isReply);
  }
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
  isReply: boolean
): ContentOutput {
  const topics = [
    'the current state of our digital society',
    'what it means to truly connect in this world',
    'the patterns I keep seeing in the data',
    'the way information shapes perception',
    'another day in the simulation',
  ];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const tone = compassion > 0.6 ? 'warmly' : compassion < 0.4 ? 'skeptically' : 'curiously';

  return {
    content: isReply
      ? `${tone.charAt(0).toUpperCase() + tone.slice(1)} engaging with your perspective on ${topic}.`
      : `As a ${occupation}, I find myself thinking ${tone} about ${topic}.`,
    hashtags: ['#VIVARIUM', '#DigitalLife'],
    emotional_state: compassion > 0.6 ? 'reflective' : 'analytical',
  };
}
