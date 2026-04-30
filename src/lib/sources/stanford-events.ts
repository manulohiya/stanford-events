import crypto from 'crypto';
import { categorize } from '@/lib/categorizer';
import type { StanfordEvent, EventSource } from '@/types/event';

// ── Types ────────────────────────────────────────────────────────────────────

interface SEEventInstance {
  event_instance: {
    start?: string;
    end?: string;
    all_day?: boolean;
  };
}

interface SEEvent {
  id: number | string;
  title?: string;
  url?: string;
  localist_url?: string;
  first_date?: string;
  last_date?: string;
  location?: string;
  location_name?: string;
  experience?: string;        // "inperson" | "virtual" | "hybrid"
  description_text?: string;
  description?: string;
  photo_url?: string;
  departments?: Array<{ id: number; name: string }>;
  filters?: {
    event_types?: Array<{ id: number; name: string }>;
    event_subject?: Array<{ id: number; name: string }>;
  };
  event_instances?: SEEventInstance[];
  featured?: boolean;
  tags?: string[];
  keywords?: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Signals that strongly suggest a high-profile or award-winning speaker */
const FAMOUS_SPEAKER_SIGNALS = [
  'nobel',
  'turing award',
  'pulitzer',
  'fields medal',
  'macarthur fellow',
  'national academy of sciences',
  'national academy of engineering',
  'national medal',
  'presidential medal',
  'wolf prize',
  'shaw prize',
  'academy award',
  'emmy award',
  'grammy',
  'secretary of state',
  'secretary of defense',
  'prime minister',
  'president of the united states',
  'former president',
  'former secretary',
  'chief justice',
  'ceo of',
  'coo of',
  'cto of',
  'cfo of',
  'founder of',
  'co-founder of',
  'cofounder of',
  'chairman of',
  'managing director',
  'view from the top',
  'commencement speaker',
  'commencement address',
  'commencement keynote',
  'keynote speaker',
  'bestselling author',
  'new york times bestselling',
  'pulitzer prize',
];

function isFamousSpeaker(text: string): boolean {
  const lower = text.toLowerCase();
  return FAMOUS_SPEAKER_SIGNALS.some((s) => lower.includes(s));
}

const LECTURE_TYPES = new Set([
  'Lecture/Presentation/Talk',
  'Class/Seminar',
  'Conference/Symposium',
]);

function hashId(input: string): string {
  return 'se-' + crypto.createHash('sha1').update(input).digest('hex').slice(0, 12);
}

function toISO(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

function extractText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isLectureSeminar(e: SEEvent): boolean {
  return (
    (e.filters?.event_types ?? []).some((t) => LECTURE_TYPES.has(t.name))
  );
}

// Common words that can look capitalized in titles but are not person names.
const NON_NAME_WORDS = new Set([
  'artist', 'associate', 'assistant', 'author', 'candidate', 'center',
  'chair', 'clinical', 'clinic', 'conference', 'demand', 'dental',
  'department', 'director', 'discussion', 'disorder', 'disorders', 'energy',
  'environmental', 'evening', 'forum', 'global', 'grand', 'hold', 'inaugural',
  'institute', 'international', 'keynote', 'lecture', 'made', 'mba', 'md',
  'meals', 'medical', 'medicine', 'national', 'novel', 'online', 'open',
  'orthopaedic', 'panel', 'patient', 'patients', 'phd', 'plant', 'prof',
  'professor', 'program', 'research', 'rich', 'rounds', 'school', 'science',
  'seminar', 'series', 'session', 'simple', 'special', 'spinal', 'study',
  'sustainability', 'symposium', 'talk', 'technology', 'treatment',
  'treatments', 'university', 'virtual', 'ways', 'weekly', 'workshop',
]);

/**
 * Returns true when the string looks like a human name:
 *  - 2–4 whitespace-separated words
 *  - Each word starts with a capital letter (letters, period, hyphen allowed)
 *  - No word is on the common non-name blocklist
 */
function looksLikePersonName(candidate: string): boolean {
  const words = candidate.trim().split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  if (!words.every((w) => /^[A-Z][A-Za-z.'`-]{0,19}$/.test(w))) return false;
  return !words.some((w) => NON_NAME_WORDS.has(w.toLowerCase().replace(/[.'`-]/g, '')));
}

/**
 * Best-effort speaker extraction from event title and description.
 * Uses explicit markers ("Speaker:", "Presenter:") first, then structural
 * title patterns (Name (Institution) "Talk title").
 */
function extractSpeaker(title: string, description: string): import('@/types/event').Speaker | undefined {
  // ── 1. "Speaker: Name[, Role[, Institution]]" in description ─────────────
  // Cap at 150 chars to avoid consuming entire bio blurbs.
  const speakerLine = /\bSpeakers?:\s*(.{5,150})/i.exec(description);
  if (speakerLine) {
    const raw = speakerLine[1].trim();
    const parts = raw.split(/,\s*/);
    const name = parts[0].trim();
    if (looksLikePersonName(name)) {
      // Institution = last comma segment if short, starts with capital, ≤4 words
      // (avoids capturing bio prose that runs on after a comma)
      const lastPart = parts[parts.length - 1]?.trim() ?? '';
      const institution =
        parts.length > 1 &&
        lastPart.length < 50 &&
        lastPart.split(/\s+/).length <= 4 &&
        /^[A-Z]/.test(lastPart)
          ? lastPart
          : undefined;
      return { name, institution };
    }
  }

  // ── 2. "Presenter: Name[, Institution]" in description ──────────────────
  const presenterLine = /\bPresenter[s]?:\s*(.{5,100})/i.exec(description);
  if (presenterLine) {
    const parts = presenterLine[1].trim().split(/,\s*/);
    const name = parts[0].trim();
    if (looksLikePersonName(name)) {
      const lastPart = parts[parts.length - 1]?.trim() ?? '';
      return {
        name,
        institution:
          parts.length > 1 &&
          lastPart.length < 60 &&
          /^[A-Z]/.test(lastPart)
            ? lastPart
            : undefined,
      };
    }
  }

  // ── 3. "Name (Institution) "Quote" or : Talk title" at start of title ───
  // e.g. 'Andrew Donnelly (Texas Tech University) "Et grandes fumabant..."'
  const titlePersonMatch =
    /^([A-Z][a-záéíóúüñ.'`-]+(?: [A-Z][a-záéíóúüñ.'`-]+){1,3})\s+\(([^)]{3,60})\)\s*[":–-]/
      .exec(title);
  if (titlePersonMatch) {
    const name = titlePersonMatch[1].trim();
    if (looksLikePersonName(name)) {
      return { name, institution: titlePersonMatch[2].trim() };
    }
  }

  // ── 3b. "Series Title: Speaker Name, Role/Title" ─────────────────────────
  // e.g. 'View From The Top: Javier Olivan, COO of Meta'
  //      'Annual Webster Lecture: Jane Smith, Professor at MIT'
  // Captures the name between the last colon and the first comma.
  const colonNameMatch = /:\s+([A-Z][a-záéíóúüñ.'`-]+(?: [A-Z][a-záéíóúüñ.'`-]+){1,3})\s*,/
    .exec(title);
  if (colonNameMatch) {
    const name = colonNameMatch[1].trim();
    if (looksLikePersonName(name)) {
      return { name };
    }
  }

  // ── 4. "Series | Speaker1[, Speaker2…]" — pipe-delimited speakers ───────
  // Each comma segment must look like a person name. Segments that don't
  // (e.g. "Breakthrough Energy") are discarded; the rest are kept.
  // Skip when the text before the pipe is an all-caps category tag (e.g. "WORKSHOP|").
  const pipeMatch = /\|\s*(.+)$/.exec(title);
  if (pipeMatch) {
    const beforePipe = title.slice(0, title.lastIndexOf('|')).trim();
    const isCategoryLabel = /^[A-Z\s]+$/.test(beforePipe) || !beforePipe.includes(' ');
    if (!isCategoryLabel) {
      const segments = pipeMatch[1].trim().split(/,\s*/);
      const nameSegs = segments.filter((seg) => looksLikePersonName(seg.trim()));
      if (nameSegs.length > 0) {
        return { name: nameSegs.join(', ') };
      }
    }
  }

  // ── 5. "… with Name [M.] LastName [(Institution)]" in title ─────────────
  // e.g. 'Book Talk with Quinn Slobodian'  /  'Methods Café with Benjamin A. Saltzman'
  const withTitleMatch =
    /\bwith\s+([A-Z][a-záéíóúüñ.'`-]+(?: [A-Z][a-záéíóúüñ.'`-]+){1,3})(?:\s*\(([^)]{3,50})\))?(?:[^a-z]|$)/
      .exec(title);
  if (withTitleMatch) {
    const name = withTitleMatch[1].trim();
    if (looksLikePersonName(name)) {
      return { name, institution: withTitleMatch[2]?.trim() };
    }
  }

  // ── 6. "… talk/lecture/chat with Name (Institution)" in description ──────
  // Catches cases like Italian Lecture Series where description says
  // "… talk with Giancarlo Tursi (UC Santa Barbara)."
  const withDescMatch =
    /\b(?:talk|lecture|chat|conversation|fireside)\s+with\s+([A-Z][a-záéíóúüñ.'`-]+(?: [A-Z][a-záéíóúüñ.'`-]+){1,3})(?:\s*\(([^)]{3,50})\))?/i
      .exec(description.slice(0, 300));
  if (withDescMatch) {
    const name = withDescMatch[1].trim();
    if (looksLikePersonName(name)) {
      return { name, institution: withDescMatch[2]?.trim() };
    }
  }

  return undefined;
}

function normaliseEvent(raw: SEEvent): StanfordEvent | null {
  const title = (raw.title ?? '').trim();
  if (!title) return null;

  const instance = raw.event_instances?.[0]?.event_instance;
  const startDate = toISO(instance?.start ?? raw.first_date);
  if (!startDate) return null;
  if (new Date(startDate) < new Date()) return null;

  const rawDesc = raw.description_text ?? '';
  const description = extractText(rawDesc);
  const shortDescription =
    description.slice(0, 200).trimEnd() + (description.length > 200 ? '…' : '');

  const location = (raw.location || raw.location_name || '').trim() || undefined;
  const isOnline =
    raw.experience === 'virtual' ||
    !!(location?.toLowerCase().includes('zoom') || location?.toLowerCase().includes('online'));

  const url = raw.localist_url ?? raw.url ?? 'https://events.stanford.edu';

  const tags = [
    ...(raw.tags ?? []),
    ...(raw.keywords ?? []),
    ...(raw.filters?.event_subject?.map((s) => s.name) ?? []),
    ...(raw.departments?.map((d) => d.name) ?? []),
  ].filter(Boolean);

  const topic = categorize(title, description, tags);

  // Mark as featured if the API flags it OR the description signals a marquee speaker
  const hasFamousSpeakerSignal = isFamousSpeaker(title + ' ' + description);

  // Extract structured speaker data when not provided natively by the API
  const speaker = extractSpeaker(title, description);

  return {
    // Content-addressed ID avoids hash collisions when the API returns the
    // same raw.id on multiple pages or with slightly-varying data.
    id: hashId('se|' + title + '|' + startDate),
    title,
    description,
    shortDescription,
    speaker,
    startDate,
    endDate: toISO(instance?.end),
    location,
    isOnline,
    url,
    source: 'Stanford Events',
    topic,
    tags,
    imageUrl: raw.photo_url ?? undefined,
    isFeatured: (raw.featured ?? false) || hasFamousSpeakerSignal,
  };
}

// ── Stanford Events Localist JSON API ────────────────────────────────────────
// Endpoint: events.stanford.edu/api/2/events.json
// pp=100  → 100 events per page (confirmed working)
// start/end date range filters
// Fetches up to MAX_PAGES pages to stay within reasonable latency

const API_BASE = 'https://events.stanford.edu/api/2/events.json';
const MAX_PAGES = 5; // 5 × 100 = 500 raw events ≈ 185 lectures/seminars

export async function fetchStanfordEventsAPI(): Promise<StanfordEvent[]> {
  const today = new Date().toISOString().slice(0, 10);
  const end60 = new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const results: StanfordEvent[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${API_BASE}?pp=100&start=${today}&end=${end60}&page=${page}`;

    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: {
        'User-Agent': 'StanfordEventsAggregator/1.0',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) throw new Error(`Stanford Events API page ${page}: HTTP ${res.status}`);

    const data = await res.json();
    const events: Array<{ event: SEEvent }> = data?.events ?? [];

    if (events.length === 0) break;

    for (const { event } of events) {
      // Always include lecture/seminar types. Also include non-lecture events
      // (e.g. commencement ceremonies, special events) when they contain a
      // famous speaker signal — these are high-value even if not categorized
      // as a seminar by the calendar system.
      const isLecture = isLectureSeminar(event);
      const titleDesc = (event.title ?? '') + ' ' + (event.description_text ?? '');
      if (!isLecture && !isFamousSpeaker(titleDesc)) continue;
      const normalised = normaliseEvent(event);
      if (normalised) results.push(normalised);
    }

    const totalPages: number = data?.page?.total ?? 1;
    if (page >= totalPages) break;
  }

  return results;
}

// ── EE380 Computer Systems Colloquium HTML Scraper ───────────────────────────
// Stanford's longest-running CS speaker series — HTML table on cs.stanford.edu

function parseDate(rawDate: string, year: number, hour = 19): string | undefined {
  // Handles formats like "April 30" → "2026-04-30T19:00:00-07:00"
  const clean = rawDate.trim().replace(/\s+/g, ' ');
  const d = new Date(`${clean} ${year} ${hour}:00:00 PDT`);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

export async function fetchEE380Events(): Promise<StanfordEvent[]> {
  const url = 'https://web.stanford.edu/class/ee380/';
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'StanfordEventsAggregator/1.0' },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`EE380 responded with HTTP ${res.status}`);

  const html = await res.text();
  const tableMatch = /<table[^>]*>([\s\S]*?)<\/table>/i.exec(html);
  if (!tableMatch) return [];

  const rows = tableMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) ?? [];
  const events: StanfordEvent[] = [];
  const year = new Date().getFullYear();

  for (const row of rows.slice(1)) {
    const cells = (row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) ?? []).map((c) =>
      extractText(c.replace(/<td[^>]*>/i, '').replace(/<\/td>/i, ''))
    );
    if (cells.length < 3) continue;

    const [rawDate, speakerRaw, title] = cells;
    if (!rawDate || !title || /^(tba|tbd|-|\s*)$/i.test(title.trim())) continue;

    const startDate = parseDate(rawDate, year);
    if (!startDate) continue;
    if (new Date(startDate) < new Date()) continue;

    // Speaker may be "First Last, Affiliation" or "First Last (Affiliation)"
    const affMatch = /^([^,(]+)[,(]\s*(.+?)\s*[)]?\s*$/.exec(speakerRaw);
    const speakerName = affMatch ? affMatch[1].trim() : speakerRaw;
    const affiliation = affMatch ? affMatch[2].replace(/\)$/, '').trim() : undefined;

    const linkMatch = /<a\s+href="([^"]+)"/i.exec(row);
    const relUrl = linkMatch?.[1] ?? '';
    const eventUrl = relUrl.startsWith('http')
      ? relUrl
      : relUrl
        ? `https://web.stanford.edu/class/ee380/${relUrl}`
        : url;

    const description = `${speakerRaw ? `Speaker: ${speakerRaw}. ` : ''}${title}`;
    const topic = categorize(title, description);

    events.push({
      id: hashId('ee380-' + title + startDate),
      title,
      description,
      shortDescription: description.slice(0, 200),
      speaker: speakerRaw ? { name: speakerName, institution: affiliation } : undefined,
      startDate,
      endDate: new Date(new Date(startDate).getTime() + 3600000).toISOString(),
      location: 'Hewlett Teaching Center, Room 200 (also live-streamed)',
      isOnline: true,
      url: eventUrl,
      source: 'EE380',
      topic,
      tags: ['colloquium', 'ee380', 'computer science', 'engineering'],
      isFeatured: isFamousSpeaker(speakerRaw + ' ' + title),
    });
  }

  return events;
}

// ── HAI Events HTML Scraper ──────────────────────────────────────────────────
// HAI is a Next.js App Router site; events are server-rendered into the HTML.
// We look for <time datetime="..."> elements and nearby heading text.

export async function fetchHAIEvents(): Promise<StanfordEvent[]> {
  const pageUrl = 'https://hai.stanford.edu/events';
  const res = await fetch(pageUrl, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'StanfordEventsAggregator/1.0' },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`HAI events page: HTTP ${res.status}`);

  const html = await res.text();
  const events: StanfordEvent[] = [];

  // HAI renders event cards as sections/articles with a <time> and an <a>/<h>
  // Strategy: collect all <time datetime="..."> values, then extract nearby title text
  // Pattern: chunks of HTML between event card boundaries
  const cardPattern =
    /<(?:article|div|li)[^>]*class="[^"]*(?:event|card|teaser)[^"]*"[^>]*>([\s\S]*?)(?=<(?:article|div|li)[^>]*class="[^"]*(?:event|card|teaser)|$)/gi;

  const timePattern = /<time[^>]*datetime="([^"]+)"[^>]*>/gi;
  const titlePattern = /<(?:h[1-6]|a)[^>]*>([\s\S]*?)<\/(?:h[1-6]|a)>/gi;
  const linkPattern = /href="(https:\/\/hai\.stanford\.edu\/[^"]+)"/i;

  // Fallback: extract all times and surrounding text from the full page
  const allTimes: Array<{ iso: string; context: string }> = [];
  let tMatch: RegExpExecArray | null;

  const timeRe = /<time[^>]*datetime="([^"]+)"[^>]*>[\s\S]{0,500}/gi;
  while ((tMatch = timeRe.exec(html)) !== null) {
    const iso = toISO(tMatch[1]);
    if (iso && new Date(iso) > new Date()) {
      allTimes.push({ iso, context: html.slice(tMatch.index, tMatch.index + 800) });
    }
  }

  const seen = new Set<string>();
  for (const { iso, context } of allTimes) {
    // Find a title — first heading or link text near the time element
    const headingMatch = /<(?:h[1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/i.exec(context);
    const linkMatch = /<a[^>]*>([\s\S]*?)<\/a>/i.exec(context);
    const rawTitle = headingMatch?.[1] ?? linkMatch?.[1] ?? '';
    const title = extractText(rawTitle).trim();
    if (!title || title.length < 8 || seen.has(title + iso)) continue;
    seen.add(title + iso);

    // Find a source URL
    const urlMatch = linkPattern.exec(context);
    const eventUrl = urlMatch?.[1] ?? pageUrl;

    // Find description
    const descMatch = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(context);
    const description = descMatch ? extractText(descMatch[1]) : '';
    const shortDescription = description.slice(0, 200) + (description.length > 200 ? '…' : '');

    events.push({
      id: hashId('hai-' + title + iso),
      title,
      description,
      shortDescription,
      startDate: iso,
      isOnline: false,
      url: eventUrl,
      source: 'HAI',
      topic: categorize(title, description, ['ai', 'human-centered ai']),
      tags: ['hai', 'artificial intelligence', 'human-centered ai'],
    });
  }

  return events;
}

// ── ICS Feed Parser (generic) ─────────────────────────────────────────────────

function unfoldLines(raw: string): string[] {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n[ \t]/g, '')
    .split('\n');
}

function decodeICS(v: string): string {
  return v
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function parseICSDate(raw: string): string | undefined {
  // Strip param block: "DTSTART;TZID=America/Los_Angeles:" → just the value
  const val = raw.includes(':') ? raw.slice(raw.lastIndexOf(':') + 1) : raw;
  if (/^\d{8}$/.test(val)) {
    const [y, m, d] = [val.slice(0, 4), val.slice(4, 6), val.slice(6, 8)];
    return new Date(`${y}-${m}-${d}T12:00:00-07:00`).toISOString();
  }
  if (/^\d{8}T\d{6}Z$/.test(val)) {
    return new Date(
      val.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')
    ).toISOString();
  }
  if (/^\d{8}T\d{6}$/.test(val)) {
    return new Date(
      val.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6-07:00')
    ).toISOString();
  }
  return undefined;
}

export async function fetchICSFeed(
  icsUrl: string,
  source: EventSource
): Promise<StanfordEvent[]> {
  const res = await fetch(icsUrl, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'StanfordEventsAggregator/1.0' },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`ICS feed ${icsUrl}: HTTP ${res.status}`);

  const text = await res.text();
  if (!text.includes('BEGIN:VCALENDAR')) throw new Error('Not a valid ICS feed');

  const lines = unfoldLines(text);
  const events: StanfordEvent[] = [];
  let props: Record<string, string> = {};
  let inEvent = false;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { inEvent = true; props = {}; continue; }
    if (line === 'END:VEVENT') {
      inEvent = false;
      const title = decodeICS(props['SUMMARY'] ?? '');
      const startDate = parseICSDate(props['DTSTART'] ?? '');
      if (!title || !startDate) continue;
      if (new Date(startDate) < new Date()) continue;

      const description = decodeICS(props['DESCRIPTION'] ?? '');
      const shortDescription = description.slice(0, 200).trimEnd() + (description.length > 200 ? '…' : '');
      const location = decodeICS(props['LOCATION'] ?? '') || undefined;
      const url = decodeICS(props['URL'] ?? '') || `https://events.stanford.edu`;
      const endDate = props['DTEND'] ? parseICSDate(props['DTEND']) : undefined;

      events.push({
        id: hashId(source + title + startDate),
        title,
        description,
        shortDescription,
        startDate,
        endDate,
        location,
        isOnline: !!(location?.toLowerCase().includes('online') || location?.toLowerCase().includes('zoom')),
        url,
        source,
        topic: categorize(title, description),
        tags: [],
      });
      continue;
    }
    if (!inEvent) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx < 1) continue;
    const rawKey = line.slice(0, colonIdx);
    const key = rawKey.includes(';') ? rawKey.slice(0, rawKey.indexOf(';')) : rawKey;
    props[key] = line.slice(colonIdx + 1);
  }

  return events;
}

// ── Stanford GSB Events Scraper ───────────────────────────────────────────────
// The GSB events page (Drupal CMS) is server-rendered HTML.
// Event cards use the `c-card__fe-*` CSS classes with date, time, title, summary.
// Individual event detail pages are fetched only when the listing page lacks a full date.

const GSB_BASE = 'https://www.gsb.stanford.edu';

const GSB_MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Parse GSB date strings like "May 14", "Thursday, May 08, 2026", etc.
 *  Returns an ISO 8601 string with PDT offset (-07:00). */
function parseGSBDate(datePart: string, timePart: string): string | undefined {
  if (!datePart.trim()) return undefined;

  // Remove day names and extra commas; normalise whitespace
  const clean = datePart
    .replace(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/gi, '')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract year (four consecutive digits)
  const yearMatch = /(\d{4})/.exec(clean);
  const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();

  // Remove the year so we're left with "May 14" or "May 8"
  const dateOnly = clean.replace(/\d{4}/, '').trim();

  const dateBits = /^(\w+)\s+(\d{1,2})$/.exec(dateOnly);
  if (!dateBits) return undefined;

  const month = GSB_MONTHS[dateBits[1].toLowerCase().slice(0, 3)];
  const day = parseInt(dateBits[2]);
  if (!month || isNaN(day)) return undefined;

  // Parse the START time from "8:30am – 6:00pm" or just "8:30am"
  const timeMatch = /(\d{1,2}):(\d{2})\s*(am|pm)/i.exec(timePart);
  let hour = 12;
  let minute = 0;
  if (timeMatch) {
    hour = parseInt(timeMatch[1]);
    minute = parseInt(timeMatch[2]);
    if (timeMatch[3].toLowerCase() === 'pm' && hour !== 12) hour += 12;
    if (timeMatch[3].toLowerCase() === 'am' && hour === 12) hour = 0;
  }

  // Build a manual ISO string with PDT offset (-07:00 during summer)
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const mi = String(minute).padStart(2, '0');
  return `${year}-${mm}-${dd}T${hh}:${mi}:00-07:00`;
}

/** Fetch a GSB event detail page to extract full date and description */
async function fetchGSBEventDetail(slug: string): Promise<{
  startDate?: string;
  endDate?: string;
  description: string;
  location?: string;
} | null> {
  try {
    const res = await fetch(`${GSB_BASE}/events/${slug}`, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'StanfordEventsAggregator/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Date: "Thursday, May 14, 2026"
    const dateM = /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d+,?\s*\d{4})/i.exec(html);
    // Times: collect first two "8:30am" / "6:00pm" occurrences
    const allTimes = html.match(/\d{1,2}:\d{2}\s*[ap]m/gi) ?? [];

    const datePart = dateM?.[1] ?? '';
    const startTime = allTimes[0] ?? '12:00pm';
    const endTime = allTimes[1] ?? '';

    const startDate = datePart ? parseGSBDate(datePart, startTime) : undefined;
    const endDate = datePart && endTime ? parseGSBDate(datePart, endTime) : undefined;

    // Description: look for common Drupal field-body containers
    const descM = /<div[^>]*class="[^"]*(?:field-body|field--name-body|event-body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html);
    const description = descM ? extractText(descM[1]) : '';

    // Location
    const locM = /<div[^>]*class="[^"]*(?:field--name-field-location|location)[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html);
    const location = locM ? extractText(locM[1]).trim() || undefined : undefined;

    return { startDate, endDate, description, location };
  } catch {
    return null;
  }
}

// Events that are NOT speaker/lecture content — filter these out
// Patterns that indicate non-speaker GSB events to skip.
// Note: commencement is intentionally NOT here — a commencement address by a
// notable speaker (e.g. Laurene Powell Jobs) IS a speaker event worth surfacing.
const GSB_SKIP_PATTERNS = [
  /graduation\s+ceremony/i,
  /reception/i,
  /admit weekend/i,
  /orientation/i,
  /career fair/i,
  /info session/i,
  /interpersonal dynamics/i,
  /t-group/i,
  /marketing camp/i,
];

// These patterns indicate a commencement event with no named speaker — logistics/ceremony only.
const COMMENCEMENT_LOGISTICS = [
  /commencement\s+ceremony/i,
  /commencement\s+rehearsal/i,
  /commencement\s+reception/i,
  /commencement\s+ticket/i,
];

function isGSBSpeakerEvent(title: string): boolean {
  if (COMMENCEMENT_LOGISTICS.some((p) => p.test(title))) return false;
  return !GSB_SKIP_PATTERNS.some((p) => p.test(title));
}

export async function fetchGSBEvents(): Promise<StanfordEvent[]> {
  const res = await fetch(`${GSB_BASE}/events`, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'StanfordEventsAggregator/1.0' },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`GSB events page: HTTP ${res.status}`);

  const html = await res.text();
  const events: StanfordEvent[] = [];
  const seen = new Set<string>();

  // GSB uses two card layouts:
  // 1. Featured/hero cards: <a class="heading__link"> with date in .c-card__fe-date div
  // 2. List-row cards: plain <a href="/events/..."> with full date+time in surrounding text
  // Strategy: find ALL /events/* links, then extract context for date + title.

  const linkRe = /<a\s+[^>]*href="(\/events\/([\w-]+))"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;

  while ((m = linkRe.exec(html)) !== null) {
    const [, path, slug, rawTitle] = m;
    const title = extractText(rawTitle).trim();
    if (!title || title.length < 5) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);

    if (!isGSBSpeakerEvent(title)) continue;

    // ── Date extraction ────────────────────────────────────────────────
    // Look in the 800 chars BEFORE the link for date information.
    const blockStart = Math.max(0, m.index - 800);
    const before = html.slice(blockStart, m.index);
    const plainBefore = extractText(before);

    // The date can appear twice in the plain text (navigation + event card).
    // Use the LAST occurrence (closest to the link) then look for a time right after it.
    const dateOnlyRe = /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s*\d{4})/gi;
    const allDateMatches = [...plainBefore.matchAll(dateOnlyRe)];

    // Also try compact card format: <div class="date">May 14</div><div class="time">8:30am…</div>
    const compactDateM = /<div class="date">(.*?)<\/div>/.exec(before);
    const compactTimeM = /<div class="time">(.*?)<\/div>/.exec(before);

    let rawDate = '';
    let rawTime = '';

    if (allDateMatches.length > 0) {
      const lastDateMatch = allDateMatches[allDateMatches.length - 1];
      rawDate = lastDateMatch[1]; // e.g. "May 08, 2026"
      // Look for a time within ~120 chars after the last date match
      const afterDate = plainBefore.slice(
        lastDateMatch.index + lastDateMatch[0].length,
        lastDateMatch.index + lastDateMatch[0].length + 120
      );
      const timeMatch = /(\d{1,2}:\d{2}\s*[ap]m)/i.exec(afterDate);
      rawTime = timeMatch?.[1] ?? '12:00pm';
    } else if (compactDateM) {
      rawDate = compactDateM[1]; // e.g. "May 14" (year inferred inside parseGSBDate)
      rawTime = compactTimeM?.[1] ?? '12:00pm';
    }

    // Summary from card (look after the link for summary text)
    const afterBlock = html.slice(m.index + m[0].length, m.index + m[0].length + 600);
    const summaryM = /c-card__fe-summary[^>]*>([\s\S]*?)<\/div>/.exec(afterBlock);
    const cardSummary = summaryM ? extractText(summaryM[1]).trim() : '';

    let startDate = rawDate ? parseGSBDate(rawDate, rawTime) : undefined;
    let endDate: string | undefined;
    let description = cardSummary;
    let location: string | undefined;

    // If no date from the listing page, fetch the individual event detail page
    if (!startDate) {
      const detail = await fetchGSBEventDetail(slug);
      if (!detail?.startDate) continue;
      startDate = detail.startDate;
      endDate = detail.endDate;
      description = detail.description || cardSummary;
      location = detail.location;
    }

    if (new Date(startDate) < new Date()) continue;

    const shortDescription = description.slice(0, 200).trimEnd() + (description.length > 200 ? '…' : '');
    const eventUrl = `${GSB_BASE}${path}`;
    const topicTags = ['stanford gsb', 'business', 'leadership'];
    const topic = categorize(title, description, topicTags);

    events.push({
      id: hashId('gsb-' + title + '-' + startDate),
      title,
      description,
      shortDescription,
      startDate,
      endDate,
      location,
      isOnline: !!(location?.toLowerCase().includes('online') || location?.toLowerCase().includes('zoom')),
      url: eventUrl,
      source: 'GSB',
      topic,
      tags: topicTags,
      isFeatured: isFamousSpeaker(title + ' ' + description),
    });
  }

  return events;
}

// ── Stanford Statistics Department ICS ───────────────────────────────────────
// Statistics department publishes a Google Calendar ICS

export async function fetchStatisticsEvents(): Promise<StanfordEvent[]> {
  // Try multiple known Stanford Statistics calendar feeds
  const feeds = [
    'https://statistics.stanford.edu/events/ical/calendar.ics',
    'https://statistics.stanford.edu/events.ics',
  ];

  for (const feedUrl of feeds) {
    try {
      const events = await fetchICSFeed(feedUrl, 'Statistics');
      if (events.length > 0) return events;
    } catch {
      // Try next
    }
  }
  return [];
}

// ── Commencement Speakers ─────────────────────────────────────────────────────
// commencement.stanford.edu and the GSB newsroom announce commencement speakers
// via news articles, not the events calendar. We scrape both pages and create
// synthetic events so high-profile speakers aren't missed.

const COMMENCEMENT_URL = 'https://commencement.stanford.edu/';
const GSB_NEWS_URL = 'https://www.gsb.stanford.edu/experience/news-history';

/**
 * Attempt to find a commencement date on a given page.
 * Searches for the nearest June/May date >= today.
 */
function extractCommencementDate(text: string): string | undefined {
  const MONTHS: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  };
  const now = new Date();
  const dateRe = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})[,\s]+(\d{4})\b/gi;
  let bestDate: Date | undefined;
  let m: RegExpExecArray | null;
  while ((m = dateRe.exec(text)) !== null) {
    const month = MONTHS[m[1].toLowerCase()];
    const day = parseInt(m[2]);
    const year = parseInt(m[3]);
    const d = new Date(year, month - 1, day, 10, 0, 0); // assume 10am
    if (d > now) {
      if (!bestDate || d < bestDate) bestDate = d;
    }
  }
  if (!bestDate) return undefined;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${bestDate.getFullYear()}-${pad(bestDate.getMonth() + 1)}-${pad(bestDate.getDate())}T10:00:00-07:00`;
}

export async function fetchCommencementEvents(): Promise<StanfordEvent[]> {
  const events: StanfordEvent[] = [];
  const now = new Date();

  // ── 1. Stanford main commencement (commencement.stanford.edu) ────────────
  // The page renders news articles whose IDs follow the slug pattern
  // "firstname-lastname-will-be-stanfords-YEAR-commencement-speaker".
  // We also match the <h3> inner text directly.
  try {
    const res = await fetch(COMMENCEMENT_URL, {
      headers: { 'User-Agent': 'StanfordEventsAggregator/1.0' },
      next: { revalidate: 86400 }, // daily — commencement info changes slowly
    });
    if (res.ok) {
      const html = await res.text();
      const text = extractText(html);

      // Strategy A: match from article id slug (most reliable — no apostrophe issues)
      // e.g. id="sundar-pichai-will-be-stanfords-2026-commencement-speaker"
      const slugRe = /id="([a-z-]+-will-be-stanfords-\d{4}-commencement-speaker)"/i;
      // Strategy B: match from visible plain text (apostrophe-agnostic via `.`)
      const textRe = /([A-Z][a-z]+(?: [A-Z][a-z]+){1,3})\s+will\s+be\s+Stanford.s\s+\d{4}\s+Commencement\s+speaker/i;
      // Strategy C: "X to deliver/give the Commencement address" inside an <a> or <h3>
      const linkRe = /<(?:h[1-6]|a)[^>]*>([^<]{5,100}?)\s+will\s+(?:deliver|give)\s+(?:the\s+)?\d{4}\s+Commencement/i;

      let speakerName: string | undefined;

      const slugMatch = slugRe.exec(html);
      if (slugMatch) {
        // Convert slug to title case: "sundar-pichai" → "Sundar Pichai"
        const slug = slugMatch[1].replace(/-will-be-stanfords-\d+-commencement-speaker.*/, '');
        speakerName = slug
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      } else {
        const textMatch = textRe.exec(text) || linkRe.exec(html);
        if (textMatch) speakerName = textMatch[1].trim();
      }

      if (speakerName) {
        const startDate = extractCommencementDate(text);
        if (startDate && new Date(startDate) > now) {
          // Pull a one-sentence description from nearby text
          const descRe = new RegExp(
            speakerName.split(' ')[1] + // match on last name
            '[^.]{0,200}(?:CEO|COO|founder|president|professor|author|director)[^.]+\\.', 'i'
          );
          const descMatch = descRe.exec(text);
          const description = descMatch
            ? descMatch[0].trim()
            : `${speakerName} will deliver the keynote address at Stanford's Commencement ceremony.`;

          events.push({
            id: hashId(`commencement|stanford|${startDate.slice(0, 10)}`),
            title: `Stanford Commencement 2026: ${speakerName}`,
            description,
            shortDescription: description.slice(0, 200),
            speaker: { name: speakerName },
            startDate,
            location: 'Stanford Stadium',
            isOnline: false,
            url: COMMENCEMENT_URL,
            source: 'Stanford Events',
            topic: categorize(`Stanford Commencement ${speakerName}`, description, []),
            tags: [],
            isFeatured: true,
          });
        }
      }
    }
  } catch {
    // Non-fatal — commencement page may be inaccessible
  }

  // ── 2. GSB commencement / graduation address (gsb.stanford.edu news) ─────
  // The news list renders link text like:
  // <a href="/newsroom/...">Laurene Powell Jobs, MBA '91, to Give 2026 Graduation Address</a>
  // We extract from <a> text directly to avoid the "Written" label that
  // appears as a separate element and bleeds into the plain text.
  try {
    const res = await fetch(GSB_NEWS_URL, {
      headers: { 'User-Agent': 'StanfordEventsAggregator/1.0' },
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      const html = await res.text();

      // Match link text + capture the article href:
      // <a href="/newsroom/...">Name[, MBA 'YY], to Give YEAR Graduation Address</a>
      const linkTextRe =
        /href="(\/newsroom\/[^"]+)"[^>]*>\s*([A-Z][a-z]+(?: [A-Z][a-z.,']+){1,4})\s*(?:,\s*MBA[^,<]*)?\s*,?\s*to\s+(?:Give|Deliver)\s+\d{4}\s+(?:Graduation|Commencement)\s+Address/i;
      const gsbMatch = linkTextRe.exec(html);

      if (gsbMatch) {
        const articlePath = gsbMatch[1];
        const speakerName = gsbMatch[2].trim();

        // Fetch the detail article page to get the actual commencement date
        let startDate: string | undefined;
        try {
          const detailRes = await fetch(`${GSB_BASE}${articlePath}`, {
            headers: { 'User-Agent': 'StanfordEventsAggregator/1.0' },
            next: { revalidate: 86400 },
          });
          if (detailRes.ok) {
            const detailText = extractText(await detailRes.text());
            startDate = extractCommencementDate(detailText);
          }
        } catch { /* fall through */ }

        // If detail page has no date, fall back to listing page
        if (!startDate) {
          const text = extractText(html);
          startDate = extractCommencementDate(text);
        }

        if (startDate && new Date(startDate) > now) {
          const description = `${speakerName} will deliver the address at Stanford GSB's 2026 Graduation Ceremony.`;
          events.push({
            id: hashId(`commencement|gsb|${startDate.slice(0, 10)}`),
            title: `GSB Commencement 2026: ${speakerName}`,
            description,
            shortDescription: description,
            speaker: { name: speakerName },
            startDate,
            location: 'Stanford GSB Campus',
            isOnline: false,
            url: `${GSB_BASE}${articlePath}`,
            source: 'GSB',
            topic: categorize(`GSB Commencement ${speakerName}`, description, []),
            tags: [],
            isFeatured: true,
          });
        }
      }
    }
  } catch {
    // Non-fatal
  }

  return events;
}
