'use client';
import { ReactNode } from 'react';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { usePathname } from 'next/navigation';
export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLandingOrAuth = pathname === '/' || pathname?.startsWith('/auth');
  return (<div className="min-h-screen bg-grid"><Navbar /><Sidebar /><main className={`transition-all duration-300 ${!isLandingOrAuth ? 'pt-16 md:pl-60' : ''}`}><div className="p-4 md:p-6 lg:p-8">{children}</div></main></div>);
}
