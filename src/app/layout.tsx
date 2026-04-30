import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Stanford Speaker Events',
  description:
    'Aggregated upcoming speaker events from Stanford University — categorised by topic with filtering and source links.',
  openGraph: {
    title: 'Stanford Speaker Events',
    description: 'Discover upcoming Stanford talks, seminars, and colloquia.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
