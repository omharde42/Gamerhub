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
  Bell, Film, Globe, Plus
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreatePost } from '@/components/post/create-post';

export function MobileNav() {
  const pathname = usePathname();
  const [createPostOpen, setCreatePostOpen] = useState(false);

  // Hide mobile navigation on landing and auth pages
  if (pathname === '/' || pathname?.startsWith('/auth') || pathname?.startsWith('/auth/')) return null;

  return (
    <>
      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-background/95 backdrop-blur-md border-t border-border/60 flex items-center justify-around px-2 md:hidden shadow-lg">
        {/* Item 1: Home */}
        <Link
          href="/feed"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 w-14 h-full text-xs font-medium transition-colors",
            pathname === "/feed" ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px]">Home</span>
        </Link>

        {/* Item 2: My Network */}
        <Link
          href="/friends"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 w-14 h-full text-xs font-medium transition-colors",
            pathname === "/friends" ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="h-5 w-5" />
          <span className="text-[10px]">Network</span>
        </Link>

        {/* Item 3: Create Post (+) */}
        <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
          <DialogTrigger asChild>
            <button
              className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md hover:scale-105 active:scale-95 transition-all -translate-y-2 border-2 border-background"
            >
              <Plus className="h-6 w-6 font-bold" />
            </button>
          </DialogTrigger>
          <DialogContent className="w-[95%] max-w-lg rounded-2xl p-0 overflow-hidden border border-border/60 bg-background">
            <DialogHeader className="p-4 border-b border-border/50 bg-muted/10">
              <DialogTitle className="text-base font-bold text-foreground">Create Post</DialogTitle>
            </DialogHeader>
            <div className="p-4 bg-background">
              <CreatePost />
            </div>
          </DialogContent>
        </Dialog>

        {/* Item 4: Notifications */}
        <Link
          href="/notifications"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 w-14 h-full text-xs font-medium transition-colors",
            pathname === "/notifications" ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bell className="h-5 w-5" />
          <span className="text-[10px]">Alerts</span>
        </Link>

        {/* Item 5: News */}
        <Link
          href="/news"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 w-14 h-full text-xs font-medium transition-colors",
            pathname === "/news" ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Newspaper className="h-5 w-5" />
          <span className="text-[10px]">News</span>
        </Link>
      </nav>
    </>
  );
}
