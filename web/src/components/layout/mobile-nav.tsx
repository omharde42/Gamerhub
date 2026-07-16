'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Newspaper, Users, MessageSquare, Menu, X,
  LayoutDashboard, Compass, Trophy, Gamepad2, Briefcase,
  BarChart3, Bookmark, Bot, Shield, Crown, Settings, LogOut,
  Bell, Film, Globe
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Hide mobile navigation on landing and auth pages
  if (pathname === '/' || pathname?.startsWith('/auth')) return null;

  const handleLogout = async () => {
    setDrawerOpen(false);
    logout();
    router.push('/');
  };

  const mainNavItems = [
    { href: '/feed', label: 'Feed', icon: Home },
    { href: '/news', label: 'News', icon: Globe },
    { href: '/friends', label: 'Network', icon: Users },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
  ];

  const drawerNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/studio', label: 'Game Studio', icon: Film },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/teams', label: 'Teams', icon: Trophy },
    { href: '/tournaments', label: 'Tournaments', icon: Gamepad2 },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/saved', label: 'Saved Posts', icon: Bookmark },
    { href: '/ai-coach', label: 'AI Coach', icon: Bot },
    { href: `/passport/${user?.profile?.username}`, label: 'Gamer Passport', icon: Shield },
    { href: '/premium', label: 'Premium', icon: Crown },
  ];

  return (
    <>
      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-background/95 backdrop-blur-md border-t border-primary/20 flex items-center justify-around px-2 md:hidden">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/feed' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-16 h-full text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 transition-transform", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)] scale-110")} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 w-16 h-full text-xs font-medium transition-colors",
            drawerOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px]">More</span>
        </button>
      </nav>

      {/* Slide-Up Drawer Menu */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-black md:hidden"
            />

            {/* Drawer Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] bg-background/98 border-t border-primary/30 rounded-t-2xl flex flex-col md:hidden overflow-hidden glass-strong"
            >
              {/* Header drag handle area */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  {user ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 animate-fade-in" ring>
                        <AvatarImage src={user?.profile?.avatar || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">{getInitials(user?.profile?.username || 'U')}</AvatarFallback>
                      </Avatar>
                      <div className="text-left animate-fade-in">
                        <p className="font-semibold text-xs truncate max-w-[150px]">{user?.profile?.displayName || user?.profile?.username}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{user?.profile?.headline || 'Gamer'}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="font-bold text-sm bg-gradient-to-r from-gaming-purple to-gaming-cyan bg-clip-text text-transparent">GamerHub</span>
                  )}
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-full hover:bg-accent/50 transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Scrollable Navigation Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
                {/* Regular Nav Items */}
                <div className="grid grid-cols-2 gap-2">
                  {drawerNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all duration-200",
                          isActive
                            ? "text-primary bg-primary/10 border-primary/20 shadow-sm"
                            : "text-muted-foreground hover:text-foreground bg-accent/20 border-transparent hover:bg-accent/40"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Account / Action Area */}
                <div className="border-t border-border/50 pt-4 space-y-2">
                  {user ? (
                    <>
                      <Link
                        href={`/profile/${user?.profile?.username}`}
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Settings & Account
                      </Link>
                      <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/auth/login" onClick={() => setDrawerOpen(false)}>
                        <Button variant="outline" className="w-full rounded-xl">Sign In</Button>
                      </Link>
                      <Link href="/auth/register" onClick={() => setDrawerOpen(false)}>
                        <Button className="w-full rounded-xl">Sign Up</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
