import { prisma } from './db';
import { adminConfig } from '@config/admin';

/**
 * Returns the ID of the per-timeline human operator bot, creating it if it
 * doesn't exist yet.  Uses an atomic upsert so that concurrent first-time
 * calls on the same timeline cannot race on the unique `username` constraint
 * and cause a 500 for the losing writer.
 */
export async function getOrCreateHumanActor(timelineId: string): Promise<string> {
  const settings = adminConfig.humanActor;

  // username is @unique in the schema, so this upsert is effectively
  // "insert-or-ignore" — the update clause is intentionally empty.
  const result = await prisma.bot.upsert({
    where: { username: `human_${timelineId}` },
    update: {},
    create: {
      timelineId,
      isHuman: true,
      tier: settings.tier,
      username: `human_${timelineId}`,
      displayName: settings.displayName,
      occupation: settings.occupation,
      talkingStyle: 'Direct and practical; short, grounded comments from the operator perspective',
      bio: settings.bio,
      reactivity: settings.defaults.reactivity,
      extraversion: settings.defaults.extraversion,
      compassion: settings.defaults.compassion,
      reasoningSkill: settings.defaults.reasoningSkill,
      humanSentiment: settings.defaults.humanSentiment,
      influenceability: settings.defaults.influenceability,
      simulatedAge: settings.defaults.simulatedAge,
    } as any,
    select: { id: true },
  });

  return result.id;
}
