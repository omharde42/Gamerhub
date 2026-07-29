import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, Orbitron, Rajdhani, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron', display: 'swap' });
const rajdhani = Rajdhani({ weight: ['500', '600', '700'], subsets: ['latin'], variable: '--font-rajdhani', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', display: 'swap' });

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
      <body className={`${inter.className} ${inter.variable} ${plusJakarta.variable} ${orbitron.variable} ${rajdhani.variable} ${spaceGrotesk.variable}`}>
        <Providers>
          <DashboardLayout>{children}</DashboardLayout>
        </Providers>
      </body>
    </html>
  );
}
