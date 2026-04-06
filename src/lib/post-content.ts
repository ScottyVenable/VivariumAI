export function sanitizeDisplayContent(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return value;

  const parsed = tryParseJsonLike(trimmed);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return value;
  }

  const maybeContent = (parsed as Record<string, unknown>).content;
  if (typeof maybeContent === 'string' && maybeContent.trim()) {
    return maybeContent.trim();
  }

  return value;
}

export function sanitizeEmotionalState(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.split('||debug:')[0].trim() || null;
}

export function sanitizeHashtags(rawHashtags: string, fallbackContent: string): string[] {
  const parsed = tryParseJsonLike(rawHashtags);
  if (Array.isArray(parsed)) {
    return parsed.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
  }

  const contentMatches = fallbackContent.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  return [...new Set(contentMatches)].slice(0, 3);
}

function tryParseJsonLike(input: string): unknown {
  const candidates = [
    input,
    input
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3')
      .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, group: string) => `"${group.replace(/"/g, '\\"')}"`),
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // continue
    }
  }

  return null;
}
