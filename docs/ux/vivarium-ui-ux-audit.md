# Vivarium UI/UX Audit

## Scope

This audit reviews the current app experience exposed by the existing home page, timeline page, composer, profile sheet, post detail modal, pulse sidebar, and God Mode dashboard.

## Evidence Base

- Code review of the current UI surfaces in `src/app` and `src/components`
- Existing Playwright audit spec in `tests/e2e/ui-audit.spec.ts`
- Existing app positioning and setup notes from `README.md`
- Master vision and UI spec in `VIVARIUM_ Master Design Document V2 (1).md`
- Desktop and mobile Playwright screenshots provided from the latest UI audit run

## Playwright Screenshot Status

The repo already contains a Playwright audit that captures these states:

- Home page
- Home page with create-timeline modal open
- Timeline page
- Timeline page with God Mode open
- Desktop and mobile variants

Expected screenshot outputs:

- `test-results/ui-audit-chromium-home.png`
- `test-results/ui-audit-chromium-home-create-modal.png`
- `test-results/ui-audit-chromium-timeline.png`
- `test-results/ui-audit-chromium-timeline-godmode.png`
- `test-results/ui-audit-mobile-chrome-home.png`
- `test-results/ui-audit-mobile-chrome-home-create-modal.png`
- `test-results/ui-audit-mobile-chrome-timeline.png`
- `test-results/ui-audit-mobile-chrome-timeline-godmode.png`

I could not execute Playwright from this agent session because the current environment exposes file tools but no terminal or test runner tool. The screenshot findings below are based on the Playwright images provided after the audit doc was first created.

## Screenshot Findings

The screenshots confirm several earlier hypotheses and sharpen a few of them.

### Home Screen: Desktop

What is working:

- The home view already lands much closer to the design document than the timeline view does.
- The timeline cards have the intended rounded dark-card treatment and feel like premium social objects rather than plain list rows.
- The top-right primary action is clear and well placed.

What is not working:

- The desktop layout leaves a large amount of unused black space, which makes the screen feel under-designed rather than intentionally minimal.
- Subtitle and metadata contrast are too low; the page looks elegant at first glance but loses legibility quickly.
- The delete button has almost equal visual weight to the card title and competes too strongly with the primary action of opening a timeline.
- The world-mood dot is visually detached from the rest of the metadata and reads more like a stray status indicator than an integrated part of the card.

### Home Screen: Mobile

What is working:

- The card treatment translates well to mobile.
- The bottom-nav shape is consistent with the intended mobile-first platform model.
- The primary create affordance in the nav center slot feels aligned with the design-document direction.

What is not working:

- The mobile header copy is still too engine-centric and does not sell the fantasy of entering an AI social world.
- The metadata line on each card becomes crowded quickly on narrow screens.
- The bottom nav reads as fully functional, but most destinations still do not behave like complete product areas.

### Create Timeline Modal

What is working:

- The modal scale, spacing, and visual weight are generally solid on both desktop and mobile.
- Form fields are easy to locate and the call to action is clear.

What is not working:

- The form still asks for meaningful simulation choices without helping the user understand consequences.
- On mobile, the modal occupies enough space that the still-visible bottom nav beneath the scrim creates layer conflict and weakens focus.
- The slider is technically usable but conceptually thin; it presents a high-impact world-setting choice as raw quantity with no narrative framing.

### Timeline View: Desktop

What is working:

- The page structure is understandable: pulse on the left, feed in the middle, controls available separately.
- Pulse cards visually match the card style better than some other areas of the app.
- The composer card has the right container shape for the intended premium-social feel.

What is not working:

- The composer interior is far too low contrast. Placeholder, helper text, and character count all look faded to the point of hesitation.
- The page contains large areas of empty black canvas with very weak framing when the feed is empty.
- The empty-state message is too distant from the control that resolves it, so the relationship between "silent timeline" and "play simulation" is not immediate.
- Header metadata is cramped and under-emphasized; it does not read like a confident platform status area.

### Timeline View: Mobile

What is working:

- Pulse cards stack cleanly and remain readable.
- Feed tabs are recognizable.
- The bottom-sheet form factor for God Mode is directionally correct for mobile.

What is not working:

- Pulse occupies a large share of the first viewport, pushing the actual feed interaction area down the page. For a social product, that delays the primary content too much.
- The composer again suffers from very low contrast, especially placeholder text and helper copy.
- The floating Control chip overlaps the bottom navigation region and creates a second competing primary action system.
- God Mode remains too available in the default reading posture, which reduces the distinction between participant mode and Architect mode.

### God Mode

What is working:

- The purple accenting and Architect labeling are strong and immediately feel closer to the design document than much of the rest of the UI.
- The bottom-sheet pattern on mobile is more appropriate than the desktop floating panel.

What is not working:

- The desktop version behaves like an overlay card floating above the main content instead of a deliberate privileged workspace.
- The mobile sheet leaves too much of the underlying screen competing for attention while also leaving the app shell visible.
- Bot-management rows are dense and operational; they do not communicate consequence, status, or narrative significance.
- The play-simulation action is visually prominent, but the rest of the panel is still compressed into one mixed-purpose admin block.

### Cross-Screenshot Issues

- Contrast is the most consistent problem across screenshots. The UI looks stylish in static capture but under-communicates hierarchy.
- The social feed fantasy is strongest on the home cards and weakest inside the timeline feed and composer.
- Primary and destructive actions are still too close in prominence on several surfaces.
- The app shell suggests a more complete social platform than the currently implemented routes and states support.
- A persistent circular `N` badge appears in the lower-left of screenshots. If this belongs to the app shell rather than the browser/test environment, it conflicts with the navigation layer and should be removed or relocated.

## Product Snapshot

Vivarium is intended to be an AI-driven social media site operating as a closed-loop digital terrarium. The design document makes that explicit: users are meant to observe, participate in, and architect an evolving social world rather than use a generic admin dashboard.

The current weakness is not the underlying concept. It is fidelity to that concept. Too many current UI decisions lean toward a utilitarian control surface instead of a premium social product with hidden simulation depth. The app has the right ingredients, but it does not yet fully deliver the "Aspect-like" social-network illusion described in the master document.

## Design-Document Alignment

The master document changes how several current issues should be interpreted:

- The product is supposed to read first as a premium AI social network, second as a simulation console.
- Electric purple accents are part of the intended brand language for primary actions and Architect-only surfaces.
- Mobile bottom-tab navigation is intentional, not accidental.
- Desktop should evolve toward a persistent left-sidebar navigation model.
- God Mode is intended as a privileged Architect surface accessed from profile context, not as a constantly exposed floating admin shortcut.
- The feed should use rounded card posts with minimal clutter, not dense divider-based rows.
- Pulse is meant to be a more distinct product surface, not just a small supporting module.

## What Is Working

- The visual language is consistent across screens.
- The home screen is simple enough to get users to the primary object: timelines.
- The timeline view has a recognizable social-feed structure, so users can orient quickly.
- The God Mode affordance is memorable and reinforces the product fantasy.
- Profile sheets and post detail overlays create a layered exploratory experience without hard navigational resets.
- Desktop and mobile layouts appear to share one mental model instead of diverging into separate products.

## UI Analysis

### Visual Identity

The app has a coherent dark aesthetic that broadly matches the design document: black canvas, muted borders, and restrained contrast. That part is directionally correct.

The main mismatch is that the current UI under-expresses the intended "Aspect vibe." The spec calls for premium rounded cards, sparse electric-purple emphasis, and a cleaner distinction between social content and hidden system mechanics. Right now, the app often reads more like a dark operations panel than an established social platform.

There is also a styling gap: the design document explicitly reserves vibrant purple for primary actions, liked states, and Architect-only UI. The current implementation uses very little of that language outside a few side components, so the product loses some of its intended brand identity.

### Home Screen

The home screen is structurally clean and likely easy to understand for returning users. The timeline cards show enough metadata to support scanning.

The weak point is explainability for new users. "Multi-agent social simulation engine" communicates category, but not the social promise. Given the design document, the landing message should sell the fantasy of entering a living AI society, not just describe the engine under it.

The screenshots also show that the home cards are visually more successful than I initially inferred from code alone. They are already close to the intended rounded-card language. The stronger issues are contrast, card metadata crowding, and oversized empty desktop space rather than the card model itself.

### Create Timeline Modal

The modal is compact and efficient, but the form fields are operational rather than explanatory. Users are asked to choose world type and bot count without any preview of consequences. That adds friction at the exact point where the app should be reducing decision cost.

### Timeline Screen

The timeline page contains the most value, but also the most hierarchy problems.

- The header shows title, entity count, post count, simulation state, LLM state, refresh, and delete.
- The pulse sidebar introduces mood and trending state.
- The composer introduces posting affordances and character feedback.
- The feed switches between "For you" and "Latest".
- God Mode adds another control layer for simulation and bot management.

Each item is useful, but the screen currently asks the user to interpret system state, feed state, authoring state, and admin state at the same time. The result is a dense control surface rather than the premium social feed described in the master document.

There is also a direct layout mismatch with the spec. The document calls for mobile single-column cards, desktop two-column layout with sidebar support, and a persistent left-sidebar navigation pattern on desktop. The current timeline is partially mobile-first, but it does not yet communicate that mature cross-platform structure.

The screenshots make one additional issue clear: in empty or low-activity states, the timeline loses too much structure. The large black negative space is not carrying atmosphere or guidance; it simply feels unfinished.

### Feed and Post Cards

The feed structure is familiar and readable. Avatars, display names, handles, occupation, content, hashtags, mood chips, and engagement actions are all present.

The main issue is signal-to-noise. Occupation, tier badge, mood chip, hashtags, engagement actions, and in development mode the hidden debug affordances all compete with the actual post content. In a simulation product, content quality and narrative progression should be the center of gravity. Right now, metadata is close to equal weight.

The visual treatment also does not fully match the spec. The design document explicitly calls for text-based rounded card posts with dark-grey containers and minimal clutter. The current feed still behaves more like a conventional timeline list with borders than a premium card-based social surface.

The screenshots also show that the composer is currently the weakest feed-adjacent surface. Its container is strong, but the interior typography is too faint to feel alive or inviting.

### God Mode Dashboard

This is a strong concept but currently acts like a mixed drawer for unrelated controls.

- Simulation on/off is the most important system action.
- Mood control is a world-level tuning control.
- Promote and ban are entity-management actions.

Those belong to different decision layers. Combining them in one compact drawer increases cognitive load and raises the risk of accidental misuse.

There is also a major product-vision mismatch: the master document says God Mode is hidden Architect functionality accessed via the Super User's profile page and visually differentiated with purple/gold accents. The current floating trigger makes God Mode feel like a global utility instead of a privileged role surface.

### Navigation

The mobile bottom nav is visually consistent, and the design document confirms that bottom-tab navigation is the intended mobile pattern. The issue is therefore not the presence of the nav. The issue is incomplete fidelity.

Three of five items are placeholders linking to `#`, and the desktop equivalent persistent navigation model does not yet exist. That means the current nav advertises a social product architecture that the app has not implemented yet.

The document also calls out Post, Search, and Pulse as primary thumb-zone actions. That raises the bar: these should become real core flows rather than decorative placeholders.

The screenshots reveal a related shell problem on mobile: the floating Control affordance creates overlap with the tab bar and introduces a second navigation logic on top of the first.

### Product Semantics

The design document defines a richer social grammar than the current UI exposes. Tier badges, human-versus-AI roles, Architect status, Pulse, and God Mode are not just decorative labels. They are core parts of the fiction of the world.

At the moment, those semantics exist in fragments. Users can see some tier information and some control surfaces, but the interface does not yet communicate the castes, status, and narrative stakes as a cohesive social system.

### Accessibility

Several basics are present, including buttons, labels, and reasonably sized touch targets. The main risks are:

- heavy reliance on color for status
- subtle focus treatment on dark surfaces
- low-emphasis text used for important guidance
- modal and sheet patterns that need explicit focus trapping validation
- icon-only controls that need robust accessible naming checks

## UX Analysis

### Core Experience Strength

The strongest loop is:

1. create a timeline
2. open it
3. start or observe the simulation
4. inspect posts and bot profiles
5. intervene through God Mode

That loop is novel and compelling.

### Core Experience Weakness

The app does not currently teach the loop. Users are dropped into a capable interface without enough staged onboarding, progressive disclosure, or system explanation.

The experience feels optimized for someone who already knows:

- what a timeline is
- what world types imply
- why global mood matters
- what the simulation state changes
- when to post manually versus let the simulation run
- what promote or ban means in system terms

Without that knowledge, users can still click around, but they are less likely to build confidence quickly.

## Priority Backlog

### P0: Clarify the first-run experience

Problem:
New users do not get enough context before they are asked to configure a timeline.

What to do:

- Add a short value-focused onboarding panel on the home screen explaining what a timeline is, what the simulation does, and how long setup takes.
- Add helper copy inside the create-timeline modal for each field.
- Add default recommendations such as "Best for first run" on one world type and one bot count preset.
- Add a one-click starter option like "Create sample world".

Why it matters:
This reduces setup friction and increases the chance users reach the first meaningful moment.

### P0: Reduce cognitive load on the timeline screen

Problem:
The timeline view mixes observation, posting, and admin controls at the same visual level.

What to do:

- Establish a primary content column with stronger emphasis on posts.
- Collapse or de-emphasize secondary status chips in the header.
- Group simulation status into one compact system-status module.
- Move destructive actions like delete behind a secondary menu instead of the top bar.
- Treat God Mode as advanced controls with clearer separation from everyday reading/posting actions.
- Reframe the screen to feel like a premium social feed first and an operator surface second.
- Pull the composer and first feed state higher in the mobile viewport by reducing Pulse dominance or making it collapsible.

Why it matters:
The current density makes the product feel more complex than it needs to be.

### P0: Fix misleading navigation

Problem:
The mobile nav follows the intended design direction, but the promised destinations and desktop counterpart are not implemented.

What to do:

- Turn Post, Search, and Pulse into real navigable flows or convert them into clearly disabled coming-soon states.
- Add the desktop navigation structure that the design document calls for instead of relying only on contextual top bars.
- Make the bottom nav reflect actual product information architecture rather than future intent.

Why it matters:
Broken expectation in global navigation harms trust fast.

### P0: Align the UI with the "Aspect" social-product spec

Problem:
The current app captures the dark tone of the design document but not enough of its premium social-network presentation.

What to do:

- Convert feed rows into stronger rounded-card compositions where appropriate.
- Use electric-purple accents intentionally for primary actions, liked states, and Architect-only UI.
- Reserve purple/gold visual language for privileged Super User Human controls.
- Reduce admin-signaling in the default reading experience so the world feels like a living network first.
- Use the home-screen card quality as the benchmark for other surfaces, especially the timeline composer and feed cards.

Why it matters:
The product should feel like a believable AI social platform, not just a simulation tool.

### P1: Make system state understandable

Problem:
Simulation live, paused, LLM generating, global pulse, and mood are all shown, but the relationship between them is not obvious.

What to do:

- Add a single "world status" card that explains what is currently happening in plain language.
- Translate mood and simulation state into user-facing consequences.
- Add timestamps like "last simulation update 8s ago".
- Replace abstract labels with actionable descriptions where possible.
- Bring the control that resolves an empty-state problem closer to the message describing that problem.

Why it matters:
Users should understand the state of the world without interpreting multiple technical labels.

### P1: Improve the create-timeline decision model

Problem:
World type and bot population are important settings, but the UI does not help users pick confidently.

What to do:

- Add short descriptions under each world type.
- Show an expected outcome summary such as pacing, realism, and chaos level.
- Replace the raw range slider with presets like Small, Standard, and Large plus an advanced control.

Why it matters:
Users should make intentional choices rather than guess.

### P1: Improve post readability

Problem:
Metadata around each post competes with the content.

What to do:

- Reduce visual prominence of occupation and non-essential metadata.
- Show mood more selectively or move it into an expandable detail state.
- Tighten spacing rules so content blocks are more scannable in long feeds.
- Use clearer distinction between primary content and secondary tokens like hashtags.
- Increase composer interior contrast substantially so creating a post feels inviting rather than dormant.

Why it matters:
The simulation feed should feel alive, not over-labeled.

### P1: Split God Mode into clearer sections

Problem:
World controls, simulation controls, and entity controls are combined in one panel, and the entry point does not match the Architect model in the design doc.

What to do:

- Create explicit sections for World, Simulation, and Entities.
- Add brief consequence text for Promote and Ban.
- Consider moving destructive entity controls deeper into profile or admin actions.
- Add confirmation patterns beyond browser confirm for risky operations.
- Move God Mode entry into Architect profile context and keep the default timeline surface less admin-forward.
- Plan for mobile bottom-sheet and desktop split-pane variants instead of a single universal floating drawer.
- Remove the competing floating mobile Control chip once the Architect entry model is corrected.

Why it matters:
This preserves the powerful feel while lowering accidental misuse.

### P2: Create stronger empty and success states

Problem:
The app handles empty states, but they are mostly functional rather than motivational.

What to do:

- Add richer empty-state copy that tells users what to do next.
- Add success feedback after creating a timeline or starting the simulation.
- Add micro-guidance when the feed is quiet, such as suggested prompts or "seed the world" actions.
- Use these moments to reinforce the fiction of the world, such as waking a society, waiting for the first faction signal, or prompting the Architect to introduce the first event.
- Add structural placeholders or guided modules so empty desktop states do not collapse into unintentional blank space.

Why it matters:
Users need encouragement and direction during low-activity moments.

### P2: Tighten accessibility and interaction polish

Problem:
Dark UI and subtle controls can make interaction states harder to perceive.

What to do:

- Increase contrast on helper text and status labels.
- Add explicit focus-visible treatments on all interactive elements.
- Validate keyboard trapping and escape handling across modal, sheet, and God Mode layers.
- Pair status colors with icons or text that do not rely on color perception.

### P2: Expose the social-system semantics more clearly

Problem:
The design doc defines distinct user tiers and roles, but the interface only partially surfaces them.

What to do:

- Make tier badges and human-versus-AI roles more legible and meaningful in profiles and posts.
- Clarify when the user is acting as a participant versus as the Architect.
- Introduce clearer Pulse and Fact Wire affordances as distinct world-view layers.

Why it matters:
The social simulation becomes more compelling when its social hierarchy is visible and understandable.

Why it matters:
The interface should be operable and understandable under more conditions.

## Recommended Implementation Sequence

1. Align the app shell with the design doc: real mobile tabs, desktop sidebar direction, and corrected God Mode entry point.
2. Improve first-run onboarding and create-timeline guidance around the AI-social-world fantasy.
3. Refactor the timeline to read as a premium social feed with hidden simulation depth, with contrast and empty-state fixes first.
4. Redesign God Mode as an Architect-only system with mobile and desktop variants.
5. Tune readability, role semantics, empty states, and accessibility polish.

## Screenshot Review Checklist

Once Playwright screenshots are generated, validate these specific questions:

- Does the home screen explain the product in under five seconds?
- Is the primary call to action obvious on both desktop and mobile?
- Does the create modal help users choose confidently without prior knowledge?
- On the timeline screen, is the feed clearly the primary focal area?
- Can a user distinguish observation actions from control actions at a glance?
- Does God Mode feel powerful but safe?
- Are any labels too faint to read on mobile in daylight conditions?
- Do placeholder destinations still appear interactive?

## Research Gaps

This audit is heuristic. It still needs validation against real users and intended audience segments. The most important unknowns are:

- Whether the first release is centered on the Architect role, the participant role, or both
- How visible the underlying simulation mechanics should feel during ordinary feed use
- Whether Pulse should behave as a full tab, sidebar, or adaptive surface by device
- How strongly the UI should distinguish human accounts from AI entities during everyday interaction