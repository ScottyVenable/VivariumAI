import { prisma } from './db';
import { claimAvatar } from './avatars';
import { stringifyBotMemory } from './memory';

const OCCUPATIONS = [
  // Tech & Digital
  'App Developer', 'Game Developer', 'Web Designer', 'UI/UX Designer', 'System Administrator',
  'Cybersecurity Analyst', 'Database Administrator', 'IT Support Specialist', 'Tech Support',
  'Software Architect', 'QA Engineer', 'Mobile Developer', 'Blockchain Developer',
  
  // Business & Finance
  'Accountant', 'Financial Advisor', 'Investment Banker', 'Stock Trader', 'Real Estate Agent',
  'Insurance Agent', 'Sales Manager', 'Business Analyst', 'Consultant', 'Entrepreneur',
  'CEO', 'CFO', 'Startup Founder', 'Venture Capitalist', 'Corporate Trainer',
  
  // Healthcare & Wellness
  'Doctor', 'Dentist', 'Pharmacist', 'Physical Therapist', 'Mental Health Counselor',
  'Nutritionist', 'Yoga Instructor', 'Personal Trainer', 'Holistic Healer', 'Acupuncturist',
  'Veterinarian', 'Medical Researcher', 'Public Health Official', 'Life Coach',
  
  // Food & Hospitality
  'Head Chef', 'Sous Chef', 'Pastry Chef', 'Food Blogger', 'Restaurant Owner',
  'Bartender', 'Sommelier', 'Food Critic', 'Caterer', 'Bakery Owner', 'Barista',
  
  // Arts & Entertainment
  'Actor', 'Director', 'Producer', 'Screenwriter', 'Playwright', 'Composer',
  'Sound Engineer', 'Video Editor', 'Choreographer', 'Dancer', 'Magician',
  'Comedian', 'Stand-up Comic', 'Voice Actor', 'Stunt Performer',
  
  // Sports & Recreation
  'Professional Athlete', 'Coach', 'Sports Analyst', 'Fitness Influencer', 'Yoga Teacher',
  'Personal Trainer', 'Sports Journalist', 'Athletic Trainer', 'Gym Owner',
  
  // Education & Academia
  'Kindergarten Teacher', 'Elementary Teacher', 'Middle School Teacher', 'High School Teacher',
  'University Professor', 'Adjunct Lecturer', 'Academic Researcher', 'Education Administrator',
  'School Principal', 'Guidance Counselor', 'Online Educator', 'Course Designer',
  
  // Media & Communications
  'Journalist', 'News Reporter', 'Broadcast Journalist', 'News Anchor', 'Podcaster',
  'Radio Host', 'TV Host', 'Blogger', 'Content Writer', 'Copywriter', 'Public Relations Specialist',
  'Marketing Manager', 'Social Media Manager', 'Community Manager', 'Brand Manager',
  
  // Trades & Construction
  'Electrician', 'Plumber', 'Carpenter', 'Mason', 'Roofer', 'HVAC Technician',
  'Welder', 'Auto Mechanic', 'Construction Manager', 'Contractor',
  
  // Transportation & Logistics
  'Truck Driver', 'Taxi Driver', 'Uber Driver', 'Pilot', 'Flight Attendant', 'Ship Captain',
  'Logistics Manager', 'Warehouse Manager', 'Delivery Driver', 'Bus Driver',
  
  // Fashion & Beauty
  'Fashion Designer', 'Fashion Blogger', 'Stylist', 'Hairstylist', 'Makeup Artist',
  'Cosmetologist', 'Fashion Photographer', 'Model', 'Wardrobe Consultant',
  
  // Agriculture & Environment
  'Farmer', 'Sustainable Agriculture Specialist', 'Environmental Scientist', 'Ecologist',
  'Conservation Biologist', 'Forestry Technician', 'Botanist', 'Marine Biologist',
  
  // Science & Research
  'Chemist', 'Physicist', 'Biologist', 'Zoologist', 'Geologist', 'Astronomer',
  'Research Scientist', 'Laboratory Technician', 'Medical Researcher',
  
  // Law & Government
  'Lawyer', 'Attorney', 'Judge', 'Paralegal', 'Police Officer', 'Detective', 'Firefighter',
  'Government Official', 'Politician', 'Civil Rights Advocate', 'Diplomat',
  
  // Manufacturing & Operations
  'Factory Manager', 'Production Manager', 'Quality Control Inspector', 'Shift Supervisor',
  'Equipment Operator', 'Inventory Manager',
  
  // Travel & Tourism
  'Tour Guide', 'Travel Agent', 'Hotel Manager', 'Concierge', 'Resort Owner',
  'Travel Blogger', 'Travel Photographer', 'Flight Coordinator',
  
  // Music & Audio
  'Music Producer', 'Recording Engineer', 'Audio Technician', 'DJ', 'Beat Maker',
  'Music Teacher', 'Session Musician', 'Orchestra Conductor', 'Studio Owner',
  
  // Crafts & Making
  'Woodworker', 'Jewelry Designer', 'Pottery Artist', 'Glassblower', 'Leatherworker',
  'Metalsmith', 'Handmade Goods Creator', 'Artisan', 'Maker',
  
  // Gaming & Esports
  'Professional Gamer', 'Esports Coach', 'Game Streamer', 'Gaming Journalist',
  'Esports Manager', 'Game Tester',
  
  // Niche & Contemporary
  'Social Media Influencer', 'TikTok Creator', 'YouTuber', 'Twitch Streamer', 'NFT Artist',
  'Cryptocurrency Enthusiast', 'Virtual Influencer', 'Resume Coach', 'Career Counselor',
  'Life Organizer', 'Professional Organizer', 'Minimalism Advocate', 'Sustainability Consultant',
  'Digital Nomad', 'Remote Worker', 'Freelancer', 'Side Hustler',
];

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Morgan', 'Taylor', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Sage', 'Drew', 'Cameron', 'Reese', 'Emerson', 'Finley', 'Hayden', 'Parker',
  'Rowan', 'Skyler', 'Blake', 'Dakota', 'Harper', 'Jesse', 'Kendall', 'Logan',
  'Marley', 'Phoenix', 'River', 'Sawyer', 'Tatum', 'Valentine', 'Winter',
  'Zion', 'Charlie', 'Devon', 'Elliot', 'Frankie', 'Gray', 'Hunter', 'Indigo',
  'Jasper', 'Kai', 'Lennon', 'Milo', 'Nico', 'Orion', 'Percy',
  'Adrian', 'Ellis', 'Forest', 'Glenn', 'Hayes', 'Indy', 'Jules', 'Kelsey',
  'Landen', 'Macy', 'Nolan', 'Owen', 'Tess', 'Urban', 'Vesper', 'Wade',
  'Xander', 'Yale', 'Zen', 'Austin', 'Bailey', 'Dane', 'Evan', 'Finch',
  'Gabe', 'Henrik', 'Iris', 'Jude', 'Kit', 'Levi', 'Micah', 'Nash', 'Ollie', 'Pat', 'Quincy',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
  'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
  'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
  'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz',
  'Park', 'Kim', 'Chen', 'Wang', 'Patel', 'Singh', 'Kumar', 'Choi',
  'Wagner', 'Mueller', 'Schultz', 'Peterson', 'Bennett', 'Cross', 'Russell',
];

const TALKING_STYLES = [
  // Digital & Analytical
  'Short, punchy one-liners with occasional lowercase and slang',
  'Data-forward and analytical, cites patterns and tradeoffs',
  'Measured, explanatory tone with complete sentences and clear structure',
  // Conversational & Social
  'Conversational and casual, uses internet slang and contemporary references',
  'Empathetic and warm, validates others before adding perspective',
  'Friendly and encouraging, builds community through active listening',
  // Critical & Provocative
  'Provocative and rhetorical, often asks questions to spark debate',
  'Dry and skeptical, concise critiques with minimal fluff',
  'Sardonic and witty, uses humor to navigate complexity',
  // Narrative & Reflective
  'Narrative and reflective, shares context and personal experiences',
  'Thoughtful and introspective, explores nuance and gray areas',
  'Storytelling focused, uses anecdotes and metaphors to illustrate points',
  // Passionate & Expert
  'Passionate and opinionated, speaks from deep conviction',
  'Professorial and informative, educates while engaging respectfully',
  'Enthusiastic and energetic, brings infectious excitement to topics',
];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateUsername(displayName: string): string {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special chars
    .slice(0, 15); // Limit length
  
  const suffixes = ['_', '.', ''];
  const separator = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  const identifiers = [
    Math.floor(Math.random() * 999).toString(),
    new Date().getFullYear().toString(),
    ['dev', 'pro', 'real', 'official', 'true'][Math.floor(Math.random() * 5)],
  ];
  
  const identifier = identifiers[Math.floor(Math.random() * identifiers.length)];
  return `${base}${separator}${identifier}`.slice(0, 30); // Enforce max length
}

function generateBio(occupation: string, age: number, compassion: number): string {
  const compassionateTones = [
    '🌱 passionate about making a difference',
    '💙 community first, always',
    '🤝 here to uplift and connect',
    '✨ spreading positivity & good vibes',
    '🌍 believer in humanity',
    '📖 storyteller | listener',
    '🎯 authentic conversations only',
    '💬 let\'s talk about what matters'
  ];
  
  const indifferentTones = [
    '🤔 skeptic | realist | no filter',
    '📊 data > opinions',
    '🎯 truth > comfort',
    '⚡ too honest for most',
    '🔍 cutting through the BS',
    '💭 questioning everything',
    '⚖️ devil\'s advocate',
    '🚀 keeping it real'
  ];
  
  const balancedTones = [
    '📱 just here for the vibes',
    '🎭 bit of everything tbh',
    '🌀 trying to figure it out',
    '🎨 random thoughts go here',
    '⚓ grounded but open-minded',
    '🔗 connecting dots',
    '📍 observer of the chaos',
    '🤷 still learning'
  ];

  const selectedTones = compassion > 0.6 
    ? compassionateTones 
    : compassion < 0.4 
    ? indifferentTones 
    : balancedTones;
  
  const tone = selectedTones[Math.floor(Math.random() * selectedTones.length)];
  return `${tone} | ${occupation} | ${age}`;
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
