export interface BotMemoryState {
  topics: string[];
  people: string[];
  recent: string[];
}

export interface MemoryPromptOptions {
  compact?: boolean;
  topicLimit?: number;
  peopleLimit?: number;
  recentLimit?: number;
  maxItemLength?: number;
}

const EMPTY_MEMORY: BotMemoryState = {
  topics: [],
  people: [],
  recent: [],
};

function uniqueTrimmed(values: string[], limit: number): string[] {
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || out.includes(trimmed)) continue;
    out.push(trimmed);
    if (out.length >= limit) break;
  }
  return out;
}

export function parseBotMemory(raw?: string | null): BotMemoryState {
  if (!raw) return EMPTY_MEMORY;

  try {
    const parsed = JSON.parse(raw) as Partial<BotMemoryState>;
    return {
      topics: Array.isArray(parsed.topics) ? uniqueTrimmed(parsed.topics.filter((v): v is string => typeof v === 'string'), 6) : [],
      people: Array.isArray(parsed.people) ? uniqueTrimmed(parsed.people.filter((v): v is string => typeof v === 'string'), 6) : [],
      recent: Array.isArray(parsed.recent) ? uniqueTrimmed(parsed.recent.filter((v): v is string => typeof v === 'string'), 8) : [],
    };
  } catch {
    return EMPTY_MEMORY;
  }
}

export function stringifyBotMemory(memory: BotMemoryState): string {
  return JSON.stringify({
    topics: uniqueTrimmed(memory.topics, 6),
    people: uniqueTrimmed(memory.people, 6),
    recent: uniqueTrimmed(memory.recent, 8),
  });
}

function truncate(value: string, maxItemLength: number): string {
  if (value.length <= maxItemLength) return value;
  return `${value.slice(0, maxItemLength - 1).trimEnd()}…`;
}

export function memoryToPrompt(raw?: string | null, options?: MemoryPromptOptions): string {
  const memory = parseBotMemory(raw);
  const compact = options?.compact ?? false;
  const topicLimit = options?.topicLimit ?? (compact ? 3 : 6);
  const peopleLimit = options?.peopleLimit ?? (compact ? 3 : 6);
  const recentLimit = options?.recentLimit ?? (compact ? 3 : 8);
  const maxItemLength = options?.maxItemLength ?? (compact ? 48 : 120);

  const topics = memory.topics
    .slice(0, topicLimit)
    .map(topic => truncate(topic, maxItemLength));
  const people = memory.people
    .slice(0, peopleLimit)
    .map(person => truncate(person, maxItemLength));
  const recent = memory.recent
    .slice(0, recentLimit)
    .map(event => truncate(event, maxItemLength));

  const parts: string[] = [];

  if (topics.length > 0) {
    parts.push(`Recurring topics: ${topics.join(', ')}`);
  }
  if (people.length > 0) {
    parts.push(`Recurring people: ${people.join(', ')}`);
  }
  if (recent.length > 0) {
    parts.push(`Recent memories: ${recent.join(' | ')}`);
  }

  if (parts.length === 0) {
    return compact ? 'No durable memory.' : 'No durable memory yet.';
  }

  if (compact) {
    return parts
      .map(part => part.replace('Recurring ', '').replace('Recent memories', 'Recent'))
      .join(' || ');
  }

  return parts.join('\n');
}

export function remember(
  raw: string | null | undefined,
  update: { topic?: string | null; person?: string | null; event?: string | null }
): string {
  const memory = parseBotMemory(raw);

  const topics = update.topic ? [update.topic, ...memory.topics] : memory.topics;
  const people = update.person ? [update.person, ...memory.people] : memory.people;
  const recent = update.event ? [update.event, ...memory.recent] : memory.recent;

  return stringifyBotMemory({
    topics,
    people,
    recent,
  });
}
