import type { StanfordEvent } from '@/types/event';
import {
  fetchStanfordEventsAPI,
  fetchEE380Events,
  fetchHAIEvents,
  fetchStatisticsEvents,
  fetchGSBEvents,
  fetchCommencementEvents,
} from './stanford-events';
import { deduplicate } from '@/lib/deduplicator';

// Wrap each source so a failure never brings down the whole fetch
async function trySource(
  label: string,
  fn: () => Promise<StanfordEvent[]>
): Promise<StanfordEvent[]> {
  try {
    const results = await fn();
    console.log(`[sources] ${label}: ${results.length} events`);
    return results;
  } catch (err) {
    console.warn(`[sources] ${label} failed:`, (err as Error).message);
    return [];
  }
}

export async function fetchAllEvents(): Promise<StanfordEvent[]> {
  // Fan out to all sources in parallel
  const [stanfordEvents, ee380Events, haiEvents, statsEvents, gsbEvents, commencementEvents] = await Promise.all([
    trySource('Stanford Events API', fetchStanfordEventsAPI),
    trySource('EE380 Colloquium',    fetchEE380Events),
    trySource('HAI',                 fetchHAIEvents),
    trySource('Statistics',          fetchStatisticsEvents),
    trySource('GSB',                 fetchGSBEvents),
    trySource('Commencement',        fetchCommencementEvents),
  ]);

  const all: StanfordEvent[] = [
    ...stanfordEvents,
    ...ee380Events,
    ...haiEvents,
    ...statsEvents,
    ...gsbEvents,
    ...commencementEvents,
  ];

  const deduped = deduplicate(all);

  // Final pass: ensure every id is unique (guards against hash collisions
  // or API quirks that slip past the title+date deduplicator).
  const byId = new Map<string, StanfordEvent>();
  for (const e of deduped) {
    if (!byId.has(e.id)) byId.set(e.id, e);
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
}
