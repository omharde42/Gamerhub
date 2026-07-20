'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/input';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useTheme } from 'next-themes';
import {
  Gamepad2, Search, Bell, MessageSquare, Users,
  LogOut, User, Settings, Crown, Home, Briefcase, ChevronDown,
  Heart, Trophy, Loader2, LayoutDashboard, Compass,
  Bookmark, Bot, Shield, BarChart3, Gamepad2 as GamepadIcon, Building2, MoreHorizontal,
  Globe, UserCheck, Zap, Sparkles, Newspaper, Film, Sun, Moon, Palette
} from 'lucide-react';

const navIcons = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/news', icon: Newspaper, label: 'News' },
  { href: '/studio', icon: Film, label: 'Studio' },
  { href: '/friends', icon: Users, label: 'Network' },
  { href: '/servers', icon: Globe, label: 'Servers' },
  { href: '/messages', icon: MessageSquare, label: 'Messaging' },
];

const moreNavItems = (username: string) => [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/news', label: 'Gaming News', icon: Newspaper },
  { href: '/teams', label: 'Teams', icon: Trophy },
  { href: '/tournaments', label: 'Tournaments', icon: GamepadIcon },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/saved', label: 'Saved Posts', icon: Bookmark },
  { href: '/ai-coach', label: 'AI Coach', icon: Bot },
  { href: `/passport/${username}`, label: 'Gamer Passport', icon: Shield },
  { href: '/premium', label: 'Premium', icon: Crown },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { theme: activeTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const { data: notifData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => api.get('/notifications/unread-count').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const { data: recentNotifs } = useQuery({
    queryKey: ['notifications-recent'],
    queryFn: () => api.get('/notifications').then(r => r.data.data?.slice(0, 5)),
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.count || 0;

  if (pathname === '/' || pathname?.startsWith('/auth')) return null;

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) await api.post('/auth/logout', { refreshToken }).catch(() => {});
    } catch {}
    logout();
    router.push('/');
  };

  return (
    <header className={`fixed top-0 z-40 w-full transition-all duration-300 ${scrolled ? 'glass-strong border-primary/20' : 'bg-background/80 backdrop-blur-md border-b border-primary/20'}`}>
      <div className="w-full mx-auto flex h-16 items-center px-6 gap-3">
        <Link href="/dashboard" className="flex items-center gap-1.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gaming-purple to-gaming-pink flex items-center justify-center shadow-lg shadow-gaming-purple/20 group-hover:shadow-gaming-purple/40 transition-all duration-300">
            <Gamepad2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold hidden sm:block bg-gradient-to-r from-gaming-purple to-gaming-cyan bg-clip-text text-transparent animate-glow-rainbow">GamerHub</span>
        </Link>

        <div className="hidden md:flex relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="h-9 pl-9 bg-muted/50 border-0 rounded-full text-sm focus-visible:ring-1 focus-visible:ring-primary/30" placeholder="Search players, teams..." variant="ghost" />
        </div>

        <div className="flex-1" />

        <nav className="hidden md:flex items-center gap-0.5">
          {navIcons.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/feed' && pathname?.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 min-w-[70px] relative
                  ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}>
                <Icon className={`h-5 w-5 transition-all duration-200 ${isActive ? 'drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)] animate-bounce-in' : ''}`} />
                <span>{item.label}</span>
                {isActive && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full glow-sm" />}
              </Link>
            );
          })}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 min-w-[70px] relative
                ${pathname === '/notifications' ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}>
                <Bell className={`h-5 w-5 transition-all duration-200 ${unreadCount > 0 ? 'animate-pulse-glow' : ''}`} />
                <span>Alerts</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 right-3 h-4 min-w-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-scale-in">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 glass-strong">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                <span className="text-sm font-semibold">Notifications</span>
                <Link href="/notifications" className="text-xs text-primary hover:underline">View all</Link>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {recentNotifs?.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No notifications yet
                  </div>
                )}
                {recentNotifs?.map((notif: any) => (
                  <Link key={notif.id} href={notif.link || '/notifications'}>
                    <div className={`flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors ${!notif.isRead ? 'bg-primary/5' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!notif.isRead ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <Bell className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs line-clamp-2">{notif.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelativeTime(notif.createdAt)}</p>
                      </div>
                      {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                    </div>
                  </Link>
                ))}
              </div>
              <DropdownMenuSeparator />
              <Link href="/notifications">
                <div className="px-4 py-2 text-sm text-primary font-medium text-center hover:bg-accent/50 transition-colors rounded-b-lg">
                  See all notifications
                </div>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-1">
          {/* Theme Switcher Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground">
                {mounted && activeTheme === 'light' ? (
                  <Sun className="h-4.5 w-4.5" />
                ) : mounted && activeTheme === 'gray' ? (
                  <Palette className="h-4.5 w-4.5" />
                ) : (
                  <Moon className="h-4.5 w-4.5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 glass-strong">
              <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2 cursor-pointer text-xs font-semibold">
                <Sun className="h-4 w-4 text-orange-500" /> Light Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2 cursor-pointer text-xs font-semibold">
                <Moon className="h-4 w-4 text-primary" /> Dark Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('gray')} className="gap-2 cursor-pointer text-xs font-semibold">
                <Palette className="h-4 w-4 text-muted-foreground" /> Gray Mode
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1.5 px-2 h-12 rounded-lg hover:bg-accent/50">
                  <Avatar className="h-7 w-7" ring status="online">
                    <AvatarImage src={user?.profile?.avatar || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px]">{getInitials(user?.profile?.username || 'U')}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 glass-strong">
                <div className="flex items-center gap-3 p-3">
                  <Avatar className="h-12 w-12" ring>
                    <AvatarImage src={user?.profile?.avatar || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">{getInitials(user?.profile?.username || 'U')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{user?.profile?.displayName || user?.profile?.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.profile?.headline || 'Gamer'}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <Link href={`/profile/${user?.profile?.username}`}>
                  <DropdownMenuItem><User className="h-4 w-4 mr-3" /> View Profile</DropdownMenuItem>
                </Link>
                <Link href="/profile/settings">
                  <DropdownMenuItem><Settings className="h-4 w-4 mr-3" /> Settings</DropdownMenuItem>
                </Link>
                <Link href="/premium">
                  <DropdownMenuItem><Crown className="h-4 w-4 mr-3" /> <span className="flex items-center gap-1">Premium <Sparkles className="h-3 w-3 text-yellow-500" /></span></DropdownMenuItem>
                </Link>
                <Link href="/explore">
                  <DropdownMenuItem><Home className="h-4 w-4 mr-3" /> Explore</DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-3" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg text-xs font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="default" size="sm" className="h-9 px-4 rounded-lg text-xs font-medium">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
