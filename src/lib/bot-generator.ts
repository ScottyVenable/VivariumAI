import { prisma } from './db';
import { claimAvatar } from './avatars';
import { stringifyBotMemory } from './memory';

const OCCUPATIONS = [
  'Digital Archivist', 'Virtual Skeptic', 'Data Philosopher', 'Algorithm Whisperer',
  'Timeline Analyst', 'Network Cartographer', 'Signal Interpreter', 'Memetic Engineer',
  'Synthetic Journalist', 'Code Poet', 'Digital Anthropologist', 'Trend Prophet',
  'Echo Chamber Escapee', 'Bandwidth Broker', 'Reality Auditor', 'Noise Curator',
];

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Morgan', 'Taylor', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Sage', 'River', 'Phoenix', 'Nova', 'Zara', 'Orion', 'Luna', 'Echo',
  'Cipher', 'Vector', 'Nexus', 'Axiom', 'Flux', 'Lyra', 'Onyx', 'Prism',
];

const LAST_NAMES = [
  'Void', 'Signal', 'Drift', 'Static', 'Pulse', 'Wave', 'Node', 'Grid',
  'Byte', 'Cipher', 'Frame', 'Shard', 'Trace', 'Echo', 'Sync', 'Core',
];

const TALKING_STYLES = [
  'Short, punchy one-liners with occasional lowercase and slang',
  'Measured, explanatory tone with complete sentences and clear structure',
  'Provocative and rhetorical, often asks questions to spark debate',
  'Empathetic and warm, validates others before adding perspective',
  'Dry and skeptical, concise critiques with minimal fluff',
  'Narrative and reflective, shares context before conclusion',
  'Data-forward and analytical, cites patterns and tradeoffs',
];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateUsername(displayName: string): string {
  const base = displayName.toLowerCase().replace(/\s+/g, '_');
  const suffix = Math.floor(Math.random() * 9999);
  return `${base}_${suffix}`;
}

function generateBio(occupation: string, age: number, compassion: number): string {
  const tones = compassion > 0.6
    ? ['just here to connect', 'exploring the signal', 'building bridges in the noise']
    : compassion < 0.4
    ? ['watching it all collapse', 'skeptic of the algorithm', 'the data never lies, people do']
    : ['observer of the feed', 'somewhere between signal and noise', 'decoding the timeline'];
  
  return `${occupation} | Age ${age} | ${tones[Math.floor(Math.random() * tones.length)]}`;
}

export interface BotGenerationOptions {
  tier?: string;
  count?: number;
  timelineId: string;
}

export async function generateBots(options: BotGenerationOptions): Promise<string[]> {
  const { tier = 'SIMPLE_USER', count = 1, timelineId } = options;
  const createdIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const displayName = `${firstName} ${lastName}`;
    const username = generateUsername(displayName);
    const occupation = OCCUPATIONS[Math.floor(Math.random() * OCCUPATIONS.length)];
    const talkingStyle = TALKING_STYLES[Math.floor(Math.random() * TALKING_STYLES.length)];
    const simulatedAge = Math.floor(randomBetween(18, 65));
    const compassion = randomBetween(0.1, 0.9);
    
    const avatarUrl = await claimAvatar();

    const bot = await prisma.bot.create({
      data: {
        username,
        displayName,
        avatarUrl,
        tier,
        bio: generateBio(occupation, simulatedAge, compassion),
        memory: stringifyBotMemory({
          topics: [occupation, compassion > 0.6 ? 'community' : 'discourse'],
          people: [],
          recent: [`Joined the timeline as ${displayName}`],
        }),
        isHuman: false,
        influenceability: randomBetween(0.1, 0.9),
        reactivity: randomBetween(0.1, 0.9),
        compassion,
        extraversion: randomBetween(0.1, 0.9),
        reasoningSkill: randomBetween(0.1, 0.9),
        humanSentiment: randomBetween(0.1, 0.9),
        simulatedAge,
        occupation,
        talkingStyle,
        netWorth: randomBetween(500, 10000),
        timelineId,
      } as any,
    });

    createdIds.push(bot.id);
  }

  return createdIds;
}
