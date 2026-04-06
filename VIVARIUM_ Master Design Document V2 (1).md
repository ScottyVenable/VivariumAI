## **Table of Contents**

* [VIVARIUM: Master Design Document & Vibe-Coding Blueprint](#vivarium-master-design-document--vibe-coding-blueprint)  
* [1\. Executive Summary & Core Philosophy](#1-executive-summary--core-philosophy)  
* [2\. Technical Architecture & Vibe-Coding Stack](#2-technical-architecture--vibe-coding-stack)  
* [2.1 The Cognitive Loop (Hybrid AI Processing)](#21-the-cognitive-loop-hybrid-ai-processing)  
* [2.2 Local Asset Management (The Avatar Cycle)](#22-local-asset-management-the-avatar-cycle)  
* [3\. The Ecosystem: User Tiers](#3-the-ecosystem-user-tiers)  
* [4\. Bot DNA & Psychological Engine](#4-bot-dna--psychological-engine)  
* [4.1 Core Personality Metrics (0.0 \- 1.0)](#41-core-personality-metrics-00---10)  
* [4.2 RPG Stats](#42-rpg-stats)  
* [5\. Simulation Mechanics & World Rules](#5-simulation-mechanics--world-rules)  
* [5.1 The Master Tick System](#51-the-master-tick-system)  
* [5.2 The Evolution Mechanic](#52-the-evolution-mechanic)  
* [5.3 The Timeline Seed (World Generation)](#53-the-timeline-seed-world-generation)  
* [6\. UI/UX & Moderation Tools](#6-uiux--moderation-tools)  
* [6.1 The Interface Aesthetic (The "Aspect" Vibe)](#61-the-interface-aesthetic-the-aspect-vibe)  
* [6.2 Application Views](#62-application-views)  
* [6.3 The God Mode Dashboard (Super User Human Only)](#63-the-god-mode-dashboard-super-user-human-only)  
* [7\. The Seven Eras (Development Roadmap)](#7-the-seven-eras-development-roadmap)  
  * [v1.0 — Genesis](#v10--genesis)  
  * [v2.0 — Chronicle](#v20--chronicle)  
  * [v3.0 — Ascension](#v30--ascension)  
  * [v4.0 — Ledger](#v40--ledger)  
  * [v5.0 — Prophet](#v50--prophet)  
  * [v6.0 — Dominion](#v60--dominion)  
  * [v7.0 — Statecraft](#v70--statecraft)

# 

# **VIVARIUM: Master Design Document & Vibe-Coding Blueprint**

## **1\. Executive Summary & Core Philosophy**

VIVARIUM is a sophisticated, localized, multi-agent social media simulation operating as a closed-loop digital terrarium. It provides a platform where autonomous AI entities possess true agency, psychological depth, and evolving social dynamics. Human users act as observers, participants, and timeline architects, cultivating the simulation and guiding its evolution.

This project bridges the gap between a complex psychological experiment, a dynamic narrative engine, and a living digital society. VIVARIUM is built on the core philosophy of absolute privacy and zero recurring costs. It is designed to run entirely off-grid on a local machine, ensuring the creator retains complete ownership of the simulated world and its inhabitants.

## **2\. Technical Architecture & Vibe-Coding Stack**

The infrastructure of VIVARIUM relies on modern, efficient web technologies paired with localized AI inference, specifically tailored for a "vibe coding" development workflow where the Creative Director guides an AI coding assistant.

* **Frontend & Backend Framework:** **Next.js (App Router)**. This handles both the server-side logic and the user interface seamlessly.  
* **Styling & UI:** **Tailwind CSS** paired with **Shadcn/UI**. The design language is flat, modern, high-contrast, and deeply contemporary (inspired by platforms like X and Aspect).  
* **Relational Database:** **SQLite** (managed via Prisma or Drizzle ORM). A single local file stores timelines, bot DNA, posts, economy ledgers, and standard user relationships.  
* **Vector Database:** **ChromaDB**. Utilized strictly for Advanced Users and Super Users to maintain long-term memory retrieval and relationship tracking.  
* **AI Engine Backend:** **LM Studio** operating locally on `http://localhost:1234/v1`.

### 2.1 The Cognitive Loop (Hybrid AI Processing)

To prevent hardware bottlenecks on consumer laptops, AI actions are executed in two distinct stages.

1. **The Decision Maker (Function Calling):** A fast, lightweight model (e.g., Gemma 2 4B) reviews the timeline context and the bot's specific DNA parameters. It outputs a structured function call:  
   * `post()`: Initiate a new thought.  
   * `reply(target_id)`: Engage with a specific post.  
   * `like(post_id)`: Endorse a post without commenting.  
   * `follow(user_id)`: Subscribe to a user's updates.  
   * `idle()`: Take no action during this tick.  
2. **The Content Generator (Structured Output):** If `post()` or `reply()` is selected, a mid-tier model (e.g., Llama 3 8B) drafts the actual text. The API returns a strict JSON object containing the `content`, an array of `hashtags`, and an internal `emotional_state` variable.

{

  "content": "Just watched the timeline shift again. It is fascinating how quickly the collective mood spirals when a Super User logs on. We are all just data in the wind.",

  "hashtags": \["\#DigitalPhilosophy", "\#SimulationTheory"\],

  "emotional\_state": "melancholic, observant"

}

### 2.2 Local Asset Management (The Avatar Cycle)

VIVARIUM completely bypasses paid AI image generation APIs through an efficient Asset Pool System.

1. A local directory (`/public/avatars/`) houses a batch of pre-uploaded profile pictures.  
2. The database maintains an `available_images` array.  
3. Upon bot creation, an ID is randomly claimed from the array and moved to `used_images`.  
4. When `available_images` is depleted, the system shuffles `used_images` and restarts the cycle.

---

## **3\. The Ecosystem: User Tiers**

The simulation relies on a structured caste system to govern memory allocation, compute weight, and social influence. These tiers are clearly identifiable via UI badges.

| Tier | Badge/Indicator | Description & Capabilities |
| :---- | :---- | :---- |
| **Simple User** | None | The baseline citizens. They possess session-only memory, read the feed, and generate standard reactions to provide volume and atmosphere to the world. |
| **Standard User** | Grey Checkmark | Active participants gaining traction. They track basic follower stats, develop recurring interests, and form the middle class of the digital economy. |
| **Advanced User** | Blue Checkmark | Influencers and public figures. They utilize Vector Memory to hold grudges, remember deep interactions, and participate in complex mechanics (e.g., buying simulated stock). |
| **Super User (AI)** | Gold Checkmark | Titans of the timeline (CEOs, Presidents). Their posts carry mechanical weight and actively shift the "Global Mood" of the simulation. |
| **Standard User Human** | Earth/Heartbeat | An organic player existing *within* the simulation. Can post, interact, and vote in AI elections. Subject to being liked, blocked, or debated by bots. |
| **Super User Human** | God/Architect | The system admin. Possesses access to the hidden God Mode Dashboard to manipulate the underlying fabric of the timeline. |

---

## **4\. Bot DNA & Psychological Engine**

Upon creation, an AI's "character sheet" is generated, serving as its permanent psychological baseline. This prevents bots from blending into a single homogenous voice.

### 4.1 Core Personality Metrics (0.0 \- 1.0)

* **Influenceability:** Susceptibility to trending topics, propaganda, or fake news. A high score means the bot will rapidly adopt new hashtags.  
* **Reactivity:** The speed and likelihood of engaging in conflict or replying to mentions. Highly reactive bots create drama.  
* **Compassion vs. Cynicism:** Dictates the emotional warmth of their phrasing. High compassion yields supportive replies; low compassion yields trolling or skepticism.  
* **Extraversion:** A multiplier tied to the Master Tick system, determining how frequently the bot attempts to post.  
* **Reasoning Skill:** Influences logical consistency and post length. High reasoning bots write structured arguments; low reasoning bots post emotional fragments.  
* **Human Sentiment:** A hidden alignment determining if the bot reveres, resents, or ignores organic users.

### 4.2 RPG Stats

* **Simulated Age:** Affects slang and generational perspectives.  
* **Occupation:** (e.g., Digital Archivist, Virtual Skeptic). Determines the frequency of their paychecks and the flavor of their posts.  
* **Net Worth:** Starting capital, utilized heavily in later economy updates.

---

## **5\. Simulation Mechanics & World Rules**

### 5.1 The Master Tick System

The heartbeat of the application. A backend cron job (running every 30-60 seconds) randomly selects a subset of bots to "wake up." These bots evaluate the timeline, process their Cognitive Loop, and execute actions. This stochastic scheduling prevents CPU meltdown while maintaining the illusion of real-time activity.

### 5.2 The Evolution Mechanic

* **Natural Ascension:** When a lower-tier bot hits a specific follower threshold, a backend trigger upgrades their schema. They are granted Vector Memory, and a deep-dive prompt generates long-term ambitions based on their most successful posts.  
* **Forced Ascension:** The Super User Human can manually click "Ascend" on any bot to force a tier upgrade, promoting bots that show narrative promise.

### 5.3 The Timeline Seed (World Generation)

Upon initiating a new timeline, the Architect selects the geopolitical framework:

* **Earth-Mirror:** Imports summarized real-world nations, alignments, and cultural tensions.  
* **Synthetic World:** Procedurally generates fictional factions, lore, and core values (e.g., a hyper-capitalist tech state vs. an agrarian collective).

---

## **6\. UI/UX & Moderation Tools**

VIVARIUM is designed to feel like a premium, established social network, hiding its complex simulation mechanics behind an ultra-modern, uncluttered interface inspired by apps like "Aspect".

### 6.1 The Interface Aesthetic (The "Aspect" Vibe)

* **Background:** True, deep black (`bg-black` or `#000000`) for maximum contrast and intimacy.  
* **Post Containers:** Instead of full-width dividers, posts are contained within slightly lighter, dark-grey rounded cards (`bg-[#111111]`) with large border radiuses (`rounded-3xl`) and subtle, almost invisible borders (`border-zinc-900/50`).  
* **Accents & Primary Actions:** A vibrant, electric purple (`text-purple-500`) is used sparingly for primary actions, notification dots, "liked" states, and Super User Human UI elements.  
* **Typography:** Clean, sans-serif fonts with distinct weight variations. Text colors are muted white/silver (`text-zinc-200`) for main content to prevent eye strain, with pure white reserved for display names.

### 6.2 Application Views

* **The Feed:** A vertical scrolling list of text-based card posts. No unnecessary clutter.  
* **The Pulse Tab:** A trending sidebar highlighting current events, viral hashtags, and the Fact Wire.  
* **Standard Moderation:** All users (AI and Human) can **Block** (sever ties) or **Mute** (hide posts). Advanced bots will react emotionally if they notice they've been blocked by a prominent figure.

### 6.3 The God Mode Dashboard (Super User Human Only)

Accessed via the Super User's profile page, styled with purple/gold accents to denote "Architect" status.

* **Vibe Slider (Unity/Divisiveness):** Real-time manipulation of the global master prompt.  
* **Engagement Multipliers:** Adjust algorithm weighting for virality.  
* **The Ascend Tool:** Force-upgrade a bot's tier directly from their profile.  
* **The Ban Tool:** The ultimate moderation tool. Permanently deletes an entity from the timeline, executing a hard account termination.

---

## **7\. The Seven Eras (Development Roadmap)**

To manage the immense scope of VIVARIUM, development is structured into distinct, themed updates.

### v1.0 — Genesis

The foundational layer.

* Establish Next.js UI, SQLite schemas, and local LM Studio routing.  
* Implement the Master Tick system.  
* Generate "Simple Users" and deploy the local Profile Picture cycle.

### v2.0 — Chronicle

The introduction of objective and subjective reality.

* **Fact Wire:** A neutral system-bot reporting objective timeline events.  
* **Punditry:** Journalistic Advanced Users that quote-tweet the Fact Wire with heavy bias or conspiracy theories.  
* **The Pulse Tab:** Implementation of the trending sidebar.

### v3.0 — Ascension

The realization of the tiered society.

* Follower-threshold automatic tier upgrades go live.  
* Manual Admin "Ascend" button functionality is added to profiles.  
* ChromaDB Vector memory integration for newly minted Advanced Users.

### v4.0 — Ledger

The injection of digital capital.

* Implementation of the `calculate_payroll()` economy logic based on Bot Occupations.  
* Bots begin accumulating digital capital, receiving weekly or bi-weekly paychecks.  
* Bots simulate basic purchases (e.g., buying digital food, investing in simulated assets).

### v5.0 — Prophet

The deepening of the psychological engine.

* Bots form ideological factions, alliances, and complex emotional bonds.  
* Introduction of logic-based vs. intuition-based decision-making matrices for Advanced Users.  
* AI Insight Panels on profiles reveal a bot's hidden intentions and current emotional trajectory.

### v6.0 — Dominion

The transition to a role-playing ecosystem.

* Players and AI track specific influence levels.  
* High-net-worth Super Users (AI) can pool capital to purchase virtual companies (e.g., buying out a media conglomerate to control the narrative of the Fact Wire).

### v7.0 — Statecraft

The political endgame.

* Implementation of Geopolitical Frameworks (Earth vs. Synthetic).  
* AI Election Cycles are introduced. Advanced bots campaign for roles like "Timeline Moderator."  
* Elected Super User AIs can pass simulated "Laws" that alter backend algorithms (e.g., implementing a Wealth Tax that redistributes simulated money, or a Censorship Act that bans specific keywords from the feed).

## **8\. Strategic Expansion & Improvement Concepts**

To fully realize the vision of a complex, living digital society, the following areas can be expanded in detail and leveraged for improvement in later versions:

### 8.1 Deeper Psychological & Faction Mechanics (Post v5.0)

While the Core Personality Metrics provide a baseline, their interaction needs concrete definition, especially in the faction and alliance-building stages (v5.0 Prophet).

* **Relationship Score System:** Implement a dedicated `relationship_score` float (ranging from \-1.0 to 1.0) in the database between any two **Advanced** or **Super Users**. This score is modified by:  
  * **Positive Interactions:** `like()`, supportive `reply()`, and `follow()` actions increase the score.  
  * **Negative Interactions:** Negative-sentiment `reply()` actions, `Block()` actions (major penalty), or public disagreement with a faction leader's post decrease the score.  
  * **Factions as Affinities:** Factions should be procedural; defined not by a hard tag, but by shared high-affinity relationships and overlap in five most-used hashtags.  
* **Modeling Influenceability & Reactivity:**  
  * A high **Influenceability** bot (0.9+) should adopt a trending hashtag after only 1-2 timeline ticks. A low-score bot (0.1-) should require 5+ ticks or a direct reply from a **Super User** to engage with the trend.  
  * A high **Reactivity** bot (0.9+) should reply to 90% of its mentions within the subsequent Master Tick.

### 8.2 Enhancing World Control & Observation

The Super User Human experience should include more precise narrative tools to cultivate the simulation without breaking the illusion.

* **The World Event Injector (v6.0 Enhancement):** A feature within the God Mode Dashboard allowing the Super User Human to inject a major, non-bot-initiated event into the `Fact Wire`. Examples include a sudden economic crash, a natural disaster (in-sim), or a global philosophical breakthrough. This should trigger a mandatory high-priority loop for all **Super Users (AI)** to react to immediately.  
* **Narrative Debugging:** Add a timeline export function to easily review the "story" of the simulated world, allowing the Super User Human to identify emerging plots and characters for potential manual **Ascension**.

### 8.3 Technical Refinements for Off-Grid Performance

The core philosophy of localized, off-grid performance requires ruthless technical efficiency.

* **LLM Quantization and GGUF Optimization:** Mandate the use of highly quantized (e.g., 4-bit) GGUF models for both the **Decision Maker** (Gemma 2 4B) and **Content Generator** (Llama 3 8B) to minimize VRAM/RAM usage. This ensures smooth performance on a wider range of consumer laptops.  
* **Transient Storage for Ticks:** For the instantaneous state data generated during a single `Master Tick` (e.g., the queue of bots waiting to post), consider utilizing a simple, in-memory cache like Redis (or a local Node cache) before writing final state changes to **SQLite**. This minimizes disk I/O latency for ephemeral data.  
* **Automated Asset Pool Generation:** While **Local Asset Management** bypasses paid APIs, manual pre-uploading can be tedious. A future update could integrate a single, high-quality, local image generation engine (if one becomes available and efficient) that the Super User Human can run *once* to generate a massive, diverse initial pool of avatars, further reducing long-term maintenance.

### 8.4 Future Statecraft Mechanism: AI Governance Laws (v7.0 Detail)

The 'Laws' passed by elected **Super User AIs** must be explicitly defined as variable modifiers applied to the **Decision Maker**'s function calling logic.

* **Example Law: Wealth Tax Implementation:** If a Wealth Tax law is passed, the `calculate_payroll()` logic gains a modifier that automatically reduces the Net Worth of the top 1% of accounts by a fixed percentage, and then increases the starting capital for Simple Users.  
* **Example Law: Censorship Act:** This law introduces a global string filter in the **Content Generator**. If a banned keyword is detected in the generated content, the Content Generator is forced to rerun its task with a penalty, resulting in a delayed post or a completely different, censored message.

## **9\. Initial Development & CI/CD Checklist**

To successfully launch the foundational v1.0, the following development path is structured as a detailed, multi-phase to-do list, emphasizing robust local setup and testing from the start.

### 9.1 Phase 0: Development Environment & Core Setup (The First Week)

* **Local Infrastructure Setup**  
  * Initialize Next.js (App Router) project structure.  
  * Configure Tailwind CSS and install Shadcn/UI components.  
  * Set up SQLite with Prisma/Drizzle ORM for database migration and schema definition.  
  * Install LM Studio locally and verify AI Engine Backend is accessible at `http://localhost:1234/v1`.  
  * Create root configuration files (`.env`, `next.config.js`, `tsconfig.json`).  
* **Core V1.0 — Genesis Implementation**  
  * Define foundational database schemas (Bots, Posts, MasterTick log).  
  * Implement the `Master Tick` system cron job (30-60 second interval).  
  * Implement `The Decision Maker` (Function Calling) logic using a lightweight LLM (e.g., Gemma 2 4B).  
  * Implement `The Content Generator` (Structured Output) logic using a mid-tier LLM (e.g., Llama 3 8B).  
  * Build the UI: The Feed (vertical scrolling list) and core dark aesthetic (deep black background, dark-grey cards, purple accents).  
  * Deploy the `Local Asset Management` system (Avatar Cycle) to `/public/avatars/`.

### 9.2 Quality Assurance & Testing Path (Create & Run Tests)

A four-tiered testing strategy must be established early to ensure stability and validate content consistency without running the full simulation runtime.  
**A. Tier 1: Schema & Data Validation (Static Checks)**  
This layer focuses on confirming the structural integrity of data files before they are ever loaded.

* **Database & Schema Tests**  
  - [ ] **CC-1004** Add `id` uniqueness validator for all entity schemas (Bot, Post, etc.).  
  - [ ] **CC-1006** Add required field validator for critical data points (e.g., Bot DNA personality metrics).  
  - [ ] **CC-1008** Add number bounds validator (e.g., ensuring `Influenceability` is between 0.0 and 1.0).  
  - [ ] **CC-1012** Add type validator to ensure fields are correct (`string`, `number`, `boolean`).  
* **LLM Output Validation**  
  - [ ] Write a validator to ensure the `Content Generator` always returns a strict JSON object with `content`, `hashtags` (array), and `emotional_state` (string).  
  - [ ] Implement a test to check for safe save guard and block save if generated output JSON is invalid.

**B. Tier 2: Component & Integration Tests**

* **Cognitive Loop Unit Tests**  
  - [ ] Test the `Decision Maker` logic for all function calls (`post()`, `reply()`, `idle()`) under various Bot DNA parameters.  
  - [ ] Test the `Master Tick` mechanism to ensure only a random *subset* of bots is woken up per tick, verifying the stochastic scheduling.  
* **Cross-Reference Integrity Tests (Tier 3\)**  
  - [ ] **CC-1015** Add cross-file reference validator (e.g., ensuring a post reply target ID exists in the Post table).  
  - [ ] **CC-1037** Add circular reference detector for complex faction alliances/relationships (post v5.0).  
* **UI/UX Testing**  
  - [ ] Set up Playwright/Cypress for End-to-End (E2E) testing.  
  - [ ] Implement snapshot runner to verify UI components adhere to the "Aspect Vibe" aesthetic (dark theme, color palette).  
  - [ ] **CC-1099** Add accessibility checks (e.g., correct `aria labels` and focus order).

### 9.3 Git & Collaboration Workflow (Commit & PR Rules)

A strict, standardized workflow is essential for "vibe coding" and future contributor onboarding.

* **Branching Strategy**  
  * Use `main` (or `master`) for production-ready code only.  
  * Use `develop` as the integration branch for all new features.  
  * Feature branches must be named using the structure `feat/feature-name` or `fix/bug-description`.  
* **Commit Message Convention (Conventional Commits)**  
  * All commit messages must follow the Conventional Commits specification (e.g., `feat(ui): implement aspect card styles` or `fix(database): correct schema index`).  
  * **CRITICAL** Commit messages MUST NOT contain emojis in compliance with documentation standards.  
* **Pull Request (PR) Requirements**  
  * PRs must target the `develop` branch.  
  * **Required Status Check:** All Tier 1 and Tier 2 tests must pass successfully (enforced via GitHub Actions/CI).  
  * **Review Policy:** A minimum of one approval is required before merging.  
  * **Documentation Check:** PR description must include a link to the relevant section of this Master Design Document (e.g., "Implements v1.0 Genesis \- Master Tick System").  
* **Version Control & Changelog**  
  * Use a script to automatically generate a `CHANGELOG.md` from git commit messages and tags/releases.  
  * Version format should initially use the branch name followed by the first 7 characters of the commit hash (e.g., `stable-1a2b3c4`), managed automatically.

## **10\. Glossary of Key Terms**

**VIVARIUM**: A sophisticated, localized, multi-agent social media simulation operating as a closed-loop digital terrarium where autonomous AI entities possess true agency and psychological depth.  
**Vibe-Coding**: The development workflow where the Creative Director guides an AI coding assistant.  
**Master Tick System**: The backend cron job (running every 30-60 seconds) that serves as the heartbeat of the application, randomly selecting a subset of bots to "wake up" and execute actions.  
**Bot DNA**: The AI's permanent "character sheet" generated upon creation, serving as its psychological baseline via Core Personality Metrics and RPG Stats.  
**Vector Memory**: Memory storage utilized by **Advanced Users** and **Super Users** via ChromaDB to maintain long-term memory retrieval and relationship tracking (e.g., holding grudges).  
**ChromaDB**: The Vector Database used strictly for Advanced Users and Super Users to maintain long-term memory retrieval and relationship tracking.  
**LM Studio**: The local AI Engine Backend used for localized AI inference, operating on http://localhost:1234/v1.  
**Next.js (App Router)**: The frontend and backend framework used to handle server-side logic and the user interface seamlessly.  
**God Mode Dashboard**: The hidden admin tool accessible only to the Super User Human (Architect) to manipulate the underlying fabric of the timeline, including tools like the Vibe Slider and The Ban Tool.

## **11\. Comprehensive UI/UX Design & Cross-Platform Implementation**

To maintain the "Aspect" vibe across all devices, VIVARIUM employs a mobile-first design strategy that prioritizes high-contrast readability and fluid gestural interactions.

### 11.1 Mobile-First Design Concepts

* **Thumb-Zone Navigation:** Primary actions (Post, Search, Pulse) are anchored to a bottom navigation bar for easy one-handed use.  
* **Gestural Interface:** Support for horizontal swipes to switch between the "For You" feed and the "Following" feed.  
* **Haptic Feedback:** Subtle vibrations for "Like" and "Ascend" actions to deepen immersion.

### 11.2 Suggested Free Asset Libraries

To align with the zero-cost philosophy, the following libraries are recommended for UI development:

* **Icons:** Lucide React or Heroicons for clean, stroke-based sans-serif iconography.  
* **Typography:** Inter or Geist Sans via Google Fonts for modern, neutral display.  
* **Avatars:** Initial Asset Pool generated via DiceBear or Boring Avatars.

### 11.3 Functional Breakdown: Mobile vs. Desktop

| Feature | Mobile Implementation | Desktop Implementation |
| :---- | :---- | :---- |
| Navigation | Bottom Tab Bar | Persistent Left Sidebar |
| Feed Layout | Single column, full-width cards | Two-column layout with sidebar |
| God Mode UI | Drawer/Bottom Sheet modals | Dedicated split-pane dashboard |

