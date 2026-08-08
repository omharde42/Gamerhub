'use client';
import { ReactNode, useEffect, useState } from 'react';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { MobileBottomNav } from './mobile-bottom-nav';
import { ScrollControls } from './scroll-controls';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useAutoHideNav } from '@/hooks/useAutoHideNav';
import toast from 'react-hot-toast';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // Validate and refresh session silently in the background
  useAuth();

  const [hasHydrated, setHasHydrated] = useState(false);

  // Instagram-style auto-hide for the top search bar & bottom nav on scroll.
  const navHidden = useAutoHideNav();

  const isLanding = pathname === '/';
  const isAuthOrLanding = pathname === '/' || pathname?.startsWith('/auth') || pathname?.startsWith('/auth/');
  const hideSidebar = pathname === '/' || pathname?.startsWith('/auth') || pathname?.startsWith('/auth/') || pathname?.startsWith('/messages') || pathname?.startsWith('/search');
  const hideBottomNav = pathname === '/' || pathname?.startsWith('/auth') || pathname?.startsWith('/auth/') || pathname?.startsWith('/messages') || pathname?.startsWith('/search');
  const isServerPage = pathname?.startsWith('/servers/');
  const isMessages = pathname?.startsWith('/messages');

  useEffect(() => {
    // Check if the auth store is already hydrated from localStorage
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
      return;
    }

    // Otherwise, listen for hydration completion
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    return () => {
      unsubscribe();
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

  const isRedirectingAuthenticatedUser = isAuthenticated && !!user && isAuthOrLanding && pathname !== '/auth/callback';
  const isRedirectingUnauthenticatedUser = !isAuthenticated && !isAuthOrLanding;

  // Render a branded splash screen only until hydration completes to eliminate unauthenticated redirects or layout flashes
  if (!hasHydrated || isRedirectingAuthenticatedUser || isRedirectingUnauthenticatedUser) {
    return (
      <div className="min-h-screen bg-[#05070E] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-primary/20 shadow-xl relative shrink-0">
            <img src="/logo.jpg" alt="GamerZ Hub" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
            <span>Loading GamerZ Hub...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header role="banner" className={isMessages ? "hidden md:block" : "block"}>
        <Navbar hidden={navHidden} />
      </header>
      <div className={`w-full transition-[padding] duration-300 ease-in-out ${!isLanding ? (isMessages ? 'pt-0 md:pt-16 pb-0' : (navHidden ? 'pt-0 pb-0' : 'pt-16 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0')) : ''}`}>
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
          <MobileBottomNav hidden={navHidden} />
        </nav>
      )}
      {/* Progress bar + scroll-to-top FAB appear while the nav bars are auto-hidden */}
      {!isAuthOrLanding && !isMessages && <ScrollControls hidden={navHidden} />}
    </div>
  );
}
