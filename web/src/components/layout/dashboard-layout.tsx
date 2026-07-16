'use client';
import { ReactNode } from 'react';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';
  const hideSidebar = pathname === '/' || pathname?.startsWith('/auth') || pathname?.startsWith('/auth/') || pathname?.startsWith('/messages');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className={`w-full ${!isLanding ? 'pt-16 pb-16 md:pb-0' : ''}`}>
        <div className="w-full mx-auto flex gap-4 px-6 py-4">
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
