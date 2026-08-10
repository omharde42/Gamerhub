'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Newspaper, MessageSquare, Trophy, User, Search
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useOverlayStore, type PanelType } from '@/store/overlayStore';
import { usePanelNav } from '@/hooks/usePanelNav';

const mobileNavItems: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  panel?: PanelType;
}[] = [
  { href: '/feed', icon: Newspaper, label: 'Feed' },
  { href: '/search', icon: Search, label: 'Search', panel: 'search' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/tournaments', icon: Trophy, label: 'Tournaments', panel: 'tournaments' },
  { href: '/profile', icon: User, label: 'Profile', panel: 'profile' },
];

export function MobileBottomNav({ hidden = false }: { hidden?: boolean }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const panel = useOverlayStore((s) => s.panel);
  const openPanelFromNav = usePanelNav();

  const { data: chatUnreadData } = useQuery({
    queryKey: ['chat-unread'],
    queryFn: () => api.get('/chat/unread-counts').then(r => r.data.data || {}),
    refetchInterval: 15000,
    enabled: !!user && pathname !== '/' && !pathname?.startsWith('/auth'),
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => api.get('/notifications/unread-count').then(r => r.data.data),
    refetchInterval: 30000,
    enabled: !!user && pathname !== '/' && !pathname?.startsWith('/auth'),
  });

  const totalChatUnread = Object.values(chatUnreadData || {}).reduce((sum: number, c: any) => sum + (c as number), 0);

  const isActive = (item: (typeof mobileNavItems)[number]) => {
    if (item.panel) {
      const onRoute = pathname === item.href || pathname?.startsWith(item.href + '/');
      if (item.panel === 'profile') {
        const onProfilePage = pathname?.startsWith('/profile/') && !pathname?.endsWith('/settings');
        return onProfilePage || panel === 'profile';
      }
      return onRoute || panel === item.panel;
    }
    return pathname === item.href || pathname?.startsWith(item.href + '/');
  };

  return (
    <motion.nav
      initial={false}
      animate={{ y: hidden ? '100%' : '0%', opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden ${hidden ? 'pointer-events-none' : ''}`}
      aria-hidden={hidden || undefined}
      inert={hidden}
    >
      <div className="bg-background/90 backdrop-blur-xl border-t border-primary/20 shadow-[0_-4px_20px_hsl(var(--background)/0.8)] safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-1.5">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            const isChat = item.href === '/messages';
            const isProfile = item.href === '/profile';
            const panelType = item.panel;

            // Dynamically resolve /profile to current user's profile
            const targetHref = isProfile && user?.profile?.username
              ? `/profile/${user.profile.username}`
              : item.href;

            const className = `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 min-w-[56px] relative ${
              active
                ? 'text-primary'
                : 'text-muted-foreground/70 hover:text-foreground'
            }`;

            const content = (
              <>
                <div className="relative">
                  <Icon className={`h-5 w-5 transition-all duration-200 ${
                    active ? 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]' : ''
                  }`} />
                  {isChat && totalChatUnread > 0 && (
                    <span className="absolute -top-1 -right-2 h-3.5 min-w-[14px] px-1 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center shadow-sm">
                      {totalChatUnread > 9 ? '9+' : totalChatUnread}
                    </span>
                  )}
                </div>
                <span className="truncate max-w-[56px]">{item.label}</span>
                {active && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
                )}
              </>
            );

            if (panelType) {
              return (
                <button
                  key={item.href}
                  onClick={() => openPanelFromNav(panelType, panelType === 'profile' ? { username: user?.profile?.username } : undefined)}
                  className={className}
                  aria-label={item.label}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={targetHref}
                className={className}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
