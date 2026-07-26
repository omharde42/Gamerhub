'use client';
import { ReactNode } from 'react';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { MobileBottomNav } from './mobile-bottom-nav';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';
  const hideSidebar = pathname === '/' || pathname?.startsWith('/auth') || pathname?.startsWith('/auth/') || pathname?.startsWith('/messages');
  const hideBottomNav = pathname === '/' || pathname?.startsWith('/auth') || pathname?.startsWith('/auth/');
  const isServerPage = pathname?.startsWith('/servers/');
  const isMessages = pathname?.startsWith('/messages');
  // Mobile bottom nav offset
  const bottomNavHeight = 'pb-16';

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <div className={`w-full ${!isLanding ? 'pt-14' : ''} ${!hideBottomNav ? bottomNavHeight : ''}`}>
        <div className="w-full mx-auto flex gap-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          {!hideSidebar && !isServerPage && !isMessages && <Sidebar />}
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
      {!hideBottomNav && <MobileBottomNav />}
    </div>
  );
}
