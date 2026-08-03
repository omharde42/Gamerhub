'use client';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { MobileBottomNav } from './mobile-bottom-nav';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import toast from 'react-hot-toast';
import { UpdateChecker } from '../common/update-checker';

// Routes prefetched eagerly after a session is restored so navigation is instant.
const PREFETCH_ROUTES = ['/feed', '/messages', '/notifications', '/dashboard'];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, lastPath, setLastPath } = useAuthStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const restoredRef = useRef(false);

  const isLanding = pathname === '/';
  const isAuthRoute = pathname === '/' || pathname?.startsWith('/auth') || pathname?.startsWith('/auth/');
  const hideSidebar = isAuthRoute || pathname?.startsWith('/messages');
  const hideBottomNav = isAuthRoute || pathname?.startsWith('/messages');
  const isServerPage = pathname?.startsWith('/servers/');
  const isMessages = pathname?.startsWith('/messages');

  // Hydration of zustand's persist store is synchronous with localStorage, so
  // this resolves within the first render cycle — no artificial delay needed.
  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }
    return () => unsubscribe();
  }, []);

  // Remember the last visited page (skipping landing/auth) for instant restore.
  useEffect(() => {
    if (!hasHydrated || isAuthRoute || !isAuthenticated) return;
    setLastPath(pathname);
  }, [pathname, hasHydrated, isAuthenticated, setLastPath]);

  // Restore the last visited page instead of always forcing /feed.
  useEffect(() => {
    if (!hasHydrated) return;

    // Guard 1: Unauthenticated on a private page → login (silent, no splash).
    if (!isAuthenticated && !isAuthRoute) {
      router.replace('/auth/login');
      return;
    }

    // Guard 2: Authenticated on landing/auth → restore last page or feed.
    if (isAuthenticated && user && isAuthRoute && pathname !== '/auth/callback') {
      if (restoredRef.current) return;
      restoredRef.current = true;
      const target = lastPath && lastPath !== '/' ? lastPath : '/feed';
      setLastPath(null);
      router.replace(target);
    }
  }, [hasHydrated, user, isAuthenticated, isAuthRoute, pathname, router, lastPath, setLastPath]);

  // Background session validation + silent user refresh. Never blocks rendering.
  useSessionRefresh(hasHydrated && !!isAuthenticated);

  // Prefetch the critical routes right after session restore.
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;
    const t = setTimeout(() => {
      PREFETCH_ROUTES.forEach((route) => {
        if (route !== pathname) router.prefetch(route);
      });
      if (user?.profile?.username) router.prefetch(`/profile/${user.profile.username}`);
    }, 400);
    return () => clearTimeout(t);
  }, [hasHydrated, isAuthenticated, pathname, router, user?.profile?.username]);

  // Guard 3: Redirect to settings if the Gamer Passport is incomplete.
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user) return;
    const isProfileIncomplete = !user.profile || !user.profile.displayName?.trim();
    const onSettingsPage = pathname === '/profile/settings';
    if (isProfileIncomplete && !onSettingsPage && !isAuthRoute) {
      toast('Gamer Passport incomplete. Please complete setup!', { id: 'setup-guard-toast' });
      router.push('/profile/settings');
    }
  }, [hasHydrated, user, isAuthenticated, isAuthRoute, pathname, router]);

  // Only show the branded splash while the persisted session is being read
  // (a single synchronous tick with localStorage — typically invisible).
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-[#05070E] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-primary/20 shadow-xl relative shrink-0">
            <img src="/logo.jpg" alt="GamerZ Hub" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
            <span>Initializing GamerZ Hub...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header role="banner" className={isMessages ? "hidden md:block" : "block"}>
        <Navbar />
      </header>
      <div className={`w-full ${!isLanding ? (isMessages ? 'pt-0 md:pt-16 pb-0' : 'pt-16 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0') : ''}`}>
        <div className={`w-full mx-auto flex gap-3 lg:gap-4 ${isMessages ? 'px-0 md:px-6 py-0 md:py-4' : 'px-3 md:px-6 py-3 md:py-4'}`}>
          {!hideSidebar && !isServerPage && !isMessages && (
            <aside aria-label="Control Panel" className="hidden md:block shrink-0">
              <Sidebar />
            </aside>
          )}
          <main id="main-content" role="main" className="flex-1 min-w-0 max-w-full">
            {children}
          </main>
        </div>
      </div>
      {!hideBottomNav && (
        <nav aria-label="Mobile Navigation" className="block md:hidden">
          <MobileBottomNav />
        </nav>
      )}
      <UpdateChecker />
    </div>
  );
}
