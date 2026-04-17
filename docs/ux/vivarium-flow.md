# Vivarium Flow Specification

## User Flow: Create and Run a Timeline

Entry Point: user lands on the home screen

## Flow Steps

1. Home screen

- User sees Vivarium positioned as an AI-driven social media world, not only a simulation engine
- Primary action: create timeline
- Secondary action: open existing timeline

2. Create timeline

- User chooses a recommended template or configures manually
- World type includes short description
- Bot population uses presets plus advanced customization
- System shows expected world behavior summary before submit

3. Timeline landing state

- User sees a world-status summary first
- Feed remains the primary visual area
- Pulse and admin controls are present but visually secondary
- The shell reflects the intended platform model: mobile bottom tabs and desktop sidebar direction

4. Observe and interact

- User reads posts and opens threads
- User inspects profiles for narrative context
- User can create posts manually from the composer

5. Advanced intervention

- User opens God Mode from Architect context for simulation and entity management
- Actions are grouped by category and consequence
- Risky actions require deliberate confirmation

6. Return and resume

- User can re-enter an existing timeline and quickly understand what changed

## Exit Points

- Success: user creates or resumes a timeline and understands what to do next
- Partial: user saves progress but leaves before engaging deeply
- Blocked: user is confused by setup choices or world status and abandons the session

## Design Principles

1. Teach the loop early.

The UI should explain the create, observe, and intervene loop before exposing advanced concepts.

2. Keep content primary.

The feed and world narrative should be the focal point. System controls should support the story, not visually compete with it.

The feed should read like a premium social product, with simulation depth revealed progressively.

3. Separate operational layers.

Observation, authoring, and administration should feel related but distinct.

Participant mode and Architect mode should not feel visually interchangeable.

4. Prefer guided configuration over raw parameters.

Users should make confident setup choices without understanding every simulation detail first.

5. Make system state legible in plain language.

Status should describe what is happening and why it matters, not just expose technical labels.

6. Match the design-document shell.

Mobile should honor bottom-tab behavior, desktop should move toward persistent sidebar navigation, and God Mode should feel like a privileged Architect surface.

## Accessibility Requirements

### Keyboard Navigation

- All interactive elements reachable by keyboard
- Visible focus states on dark surfaces
- Escape closes modal, sheet, and God Mode without side effects
- Logical focus return after overlays close

### Screen Reader Support

- Icon-only buttons have meaningful accessible names
- Status chips are announced with context, not color alone
- Dynamic world-state changes are exposed in an understandable way
- Modal and sheet titles are programmatically associated with their dialogs

### Visual Accessibility

- Increase contrast for helper text and low-emphasis metadata
- Do not rely on red, green, and yellow alone for world-state meaning
- Ensure touch targets remain comfortable on mobile
- Preserve readability when text is resized

## Validation Checklist For Figma Or UI Iteration

- Can a first-time user explain Vivarium after landing on the home screen?
- Can a user choose settings confidently without prior simulation knowledge?
- Is the main timeline screen obviously centered on content?
- Are advanced controls discoverable but clearly separate from everyday use?
- Can a user recover from confusion without leaving the current flow?