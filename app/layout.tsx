import './globals.css';
import { Providers } from './providers';
import { Analytics } from '@vercel/analytics/react';
import type { Metadata, Viewport } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bananafood.app';

export const metadata: Metadata = {
  title: 'BananaFood',
  description: 'Snap, translate, eat - AI-powered menu translation & food recognition',
  manifest: '/manifest.json',
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BananaFood',
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
