'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { LayoutDashboard, Newspaper, Users, Trophy, Briefcase, Building2, MessageSquare, BarChart3, Bot, Shield, Crown } from 'lucide-react';
const navItems = [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }, { href: '/feed', label: 'Feed', icon: Newspaper }, { href: '/teams', label: 'Teams', icon: Users }, { href: '/tournaments', label: 'Tournaments', icon: Trophy }, { href: '/jobs', label: 'Jobs', icon: Briefcase }, { href: '/organizations', label: 'Organizations', icon: Building2 }, { href: '/messages', label: 'Messages', icon: MessageSquare }, { href: '/analytics', label: 'Analytics', icon: BarChart3 }, { href: '/ai-coach', label: 'AI Coach', icon: Bot }, { href: '/premium', label: 'Premium', icon: Crown },];
export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen } = useUIStore();
  if (pathname === '/' || pathname?.startsWith('/auth')) return null;
  return (<aside className={`fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-0 md:w-16'} overflow-hidden`}><nav className="flex flex-col gap-1 p-2 pt-4"><div className="space-y-1">{navItems.map((item) => { const Icon = item.icon; const isActive = pathname === item.href || pathname?.startsWith(item.href + '/'); return (<Link key={item.href} href={item.href} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all', isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}><Icon className="h-5 w-5 shrink-0" /><span className={cn('transition-opacity', sidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden')}>{item.label}</span></Link>); })}</div></nav></aside>);
}
