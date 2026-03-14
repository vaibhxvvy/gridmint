import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gridbox — CSS Background Pattern Generator',
  description:
    'Generate beautiful CSS background patterns instantly. Copy CSS, SCSS, Tailwind, React, Next.js or TSX. Zero dependencies.',
  keywords: ['css background', 'pattern generator', 'background texture', 'gridbox', 'css patterns'],
  metadataBase: new URL('https://gridbox.ink'),
  openGraph: {
    title: 'Gridbox — CSS Background Pattern Generator',
    description: 'Pick a pattern. Tweak it. Copy the code in any format.',
    url: 'https://gridbox.ink',
    siteName: 'Gridbox',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gridbox — CSS Background Pattern Generator',
    description: 'Pick a pattern. Tweak it. Copy the code in any format.',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          type="image/svg+xml"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='%230a0a0a'/><text x='50%25' y='56%25' font-family='monospace' font-size='24' font-weight='bold' fill='%23c8ff00' text-anchor='middle' dominant-baseline='middle'>gb</text></svg>"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
