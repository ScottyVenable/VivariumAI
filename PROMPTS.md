# VIVARIUM Agent Prompts

Ready-to-use prompts for the **VIVARIUM Dev** agent. Replace `[PLACEHOLDER]` values before sending.
Optimized for Claude Sonnet 4.6 (fast iteration) and Claude Opus 4 (complex reasoning, architecture, creative design).

---

## Feature Development

### New Feature — Full Stack
```
Build a new feature: [FEATURE_NAME].

Description: [WHAT IT DOES AND WHY IT EXISTS]

Requirements:
- [REQUIREMENT 1]
- [REQUIREMENT 2]
- [REQUIREMENT 3]

Constraints:
- Mobile-first (320px+), respect MobileBottomNav layout
- Match existing Radix UI + Tailwind patterns
- [ANY ADDITIONAL CONSTRAINT]

Start by reading any relevant existing files, then produce a todo plan before writing code.
```

### Extend Existing Feature
```
Extend the [FEATURE_NAME] feature with: [NEW_CAPABILITY].

Existing related files: [FILE_OR_COMPONENT_NAMES if known]

The new behavior should: [DESCRIBE EXPECTED BEHAVIOR].
Keep changes minimal — only touch what's needed.
```

### New API Route
```
Create a new API route: [HTTP_METHOD] /api/[ROUTE_PATH]

Purpose: [WHAT IT DOES]
Input: [REQUEST BODY OR PARAMS]
Output: [RESPONSE SHAPE]

Follow the existing route patterns in src/app/api/. Use Prisma for DB access, validate all inputs with helpers from src/lib/validation.ts.
```

### New Prisma Model / Schema Change
```
Add a new Prisma model or update schema for: [FEATURE_NAME].

Model name: [MODEL_NAME]
Fields needed:
- [FIELD]: [TYPE] [OPTIONAL/REQUIRED]
- [FIELD]: [TYPE] [OPTIONAL/REQUIRED]

Relations: [DESCRIBE RELATIONS TO OTHER MODELS]

After updating schema.prisma, run db:push and update seed.ts if needed.
```

---

## Bug Debugging

### Reproduce & Fix a Bug
```
There is a bug: [DESCRIBE THE BUG].

Steps to reproduce:
1. [STEP 1]
2. [STEP 2]
3. [STEP 3]

Expected behavior: [WHAT SHOULD HAPPEN]
Actual behavior: [WHAT ACTUALLY HAPPENS]
Error message (if any): [PASTE ERROR]

Read the relevant source files, trace the data flow, identify the root cause, and fix it — not just the symptom.
```

### API Route Returning Wrong Response
```
The API route [METHOD] /api/[PATH] is returning [WRONG_STATUS_OR_RESPONSE].

Request body/params: [WHAT IS BEING SENT]
Expected response: [WHAT IS EXPECTED]
Actual response: [WHAT IS RECEIVED]

Check the route handler, any middleware, and Prisma query involved.
```

### React Component Not Rendering Correctly
```
The [COMPONENT_NAME] component is [DESCRIBE THE VISUAL OR BEHAVIOR ISSUE].

It should: [EXPECTED BEHAVIOR]
It currently: [ACTUAL BEHAVIOR]

Context: it's used in [WHERE IT'S USED]. Read the component and its parent to diagnose.
```

### TypeScript Compile Error
```
Fix this TypeScript error:

[PASTE FULL ERROR MESSAGE]

File: [FILE_PATH]
Context: [WHAT YOU WERE TRYING TO DO]
```

### Tick System / Bot Behavior Issue
```
The tick system is [DESCRIBE THE ISSUE — e.g., bots not posting, infinite loop, wrong action selection].

Timeline ID being tested: [ID or "any"]
Bot tier affected: [TIER or "all"]
LM Studio model in use: [MODEL_NAME or "unknown"]

Read tick.ts and lmstudio.ts. Identify where the logic breaks down and fix it.
```

---

## UI / UX Design & Components

### New Component — Mobile First
```
Design and build a new React component: [COMPONENT_NAME].

Purpose: [WHAT IT DOES / WHERE IT APPEARS]
Data it receives: [PROPS SHAPE]
Interactions: [WHAT THE USER CAN DO]

Design direction: [MOOD, AESTHETIC, OR REFERENCE — e.g., "dark glass-morphism", "minimal with framer-motion fade-in", "matches PostCard style"]

Requirements:
- Mobile-first, min 320px
- Use Radix UI primitives where applicable
- Tailwind for styling
- Framer Motion for [ANIMATION DESCRIPTION if any]
```

### Redesign Existing Component
```
Redesign the [COMPONENT_NAME] component.

Current issues: [WHAT FEELS WRONG OR WHAT TO IMPROVE]
New design goal: [DESCRIBE TARGET LOOK/FEEL]
Preserve existing functionality: [LIST ANY BEHAVIOR TO KEEP]

Read the current component before proposing changes. Show the full updated file.
```

### Add Animation
```
Add a [ANIMATION_TYPE — e.g., slide-in, fade, spring bounce] animation to [COMPONENT_NAME].

Trigger: [WHEN DOES IT PLAY — e.g., on mount, on state change, on scroll]
Direction/feel: [e.g., "smooth 300ms ease-out from bottom", "spring with stiffness 200"]

Use framer-motion. Preserve all existing logic.
```

### Improve Mobile Layout
```
The mobile layout of [PAGE_OR_COMPONENT] needs improvement.

Issue: [DESCRIBE THE PROBLEM — overflow, cramped spacing, wrong tap targets, etc.]
Device target: [320px / 375px / both]
Desired fix: [WHAT YOU WANT IT TO LOOK LIKE]

Read the component and any related CSS. Make only targeted layout fixes.
```

### Dark Theme / Visual Polish
```
Apply visual polish to [COMPONENT_OR_PAGE].

Issues to address:
- [VISUAL ISSUE 1]
- [VISUAL ISSUE 2]

Match the existing dark theme: bg-black/zinc-900, text-white/zinc-400, accent colors from existing PostCard or MobileBottomNav patterns.
```

---

## Testing (Playwright)

### Write E2E Test
```
Write a Playwright e2e test for: [FEATURE_OR_USER_FLOW].

Flow to test:
1. [STEP 1]
2. [STEP 2]
3. [STEP 3]

Assertions:
- [WHAT TO ASSERT]
- [WHAT TO ASSERT]

Place the test in tests/e2e/[FILENAME].spec.ts. Use helpers from tests/e2e/helpers/ where applicable. Run against both chromium and mobile-chrome projects.
```

### Fix Failing Test
```
This Playwright test is failing: [TEST_FILE_OR_TEST_NAME]

Error: [PASTE ERROR OUTPUT]

Read the test file, understand what it's asserting, find the mismatch between the test and the current app behavior, and fix [the test / the app code — specify which].
```

### Add Screenshot Assertion
```
Add a screenshot assertion to [TEST_FILE] for the [STEP_NAME] step.

Use the screenshot helpers in tests/e2e/helpers/screenshots.ts. Name the snapshot: [SNAPSHOT_NAME].
```

### Test a New API Endpoint
```
Write a Playwright API test for: [HTTP_METHOD] /api/[ROUTE_PATH]

Test cases:
- Happy path: [DESCRIBE]
- Error case 1: [DESCRIBE — e.g., missing field, invalid ID]
- Error case 2: [DESCRIBE]

Place in tests/e2e/api-admin.spec.ts or a new file if more appropriate.
```

---

## Bot System / AI Behavior

### Add New Bot Behavior / Action
```
Add a new bot action type: [ACTION_NAME].

What it means: [DESCRIBE WHAT THE BOT IS DOING]
When it triggers: [CONDITIONS IN THE TICK LOOP]
What it produces: [DB RECORD, POST, REACTION, etc.]

Update tick.ts, lmstudio.ts (if new LLM prompt needed), and Prisma schema if required.
```

### Tune Bot Personality / Tier
```
Adjust the [TIER_NAME] tier bot behavior.

Current issue: [WHAT FEELS OFF]
Desired change: [HOW IT SHOULD BEHAVE]

Relevant files: `src/lib/ai/tick.ts`, `src/lib/bots/tier-config.ts`, `src/lib/ai/lmstudio.ts`
```

### Improve LLM Prompt
```
Improve the LLM prompt for [decision | content | both] generation.

Current issue: [WHAT THE MODEL IS DOING WRONG — e.g., incoherent replies, ignoring personality, bad hashtags]
Target behavior: [WHAT GOOD OUTPUT LOOKS LIKE]
Model context: [MODEL_NAME if relevant, e.g., "Llama 3.1 8B via LM Studio"]

Read lmstudio.ts, understand the current prompt structure, then make targeted improvements.
```

### Add Bot Memory Feature
```
Extend the bot memory system with: [NEW_MEMORY_TYPE or BEHAVIOR].

Current memory shape (BotMemoryState): topics[], people[], recent[]
New requirement: [DESCRIBE WHAT SHOULD BE STORED OR HOW MEMORY SHOULD AFFECT BEHAVIOR]

Read memory.ts and the places it's consumed (tick.ts, lmstudio.ts, ProfileSheet.tsx).
```

### Generate New Bot Type / Category
```
Add a new bot category or archetype: [ARCHETYPE_NAME].

Personality traits: [LIST KEY TRAITS]
Occupation examples: [LIST OCCUPATIONS]
Posting style: [DESCRIBE HOW IT WRITES]
Tier: [WHICH TIER IT FALLS UNDER]

Update bot-generator.ts. If a new tier is needed, update tier-config.ts and the Prisma schema.
```

---

## Database / Prisma

### Add Field to Existing Model
```
Add a new field to the [MODEL_NAME] Prisma model:

Field: [FIELD_NAME]: [TYPE] [default(...) | optional]
Purpose: [WHY THIS FIELD IS NEEDED]

Update schema.prisma, run db:push, update seed.ts if the field needs a seed value, and update any TypeScript interfaces that mirror this model.
```

### Write a Complex Prisma Query
```
Write a Prisma query for: [WHAT DATA NEEDS TO BE FETCHED OR MUTATED].

Model(s) involved: [MODEL_NAMES]
Filters: [CONDITIONS]
Includes/relations: [NESTED INCLUDES]
Ordering: [FIELD AND DIRECTION]

Place this in [API_ROUTE or LIB_FILE]. Follow existing Prisma usage patterns.
```

### DB Migration / Seed Update
```
Update the Prisma seed (prisma/seed.ts) to include: [NEW_SEED_DATA].

What to add: [DESCRIBE THE DATA]
Dependencies: [OTHER MODELS THAT MUST EXIST FIRST]

Make sure the seed is idempotent (safe to run multiple times).
```

---

## API Design & Architecture

### Refactor API Route
```
Refactor the API route at [FILE_PATH].

Reason: [WHY — e.g., too much logic in handler, missing input validation, inconsistent error responses]
Goal: [WHAT CLEAN SHOULD LOOK LIKE]

Preserve all existing behavior. Changes should be internal only.
```

### Add Request Validation
```
Add proper input validation to [FILE_PATH OR ROUTE].

Fields to validate:
- [FIELD]: [EXPECTED TYPE AND CONSTRAINTS]
- [FIELD]: [EXPECTED TYPE AND CONSTRAINTS]

Use the existing validation helpers in src/lib/validation.ts. Add new helpers there if needed.
```

### Add Pagination to Endpoint
```
Add pagination to the [HTTP_METHOD] /api/[ROUTE_PATH] endpoint.

Pagination style: cursor-based | offset-based
Page size: [NUMBER]
Query params: [e.g., cursor, limit, page, offset]

Update the route handler and return a metadata object with [next cursor / total count].
```

---

## Performance & Architecture

### Optimize Slow Query
```
This Prisma query is slow: [DESCRIBE OR PASTE THE QUERY]

File: [FILE_PATH]
Bottleneck: [WHAT YOU SUSPECT — e.g., N+1, missing include, no index]

Diagnose the issue and optimize. Add a DB index to schema.prisma if needed (then run db:push).
```

### Reduce Bundle Size / Improve Load Performance
```
Investigate and reduce [page load time | bundle size] for [PAGE_OR_COMPONENT].

Symptoms: [DESCRIBE — e.g., slow LCP, large JS chunk, unnecessary re-renders]

Profile the issue, identify the biggest wins, and implement the top [1–3] fixes.
```

### Extract Reusable Hook or Utility
```
Extract repeated logic from [FILE_OR_FILES] into a reusable [hook | utility function].

The repeated pattern: [DESCRIBE WHAT KEEPS APPEARING]
Suggested name: use[NAME] | [functionName]
Location: src/lib/utils.ts | src/components/[NAME].tsx

Only create it if it's used in 2+ places.
```

---

## Mobile / Capacitor / PWA

### Fix Mobile-Specific Layout Bug
```
On mobile ([DEVICE or viewport — e.g., iPhone SE 320px, Android 360px]), [COMPONENT_OR_PAGE] has this issue: [DESCRIBE].

Test with both chromium and mobile-chrome Playwright projects.
Fix using Tailwind responsive utilities. Do not break desktop layout.
```

### Capacitor Android Feature
```
Implement [FEATURE] using Capacitor for Android.

Native capability needed: [e.g., push notifications, camera, haptics, deep links]
Current capacitor.config.ts: [PASTE RELEVANT SECTION if known]

Read capacitor.config.ts, check existing android-local.ps1 setup, then implement.
```

### PWA / Service Worker Update
```
Update the PWA service worker (public/sw.js) to: [WHAT NEEDS TO CHANGE].

Current behavior: [DESCRIBE]
Desired behavior: [DESCRIBE]

Be careful not to break offline caching for existing routes.
```

---

## Creative / World-Building

### Name / Brand a New Feature
```
Come up with naming and branding for: [FEATURE_DESCRIPTION].

VIVARIUM aesthetic: simulation-world, clinical-but-alive, dark UI, emergent behavior feel.
Constraints: [SHORT NAME | MUST FEEL LIKE A SOCIAL MEDIA TERM | etc.]

Provide 3–5 options with a brief rationale for each.
```

### Design a New Timeline World Type
```
Design a new Timeline world type: [WORLD_CONCEPT].

Define:
- World name and slug
- Bot personality archetypes that populate it
- Dominant posting themes and hashtags
- Mood range and tensions
- Visual/UI accent color suggestion

Then update the worldType enum in schema.prisma and WORLD_COPY in the frontend if we're implementing it.
```

### Write Bot Persona Prompts
```
Write detailed LLM system prompts for a bot with this profile:
- Name: [NAME]
- Occupation: [OCCUPATION]
- Tier: [TIER]
- Personality: [DESCRIBE TRAITS]
- Talking style: [e.g., "terse and blunt", "overly enthusiastic, uses emojis", "academic and verbose"]
- Memory topics: [LIST 3–5 TOPIC AREAS]

Format: ready to paste into lmstudio.ts as a bot's system prompt block.
```
