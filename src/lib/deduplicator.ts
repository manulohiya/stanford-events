import type { StanfordEvent } from '@/types/event';

// Deduplication: events are considered duplicates if they share the same
// normalized title and start date (same day), regardless of source.

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function dateKey(isoString: string): string {
  // Reduce to YYYY-MM-DD
  return isoString.slice(0, 10);
}

export function deduplicate(events: StanfordEvent[]): StanfordEvent[] {
  const seen = new Map<string, StanfordEvent>();

  for (const event of events) {
    const key = `${normalizeTitle(event.title)}::${dateKey(event.startDate)}`;

    if (!seen.has(key)) {
      seen.set(key, event);
    } else {
      // Keep the version with more information (longer description)
      const existing = seen.get(key)!;
      if (event.description.length > existing.description.length) {
        seen.set(key, event);
      }
    }
  }

  return Array.from(seen.values());
}
