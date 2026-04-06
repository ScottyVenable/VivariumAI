import { prisma } from './db';
import { adminConfig } from '@config/admin';

export async function getOrCreateHumanActor(timelineId: string): Promise<string> {
  const existing = await prisma.bot.findFirst({
    where: { timelineId, isHuman: true },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const settings = adminConfig.humanActor;
  const created = await prisma.bot.create({
    data: {
      timelineId,
      isHuman: true,
      tier: settings.tier,
      username: `human_${timelineId}`,
      displayName: settings.displayName,
      occupation: settings.occupation,
      bio: settings.bio,
      reactivity: settings.defaults.reactivity,
      extraversion: settings.defaults.extraversion,
      compassion: settings.defaults.compassion,
      reasoningSkill: settings.defaults.reasoningSkill,
      humanSentiment: settings.defaults.humanSentiment,
      influenceability: settings.defaults.influenceability,
      simulatedAge: settings.defaults.simulatedAge,
    },
    select: { id: true },
  });

  return created.id;
}
