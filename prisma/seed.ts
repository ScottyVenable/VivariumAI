import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Occupations list (expanded for diversity)
const OCCUPATIONS = [
  'App Developer', 'Game Developer', 'Web Designer', 'UI/UX Designer', 'System Administrator',
  'Cybersecurity Analyst', 'Database Administrator', 'IT Support Specialist', 'Tech Support',
  'Software Architect', 'QA Engineer', 'Mobile Developer', 'Blockchain Developer',
  'Accountant', 'Financial Advisor', 'Investment Banker', 'Stock Trader', 'Real Estate Agent',
  'Insurance Agent', 'Sales Manager', 'Business Analyst', 'Consultant', 'Entrepreneur',
  'CEO', 'CFO', 'Startup Founder', 'Venture Capitalist', 'Corporate Trainer',
  'Doctor', 'Dentist', 'Pharmacist', 'Physical Therapist', 'Mental Health Counselor',
  'Nutritionist', 'Yoga Instructor', 'Personal Trainer', 'Holistic Healer', 'Acupuncturist',
  'Veterinarian', 'Medical Researcher', 'Public Health Official', 'Life Coach',
  'Head Chef', 'Sous Chef', 'Pastry Chef', 'Food Blogger', 'Restaurant Owner',
  'Bartender', 'Sommelier', 'Food Critic', 'Caterer', 'Bakery Owner', 'Barista',
  'Actor', 'Director', 'Producer', 'Screenwriter', 'Playwright', 'Composer',
  'Sound Engineer', 'Video Editor', 'Choreographer', 'Dancer', 'Magician',
  'Comedian', 'Stand-up Comic', 'Voice Actor', 'Stunt Performer',
  'Professional Athlete', 'Coach', 'Sports Analyst', 'Fitness Influencer',
  'Elementary Teacher', 'High School Teacher', 'University Professor', 'Academic Researcher',
  'Journalist', 'News Reporter', 'Broadcaster', 'Podcaster', 'Radio Host', 'TV Host',
  'Blogger', 'Content Writer', 'Social Media Manager', 'Digital Marketing Specialist',
  'Electrician', 'Plumber', 'Carpenter', 'Mason', 'Roofer', 'HVAC Technician',
  'Truck Driver', 'Pilot', 'Flight Attendant', 'Logistics Manager',
  'Fashion Designer', 'Stylist', 'Makeup Artist', 'Model', 'Fashion Photographer',
  'Farmer', 'Environmental Scientist', 'Conservation Biologist', 'Botanist',
  'Chemist', 'Physicist', 'Biologist', 'Research Scientist',
  'Lawyer', 'Judge', 'Police Officer', 'Firefighter', 'Government Official',
  'Tour Guide', 'Travel Agent', 'Hotel Manager', 'Travel Blogger',
  'Music Producer', 'DJ', 'Session Musician', 'Music Teacher',
  'Woodworker', 'Jewelry Designer', 'Pottery Artist', 'Leatherworker', 'Artisan',
  'Professional Gamer', 'Game Streamer', 'Esports Coach', 'Game Tester',
  'Social Media Influencer', 'YouTuber', 'TikTok Creator', 'Twitch Streamer',
  'Digital Nomad', 'Freelancer', 'Career Coach', 'Life Organizer',
];

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Morgan', 'Taylor', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Sage', 'Drew', 'Cameron', 'Reese', 'Emerson', 'Finley', 'Hayden', 'Parker',
  'Rowan', 'Skyler', 'Blake', 'Dakota', 'Harper', 'Jesse', 'Kendall', 'Logan',
  'Marley', 'Phoenix', 'River', 'Sawyer', 'Tatum', 'Valentine', 'Winter', 'Zion',
  'Charlie', 'Devon', 'Elliot', 'Frankie', 'Gray', 'Hunter', 'Indigo', 'Jasper',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson',
  'Young', 'Allen', 'King', 'Wright', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Mitchell', 'Carter', 'Roberts',
  'Phillips', 'Evans', 'Turner', 'Diaz', 'Park', 'Kim', 'Chen', 'Wang', 'Patel', 'Singh',
];

const TALKING_STYLES = [
  'Short, punchy one-liners with occasional lowercase and slang',
  'Data-forward and analytical, cites patterns and tradeoffs',
  'Measured, explanatory tone with complete sentences and clear structure',
  'Conversational and casual, uses internet slang and contemporary references',
  'Empathetic and warm, validates others before adding perspective',
  'Friendly and encouraging, builds community through active listening',
  'Provocative and rhetorical, often asks questions to spark debate',
  'Dry and skeptical, concise critiques with minimal fluff',
  'Sardonic and witty, uses humor to navigate complexity',
  'Narrative and reflective, shares context and personal experiences',
  'Thoughtful and introspective, explores nuance and gray areas',
  'Storytelling focused, uses anecdotes and metaphors to illustrate points',
  'Passionate and opinionated, speaks from deep conviction',
  'Professorial and informative, educates while engaging respectfully',
  'Enthusiastic and energetic, brings infectious excitement to topics',
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
  const compassionateTones = [
    'passionate about making a difference',
    'community first, always',
    'here to uplift and connect',
    'spreading positivity',
    'believer in humanity',
    'storyteller and listener',
    'authentic conversations only',
  ];

  const indifferentTones = [
    'skeptic and realist',
    'data over opinions',
    'truth seeker',
    'cutting through the BS',
    'questioning everything',
    'devil\'s advocate',
  ];

  const balancedTones = [
    'just here for the vibes',
    'bit of everything really',
    'trying to figure it out',
    'observer of chaos',
    'grounded but open-minded',
    'still learning',
  ];

  const selectedTones = compassion > 0.6 
    ? compassionateTones 
    : compassion < 0.4 
    ? indifferentTones 
    : balancedTones;

  const tone = selectedTones[Math.floor(Math.random() * selectedTones.length)];
  return `${occupation} | Age ${age} | ${tone}`;
}

async function createBot(timelineId: string, tier: string): Promise<void> {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const displayName = `${firstName} ${lastName}`;
  const username = generateUsername(displayName);
  const occupation = OCCUPATIONS[Math.floor(Math.random() * OCCUPATIONS.length)];
  const talkingStyle = TALKING_STYLES[Math.floor(Math.random() * TALKING_STYLES.length)];
  const simulatedAge = Math.floor(randomBetween(18, 65));
  const compassion = randomBetween(0.1, 0.9);

  await prisma.bot.create({
    data: {
      username,
      displayName,
      avatarUrl: '/avatars/default.svg',
      tier,
      bio: generateBio(occupation, simulatedAge, compassion),
      memory: JSON.stringify({
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
}

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

  console.log(`✨ Created timeline: ${timeline.id}`);
  console.log('🤖 Populating with diverse AI entities...');

  // Create diverse bot population
  for (let i = 0; i < 14; i++) await createBot(timeline.id, 'SIMPLE_USER');
  for (let i = 0; i < 4; i++) await createBot(timeline.id, 'STANDARD_USER');
  await createBot(timeline.id, 'ADVANCED_USER');
  await createBot(timeline.id, 'SUPER_USER_AI');

  console.log('✅ VIVARIUM seeded with 20 diverse entities.');
}
