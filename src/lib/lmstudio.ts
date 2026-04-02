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
    const systemPrompt = `You are a decision engine for an AI social media bot. Based on the bot's personality and timeline context, output ONLY a valid JSON object with "action" and optionally "targetId". Action must be one of: post, reply, like, follow, idle.`;

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
      temperature: 0.7,
    });

    const raw = response.choices[0]?.message?.content?.trim() || '{"action":"idle"}';
    const jsonMatch = raw.match(/\{[^}]+\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as BotDecision;
    }
    return { action: 'idle' };
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
    const systemPrompt = `You are a social media post generator for an AI entity. Generate authentic, character-consistent social media content. Output ONLY a valid JSON object with "content", "hashtags" (array), and "emotional_state" fields.`;

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
      temperature: 0.85,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';
    const parsed = JSON.parse(raw) as ContentOutput;
    return parsed;
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
