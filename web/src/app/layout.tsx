import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

const inter = { className: 'font-sans', variable: '--font-inter' };
const plusJakarta = { variable: '--font-jakarta' };

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0b0e',
};

export const metadata: Metadata = {
  title: 'GamerZ Hub - The Ultimate AAA Gaming Ecosystem',
  description: 'Connect, compete, and level up. The professional AAA network for gamers.',
  keywords: 'gaming, esports, tournaments, teams, gaming community',
  icons: {
    icon: '/logo.jpg',
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
        <link rel="preload" href="/logo.jpg" as="image" type="image/jpeg" fetchPriority="high" />
      </head>
      <body className={`${inter.className} ${inter.variable} ${plusJakarta.variable}`}>
        <Providers>
          <DashboardLayout>{children}</DashboardLayout>
        </Providers>
      </body>
    </html>
  );
}
