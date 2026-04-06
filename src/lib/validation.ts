import { BotAction } from './lmstudio';

export const BOT_TIERS = [
  'SIMPLE_USER',
  'STANDARD_USER',
  'ADVANCED_USER',
  'SUPER_USER_AI',
  'STANDARD_USER_HUMAN',
  'SUPER_USER_HUMAN',
] as const;

export type BotTier = (typeof BOT_TIERS)[number];

export const WORLD_TYPES = ['EARTH_MIRROR', 'SYNTHETIC_WORLD'] as const;
export type WorldType = (typeof WORLD_TYPES)[number];

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isBotTier(value: string): value is BotTier {
  return BOT_TIERS.includes(value as BotTier);
}

export function isWorldType(value: string): value is WorldType {
  return WORLD_TYPES.includes(value as WorldType);
}

export function isBotAction(value: string): value is BotAction {
  return ['post', 'reply', 'like', 'follow', 'idle'].includes(value);
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function parseBoundedInt(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const rounded = Math.floor(value);
  return Math.max(min, Math.min(max, rounded));
}

export function parseNonNegativeNumber(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, value);
}

export function parseString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}