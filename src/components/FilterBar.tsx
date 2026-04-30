'use client';

import { X, Filter } from 'lucide-react';
import clsx from 'clsx';
import type { TopicCategory, EventSource, EventFilters } from '@/types/event';
import { ALL_TOPICS, ALL_SOURCES, TOPIC_COLORS, TOPIC_DOT_COLORS, SOURCE_LABELS } from '@/types/event';

interface FilterBarProps {
  filters: EventFilters;
  onFiltersChange: (f: EventFilters) => void;
  topicCounts: Record<TopicCategory, number>;
  sourceCounts: Record<EventSource, number>;
  totalCount: number;
}

const DATE_RANGE_OPTIONS: Array<{ value: EventFilters['dateRange']; label: string }> = [
  { value: 'this-week',  label: 'This week'    },
  { value: 'this-month', label: 'This month'   },
  { value: 'all',        label: 'All upcoming' },
];

export default function FilterBar({
  filters,
  onFiltersChange,
  topicCounts,
  sourceCounts,
  totalCount,
}: FilterBarProps) {
  const activeCount =
    filters.topics.length +
    filters.sources.length +
    (filters.dateRange !== 'this-week' ? 1 : 0) +
    (filters.onlineOnly ? 1 : 0) +
    (filters.search ? 1 : 0);

  function toggleTopic(t: TopicCategory) {
    const next = filters.topics.includes(t)
      ? filters.topics.filter((x) => x !== t)
      : [...filters.topics, t];
    onFiltersChange({ ...filters, topics: next });
  }

  function toggleSource(s: EventSource) {
    const next = filters.sources.includes(s)
      ? filters.sources.filter((x) => x !== s)
      : [...filters.sources, s];
    onFiltersChange({ ...filters, sources: next });
  }

  function clearAll() {
    onFiltersChange({
      topics: [],
      sources: [],
      search: '',
      dateRange: 'this-week',
      onlineOnly: false,
    });
  }

  // Show only sources that have events at all (count > 0) OR are currently active
  // so that selected sources are never hidden after clicking them.
  const visibleSources = ALL_SOURCES.filter(
    (s) => (sourceCounts[s] ?? 0) > 0 || filters.sources.includes(s)
  );

  return (
    <aside className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" aria-hidden />
          <span className="text-sm font-semibold text-gray-900">Filters</span>
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cardinal-700 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-cardinal-700 hover:text-cardinal-900 font-medium"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Date range */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Date range
        </p>
        <div className="flex flex-col gap-1">
          {DATE_RANGE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onFiltersChange({ ...filters, dateRange: value })}
              className={clsx(
                'flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors',
                filters.dateRange === value
                  ? 'bg-cardinal-50 text-cardinal-800 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Online only */}
      <div>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={filters.onlineOnly}
            onChange={(e) => onFiltersChange({ ...filters, onlineOnly: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-cardinal-700 focus:ring-cardinal-500"
          />
          <span className="text-sm text-gray-700">Online events only</span>
        </label>
      </div>

      {/* Topics */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Topic
        </p>
        <div className="flex flex-col gap-1">
          {ALL_TOPICS.map((topic) => {
            const count = topicCounts[topic] ?? 0;
            const active = filters.topics.includes(topic);
            // Active buttons are always clickable (to allow deselection);
            // inactive buttons are disabled only when count is 0.
            const disabled = !active && count === 0;
            return (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                disabled={disabled}
                className={clsx(
                  'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-left transition-colors',
                  active
                    ? clsx('font-semibold', TOPIC_COLORS[topic])
                    : disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <span
                  className={clsx(
                    'h-2 w-2 shrink-0 rounded-full',
                    disabled ? 'bg-gray-200' : TOPIC_DOT_COLORS[topic]
                  )}
                />
                <span className="flex-1 truncate">{topic}</span>
                <span
                  className={clsx(
                    'ml-auto text-xs tabular-nums',
                    active ? 'font-bold' : 'text-gray-400'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sources */}
      {visibleSources.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Source
          </p>
          <div className="flex flex-col gap-1">
            {visibleSources.map((source) => {
              const count = sourceCounts[source] ?? 0;
              const active = filters.sources.includes(source);
              return (
                <button
                  key={source}
                  onClick={() => toggleSource(source)}
                  className={clsx(
                    'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-left transition-colors',
                    active
                      ? 'bg-gray-900 text-white font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <span className="flex-1 truncate">
                    {SOURCE_LABELS[source] ?? source}
                  </span>
                  <span
                    className={clsx(
                      'text-xs tabular-nums',
                      active ? 'text-gray-300 font-bold' : 'text-gray-400'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Total */}
      <p className="text-xs text-gray-400 border-t border-gray-100 pt-4">
        {totalCount} total upcoming events
      </p>
    </aside>
  );
}
