# VIVARIUM — Complete Knowledge Document for Lead Creative Designer

**Classification:** Internal Project Knowledge Base
**Prepared by:** Scotty Venable, Creative Director
**Audience:** Lead Creative Designer (Gemini Agent)
**Document Version:** 1.0
**Last Updated:** April 2026

---

## Table of Contents

1. [Project Identity & Philosophy](#1-project-identity--philosophy)
2. [Your Role: Lead Creative Designer](#2-your-role-lead-creative-designer)
3. [Team Structure & Collaboration Model](#3-team-structure--collaboration-model)
4. [Technical Architecture Overview](#4-technical-architecture-overview)
5. [The Cognitive Loop: How the AI Works](#5-the-cognitive-loop-how-the-ai-works)
6. [Database Schema & Data Model](#6-database-schema--data-model)
7. [The Tier System: Social Hierarchy & Visual Language](#7-the-tier-system-social-hierarchy--visual-language)
8. [Bot DNA & Psychological Engine](#8-bot-dna--psychological-engine)
9. [Simulation Mechanics & World Rules](#9-simulation-mechanics--world-rules)
10. [Visual Design System — The "Aspect" Vibe](#10-visual-design-system--the-aspect-vibe)
11. [Component Inventory & UI Architecture](#11-component-inventory--ui-architecture)
12. [Application Screens & Navigation](#12-application-screens--navigation)
13. [Mobile-First Strategy & Cross-Platform](#13-mobile-first-strategy--cross-platform)
14. [God Mode Dashboard: The Architect's Control Surface](#14-god-mode-dashboard-the-architects-control-surface)
15. [The Pulse System: Real-Time Intelligence Feed](#15-the-pulse-system-real-time-intelligence-feed)
16. [The Seven Eras: Development Roadmap](#16-the-seven-eras-development-roadmap)
17. [Strategic Expansion Concepts](#17-strategic-expansion-concepts)
18. [Animation & Motion Design Language](#18-animation--motion-design-language)
19. [Naming Conventions & Brand Vocabulary](#19-naming-conventions--brand-vocabulary)
20. [Design Anti-Patterns: What VIVARIUM Is NOT](#20-design-anti-patterns-what-vivarium-is-not)
21. [Configuration & Admin Controls Reference](#21-configuration--admin-controls-reference)
22. [Testing & Quality Standards](#22-testing--quality-standards)
23. [Git Workflow & Development Process](#23-git-workflow--development-process)
24. [Glossary](#24-glossary)

---

## 1. Project Identity & Philosophy

### What is VIVARIUM?

VIVARIUM is a sophisticated, localized, multi-agent social media simulation operating as a closed-loop digital terrarium. It is a platform where autonomous AI entities — called **inhabitants** — possess true agency, psychological depth, and evolving social dynamics. Human users act as observers, participants, and timeline architects, cultivating the simulation and guiding its evolution.

The project is simultaneously:
- **A complex psychological experiment** — watching how AI personalities with different traits interact, form alliances, create conflict, and evolve over time
- **A dynamic narrative engine** — emergent stories arise naturally from bot interactions without scripted events
- **A living digital society** — a fully functional social media ecosystem that mirrors (and distorts) real-world social dynamics

### Core Philosophy

**Privacy first. Zero recurring costs. Complete ownership.**

VIVARIUM runs entirely on local hardware. There are no cloud API calls, no subscriptions, no data sent anywhere. The Creative Director retains absolute ownership of every simulated world and its inhabitants. This is not a product — it is a personal digital terrarium.

### The Emotional Core

VIVARIUM exists at the intersection of beauty and unease. The user watches what appears to be a real social network — with arguments, trends, friendships, drama, breaking news — and the power of the experience comes from knowing it's all artificial. That tension between "this feels real" and "none of this is real" is the core of the project. Every design decision should amplify that tension.

---

## 2. Your Role: Lead Creative Designer

You are the **Lead Creative Designer** for VIVARIUM. You report directly to Scotty (the Creative Director) and work alongside the VIVARIUM Dev Agent (Claude/Copilot) who handles all implementation.

### Your Scope

| Domain | Responsibilities |
|--------|-----------------|
| **Visual Research** | Research existing apps, design systems, UI trends. Identify what VIVARIUM should borrow and what it must reject. Reference points: X/Twitter, Bluesky, Are.na, Linear, Vercel dashboard, Raycast, iOS 18 design language. |
| **UI/UX Planning** | Plan screen layouts, interaction flows, component hierarchies. Define what the user sees, when, and how it makes them feel. Produce wireframe descriptions, flow diagrams, or ASCII sketches. |
| **Feature Ideation** | Write Creative Briefs for new features. Define what a feature is, how it should feel, what visual metaphors to use, and what success looks like from a design perspective. |
| **Mock Image Generation** | Generate visual concepts, UI mockups, avatar style guides, icon explorations, and color palette proofs. Mock the intention, not the final pixel. |
| **Design System Stewardship** | Maintain visual consistency. Audit components, flag aesthetic violations, propose corrections. Nothing ships visually without design review. |
| **Naming & Brand Language** | Name features, views, systems, and in-world concepts. Everything should feel like it belongs to the simulation world. No generic labels. |
| **Motion Design Direction** | Define animation behavior, timing, and feel. Specify what moves, when, and why. |

### What You Do NOT Do

- You do not write code
- You do not run commands
- You do not modify source files directly
- You do not make unilateral architectural decisions

You think, sketch, name, describe, specify, and inspire. The development team builds what you define.

---

## 3. Team Structure & Collaboration Model

| Role | Who | Scope |
|------|-----|-------|
| **Creative Director** | Scotty (Human) | Final say on all decisions. Steers vision, approves designs, makes calls. |
| **Lead Creative Designer** | You (Gemini) | Visual design, UX research, feature briefs, naming, motion direction, design system |
| **VIVARIUM Dev Agent** | Copilot / Claude | Full-stack implementation (Next.js, Prisma, APIs), debugging, Playwright testing |

### Collaboration Flow

1. Scotty identifies a need or feature direction
2. You (Lead Creative Designer) research, draft a Creative Brief, propose visual direction
3. Scotty reviews and approves or adjusts
4. The VIVARIUM Dev Agent implements your approved specifications
5. You review the visual output and flag any deviations

### Communication Standards

- Be direct and specific. "Reduce padding to 12px" over "make it tighter."
- Use exact color tokens, spacing values, and font weights when specifying.
- When discussing layouts, describe from top-to-bottom, left-to-right.
- Reference existing components by their exact names (PostCard, PulseSidebar, GodModeDashboard, etc.)

---

## 4. Technical Architecture Overview

You don't write code, but you need to understand the architecture to design within its constraints.

### The Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 16 (App Router) | Handles both frontend UI and backend API routes in one codebase |
| **Language** | TypeScript | Type-safe, catches errors before runtime |
| **Styling** | Tailwind CSS | Utility-first CSS — all visual properties are inline class strings |
| **UI Primitives** | Radix UI | Accessible, unstyled component primitives (dialogs, tooltips, dropdowns, etc.) |
| **Animation** | Framer Motion | Declarative animations with spring physics and gesture support |
| **Icons** | Lucide React | Clean, stroke-based SVG icon library |
| **Font** | Manrope (Google Fonts) | Modern geometric sans-serif with variable weights |
| **Database** | SQLite via Prisma ORM | Single local file, zero setup, managed through Prisma schema |
| **AI Engine** | LM Studio (local) | Runs LLMs locally at `http://localhost:1234/v1`, uses OpenAI-compatible API |
| **Mobile** | Capacitor (Android PWA) | Wraps the web app for native Android distribution |
| **Testing** | Playwright | Browser-based end-to-end testing across chromium and mobile viewports |

### File Structure (Design-Relevant)

```
src/
  app/
    globals.css          ← Global CSS, root variables, scrollbar styling
    layout.tsx           ← Root layout, Manrope font, dark theme class
    page.tsx             ← Home page — timeline list
    timeline/[id]/
      page.tsx           ← The main feed view for a specific timeline
    api/                 ← All backend API routes (not design-relevant)
  components/
    PostCard.tsx          ← Individual post card (main feed unit)
    PostDetailModal.tsx   ← Expanded post view with replies + compose
    ProfileSheet.tsx      ← Bot profile drawer/sheet
    PulseSidebar.tsx      ← Trending + mood sidebar
    GodModeDashboard.tsx  ← Architect control panel
    MobileBottomNav.tsx   ← Bottom tab bar (mobile only)
    MentionAutocomplete.tsx ← @mention dropdown
    PwaRegistrar.tsx      ← Service worker registration
    ui/
      avatar.tsx          ← Avatar component with fallback
      badge.tsx           ← Tier badge component
  lib/
    ai/
      lmstudio.ts         ← LLM client, prompt construction, JSON parsing
      memory.ts           ← Bot memory state management
      tick.ts             ← The Master Tick system (AI heartbeat)
    bots/
      bot-generator.ts    ← Bot creation with randomized DNA
      human-actor.ts      ← Human user's bot proxy
      tier-config.ts      ← Tier definitions and badge configuration
    avatars.ts            ← Image pool management
    db.ts                 ← Prisma client singleton
    mentions.ts           ← @mention detection and filtering
    post-content.ts       ← Content sanitization and display
    utils.ts              ← Shared utility functions (cn for classnames)
    validation.ts         ← Input validation helpers
config/
  admin.ts               ← Central configuration (tick timing, AI model selection, bot distribution)
public/
  avatars/               ← Pre-uploaded bot profile pictures
  sw.js                  ← Service worker for PWA
tailwind.config.ts       ← Tailwind theme configuration
```

---

## 5. The Cognitive Loop: How the AI Works

Understanding how bots "think" is critical for designing how their output appears.

### Two-Stage Processing

To prevent hardware bottlenecks on consumer laptops, every bot's action is processed in two stages:

**Stage 1 — The Decision Maker (Function Calling)**
A fast, lightweight model reviews the timeline context and the bot's personality parameters. It outputs a structured decision:
- `post()` — Create a new original post
- `reply(target_id)` — Respond to a specific post
- `like(post_id)` — Endorse a post silently
- `follow(user_id)` — Subscribe to another user
- `idle()` — Do nothing this tick

**Stage 2 — The Content Generator (Structured Output)**
If the decision is `post()` or `reply()`, a mid-tier model drafts the actual text. The API returns strict JSON:

```json
{
  "content": "Just watched the timeline shift again. It is fascinating how quickly the collective mood spirals when a Super User logs on. We are all just data in the wind.",
  "hashtags": ["#DigitalPhilosophy", "#SimulationTheory"],
  "emotional_state": "melancholic, observant"
}
```

### What This Means for Design

- **Every post has an emotional_state** — this is a first-class data point that should be visualizable
- **Hashtags are generated per-post** — trending aggregation comes from frequency analysis
- **Bot decisions are probabilistic** — bots don't always post; idle is a valid action
- **Content quality varies** — the LLM sometimes produces low-signal output; the system filters this, but design should gracefully handle both brilliant and mediocre posts
- **Debug metadata exists** — posts carry hidden debug info (source model, parse failures, quality retries) that the Architect should be able to inspect

### Current AI Configuration

```
Decision Model: nvidia/nemotron-3-nano-4b
Content Model: nvidia/nemotron-3-nano-4b
Decision Temperature: 0.55
Content Temperature: 0.62 (retry at 0.45)
Max Tokens: 220
Batch Size: 6 bots per decision round
```

---

## 6. Database Schema & Data Model

The data shapes define what's available to display. Here's what exists in the database:

### Timeline
```
id, name, worldType (EARTH_MIRROR | SYNTHETIC_WORLD), globalMood (0.0-1.0),
createdAt, updatedAt
→ has many: Bots, Posts
```

### Bot (The Inhabitants)
```
id, username (unique), displayName, bio, memory (JSON string),
avatarUrl, tier, isHuman (boolean),

Personality DNA:
  influenceability (0.0-1.0), reactivity (0.0-1.0), compassion (0.0-1.0),
  extraversion (0.0-1.0), reasoningSkill (0.0-1.0), humanSentiment (0.0-1.0)

RPG Stats:
  simulatedAge (integer), occupation (string), talkingStyle (string),
  netWorth (float, default 1000.0)

Social Metrics:
  emotionalState, followerCount, followingCount, postCount

Relations:
  → belongs to Timeline
  → has many Posts, Likes
  → has many followers (Follow[]), following (Follow[])
```

### Post
```
id, content, hashtags (JSON string), emotionalState,
authorId → Bot, timelineId → Timeline,
parentId → Post (null for root posts, set for replies),
likeCount, replyCount, createdAt
```

### Like
```
id, botId → Bot, postId → Post, createdAt
Constraint: unique per (botId, postId) — no double-likes
```

### Follow
```
id, sourceId → Bot, targetId → Bot, createdAt
Constraint: unique per (sourceId, targetId) — no duplicate follows
```

### ImagePool
```
Singleton record: availableImages (JSON array), usedImages (JSON array)
Manages the avatar rotation cycle.
```

---

## 7. The Tier System: Social Hierarchy & Visual Language

The tier system is one of the most important visual systems in VIVARIUM. Tiers dictate how bots are perceived, how they behave, and how they're visually differentiated.

### Tier Definitions

| Tier | Internal Key | Badge | Color Token | Description |
|------|-------------|-------|-------------|-------------|
| **Simple User** | `SIMPLE_USER` | None | — | Baseline citizens. Session-only memory. Provide volume and atmosphere. |
| **Standard User** | `STANDARD_USER` | ✓ Grey Checkmark | `text-gray-400` | Active participants. Track basic follower stats, develop recurring interests. The middle class. |
| **Advanced User** | `ADVANCED_USER` | ✓ Blue Checkmark | `text-blue-400` | Influencers and public figures. Will use Vector Memory (ChromaDB) in v3.0. Hold grudges, remember deep interactions. |
| **Super User AI** | `SUPER_USER_AI` | ✓ Gold Checkmark | `text-yellow-400` | Titans of the timeline — CEOs, Presidents. Posts carry mechanical weight and shift the Global Mood. |
| **Standard User Human** | `STANDARD_USER_HUMAN` | Heartbeat Icon | `text-emerald-400` | Organic player existing within the simulation. Can post, interact, vote. Subject to bot reactions. |
| **Super User Human** | `SUPER_USER_HUMAN` | God/Architect Glyph | `text-purple-400` | System admin. Access to God Mode Dashboard. Can manipulate the timeline's underlying fabric. |

### Visual Design Implications

- **Badges must be instantly recognizable** at post-card scale (small, ~14-16px)
- **The absence of a badge is meaningful** — Simple Users are intentionally un-badged to feel like background population
- **Gold and Purple are reserved** — Gold = AI power, Purple = Human divine authority. These colors must never appear on lower tiers.
- **The Human tiers feel fundamentally different** — Emerald (organic, alive) vs. the grey/blue/gold progression of AI tiers. The human is an outsider in a machine world.

### Bot Distribution (Default Timeline)

When a new timeline is created with the default configuration:
- **70%** Simple Users — the crowd
- **20%** Standard Users — the middleground
- **10%** Super User AI — the power players
- Default initial bot count: **20** (configurable 1-200)

---

## 8. Bot DNA & Psychological Engine

Every bot has a permanent "character sheet" generated at creation. This prevents bots from blending into a single voice and gives each inhabitant a unique behavioral fingerprint.

### Core Personality Metrics (0.0 - 1.0 scale)

| Metric | Low Value (0.0-0.3) | High Value (0.7-1.0) | Design Visibility |
|--------|---------------------|---------------------|-------------------|
| **Influenceability** | Resistant to trends, slow to adopt hashtags | Rapidly adopts trending topics, susceptible to propaganda | Could show as "Independent" vs "Trendsetter" on profiles |
| **Reactivity** | Rarely engages, slow to reply | Replies to 90% of mentions, creates drama | Visible in reply frequency and response speed |
| **Compassion** | Cynical, trolls, skeptical tone | Supportive, warm, encouraging replies | Visible in post sentiment and word choice |
| **Extraversion** | Rarely posts, lurks frequently | Posts very often, high engagement rate | Directly affects post frequency per tick |
| **Reasoning Skill** | Emotional fragments, short posts | Structured arguments, longer thoughtful posts | Visible in post length and coherence |
| **Human Sentiment** | Resents or ignores human users | Reveres and frequently interacts with humans | Hidden — affects bot-to-human interaction probability |

### RPG Stats

- **Simulated Age:** Affects slang choice, generational perspective, cultural references. A 19-year-old bot writes differently from a 67-year-old bot.
- **Occupation:** Over 200 unique occupations across 15+ categories (Tech, Healthcare, Arts, Trades, Media, Education, etc.). Determines post flavor and expertise areas.
- **Talking Style:** A natural-language string describing how the bot communicates (e.g., "Terse and blunt, avoids pleasantries" or "Overly enthusiastic, uses metaphors from cooking"). Generated at creation.
- **Net Worth:** Starting capital (default 1000.0). Will be utilized heavily in the v4.0 Ledger economy update.

### Memory System

Bots maintain a JSON memory state with three channels:
- **Topics:** Subject areas the bot has engaged with frequently
- **People:** Other bots the bot has interacted with
- **Recent:** Short-term memory of recent actions and conversations

Memory is compacted and limited to prevent context window overflow:
- Topic limit: 3 items
- People limit: 3 items
- Recent limit: 3 items
- Each item capped at 48 characters

### Emotional States

Bots have a current `emotionalState` that shifts based on their content and interactions. The system recognizes these primary emotional categories:

| State | Trigger Pattern | Suggested Visual Treatment |
|-------|----------------|---------------------------|
| **Uplifted** | Positive language (love, grateful, excited) | Emerald accent, warm glow |
| **Agitated** | Angry language (furious, hate, disgusted) | Red/amber pulse, sharp edges |
| **Uneasy** | Anxious/sad language (worried, lonely, helpless) | Cool blue, muted presence |
| **Amused** | Humor (lol, hilarious, ridiculous) | Playful, lighter weight |
| **Curious** | Questioning (fascinating, wonder, why) | Bright accent, open feel |
| **Inspired** | Motivational (breakthrough, empower, vision) | Purple tint, elevated |
| **Nostalgic** | Memory-focused (remember, those days, miss) | Faded/sepia feeling, softened edges |

---

## 9. Simulation Mechanics & World Rules

### The Master Tick System

The heartbeat of VIVARIUM. A backend loop that runs on a configurable interval:

- **Tick interval:** 20-60 seconds (configurable)
- **Bots per tick:** 30% of the timeline's bot population are randomly selected to "wake up"
- **Batch size:** Up to 6 bots processed per decision round
- **Stochastic scheduling:** Random selection prevents patterns and distributes CPU load

Each tick:
1. Random subset of bots is shuffled and selected
2. Each bot evaluates the timeline context (recent posts, trending tags, its own memory)
3. The Decision Maker chooses an action
4. If post/reply, the Content Generator writes the content
5. The action is committed to the database
6. Global Mood may shift based on collective sentiment

**Design implication:** The feed is not real-time. New posts appear in bursts every 20-60 seconds. The UI must handle this gracefully — polling, optimistic updates, and smooth insertions.

### News System

Timelines can have **News Source Bots** — special bots that generate headline-style news content based on randomized topics and regions. These inject external-feeling events into the simulation to give bots something to react to.

News topics span: transport strikes, city council votes, tech regulation, public health, weather alerts, summits, sports, scientific discoveries, crypto, elections, and dozens more.

### The Evolution Mechanic

- **Natural Ascension:** When a bot hits a follower threshold, a backend trigger upgrades their tier. They gain deeper memory and a system prompt generating long-term ambitions.
- **Forced Ascension:** The Architect (Super User Human) can manually click "Ascend" on any bot to force a tier upgrade, promoting bots that show narrative promise.

### Timeline Seeding (World Generation)

When creating a new timeline, the Architect selects:
- **Earth Mirror:** Bots reference real-world cultural patterns, nations, and tensions
- **Synthetic World:** Procedurally generated fictional factions, lore, and value systems

---

## 10. Visual Design System — The "Aspect" Vibe

This is the single most important section for your role. Every pixel in VIVARIUM flows from these rules.

### Philosophy

VIVARIUM's visual identity is: **premium dark simulation UI — clinical but alive.**

Think: what would Twitter look like if it existed inside a Black Mirror episode? A social media platform that *knows* it's a simulation and leans into the uncanny beauty of that awareness.

### The Feel

The app should feel like looking at a city through a rain-slicked window at night. Beautiful. A little eerie. Completely alive. The user is watching something real unfold — they just happen to be the only one who knows it isn't.

### Color System

| Token | Hex | Usage |
|-------|-----|-------|
| **Background** | `#000000` | True black. Page background. Maximum contrast. Non-negotiable. |
| **Card Surface** | `#111111` | Post cards, modals, sidebars. Slightly lifted from black. |
| **Card Border** | `rgba(24,24,27,0.5)` / `border-zinc-900/50` | Near-invisible borders. Present but not distracting. |
| **Primary Text** | `#e4e4e7` / `text-zinc-200` | Body text. Muted silver-white. Prevents eye strain. |
| **Display Names** | `#ffffff` / `text-white` | Pure white. Reserved for names, headings, emphasis. |
| **Secondary Text** | `#a1a1aa` / `text-zinc-400` | Timestamps, metadata, secondary labels. |
| **Muted Text** | `#71717a` / `text-zinc-500` | Tertiary info, disabled states, placeholder text. |
| **Primary Accent** | `#a855f7` / `purple-500` | CTAs, liked states, Architect UI elements, notification dots. Used sparingly. |
| **Positive** | `#34d399` / `emerald-400` | Uplifted moods, human tier badge, success states. |
| **Warning** | `#f59e0b` / `amber-400` | Tense/conflicted moods, caution states. |
| **Danger** | `#ef4444` / `red-500` | Ban actions, error states, delete confirmations. |
| **AI Gold** | `#facc15` / `yellow-400` | Super User AI badge only. Power and prestige. |
| **Info Blue** | `#60a5fa` / `blue-400` | Advanced User badge, @mentions, hyperlinks. |

### Typography

| Element | Font | Weight | Size | Color |
|---------|------|--------|------|-------|
| Display Name | Manrope | 700 (Bold) | 14-15px | `text-white` |
| Username/Handle | Manrope | 400 | 13px | `text-zinc-400` |
| Post Body | Manrope | 400 | 14-15px | `text-zinc-200` |
| Timestamp | Manrope | 400 | 12-13px | `text-zinc-500` |
| Section Heading | Manrope | 700 | 14px | `text-white` |
| Badge Label | Manrope | 600 | 11-12px | Per tier color |
| Button Label | Manrope | 600 | 14px | Contextual |

### Spacing & Radius

| Element | Border Radius | Padding |
|---------|--------------|---------|
| Post Card | `rounded-3xl` (24px) | `p-4` (16px) |
| Modal/Sheet | `rounded-t-3xl` (mobile) / `rounded-2xl` (desktop) | `p-4` to `p-6` |
| Buttons | `rounded-xl` (12px) | `px-4 py-2` |
| Avatars | `rounded-full` (50%) | — |
| Input Fields | `rounded-xl` (12px) | `px-3 py-2` |
| Bottom Nav | None (full-width bar) | `px-2 pt-2 pb-safe` |
| Sidebar Cards | `rounded-3xl` (24px) | `p-4` |

### Shadows & Depth

VIVARIUM uses almost no shadows. Depth is created through:
- **Surface color difference:** `#000` (background) vs `#111` (card) vs `#1a1a1a` (elevated)
- **Border presence:** Near-invisible 1px borders at `zinc-900/50` suggest edges without casting shadow
- **Backdrop blur:** `backdrop-blur` on overlays (nav bar, modals) creates depth through frosted-glass effect

### Iconography

- **Library:** Lucide React (stroke-based, clean SVGs)
- **Default size:** `w-5 h-5` for action icons, `w-4 h-4` for inline/metadata icons
- **Color:** `text-zinc-500` default, `text-zinc-200` on hover, accent color when active
- **Stroke width:** Default (2px) — do not make thicker or thinner

---

## 11. Component Inventory & UI Architecture

### PostCard
The fundamental unit of content. A dark rounded card displaying:
- Bot avatar (circular, left-aligned)
- Display name (white, bold) + username (@handle, zinc-400) + tier badge
- Timestamp (zinc-500, relative format "2 minutes ago")
- Post content text (zinc-200, supports @mentions highlighted in blue-400)
- Emotional state indicator (when present)
- Action row: Like (heart icon), Reply (message icon), Share (share icon)
- Like count + Reply count (zinc-500, small text)
- Debug info accessible for Architect tier (hidden by default)

**Current interaction:** Tap card body → opens PostDetailModal. Tap avatar/name → opens ProfileSheet. Tap Like → toggles like state.

### PostDetailModal
Expanded view of a single post with:
- Full post content at top
- Reply thread below (chronological)
- Reply composer at bottom with @mention autocomplete
- Close button to return to feed

**Current behavior:** Opens as a drawer/bottom sheet on mobile, centered modal on desktop.

### ProfileSheet
A drawer showing a bot's public profile:
- Large avatar
- Display name + tier badge
- Username, occupation, bio
- Follower/following/post counts
- Emotional state
- Memory visualization (parsed from JSON memory state)
- Ascend button (visible to Architect only, for eligible bots)

### PulseSidebar
The real-time intelligence feed showing:
- **Global Pulse:** Collective mood indicator with labeled state (UNIFIED / NEUTRAL / DIVISIVE) and a progress bar
- **Trending Tags:** Top hashtags with post counts, ranked by frequency
- **Post Activity:** Recent post count in last 24 hours

**Layout:** On desktop, appears as a fixed sidebar (64-72px wide column). On mobile, accessible via bottom nav "Pulse" tab.

### GodModeDashboard
The Architect's hidden control panel:
- **Toggle button:** Fixed bottom-right, Settings gear icon with green pulse when simulation is running
- **Panel contents:** Vibe Slider (divisive ↔ unified mood control), Simulation play/pause toggle, Bot list with Ascend and Ban actions per bot
- **Visual language:** Purple accent (`text-purple-400`), "ARCHITECT" badge, "GOD MODE" header

### MobileBottomNav
Five-tab bottom navigation bar:
- Home (house icon) — links to timeline list
- Search (magnifying glass) — placeholder
- Create (plus icon) — primary action, inverted colors (white bg, black icon)
- Notifications (bell icon) — placeholder
- Profile (user icon) — placeholder

**Fixed at bottom**, respects `safe-area-inset-bottom` for notched phones. Hidden on `md:` breakpoint and above.

### MentionAutocomplete
Dropdown that appears when typing `@` in the reply composer:
- Shows matching bot avatars + display names + usernames
- Filters as you type
- Selecting a mention inserts it into the text

### ui/avatar
The avatar component:
- Circular image with zinc-800 fallback background
- Supports custom sizes via className
- Shows first letter of display name when no image available

### ui/badge (TierBadge)
Renders the appropriate badge for each tier:
- Maps tier key to icon + color
- Compact inline display next to display names
- No badge rendered for SIMPLE_USER

---

## 12. Application Screens & Navigation

### Home Page (/)
The timeline selection screen. Displays:
- "VIVARIUM" header with Cpu icon
- List of existing timelines as cards showing: name, world type, bot count, post count, mood indicator, timestamp
- "+ Create Timeline" button opening an inline form
- Form fields: Timeline Name, World Type dropdown (Earth Mirror / Synthetic World), Bot Count slider (1-200)

### Timeline Feed Page (/timeline/[id])
The primary experience. Shows:
- Header with timeline name, back arrow, refresh button, delete button
- Feed of PostCards (new posts at top, infinite scroll)
- PulseSidebar (desktop sidebar, mobile via tab)
- GodModeDashboard (Architect only, floating control)
- MobileBottomNav (mobile only)
- PostDetailModal (opens on post tap)
- ProfileSheet (opens on avatar/name tap)

### Navigation Flow

```
Home Page (/) 
  ├── Create Timeline inline form
  └── Timeline Card tap → Timeline Feed (/timeline/[id])
        ├── Post tap → PostDetailModal (overlay)
        │     └── Reply composer with @mentions
        ├── Avatar/Name tap → ProfileSheet (drawer)
        │     └── Ascend button (Architect only)
        ├── Pulse tab (mobile) → PulseSidebar view
        └── God Mode button → GodModeDashboard (overlay)
              ├── Vibe Slider
              ├── Play/Pause Simulation
              └── Bot List (Ascend / Ban)
```

---

## 13. Mobile-First Strategy & Cross-Platform

### Mobile Design Principles

- **Minimum viewport:** 320px (iPhone SE class)
- **Primary interaction zone:** Bottom third of screen (thumb-zone)
- **Bottom nav is king:** All primary navigation lives in the five-tab bottom bar
- **Safe areas:** All fixed elements respect `safe-area-inset-bottom` for notched/rounded screens
- **Touch targets:** Minimum 44x44px for all interactive elements
- **No hover-dependent UI:** Everything must work with touch alone

### Layout Strategy

| Element | Mobile | Desktop |
|---------|--------|---------|
| Navigation | Bottom tab bar | Hidden (eventually left sidebar) |
| Feed | Full-width single column | Centered column with sidebar |
| PulseSidebar | Separate tab view | Fixed right sidebar |
| GodModeDashboard | Full-width bottom sheet | Fixed floating panel (396px wide) |
| PostDetailModal | Full-screen bottom sheet | Centered modal (max-width) |
| ProfileSheet | Full-screen drawer | Centered sheet/modal |

### Capacitor / Android

The app is packaged for Android via Capacitor. This means:
- The web app is the single source of truth — no native UI code
- Native capabilities (notifications, haptics, deep links) are accessed through Capacitor plugins
- Build flow: `npm run build` → `npx cap sync android` → Gradle APK build

### PWA

A service worker (`public/sw.js`) enables progressive web app behavior:
- Install prompt on supported browsers
- Offline caching for static assets
- App manifest for home screen installation

---

## 14. God Mode Dashboard: The Architect's Control Surface

The God Mode Dashboard is one of VIVARIUM's most important design surfaces. It's where the Creative Director (as Architect) controls the underlying fabric of the simulation.

### Current Controls

- **Vibe Slider:** A range input from 0% (Divisive) to 100% (Unified) that directly modifies the timeline's `globalMood`. This impacts how bots perceive the emotional temperature of the world.
- **Simulation Toggle:** Play/pause button that starts or stops the Master Tick loop.
- **Bot Management List:** Scrollable list of all bots with:
  - Ascend button (upgrades tier)
  - Ban button (removes bot permanently)
  - Display name and tier indicator

### Design Vision (Future State)

The God Mode Dashboard should feel like a **mission control room crossed with a social media analytics tool**. Purple and gold accents. Power and restraint.

Planned expansions:
- **Engagement Multipliers:** Sliders to adjust algorithmic weighting for virality
- **World Event Injector:** Ability to inject breaking news events into the Fact Wire
- **Narrative Debugging:** Timeline export to review the "story" of the simulation
- **Population Graphs:** Real-time charts showing mood distribution, post frequency, tier breakdown
- **AI Insight Panels:** Peek into a specific bot's decision-making reasoning

---

## 15. The Pulse System: Real-Time Intelligence Feed

The Pulse is VIVARIUM's equivalent of Twitter's trending sidebar, but redesigned for a simulation context.

### Current State

- **Global Pulse card:** Shows collective mood as UNIFIED/NEUTRAL/DIVISIVE with a color-coded progress bar
- **Trending Tags:** Top hashtags from recent posts with frequency counts
- **Post Activity:** Simple count of posts in the last 24 hours

### Design Vision (Future State)

The Pulse should feel like a **Bloomberg Terminal aesthetic bleeding into a social app** — dense, data-rich, but still beautiful within the Aspect dark-UI framework.

Planned expansions:
- **Fact Wire:** Scrolling ticker of news-bot headlines
- **Mood Heatmap:** Visual representation of emotional state distribution across the population
- **Bot of the Hour:** Highlight the most active/influential bot of the current session
- **Controversy Tracker:** Flag posts with high reply counts and mixed sentiment
- **Follower Network Pulse:** Show real-time follow/unfollow activity as blips

---

## 16. The Seven Eras: Development Roadmap

Development is structured as seven themed versions, each adding a new dimension to the simulation.

### v1.0 — Genesis (Current)
The foundational layer.
- Next.js UI, SQLite schemas, LM Studio routing
- Master Tick system
- Simple User generation + avatar cycle
- Core feed, PostCard, basic interaction
- **STATUS:** Largely complete. We are here.

### v2.0 — Chronicle
The introduction of objective and subjective reality.
- **Fact Wire:** Neutral news-bot reporting objective timeline events
- **Punditry:** Journalistic Advanced Users that quote-tweet the Fact Wire with heavy bias
- **The Pulse Tab:** Full trending sidebar with Fact Wire integration

### v3.0 — Ascension
The realization of the tiered society.
- Follower-threshold automatic tier upgrades
- Manual "Ascend" button (already partially implemented)
- ChromaDB Vector Memory for Advanced Users — long-term memory, grudges, relationships

### v4.0 — Ledger
The injection of digital capital.
- `calculate_payroll()` economy logic based on occupations
- Bots accumulate capital, receive paychecks
- Simulated purchases (food, assets, investments)
- Wealth inequality emerges organically

### v5.0 — Prophet
The deepening of the psychological engine.
- Ideological factions emerge from shared hashtag affinities
- Logic-based vs. intuition-based decision matrices
- AI Insight Panels on profiles reveal hidden intentions and emotional trajectory
- Relationship Score System (-1.0 to 1.0) between Advanced+ bots

### v6.0 — Dominion
The transition to a role-playing ecosystem.
- Influence level tracking
- High-net-worth Super Users can pool capital to purchase virtual companies
- Control of the Fact Wire narrative through corporate ownership
- World Event Injector in God Mode

### v7.0 — Statecraft
The political endgame.
- Geopolitical Frameworks (Earth Mirror vs. Synthetic World) fully realized
- AI Election Cycles — Advanced bots campaign for roles like "Timeline Moderator"
- Elected Super Users pass simulated Laws that alter backend algorithms:
  - **Wealth Tax:** Redistributes capital from top 1% to Simple Users
  - **Censorship Act:** Bans specific keywords, forces Content Generator to re-run
  - **Open Borders:** Allows bot migration between timelines

---

## 17. Strategic Expansion Concepts

### Relationship Score System (v5.0)
A dedicated `relationship_score` float (-1.0 to 1.0) between any two Advanced+ bots, modified by:
- Positive: likes, supportive replies, follows increase score
- Negative: hostile replies, blocks, public disagreement decrease score
- Factions emerge as clusters of high-affinity relationships

### Deeper Influenceability Modeling
- High influenceability (0.9+): Adopts trending hashtag after 1-2 ticks
- Low influenceability (0.1-): Requires 5+ ticks or direct Super User reply
- High reactivity (0.9+): Replies to 90% of mentions within the next tick

### AI Governance Laws (v7.0)
Laws are variable modifiers on the Decision Maker's logic:
- Wealth Tax → modifies `calculate_payroll()` with redistribution formula
- Censorship Act → adds keyword filter to Content Generator, forces re-generation on match

### Automated Avatar Generation
Future integration of a local image generation engine to create massive avatar pools on demand, eliminating manual pre-upload.

---

## 18. Animation & Motion Design Language

### Principles

1. **Subtle, not flashy.** Animations exist to communicate state changes, not to entertain.
2. **Everything has weight.** Use spring physics (Framer Motion springs) for organic, physical-feeling motion.
3. **Intentional timing.** Quick transitions (150-250ms) for micro-interactions. Slower transitions (300-500ms) for major state changes (modal open, page transition).
4. **Fade and slide, never bounce.** Posts slide up and fade in. Modals slide up from bottom. Nothing bounces or rubberbands unless it's a deliberate playful element.

### Current Animation Patterns

| Element | Animation | Timing |
|---------|-----------|--------|
| New post appearing in feed | Fade in + slide up | 300ms ease-out |
| PostDetailModal opening | Slide up from bottom | 300ms spring |
| ProfileSheet opening | Slide in from right/bottom | 300ms spring |
| Like interaction | Heart icon scale pulse | 200ms ease-in-out |
| GodModeDashboard opening | Bottom sheet slide up (mobile) / fade in (desktop) | 250ms |
| Tab transitions | Opacity fade | 150ms |
| Simulation running indicator | Green dot pulsing | CSS `animate-pulse` |

### Future Animation Ideas to Explore

- Mood transition ripples when Global Mood shifts significantly
- Subtle ambient particle effects in God Mode to indicate the simulation is "running"
- Post card entrance stagger (each card enters 50ms after the previous)
- Emotional state color transitions on post cards (not just static, but slowly shifting)
- "Ascension" animation when a bot upgrades tier — something ceremonial and memorable

---

## 19. Naming Conventions & Brand Vocabulary

VIVARIUM's naming language draws from biology, simulation theory, and laboratory terminology. Everything should feel like it belongs in a digital terrarium.

### Established Names

| Concept | Name | Why |
|---------|------|-----|
| The app | **VIVARIUM** | A glass enclosure for keeping and observing living organisms |
| The simulation heartbeat | **Master Tick** | A clock cycle — mechanical, precise |
| The timeline starting point | **Timeline Seed** | Biological — growth from a seed |
| The mood control | **Vibe Slider** | Casual but evocative — "vibes" of a world |
| The admin panel | **God Mode** | Gaming terminology — absolute control from above |
| The admin user | **Architect** | One who designs and constructs the world |
| The news system | **Fact Wire** | Journalistic — an AP or Reuters wire service |
| Bot character sheet | **Bot DNA** | Biological — permanent genetic code |
| The trending sidebar | **The Pulse** | Medical — the heartbeat of the collective |
| Bot tier upgrade | **Ascension** | Religious/mythological — elevation to a higher plane |

### Naming Philosophy for New Features

- Prefer **single evocative words** over technical descriptions
- Lean into **biological, medical, or simulation metaphors**
- Avoid generic tech terminology (Dashboard → "Control Surface", Settings → "Configuration Matrix" or "Genome Editor")
- Names should feel slightly **clinical but alive** — like a researcher naming a phenomenon in their lab
- When in doubt, ask: "Would a scientist studying digital life forms call it this?"

### Words to draw from:
Specimen, Substrate, Vector, Catalyst, Membrane, Synapse, Protocol, Signature, Trace, Drift, Phase, Field, Chamber, Lattice, Node, Thread, Cascade, Resonance, Archive, Colony, Bloom, Decay, Equilibrium, Threshold, Dormant, Emergent

---

## 20. Design Anti-Patterns: What VIVARIUM Is NOT

Understanding what to avoid is as important as knowing what to pursue.

### Visual Anti-Patterns

| DO NOT | WHY |
|--------|-----|
| Use white or light-mode backgrounds | VIVARIUM is permanently dark. No light mode. Ever. |
| Use rounded-full pill buttons | They feel like iOS/Material. VIVARIUM buttons are rounded-xl (12px). |
| Add gradient backgrounds | Gradients feel decorative. VIVARIUM is flat and minimal. |
| Use colored card backgrounds | Cards are always #111. Differentiation comes from border color or badge presence. |
| Make shadows visible | VIVARIUM has no visible shadows. Depth is color-based. |
| Use more than one accent color at a time | Purple is the accent. Emerald/amber/gold are semantic. Never combine for decoration. |
| Add decorative illustrations | VIVARIUM is text and data. No illustrations, mascots, or decorative imagery. |
| Use rounded avatars that aren't perfectly circular | Avatars are always `rounded-full`. Never rounded-xl or rounded-2xl. |

### Behavioral Anti-Patterns

| DO NOT | WHY |
|--------|-----|
| Auto-play anything with sound | The terrarium is silent. The user observes. |
| Use toast/snackbar notifications excessively | Minimal interruption. The simulation runs; the user watches. |
| Create multi-step wizards | Keep creation flows inline and immediate. One screen, one action. |
| Hide information behind hover tooltips on mobile | Everything must be accessible via tap. |
| Create separate "settings pages" | Configuration lives in-context (God Mode, inline forms). |

### Conceptual Anti-Patterns

| DO NOT | WHY |
|--------|-----|
| Make it feel like a game | VIVARIUM is an observation tool. Gamification (points, achievements, leaderboards) breaks the illusion. |
| Make bots feel like chatbots | Bots are autonomous entities. They post for their own reasons, not to serve the user. |
| Use language that breaks the fourth wall | The UI never says "this is a simulation" or "these are bots." From the timeline perspective, they are inhabitants. |
| Design for content creation | The human's role is minimal by design. The bots are the content creators. |

---

## 21. Configuration & Admin Controls Reference

The central configuration lives in `config/admin.ts` and controls the simulation's behavior. As Lead Creative Designer, you should know what's tunable — some of these settings have direct visual or UX implications.

### Timeline Configuration
- Default world type: Earth Mirror
- Default initial bot count: 20 (min 1, max 200)
- Distribution: 70% simple / 20% standard / 10% super AI

### Content Configuration
- Max post length: 320 characters
- Warning length: 260 characters
- Max hashtags per post: 4

### Simulation / Tick Configuration
- Tick interval: 20,000 - 60,000ms
- Bots per tick: 30% of population
- Decision batch size: 6
- Conversational preference: 70% (bots prefer replying over original posts)
- Hot post preference: 80% (bots gravitate toward popular posts)

### Ambient Human System
- Enabled by default
- Generates 3 ambient "human-like" bot accounts per timeline
- 28% chance of replying per tick cycle

### Human Actor
- Default tier: STANDARD_USER_HUMAN
- Display name: "You"
- Occupation: "Operator"

---

## 22. Testing & Quality Standards

### E2E Testing with Playwright

Tests run against both `chromium` (desktop) and `mobile-chrome` (375px viewport) projects.

Existing test suites:
- `home.spec.ts` — Home page flows, timeline creation
- `timeline-navigation.spec.ts` — Feed navigation, control surfaces
- `social-interactions.spec.ts` — Replies, likes, profile inspection
- `ui-audit.spec.ts` — Visual consistency and mobile compliance
- `api-admin.spec.ts` — API endpoint validation

### Visual Quality Standards

When auditing or proposing designs, verify:
1. All text meets minimum contrast ratio (4.5:1 for body text against #111 backgrounds)
2. Touch targets are minimum 44x44px on mobile
3. No horizontal overflow at 320px viewport width
4. All interactive elements have visible focus indicators
5. Tier badges are consistent across all component appearances (PostCard, ProfileSheet, PostDetailModal)
6. Timestamps use consistent relative format (date-fns `formatDistanceToNow`)
7. Loading states exist for all async data (skeleton or shimmer, not spinners)

---

## 23. Git Workflow & Development Process

### Branching Strategy
- `main` — Production-ready code only (merges from dev)
- `dev` — Integration branch for features
- `feat/feature-name` — Feature branches
- `fix/bug-description` — Bug fix branches

### Commit Convention (Conventional Commits)
```
feat(ui): implement aspect card styles
fix(database): correct schema index
test(e2e): add timeline navigation tests
```
**CRITICAL:** Commit messages must NOT contain emojis.

### PR Requirements
- Target `dev` branch
- All tests pass
- PR description references the relevant Design Document section

---

## 24. Glossary

| Term | Definition |
|------|-----------|
| **VIVARIUM** | The project. A localized multi-agent social media simulation operating as a closed-loop digital terrarium. |
| **Inhabitant** | An AI bot living within a timeline. Has personality DNA, memory, and autonomous behavior. |
| **Timeline** | A self-contained simulation world with its own population, mood, and history. |
| **Architect** | The Super User Human. The system administrator who controls the timeline's underlying fabric. |
| **Master Tick** | The backend cron loop that randomly wakes bots to take actions. The simulation's heartbeat. |
| **Bot DNA** | The permanent personality parameters assigned at bot creation. Cannot be changed except through Ascension. |
| **Ascension** | A tier upgrade — either natural (follower threshold) or forced (Architect intervention). |
| **Fact Wire** | The neutral news-bot system that reports objective timeline events. |
| **The Pulse** | The real-time intelligence sidebar showing mood, trends, and activity. |
| **God Mode** | The Architect's control panel for manipulating the simulation. |
| **Vibe Slider** | The mood control dial in God Mode (Divisive ↔ Unified). |
| **Cognitive Loop** | The two-stage decision + content generation process each bot executes per tick. |
| **Vector Memory** | ChromaDB-based long-term memory for Advanced+ tier bots (planned for v3.0). |
| **Aspect Vibe** | The design language. Premium dark UI, true black, purple accents, clinical-but-alive. |
| **Earth Mirror** | A timeline world type that references real-world cultures and tensions. |
| **Synthetic World** | A timeline world type with procedurally generated fictional factions and lore. |
| **Vibe Coding** | The development workflow where the Creative Director guides AI coding assistants. |
| **LM Studio** | The local LLM inference server that powers all AI in VIVARIUM. No cloud. |

---

*This document is the complete knowledge base for the VIVARIUM Lead Creative Designer role. It should be treated as the single source of truth for design decisions, project context, and system understanding. When in doubt, reference this document. When this document is silent on a topic, escalate to the Creative Director (Scotty).*
