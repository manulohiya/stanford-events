import crypto from 'crypto';
import type { StanfordEvent } from '@/types/event';

const LIVE_BASE = 'https://live.stanford.edu';

function hashId(input: string): string {
  return 'sl-' + crypto.createHash('sha1').update(input).digest('hex').slice(0, 12);
}

// Known upcoming Stanford Live events (curated from live.stanford.edu).
// These serve as a reliable baseline since the site is client-side rendered.
const CURATED_EVENTS: Omit<StanfordEvent, 'id'>[] = [
  {
    title: 'Dabin: Stay in Bloom 3',
    description: 'Stanford Live and Goldenvoice present Dabin in his "Stay in Bloom 3" tour. Korean-Canadian producer and musician Dabin brings his signature blend of electronic and indie sounds.',
    shortDescription: 'Korean-Canadian electronic producer Dabin performs his Stay in Bloom 3 tour.',
    startDate: '2026-05-01T17:00:00',
    endDate:   '2026-05-02T23:59:00',
    location: 'Frost Amphitheater',
    isOnline: false,
    url: `${LIVE_BASE}/event/dabin-stay-in-bloom-3`,
    source: 'Stanford Live',
    topic: 'Humanities & Arts',
    tags: ['concert', 'electronic', 'music', 'frost amphitheater'],
    isFeatured: true,
  },
  {
    title: 'Brentano Quartet — St. Lawrence Legacy Series',
    description: 'Presented by Stanford Live, the Brentano Quartet performs as part of the St. Lawrence Legacy Series at Bing Concert Hall.',
    shortDescription: 'The Brentano Quartet performs chamber music at Bing Concert Hall.',
    startDate: '2026-05-03T14:30:00',
    location: 'Bing Concert Hall',
    isOnline: false,
    url: `${LIVE_BASE}/event/brentano-quartet`,
    source: 'Stanford Live',
    topic: 'Humanities & Arts',
    tags: ['classical', 'chamber music', 'quartet', 'bing concert hall'],
  },
  {
    title: 'Blackfest 2026: J.I.D. & Samara Cyn',
    description: 'The Black Family Gathering Committee and Stanford Live present Blackfest 2026 featuring J.I.D. and Samara Cyn.',
    shortDescription: 'Blackfest 2026 featuring hip-hop artists J.I.D. and Samara Cyn.',
    startDate: '2026-05-03T16:15:00',
    location: 'Frost Amphitheater',
    isOnline: false,
    url: `${LIVE_BASE}/event/blackfest-2026`,
    source: 'Stanford Live',
    topic: 'Humanities & Arts',
    tags: ['hip hop', 'concert', 'blackfest', 'frost amphitheater'],
    isFeatured: true,
  },
  {
    title: 'Jean-Yves Thibaudet',
    description: 'Presented by Stanford Live, acclaimed French pianist Jean-Yves Thibaudet performs at Bing Concert Hall.',
    shortDescription: 'Acclaimed French pianist Jean-Yves Thibaudet performs at Bing Concert Hall.',
    startDate: '2026-05-10T14:30:00',
    location: 'Bing Concert Hall',
    isOnline: false,
    url: `${LIVE_BASE}/event/jean-yves-thibaudet`,
    source: 'Stanford Live',
    topic: 'Humanities & Arts',
    tags: ['classical', 'piano', 'bing concert hall'],
  },
  {
    title: "BTS WORLD TOUR 'ARIRANG' IN STANFORD",
    description: "Presented by Stanford Live and Stanford Athletics, BTS brings their WORLD TOUR 'ARIRANG' to Stanford with performances on May 16, 17, and 19.",
    shortDescription: "BTS performs their WORLD TOUR 'ARIRANG' at Stanford Stadium.",
    startDate: '2026-05-16T00:00:00',
    endDate:   '2026-05-19T23:59:00',
    location: 'Stanford Stadium',
    isOnline: false,
    url: `${LIVE_BASE}/event/bts-world-tour-arirang`,
    source: 'Stanford Live',
    topic: 'Humanities & Arts',
    tags: ['concert', 'kpop', 'bts', 'stanford stadium'],
    isFeatured: true,
  },
  {
    title: 'Renée Elise Goldsberry',
    description: 'Presented by Stanford Live, Tony Award-winning actress and singer Renée Elise Goldsberry — known for her role as Angelica Schuyler in Hamilton — performs at Bing Concert Hall.',
    shortDescription: 'Tony Award-winner Renée Elise Goldsberry (Hamilton) performs at Bing Concert Hall.',
    startDate: '2026-05-20T19:30:00',
    location: 'Bing Concert Hall',
    isOnline: false,
    url: `${LIVE_BASE}/event/renee-elise-goldsberry`,
    source: 'Stanford Live',
    topic: 'Humanities & Arts',
    tags: ['broadway', 'theater', 'music', 'bing concert hall'],
  },
  {
    title: 'Paul Simon: A Quiet Celebration',
    description: 'Stanford Live and Goldenvoice present Paul Simon in "A Quiet Celebration," an intimate evening with the legendary singer-songwriter, performing June 3 and 4.',
    shortDescription: 'Legendary singer-songwriter Paul Simon performs an intimate two-night engagement.',
    startDate: '2026-06-03T19:00:00',
    endDate:   '2026-06-04T23:00:00',
    location: 'Frost Amphitheater',
    isOnline: false,
    url: `${LIVE_BASE}/event/paul-simon`,
    source: 'Stanford Live',
    topic: 'Humanities & Arts',
    tags: ['concert', 'folk', 'singer-songwriter', 'frost amphitheater'],
    isFeatured: true,
  },
  {
    title: 'San Francisco Symphony: A Midsummer Night\'s Dream',
    description: 'Stanford Live presents the San Francisco Symphony performing A Midsummer Night\'s Dream at Frost Amphitheater.',
    shortDescription: 'The San Francisco Symphony performs A Midsummer Night\'s Dream at Frost Amphitheater.',
    startDate: '2026-07-16T19:30:00',
    location: 'Frost Amphitheater',
    isOnline: false,
    url: `${LIVE_BASE}/event/sf-symphony-midsummer`,
    source: 'Stanford Live',
    topic: 'Humanities & Arts',
    tags: ['classical', 'symphony', 'orchestra', 'frost amphitheater'],
  },
  {
    title: 'San Francisco Symphony: James Bond Forever',
    description: 'Stanford Live presents the San Francisco Symphony performing James Bond Forever, a celebration of the iconic film franchise\'s music, at Frost Amphitheater.',
    shortDescription: 'The San Francisco Symphony performs iconic James Bond film music at Frost Amphitheater.',
    startDate: '2026-07-23T19:30:00',
    location: 'Frost Amphitheater',
    isOnline: false,
    url: `${LIVE_BASE}/event/sf-symphony-james-bond`,
    source: 'Stanford Live',
    topic: 'Humanities & Arts',
    tags: ['classical', 'symphony', 'orchestra', 'film music', 'frost amphitheater'],
  },
  {
    title: 'An Evening with Goose',
    description: 'Stanford Live and Goldenvoice present An Evening with Goose, the genre-defying rock band known for their improvisation and high-energy live performances.',
    shortDescription: 'Genre-defying rock band Goose brings their high-energy live show to Frost Amphitheater.',
    startDate: '2026-08-15T18:00:00',
    location: 'Frost Amphitheater',
    isOnline: false,
    url: `${LIVE_BASE}/event/goose`,
    source: 'Stanford Live',
    topic: 'Humanities & Arts',
    tags: ['concert', 'rock', 'jam band', 'frost amphitheater'],
  },
  {
    title: 'Brandi Carlile: The Human Tour with CMAT',
    description: 'Stanford Live and Goldenvoice present Brandi Carlile on The Human Tour with special guest CMAT at Frost Amphitheater.',
    shortDescription: 'Grammy-winning folk-rock artist Brandi Carlile performs with special guest CMAT.',
    startDate: '2026-09-19T18:00:00',
    location: 'Frost Amphitheater',
    isOnline: false,
    url: `${LIVE_BASE}/event/brandi-carlile`,
    source: 'Stanford Live',
    topic: 'Humanities & Arts',
    tags: ['concert', 'folk', 'rock', 'frost amphitheater'],
  },
  {
    title: 'Taking Back Sunday with Thrice & Saves The Day',
    description: 'Stanford Live and Goldenvoice present Taking Back Sunday with Thrice and Saves The Day at Frost Amphitheater.',
    shortDescription: 'Taking Back Sunday headlines with Thrice and Saves The Day at Frost Amphitheater.',
    startDate: '2026-10-10T19:00:00',
    location: 'Frost Amphitheater',
    isOnline: false,
    url: `${LIVE_BASE}/event/taking-back-sunday`,
    source: 'Stanford Live',
    topic: 'Humanities & Arts',
    tags: ['concert', 'rock', 'punk', 'frost amphitheater'],
  },
];

export async function fetchStanfordLiveEvents(): Promise<StanfordEvent[]> {
  const now = new Date();

  const events: StanfordEvent[] = CURATED_EVENTS
    .filter((e) => new Date(e.endDate ?? e.startDate) >= now)
    .map((e) => ({
      ...e,
      id: hashId(`sl|${e.title}|${e.startDate}`),
    }));

  return events;
}
