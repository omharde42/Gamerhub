import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers';
const inter = Inter({ subsets: ['latin'] });
export const metadata: Metadata = { title: 'GamerHub - The Ultimate Gaming Network', description: 'Connect, compete, and level up. The professional network for gamers.', keywords: 'gaming, esports, tournaments, teams, gaming community' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return (<html lang="en" suppressHydrationWarning><body className={inter.className}><Providers>{children}</Providers></body></html>); }
