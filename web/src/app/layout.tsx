import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-jakarta' });

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0A0E17' },
    { media: '(prefers-color-scheme: light)', color: '#F1F5F9' },
  ],
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'GamerZ Hub - The Ultimate AAA Gaming Ecosystem',
  description: 'Connect, compete, and level up. The professional AAA network for gamers.',
  keywords: 'gaming, esports, tournaments, teams, gaming community',
  icons: {
    icon: '/logo.webp',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preload" href="/logo.webp" as="image" type="image/webp" fetchPriority="high" />
      </head>
      <body className={`${inter.className} ${inter.variable} ${plusJakarta.variable}`}>
        <Providers>
          <DashboardLayout>{children}</DashboardLayout>
        </Providers>
      </body>
    </html>
  );
}
