'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell, ExternalLink, Gamepad2, Search, Settings, Trophy, User, UserCheck, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PremiumModal, type PremiumModalSize } from '@/components/ui/premium-modal';
import { useOverlayStore, type PanelType } from '@/store/overlayStore';
import { PopularGamesPanel } from '@/components/games/popular-games-panel';

import SearchPage from '@/app/search/page';
import NotificationsPage from '@/app/notifications/page';
import TournamentsPage from '@/app/tournaments/page';
import SettingsPage from '@/app/profile/settings/page';
import ConnectionsPage from '@/app/connections/page';
import ProfilePage from '@/app/profile/[username]/page';

const PANEL_META: Record<
  PanelType,
  { title: string; icon: React.ComponentType<{ className?: string }>; href: string; size: PremiumModalSize }
> = {
  profile: { title: 'Profile', icon: User, href: '/profile', size: 'xl' },
  search: { title: 'Search', icon: Search, href: '/search', size: 'lg' },
  notifications: { title: 'Notifications', icon: Bell, href: '/notifications', size: 'lg' },
  tournaments: { title: 'Tournaments', icon: Trophy, href: '/tournaments', size: 'xl' },
  settings: { title: 'Settings', icon: Settings, href: '/profile/settings', size: 'xl' },
  connections: { title: 'Connections', icon: UserCheck, href: '/connections', size: 'lg' },
  games: { title: 'Popular Games', icon: Gamepad2, href: '/explore', size: 'lg' },
};

function renderPanelContent(panel: PanelType | null, panelUsername: string | null): React.ReactNode {
  switch (panel) {
    case 'search':
      return <SearchPage />;
    case 'notifications':
      return <NotificationsPage />;
    case 'tournaments':
      return <TournamentsPage />;
    case 'settings':
      return <SettingsPage />;
    case 'connections':
      return <ConnectionsPage />;
    case 'profile':
      return <ProfilePage />;
    case 'games':
      return <PopularGamesPanel />;
    default:
      return null;
  }
}

/**
 * Renders page-level features (Profile, Search, Notifications, Tournaments,
 * Settings, Connections, Popular Games) as premium overlay panels on top of
 * the current page. The routes still exist as full pages (deep links work).
 */
export function PanelHost() {
  const panel = useOverlayStore((s) => s.panel);
  const panelUsername = useOverlayStore((s) => s.panelUsername);
  const closePanel = useOverlayStore((s) => s.closePanel);
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  // Keep the last panel type around while its exit animation plays.
  const [exitPanel, setExitPanel] = useState<PanelType | null>(null);
  const effectivePanel = panel ?? exitPanel;

  // Close the panel whenever the underlying route changes (e.g. a Link clicked
  // inside the panel navigates to another page).
  useEffect(() => {
    if (prevPath.current !== pathname) closePanel();
    prevPath.current = pathname;
  }, [pathname, closePanel]);

  const meta = effectivePanel ? PANEL_META[effectivePanel] : null;

  return (
    <PremiumModal
      open={!!panel}
      onClose={closePanel}
      onExitComplete={() => setExitPanel(null)}
      variant="bottom"
      size={meta?.size ?? 'lg'}
      title={meta?.title}
      header={
        meta ? (
          <div className="flex w-full items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full hover:bg-accent"
              onClick={closePanel}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
            <meta.icon className="h-4 w-4 shrink-0 text-primary" />
            <h2 className="truncate text-base font-bold tracking-tight">{meta.title}</h2>
            <Link
              href={meta.href}
              onClick={closePanel}
              className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className={cn('hidden sm:inline')}>Full page</span>
            </Link>
          </div>
        ) : undefined
      }
    >
      {renderPanelContent(effectivePanel, panelUsername)}
    </PremiumModal>
  );
}
