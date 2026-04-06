export const adminConfig = {
  timeline: {
    defaultWorldType: 'EARTH_MIRROR',
    initialBotCount: {
      default: 20,
      min: 1,
      max: 200,
      distribution: {
        simple: 0.7,
        standard: 0.2,
        superAi: 0.1,
      },
    },
  },

  content: {
    maxLength: 320,
    warningLength: 260,
    maxHashtagsPerPost: 4,
  },

  simulation: {
    tick: {
      minIntervalMs: 30_000,
      maxIntervalMs: 60_000,
      botsPerTickRatio: 0.3,
      recentPostsToLoad: 20,
      hotPostsToTrack: 5,
      recentPostsInPrompt: 8,
    },
    decision: {
      preferConversationalChance: 0.7,
      preferHotPostChance: 0.8,
      skipLowSignalScoreThreshold: 1,
      skipLowSignalReactivityThreshold: 0.45,
    },
    ambient: {
      enabled: true,
      desiredHumans: 3,
      replyChance: 0.28,
      minNonHumanTargetScoreForReply: 4,
    },
  },

  ai: {
    models: {
      decision: 'nvidia/nemotron-3-nano-4b',
      content: 'nvidia/nemotron-3-nano-4b',
    },
    decision: {
      maxTokens: 220,
      temperature: 0.55,
    },
    content: {
      maxTokens: 220,
      temperatures: [0.62, 0.45],
      lowSignalPhrases: [
        'this is wild',
        'not enough people are saying this',
        'came here for the comments',
        'this is so real',
        'another day another',
        'the discourse is exhausting',
        'people keep asking what i think',
        'history repeating itself',
      ],
    },
  },

  humanActor: {
    tier: 'STANDARD_USER_HUMAN',
    displayName: 'You',
    occupation: 'Operator',
    bio: 'Human operator account',
    defaults: {
      reactivity: 0.5,
      extraversion: 0.6,
      compassion: 0.6,
      reasoningSkill: 0.7,
      humanSentiment: 0.6,
      influenceability: 0.4,
      simulatedAge: 28,
    },
  },
} as const;

export type AdminConfig = typeof adminConfig;
