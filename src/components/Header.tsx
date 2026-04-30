'use client';

import { BookOpen, Search } from 'lucide-react';

interface HeaderProps {
  totalCount: number;
  filteredCount: number;
}

export default function Header({ totalCount, filteredCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Stanford-red wordmark dot */}
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cardinal-700">
              <BookOpen className="h-4 w-4 text-white" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-gray-900 leading-tight">
                Stanford Speaker Events
              </h1>
              <p className="truncate text-xs text-gray-500 leading-tight">
                Aggregated from Stanford calendars, seminars &amp; departments
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-sm font-medium text-gray-900">
              {filteredCount.toLocaleString()}
              {filteredCount !== totalCount && (
                <span className="text-gray-400"> / {totalCount.toLocaleString()}</span>
              )}
            </p>
            <p className="text-xs text-gray-500">upcoming events</p>
          </div>
        </div>
      </div>
    </header>
  );
}
