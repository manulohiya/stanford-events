'use client';

import { useState, useRef, useEffect } from 'react';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { MapPin, Monitor, ExternalLink, Calendar, User, Star, ChevronDown } from 'lucide-react';
import TopicBadge from './TopicBadge';
import type { StanfordEvent } from '@/types/event';
import { SOURCE_LABELS } from '@/types/event';
import clsx from 'clsx';

interface EventCardProps {
  event: StanfordEvent;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isThisWeek(d)) return format(d, 'EEEE');
  return format(d, 'EEE, MMM d');
}

function formatTime(iso: string): string {
  return format(new Date(iso), 'h:mm a');
}

/** Convert ISO string to Google Calendar date format: YYYYMMDDTHHmmssZ */
function toGCalDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
}

function buildGoogleCalendarUrl(event: StanfordEvent): string {
  const start = toGCalDate(event.startDate);
  const end = event.endDate
    ? toGCalDate(event.endDate)
    : toGCalDate(new Date(new Date(event.startDate).getTime() + 3600000).toISOString());

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: event.shortDescription + (event.url ? `\n\nMore info: ${event.url}` : ''),
    location: event.location ?? (event.isOnline ? 'Online' : ''),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildOutlookUrl(event: StanfordEvent): string {
  const start = new Date(event.startDate).toISOString();
  const end = event.endDate
    ? new Date(event.endDate).toISOString()
    : new Date(new Date(event.startDate).getTime() + 3600000).toISOString();

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    startdt: start,
    enddt: end,
    subject: event.title,
    body: event.shortDescription,
    location: event.location ?? '',
  });
  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
}

/** Dropdown for calendar options */
function CalendarDropdown({ event }: { event: StanfordEvent }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        className={clsx(
          'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
          open
            ? 'border-cardinal-300 bg-cardinal-50 text-cardinal-700'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        )}
        aria-label="Add to calendar"
        title="Add to calendar"
      >
        <Calendar className="h-3 w-3" aria-hidden />
        <span className="hidden sm:inline">Add</span>
        <ChevronDown className={clsx('h-3 w-3 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-1 z-20 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <a
            href={buildGoogleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
          >
            {/* Google Calendar colour dot */}
            <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-[6px] font-bold text-white leading-none">G</span>
            </span>
            Google Calendar
          </a>
          <a
            href={buildOutlookUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
          >
            <span className="h-3.5 w-3.5 shrink-0 rounded bg-blue-700 flex items-center justify-center">
              <span className="text-[6px] font-bold text-white leading-none">O</span>
            </span>
            Outlook / Office 365
          </a>
        </div>
      )}
    </div>
  );
}

export default function EventCard({ event }: EventCardProps) {
  const dateLabel = formatDate(event.startDate);
  const timeLabel = formatTime(event.startDate);
  const isUpcoming = ['Today', 'Tomorrow'].includes(dateLabel);

  return (
    <article
      className={clsx(
        'group relative flex flex-col rounded-xl border bg-white transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-0.5',
        event.isFeatured
          ? 'border-cardinal-200 shadow-sm ring-1 ring-cardinal-100'
          : 'border-gray-200 shadow-sm'
      )}
    >
      {/* Featured accent bar */}
      {event.isFeatured && (
        <div className="absolute -top-px left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-cardinal-500 to-cardinal-700" />
      )}

      <div className="flex flex-col gap-3 p-5">
        {/* Date chip + topic */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div
            className={clsx(
              'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold',
              isUpcoming
                ? 'bg-cardinal-50 text-cardinal-700'
                : 'bg-gray-100 text-gray-600'
            )}
          >
            <Calendar className="h-3 w-3" aria-hidden />
            {dateLabel} · {timeLabel}
          </div>
          <div className="flex items-center gap-1.5">
            {event.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
                <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" aria-hidden />
                Featured
              </span>
            )}
            <TopicBadge topic={event.topic} size="sm" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-cardinal-700 transition-colors">
          {event.title}
        </h2>

        {/* Speaker — prominent display directly under title */}
        {event.speaker && (
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-1.5">
            <User className="h-3.5 w-3.5 shrink-0 text-cardinal-600" aria-hidden />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-gray-900 truncate block">
                {event.speaker.name}
              </span>
              {(event.speaker.title || event.speaker.institution) && (
                <span className="text-[10px] text-gray-500 truncate block leading-tight">
                  {[event.speaker.title, event.speaker.institution]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
          {event.shortDescription}
        </p>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 min-w-0">
            {event.isOnline ? (
              <Monitor className="h-3.5 w-3.5 shrink-0 text-teal-500" aria-hidden />
            ) : (
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
            )}
            <span className="text-xs text-gray-500 truncate">
              {event.isOnline && !event.location
                ? 'Online'
                : (event.location ?? 'Location TBD')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <CalendarDropdown event={event} />
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-cardinal-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-cardinal-800 transition-colors"
              aria-label={`Details for ${event.title}`}
            >
              Details
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
