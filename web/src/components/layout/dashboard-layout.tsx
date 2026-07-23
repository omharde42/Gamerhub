'use client';
import { ReactNode, useEffect, useState } from 'react';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [hasHydrated, setHasHydrated] = useState(false);

  const isLanding = pathname === '/';
  const isAuthOrLanding = pathname === '/' || pathname?.startsWith('/auth') || pathname?.startsWith('/auth/');
  const hideSidebar = pathname === '/' || pathname?.startsWith('/auth') || pathname?.startsWith('/auth/') || pathname?.startsWith('/messages');

  useEffect(() => {
    // Wait for store to rehydrate from preferences
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    // Guard 1: Redirect to login if unauthenticated and trying to access private page
    if (!isAuthenticated && !isAuthOrLanding) {
      router.push('/auth/login');
      return;
    }

    // Guard 2: Redirect to feed if authenticated and trying to access landing/auth page
    if (isAuthenticated && isAuthOrLanding && pathname !== '/auth/callback') {
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

  // Render a loading state until rehydration is complete to prevent layout flashes
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className={`w-full ${!isLanding ? 'pt-16 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0' : ''}`}>
        <div className="w-full mx-auto flex gap-3 lg:gap-4 px-3 md:px-6 py-3 md:py-4">
          {!hideSidebar && <Sidebar />}
          <main className="flex-1 min-w-0 max-w-full">
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
