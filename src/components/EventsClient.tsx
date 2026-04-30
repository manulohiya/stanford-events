'use client';

import { useMemo, useState } from 'react';
import {
  isThisWeek,
  startOfDay,
  endOfMonth,
  isWithinInterval,
} from 'date-fns';
import { Layers, RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import type { StanfordEvent, EventFilters, TopicCategory, EventSource } from '@/types/event';
import { ALL_TOPICS, ALL_SOURCES } from '@/types/event';
import Header from './Header';
import FilterBar from './FilterBar';
import SearchBar from './SearchBar';
import EventCard from './EventCard';

interface EventsClientProps {
  initialEvents: StanfordEvent[];
}

const DEFAULT_FILTERS: EventFilters = {
  topics: [],
  sources: [],
  search: '',
  dateRange: 'this-week',
  onlineOnly: false,
};

function passesDateRange(event: StanfordEvent, range: EventFilters['dateRange']): boolean {
  const d = new Date(event.startDate);
  const now = new Date();
  if (range === 'all') return d >= now;
  if (range === 'this-week') return d >= now && isThisWeek(d, { weekStartsOn: 1 });
  if (range === 'this-month') {
    return d >= now && isWithinInterval(d, {
      start: startOfDay(now),
      end: endOfMonth(now),
    });
  }
  return true;
}

function filterEvents(events: StanfordEvent[], filters: EventFilters): StanfordEvent[] {
  const q = filters.search.toLowerCase().trim();

  return events.filter((e) => {
    if (!passesDateRange(e, filters.dateRange)) return false;
    if (filters.onlineOnly && !e.isOnline) return false;
    if (filters.topics.length > 0 && !filters.topics.includes(e.topic)) return false;
    if (filters.sources.length > 0 && !filters.sources.includes(e.source)) return false;
    if (q) {
      const haystack = [
        e.title,
        e.description,
        e.speaker?.name ?? '',
        e.speaker?.institution ?? '',
        e.location ?? '',
        e.topic,
        ...e.tags,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

function buildCounts<K extends string>(
  events: StanfordEvent[],
  key: 'topic' | 'source',
  allKeys: K[]
): Record<K, number> {
  const counts = Object.fromEntries(allKeys.map((k) => [k, 0])) as Record<K, number>;
  for (const e of events) {
    const v = e[key] as K;
    if (v in counts) counts[v]++;
  }
  return counts;
}

export default function EventsClient({ initialEvents }: EventsClientProps) {
  const [filters, setFilters] = useState<EventFilters>(DEFAULT_FILTERS);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const baseEvents = useMemo(
    () => initialEvents.filter((e) => new Date(e.startDate) >= new Date()),
    [initialEvents]
  );

  const filteredEvents = useMemo(
    () => filterEvents(baseEvents, filters),
    [baseEvents, filters]
  );

  // Independent-facet counts: each dimension is counted from the set filtered
  // by everything *except itself*, so counts stay stable as you add filters and
  // accurately show what you'd get if you clicked that option.
  const eventsForTopicCounts = useMemo(
    () => filterEvents(baseEvents, { ...filters, topics: [] }),
    [baseEvents, filters]
  );
  const eventsForSourceCounts = useMemo(
    () => filterEvents(baseEvents, { ...filters, sources: [] }),
    [baseEvents, filters]
  );

  const topicCounts = useMemo(
    () => buildCounts<TopicCategory>(eventsForTopicCounts, 'topic', ALL_TOPICS),
    [eventsForTopicCounts]
  );
  const sourceCounts = useMemo(
    () => buildCounts<EventSource>(eventsForSourceCounts, 'source', ALL_SOURCES),
    [eventsForSourceCounts]
  );

  const featuredEvents = useMemo(
    () => filteredEvents.filter((e) => e.isFeatured),
    [filteredEvents]
  );

  const hasActiveFilters =
    filters.topics.length > 0 ||
    filters.sources.length > 0 ||
    filters.dateRange !== 'this-week' ||
    filters.onlineOnly ||
    !!filters.search;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header totalCount={baseEvents.length} filteredCount={filteredEvents.length} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Search bar — always visible */}
        <div className="mb-4 flex gap-3">
          <div className="flex-1">
            <SearchBar
              value={filters.search}
              onChange={(s) => setFilters((f) => ({ ...f, search: s }))}
            />
          </div>
          {/* Mobile filter toggle */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-cardinal-700" />
            )}
          </button>
        </div>

        <div className="flex gap-6">
          {/* ── Sidebar (desktop) ─────────────────────── */}
          <div className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <FilterBar
                filters={filters}
                onFiltersChange={setFilters}
                topicCounts={topicCounts}
                sourceCounts={sourceCounts}
                totalCount={baseEvents.length}
              />
            </div>
          </div>

          {/* ── Main content ──────────────────────────── */}
          <main className="flex-1 min-w-0">
            {/* Featured strip */}
            {featuredEvents.length > 0 && !hasActiveFilters && (
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-cardinal-700">
                    Featured
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-cardinal-200 to-transparent" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {featuredEvents.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              </section>
            )}

            {/* All / filtered results header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-gray-400" aria-hidden />
                <span className="text-sm font-semibold text-gray-700">
                  {hasActiveFilters ? 'Results' : 'This week\'s events'}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {filteredEvents.length}
                </span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                </button>
              )}
            </div>

            {/* Event grid */}
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-gray-400" />
                </div>
                {hasActiveFilters ? (
                  <div>
                    <p className="text-sm font-semibold text-gray-700">No events match your filters</p>
                    <p className="text-xs text-gray-500 mt-1">Try broadening your search or adjusting the filters.</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-gray-700">No upcoming events found</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">
                      Stanford event sources may be temporarily unavailable. Data refreshes hourly.
                    </p>
                  </div>
                )}
                {hasActiveFilters && (
                  <button
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="mt-2 rounded-lg bg-cardinal-700 px-4 py-2 text-xs font-medium text-white hover:bg-cardinal-800 transition-colors"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {(hasActiveFilters ? filteredEvents : filteredEvents.filter((e) => !e.isFeatured)).map(
                  (e) => (
                    <EventCard key={e.id} event={e} />
                  )
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Mobile filter drawer ──────────────────────── */}
      {mobileFiltersOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto flex h-full w-80 max-w-[90vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <span className="font-semibold text-gray-900">Filters</span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterBar
                filters={filters}
                onFiltersChange={(f) => {
                  setFilters(f);
                }}
                topicCounts={topicCounts}
                sourceCounts={sourceCounts}
                totalCount={baseEvents.length}
              />
            </div>
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full rounded-xl bg-cardinal-700 py-2.5 text-sm font-semibold text-white hover:bg-cardinal-800 transition-colors"
              >
                Show {filteredEvents.length} events
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
