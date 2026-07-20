'use client';
import { ReactNode, useEffect } from 'react';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const isLanding = pathname === '/';
  const hideSidebar = pathname === '/' || pathname?.startsWith('/auth') || pathname?.startsWith('/auth/') || pathname?.startsWith('/messages');

  useEffect(() => {
    if (isAuthenticated && user) {
      const isProfileIncomplete = 
        !user.profile ||
        !user.profile.displayName?.trim() ||
        !user.profile.bio?.trim() ||
        !user.profile.country?.trim() ||
        !user.profile.mainGames ||
        user.profile.mainGames.length === 0;

      const onSettingsPage = pathname === '/profile/settings';
      const onAuthOrLanding = pathname === '/' || pathname?.startsWith('/auth') || pathname?.startsWith('/auth/');

      if (isProfileIncomplete && !onSettingsPage && !onAuthOrLanding) {
        toast('Gamer Passport incomplete. Please complete setup!', { id: 'setup-guard-toast' });
        router.push('/profile/settings');
      }
    }
  }, [user, isAuthenticated, pathname, router]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className={`w-full ${!isLanding ? 'pt-16 pb-16 md:pb-0' : ''}`}>
        <div className="w-full mx-auto flex gap-3 lg:gap-4 px-3 md:px-6 py-3 md:py-4">
          {!hideSidebar && <Sidebar />}
          <main className="flex-1 min-w-0 max-w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
