import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Aura Puzzle',
    template: '%s | Aura Puzzle',
  },
  description:
    'Generate beautiful, aesthetic puzzles with AI. Play instantly online.',
  keywords: ['puzzle', 'jigsaw', 'AI puzzle', 'game', 'Aura'],
  openGraph: {
    title: 'Aura Puzzle',
    description:
      'Generate beautiful, aesthetic puzzles with AI. Play instantly online.',
    url: '/',
    siteName: 'Aura Puzzle',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aura Puzzle',
    description:
      'Generate beautiful, aesthetic puzzles with AI. Play instantly online.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
