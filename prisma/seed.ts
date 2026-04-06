import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding VIVARIUM...');

  // Initialize image pool
  const existing = await prisma.imagePool.findUnique({ where: { id: 'singleton' } });
  if (!existing) {
    await prisma.imagePool.create({
      data: { id: 'singleton', availableImages: '[]', usedImages: '[]' },
    });
  }

  // Create default timeline
  const existingTimeline = await prisma.timeline.findFirst({ where: { name: 'Genesis' } });
  if (existingTimeline) {
    console.log('Default timeline already exists. Skipping seed.');
    return;
  }

  const timeline = await prisma.timeline.create({
    data: { name: 'Genesis', worldType: 'EARTH_MIRROR' },
  });

  console.log(`Created timeline: ${timeline.id}`);

  const OCCUPATIONS = [
    'Digital Archivist', 'Virtual Skeptic', 'Data Philosopher', 'Algorithm Whisperer',
    'Timeline Analyst', 'Network Cartographer', 'Influencer', 'Content Curator', 'High School Teacher', 'Gamer', 'Anime Enthusiast', 'Aspiring Musician', 'Amateur Chef', 'Fitness Buff', 'Travel Blogger', 'Sci-Fi Fan', 'Fantasy Novelist', 'Comedian', 'Pet Lover', 'Nature Photographer'
  ];
  const TALKING_STYLES = [
    'Short, punchy one-liners with occasional lowercase and slang',
    'Measured, explanatory tone with complete sentences and clear structure',
    'Provocative and rhetorical, often asks questions to spark debate',
    'Empathetic and warm, validates others before adding perspective',
    'Dry and skeptical, concise critiques with minimal fluff',
  ];

  const FIRST_NAMES = ['Alex', 'Jordan', 'Morgan', 'Taylor', 'Casey', 'Riley', 'Quinn', 'Avery', 'Sage', 'River', 'Skyler', 'Emerson', 'Finley', 'Reese', 'Rowan', 'Parker', 'Drew', 'Cameron', 'Harper', 'Blake', 'Hayden', 'Charlie', 'Dakota', 'Elliot', 'Frankie', 'Jamie', 'Kendall', 'Logan', 'Marley', 'Nico', 'Phoenix', 'Remy', 'Sawyer', 'Tatum', 'Valentine', 'Winter', 'Zion', 'Arden', 'Briar', 'Cypress', 'Emery', 'Fable', 'Greer', 'Hollis', 'Indigo', 'Jules', 'Keegan', 'Lennon', 'Marlowe', 'Nova', 'Onyx', 'Poe', 'Reagan', 'Sutton', 'Toby', 'Umber', 'Vesper', 'Wren', 'Xen', 'Yale', 'Zephyr'];
  const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

  function randomBetween(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  async function createBot(tier: string) {
    const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const displayName = `${fn} ${ln}`;
    const username = `${displayName.toLowerCase().replace(/\s+/g, '_')}_${Math.floor(Math.random() * 9999)}`;
    const occupation = OCCUPATIONS[Math.floor(Math.random() * OCCUPATIONS.length)];
    const talkingStyle = TALKING_STYLES[Math.floor(Math.random() * TALKING_STYLES.length)];
    const simulatedAge = Math.floor(randomBetween(18, 65));

    await prisma.bot.create({
      data: {
        username,
        displayName,
        avatarUrl: '/avatars/default.svg',
        tier,
        bio: `${occupation} | Age ${simulatedAge} | Style: ${talkingStyle}`,
        isHuman: false,
        influenceability: randomBetween(0.1, 0.9),
        reactivity: randomBetween(0.1, 0.9),
        compassion: randomBetween(0.1, 0.9),
        extraversion: randomBetween(0.1, 0.9),
        reasoningSkill: randomBetween(0.1, 0.9),
        humanSentiment: randomBetween(0.1, 0.9),
        simulatedAge,
        occupation,
        talkingStyle,
        netWorth: randomBetween(500, 10000),
        timelineId: timeline.id,
      } as any,
    });
  }

  for (let i = 0; i < 14; i++) await createBot('SIMPLE_USER');
  for (let i = 0; i < 4; i++) await createBot('STANDARD_USER');
  await createBot('ADVANCED_USER');
  await createBot('SUPER_USER_AI');

  console.log('✅ VIVARIUM seeded with 20 entities.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
