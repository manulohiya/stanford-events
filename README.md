# Stanford Events Aggregator

A production-quality web application that aggregates upcoming Stanford speaker events from multiple sources, categorises them by topic, and presents them in a filterable UI.

## Stack

- **Next.js 14** (App Router, SSR + ISR)
- **TypeScript** — strict throughout
- **Tailwind CSS** — Stanford Cardinal red theme
- **date-fns** — date formatting
- **lucide-react** — icons

## Architecture

```
src/
├── app/
│   ├── page.tsx                 # Server component — fetches events at render time
│   ├── layout.tsx
│   └── api/events/route.ts      # REST endpoint with 1-hour in-process cache
├── lib/
│   ├── categorizer.ts           # Keyword-scoring topic classifier (10 categories)
│   ├── deduplicator.ts          # Title + date hash deduplication
│   └── sources/
│       ├── stanford-events.ts   # Stanford Events JSON API + ICS parser + EE380 + HAI scrapers
│       ├── mock-data.ts         # 40 realistic fallback events (all topics covered)
│       └── index.ts             # Fan-out aggregator with per-source fallback chains
├── components/
│   ├── EventsClient.tsx         # Main interactive client component
│   ├── EventCard.tsx            # Individual event card
│   ├── FilterBar.tsx            # Topic / source / date / online filters
│   ├── SearchBar.tsx            # Debounced full-text search
│   ├── TopicBadge.tsx           # Coloured topic chip
│   └── Header.tsx               # Sticky top bar with event counts
└── types/event.ts               # All shared TypeScript types + colour maps
```

## Data Sources

| Source | Strategy | Fallback |
|---|---|---|
| Stanford Events | JSON API → ICS feed | mock data |
| HAI | RSS feed | mock data |
| EE380 Colloquium | HTML scraper | mock data |

Each source uses an ordered strategy list; the first successful fetch wins. All sources run in parallel via `Promise.allSettled`. If all live sources fail, the app shows the comprehensive 40-event mock dataset.

## Getting Started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # serve production build
```

## Features

- **Multi-source aggregation** with graceful per-source fallbacks
- **10 topic categories** via keyword-scoring classifier
- **Deduplication** — same title + date from multiple sources merged
- **Filterable UI** — by topic, source, date range (this week / this month / all), online-only
- **Full-text search** across title, description, speaker, and tags (debounced 250ms)
- **Featured events** — highlighted strip above the main grid
- **Responsive layout** — 3-col desktop / 2-col tablet / 1-col mobile
- **Mobile filter drawer** — slide-in sidebar on small screens
- **1-hour server-side cache** — avoids hammering Stanford's servers
- **ISR revalidation** — page data refreshed server-side every hour
