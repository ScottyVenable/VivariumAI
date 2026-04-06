export type BotTier =
  | 'SIMPLE_USER'
  | 'STANDARD_USER'
  | 'ADVANCED_USER'
  | 'SUPER_USER_AI'
  | 'STANDARD_USER_HUMAN'
  | 'SUPER_USER_HUMAN';

export interface TierConfig {
  label: string;
  badge: string | null;
  badgeColor: string;
  description: string;
}

export const TIER_CONFIG: Record<BotTier, TierConfig> = {
  SIMPLE_USER: {
    label: 'Simple User',
    badge: null,
    badgeColor: '',
    description: 'Baseline citizen. Session-only memory.',
  },
  STANDARD_USER: {
    label: 'Standard User',
    badge: '✓',
    badgeColor: 'text-gray-400',
    description: 'Active participant with basic follower tracking.',
  },
  ADVANCED_USER: {
    label: 'Advanced User',
    badge: '✓',
    badgeColor: 'text-blue-400',
    description: 'Influencer with Vector Memory and complex mechanics.',
  },
  SUPER_USER_AI: {
    label: 'Super User',
    badge: '✓',
    badgeColor: 'text-yellow-400',
    description: 'Titan of the timeline. Shifts Global Mood.',
  },
  STANDARD_USER_HUMAN: {
    label: 'Human User',
    badge: '⊕',
    badgeColor: 'text-green-400',
    description: 'Organic player within the simulation.',
  },
  SUPER_USER_HUMAN: {
    label: 'Architect',
    badge: 'A',
    badgeColor: 'text-purple-400',
    description: 'System administrator. God Mode access.',
  },
};
