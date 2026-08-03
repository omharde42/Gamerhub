'use client';
import { ReactNode, useEffect, useState, useRef } from 'react';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { MobileBottomNav } from './mobile-bottom-nav';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { UpdateChecker } from '../common/update-checker';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // Use our useAuth hook to silently refresh/validate session in the background
  useAuth();

  const [hasHydrated, setHasHydrated] = useState(false);
  const splashTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isLanding = pathname === '/';
  const isAuthOrLanding = pathname === '/' || pathname?.startsWith('/auth') || pathname?.startsWith('/auth/');
  const hideSidebar = pathname === '/' || pathname?.startsWith('/auth') || pathname?.startsWith('/auth/') || pathname?.startsWith('/messages');
  const hideBottomNav = pathname === '/' || pathname?.startsWith('/auth') || pathname?.startsWith('/auth/') || pathname?.startsWith('/messages');
  const isServerPage = pathname?.startsWith('/servers/');
  const isMessages = pathname?.startsWith('/messages');

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }

    // High performance target: Under 150ms splash screen duration if hydrated, max 250ms fallback
    splashTimerRef.current = setTimeout(() => {
      setHasHydrated(true);
    }, 200);

    return () => {
      unsubscribe();
      if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    // Guard 1: Redirect to login if unauthenticated and trying to access private page
    if (!isAuthenticated && !isAuthOrLanding) {
      router.push('/auth/login');
      return;
    }

    // Guard 2: Redirect to feed if authenticated and trying to access landing/auth page
    if (isAuthenticated && user && isAuthOrLanding && pathname !== '/auth/callback') {
      router.push('/feed');
      return;
    }

    // Guard 3: Redirect to profile settings if profile is incomplete
    if (isAuthenticated && user) {
      const isProfileIncomplete = 
        !user.profile ||
        !user.profile.displayName?.trim();

      const onSettingsPage = pathname === '/profile/settings';

      if (isProfileIncomplete && !onSettingsPage && !isAuthOrLanding) {
        toast('Gamer Passport incomplete. Please complete setup!', { id: 'setup-guard-toast' });
        router.push('/profile/settings');
      }
    }
  }, [hasHydrated, user, isAuthenticated, isAuthOrLanding, pathname, router]);

  // Instantly restore session: If we are already authenticated with cached credentials,
  // render the UI immediately in the background, skipping any blocking splash redirects
  const isRedirectingAuthenticatedUser = isAuthenticated && !!user && isAuthOrLanding && pathname !== '/auth/callback';
  const isRedirectingUnauthenticatedUser = !isAuthenticated && !isAuthOrLanding;

  // Render a branded GamerZ Hub splash screen for less than 300 ms
  if (!hasHydrated || isRedirectingAuthenticatedUser || isRedirectingUnauthenticatedUser) {
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
