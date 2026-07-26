'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Newspaper, MessageSquare, Users, Bell
} from 'lucide-react';

const mobileNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/feed', icon: Newspaper, label: 'Feed' },
  { href: '/messages', icon: MessageSquare, label: 'Chat' },
  { href: '/friends', icon: Users, label: 'Network' },
  { href: '/notifications', icon: Bell, label: 'Alerts' },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(href) || pathname === href;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-background/90 backdrop-blur-xl border-t border-primary/20 shadow-[0_-4px_20px_hsl(var(--background)/0.8)] safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-1.5">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 min-w-[56px] relative ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground/70 hover:text-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 transition-all duration-200 ${
                  active ? 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]' : ''
                }`} />
                <span className="truncate max-w-[56px]">{item.label}</span>
                {active && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
