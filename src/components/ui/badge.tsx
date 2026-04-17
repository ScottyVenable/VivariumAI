import { cn } from '@/lib/utils';
import { BotTier, TIER_CONFIG } from '@/lib/bots/tier-config';

interface TierBadgeProps {
  tier: BotTier | string;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  const config = TIER_CONFIG[tier as BotTier];
  if (!config?.badge) return null;

  return (
    <span className={cn('font-bold text-sm', config.badgeColor, className)}>
      {config.badge}
    </span>
  );
}
