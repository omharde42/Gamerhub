'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { Bell, MessageSquare, Menu, Search, LogOut, User, Settings, Crown, Gamepad2 } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { getInitials } from '@/lib/utils';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { toggleMobileMenu } = useUIStore();
  const [searchOpen, setSearchOpen] = useState(false);
  if (pathname === '/') return null;
  return (<header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-xl"><div className="flex h-16 items-center px-4 md:px-6"><Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={toggleMobileMenu}><Menu className="h-5 w-5" /></Button><Link href="/dashboard" className="flex items-center gap-2 mr-6"><Gamepad2 className="h-6 w-6 text-gaming-purple" /><span className="font-bold text-xl hidden sm:inline">GamerHub</span></Link><div className="hidden md:flex items-center gap-1">{[
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/feed', label: 'Feed' },
      { href: '/teams', label: 'Teams' },
      { href: '/tournaments', label: 'Tournaments' },
      { href: '/jobs', label: 'Jobs' },
    ].map((item) => (<Link key={item.href} href={item.href} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === item.href ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}>{item.label}</Link>))}</div><div className="flex-1" /><div className="flex items-center gap-2">{searchOpen ? (<div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="w-64 pl-9" placeholder="Search players, teams..." autoFocus onBlur={() => setSearchOpen(false)} /></div>) : (<Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}><Search className="h-5 w-5" /></Button>)}<Button variant="ghost" size="icon" className="relative"><Bell className="h-5 w-5" /><span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center">3</span></Button><Link href="/messages"><Button variant="ghost" size="icon"><MessageSquare className="h-5 w-5" /></Button></Link><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full"><Avatar className="h-8 w-8"><AvatarImage src={user?.profile?.avatar || ''} /><AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(user?.profile?.username || 'U')}</AvatarFallback></Avatar></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56"><div className="flex items-center gap-2 p-2"><Avatar className="h-10 w-10"><AvatarImage src={user?.profile?.avatar || ''} /><AvatarFallback className="bg-primary/10 text-primary">{getInitials(user?.profile?.username || 'U')}</AvatarFallback></Avatar><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{user?.profile?.username}</p><p className="text-xs text-muted-foreground truncate">{user?.email}</p></div></div><DropdownMenuSeparator /><Link href={`/profile/${user?.profile?.username}`}><DropdownMenuItem><User className="mr-2 h-4 w-4" />Profile</DropdownMenuItem></Link><Link href="/profile/settings"><DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem></Link><Link href="/premium"><DropdownMenuItem><Crown className="mr-2 h-4 w-4 text-yellow-500" />Premium</DropdownMenuItem></Link><DropdownMenuSeparator /><DropdownMenuItem onClick={logout} className="text-destructive"><LogOut className="mr-2 h-4 w-4" />Logout</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div></header>);
}
