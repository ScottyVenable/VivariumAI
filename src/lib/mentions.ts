/**
 * Utilities for handling @ mentions in posts and replies
 */

export interface MentionCandidate {
  id: string;
  displayName: string;
  username: string;
}

/**
 * Detects if text contains an incomplete mention (starts with @)
 * Returns the mention text and cursor position, or null if no active mention
 */
export function detectActiveMention(text: string, cursorPosition: number): { mention: string; startIndex: number } | null {
  // Find the last @ before cursor
  let lastAtIndex = -1;
  for (let i = cursorPosition - 1; i >= 0; i--) {
    if (text[i] === '@') {
      lastAtIndex = i;
      break;
    }
    // Stop if we hit a space or line break (mention ended)
    if (text[i] === ' ' || text[i] === '\n') {
      break;
    }
  }

  if (lastAtIndex === -1) return null;

  // Extract the mention text (e.g., "@alex" or "@")
  const mention = text.substring(lastAtIndex + 1, cursorPosition);

  // Only consider it an active mention if it's valid username characters (letters, digits, underscores, periods)
  if (!/^[a-zA-Z0-9_.]*$/.test(mention)) return null;

  return { mention, startIndex: lastAtIndex };
}

/**
 * Filters candidates by mention text (case-insensitive)
 */
export function filterCandidates(candidates: MentionCandidate[], mention: string): MentionCandidate[] {
  if (!mention.trim()) return candidates;

  const lower = mention.toLowerCase();
  return candidates.filter(
    candidate =>
      candidate.username.toLowerCase().includes(lower) ||
      candidate.displayName.toLowerCase().includes(lower)
  );
}

/**
 * Replaces the mention in text with the selected candidate
 */
export function replaceMention(
  text: string,
  startIndex: number,
  cursorPosition: number,
  selectedCandidate: MentionCandidate
): { newText: string; newCursorPosition: number } {
  const beforeMention = text.substring(0, startIndex);
  const afterMention = text.substring(cursorPosition);
  const newText = `${beforeMention}@${selectedCandidate.username}${afterMention}`;
  const newCursorPosition = beforeMention.length + selectedCandidate.username.length + 1;

  return { newText, newCursorPosition };
}
