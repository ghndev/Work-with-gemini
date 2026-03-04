import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://aura-puzzles.com'), // Replace with actual URL
  title: {
    default: 'Aura Puzzles',
    template: '%s | Aura Puzzles',
  },
  description:
    'Generate beautiful, aesthetic puzzles with AI. Play instantly online.',
  keywords: ['puzzle', 'jigsaw', 'AI puzzle', 'game', 'Aura'],
  openGraph: {
    title: 'Aura Puzzles',
    description:
      'Generate beautiful, aesthetic puzzles with AI. Play instantly online.',
    url: '/',
    siteName: 'Aura Puzzles',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aura Puzzles',
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
