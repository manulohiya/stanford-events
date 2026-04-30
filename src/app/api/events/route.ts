import { NextResponse } from 'next/server';
import { fetchAllEvents } from '@/lib/sources';
import type { StanfordEvent } from '@/types/event';

// Simple in-process cache to avoid re-fetching on every request
interface CacheEntry {
  data: StanfordEvent[];
  timestamp: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let cache: CacheEntry | null = null;

export async function GET() {
  try {
    const now = Date.now();
    if (cache && now - cache.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(
        { events: cache.data, cached: true, count: cache.data.length },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        }
      );
    }

    const events = await fetchAllEvents();
    cache = { data: events, timestamp: now };

    return NextResponse.json(
      { events, cached: false, count: events.length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (err) {
    console.error('[/api/events] Unhandled error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch events', events: [] },
      { status: 500 }
    );
  }
}
