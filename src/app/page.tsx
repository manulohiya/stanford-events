import { fetchAllEvents } from '@/lib/sources';
import EventsClient from '@/components/EventsClient';
import type { StanfordEvent } from '@/types/event';

// Revalidate server data every hour
export const revalidate = 3600;

async function getEvents(): Promise<StanfordEvent[]> {
  try {
    return await fetchAllEvents();
  } catch (err) {
    console.error('[page] fetchAllEvents threw unexpectedly:', err);
    return [];
  }
}

export default async function Home() {
  const events = await getEvents();
  return <EventsClient initialEvents={events} />;
}
