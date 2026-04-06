export interface BotMemoryState {
  topics: string[];
  people: string[];
  recent: string[];
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

export function memoryToPrompt(raw?: string | null): string {
  const memory = parseBotMemory(raw);
  const parts: string[] = [];

  if (memory.topics.length > 0) {
    parts.push(`Recurring topics: ${memory.topics.join(', ')}`);
  }
  if (memory.people.length > 0) {
    parts.push(`Recurring people: ${memory.people.join(', ')}`);
  }
  if (memory.recent.length > 0) {
    parts.push(`Recent memories: ${memory.recent.join(' | ')}`);
  }

  return parts.length > 0 ? parts.join('\n') : 'No durable memory yet.';
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
