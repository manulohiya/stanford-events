// ─────────────────────────────────────────────
// Core domain types for Stanford Events aggregator
// ─────────────────────────────────────────────

export type TopicCategory =
  | 'AI & Machine Learning'
  | 'Computer Science'
  | 'Medicine & Health'
  | 'Business & Economics'
  | 'Law & Policy'
  | 'Physics & Mathematics'
  | 'Social Sciences'
  | 'Humanities & Arts'
  | 'Environment & Climate'
  | 'Other';

export type EventSource =
  | 'Stanford Events'
  | 'Stanford Live'
  | 'HAI'
  | 'SAIL'
  | 'EE380'
  | 'GSB'
  | 'Law School'
  | 'Medicine'
  | 'Hoover'
  | 'Physics'
  | 'Statistics'
  | 'Mock';

export interface Speaker {
  name: string;
  title?: string;
  institution?: string;
}

export interface StanfordEvent {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  speaker?: Speaker;
  startDate: string;   // ISO 8601
  endDate?: string;    // ISO 8601
  location?: string;
  isOnline: boolean;
  url: string;
  source: EventSource;
  topic: TopicCategory;
  tags: string[];
  imageUrl?: string;
  isFeatured?: boolean;
}

export interface EventFilters {
  topics: TopicCategory[];
  sources: EventSource[];
  search: string;
  dateRange: 'this-week' | 'this-month' | 'all';
  onlineOnly: boolean;
}

export const ALL_TOPICS: TopicCategory[] = [
  'AI & Machine Learning',
  'Computer Science',
  'Medicine & Health',
  'Business & Economics',
  'Law & Policy',
  'Physics & Mathematics',
  'Social Sciences',
  'Humanities & Arts',
  'Environment & Climate',
  'Other',
];

export const ALL_SOURCES: EventSource[] = [
  'Stanford Events',
  'Stanford Live',
  'HAI',
  'SAIL',
  'EE380',
  'GSB',
  'Law School',
  'Medicine',
  'Hoover',
  'Physics',
  'Statistics',
];

export const TOPIC_COLORS: Record<TopicCategory, string> = {
  'AI & Machine Learning':   'bg-violet-100 text-violet-800 border-violet-200',
  'Computer Science':        'bg-blue-100 text-blue-800 border-blue-200',
  'Medicine & Health':       'bg-green-100 text-green-800 border-green-200',
  'Business & Economics':    'bg-amber-100 text-amber-800 border-amber-200',
  'Law & Policy':            'bg-orange-100 text-orange-800 border-orange-200',
  'Physics & Mathematics':   'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Social Sciences':         'bg-teal-100 text-teal-800 border-teal-200',
  'Humanities & Arts':       'bg-rose-100 text-rose-800 border-rose-200',
  'Environment & Climate':   'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Other':                   'bg-gray-100 text-gray-700 border-gray-200',
};

export const TOPIC_DOT_COLORS: Record<TopicCategory, string> = {
  'AI & Machine Learning':   'bg-violet-500',
  'Computer Science':        'bg-blue-500',
  'Medicine & Health':       'bg-green-500',
  'Business & Economics':    'bg-amber-500',
  'Law & Policy':            'bg-orange-500',
  'Physics & Mathematics':   'bg-indigo-500',
  'Social Sciences':         'bg-teal-500',
  'Humanities & Arts':       'bg-rose-500',
  'Environment & Climate':   'bg-emerald-500',
  'Other':                   'bg-gray-400',
};

export const SOURCE_LABELS: Record<EventSource, string> = {
  'Stanford Events': 'Stanford Events',
  'Stanford Live':   'Stanford Live (Concerts)',
  'HAI':             'Human-Centered AI',
  'SAIL':            'Stanford AI Lab',
  'EE380':           'EE380 Colloquium',
  'GSB':             'Graduate School of Business',
  'Law School':      'Law School',
  'Medicine':        'School of Medicine',
  'Hoover':          'Hoover Institution',
  'Physics':         'Physics Department',
  'Statistics':      'Statistics Department',
  'Mock':            'Mock',
};
