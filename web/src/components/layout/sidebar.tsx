'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard, Newspaper, Users, Trophy, Briefcase, Building2,
  MessageSquare, BarChart3, Bot, Crown, UserPlus, MoreVertical,
  Settings, LogOut, UserCheck, Gamepad2, User, Compass, Bookmark, Bell,
  Shield, Sparkles, Globe, Film
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useState } from 'react';

const getNavItems = (username: string) => [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/feed', label: 'Feed', icon: Newspaper },
  { href: '/news', label: 'Gaming News', icon: Globe },
  { href: '/studio', label: 'Game Studio', icon: Film },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/friends', label: 'My Network', icon: Users },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/teams', label: 'Teams', icon: Trophy },
  { href: '/tournaments', label: 'Tournaments', icon: Gamepad2 },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/saved', label: 'Saved Posts', icon: Bookmark },
  { href: '/ai-coach', label: 'AI Coach', icon: Bot },
  { href: `/passport/${username}`, label: 'Gamer Passport', icon: Shield },
  { href: '/premium', label: 'Premium', icon: Crown },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: chatUnreadData } = useQuery({
    queryKey: ['chat-unread'],
    queryFn: () => api.get('/chat/unread-counts').then(r => r.data.data || {}),
    refetchInterval: 15000,
  });
  const totalChatUnread = Object.values(chatUnreadData || {}).reduce((sum: number, c: any) => sum + (c as number), 0);

  if (pathname === '/' || pathname?.startsWith('/auth') || pathname?.startsWith('/auth/')) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav aria-label="Control Panel Navigation" className="w-16 lg:w-64 shrink-0 transition-all duration-300">
      <div className="sticky top-20 space-y-2">
        <div className="glass rounded-xl overflow-hidden border-border/60 shadow-sm bg-card">
          {user ? (
            <>
              {/* Desktop banner */}
              <div className="h-14 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 relative overflow-hidden hidden lg:block">
                <div className="absolute inset-0 bg-grid opacity-10" />
              </div>
              
              {/* Tablet Avatar only */}
              <div className="block lg:hidden py-3 text-center">
                <Avatar className="h-10 w-10 mx-auto border border-border/60 shadow-sm">
                  <AvatarImage src={user?.profile?.avatar || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs">{getInitials(user?.profile?.username || 'U')}</AvatarFallback>
                </Avatar>
              </div>
 
              {/* Desktop Profile Card info */}
              <div className="px-3 pb-3 -mt-8 text-center hidden lg:block animate-fade-in">
                <Avatar className="h-16 w-16 mx-auto border-2 border-background shadow-md">
                  <AvatarImage src={user?.profile?.avatar || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-lg">{getInitials(user?.profile?.username || 'U')}</AvatarFallback>
                </Avatar>
                <Link href={`/profile/${user?.profile?.username}`} className="block mt-2">
                  <p className="font-semibold text-sm hover:text-primary transition-colors">{user?.profile?.displayName || user?.profile?.username}</p>
                </Link>
                <p className="text-xs text-muted-foreground">{(user?.profile as any)?.headline || user?.profile?.role || 'Gamer'}</p>
                {user?.profile?.rank && (
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                    <Trophy className="h-3 w-3" /> {user.profile.rank}
                  </div>
                )}
              </div>
              
              {/* Desktop Connections stats */}
              <div className="border-t border-border/40 px-3 py-2 space-y-1 hidden lg:block">
                <Link href="/connections" className="flex items-center justify-between text-xs hover:bg-muted/80 rounded-lg px-2 py-1.5 -mx-1 transition-colors">
                  <span className="text-muted-foreground">Connections</span>
                  <span className="text-primary font-semibold">{(user?.profile as any)?._count?.following || 0}</span>
                </Link>
                <Link href="/profile/settings" className="flex items-center text-xs text-muted-foreground hover:bg-muted/80 rounded-lg px-2 py-1.5 -mx-1 transition-colors">
                  <Settings className="h-3 w-3 mr-1.5" /> Edit Profile
                </Link>
              </div>
            </>
          ) : (
            <div className="p-3 lg:p-6 text-center space-y-3 flex flex-col items-center">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                <Gamepad2 className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
              </div>
              <p className="text-xs font-semibold hidden lg:block">Welcome!</p>
              <p className="text-[10px] text-muted-foreground hidden lg:block">Sign in to access all features</p>
              <Link href="/auth/login" className="w-full">
                <Button variant="gradient" size="sm" className="w-full h-8 lg:h-9 text-[10px] lg:text-xs">
                  <span className="hidden lg:inline">Sign In</span>
                  <span className="lg:hidden">In</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
 
        <div className="bg-[#111827] rounded-2xl p-2 space-y-1 border border-white/[0.08] shadow-xl">
          {getNavItems(user?.profile?.username || '').map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 relative justify-center lg:justify-start group',
                  isActive
                    ? 'text-white bg-[#7C3AED]/20 border-l-4 border-[#7C3AED] shadow-[0_0_20px_rgba(124,58,237,0.3)] font-bold'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.06] border-l-4 border-transparent'
                )}>
                <div className="relative shrink-0">
                  <Icon className={cn('h-4 w-4 transition-all duration-200 group-hover:scale-110', isActive ? 'text-[#7C3AED]' : 'text-[#94A3B8] group-hover:text-white')} />
                  {item.href === '/messages' && totalChatUnread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-[#FF3D71] text-white text-[9px] font-extrabold flex items-center justify-center shadow-md">
                      {totalChatUnread > 9 ? '9+' : totalChatUnread}
                    </span>
                  )}
                </div>
                <span className="hidden lg:block font-inter">{item.label}</span>
              </Link>
            );
          })}

          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 justify-center lg:justify-start">
                <MoreVertical className="h-5 w-5 shrink-0" />
                <span className="hidden lg:block">More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56 glass-strong">
              <Link href="/organizations">
                <DropdownMenuItem onSelect={() => setMenuOpen(false)}>
                  <Building2 className="h-4 w-4 mr-2" /> Organizations
                </DropdownMenuItem>
              </Link>
              <Link href="/connections">
                <DropdownMenuItem onSelect={() => setMenuOpen(false)}>
                  <UserCheck className="h-4 w-4 mr-2" /> Connections
                </DropdownMenuItem>
              </Link>
              <Link href={`/profile/${user?.profile?.username}`}>
                <DropdownMenuItem onSelect={() => setMenuOpen(false)}>
                  <User className="h-4 w-4 mr-2" /> View Profile
                </DropdownMenuItem>
              </Link>
              <Link href={`/passport/${user?.profile?.username}`}>
                <DropdownMenuItem onSelect={() => setMenuOpen(false)}>
                  <Shield className="h-4 w-4 mr-2" /> Gamer Passport
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <Link href="/premium">
                <DropdownMenuItem onSelect={() => setMenuOpen(false)}>
                  <Crown className="h-4 w-4 mr-2" /> <span className="flex items-center gap-1">Premium <Sparkles className="h-3 w-3 text-yellow-500" /></span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
