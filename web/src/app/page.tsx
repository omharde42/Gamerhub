'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Gamepad2, Sparkles, Zap, Trophy, Users, Globe, LogIn, UserPlus, Film, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

const typewriterTexts = [
  'Connect with pro gamers worldwide',
  'Compete in epic tournaments',
  'Level up your gaming career',
  'Build your ultimate team',
  'Track every stat, every win',
];

// Lightweight CSS Particle background (Zero main-thread JS animation loops)
function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-30 animate-pulse"
          style={{
            left: `${(i * 8.3) + 4}%`,
            top: `${(i * 7.5) + 10}%`,
            width: `${(i % 3) + 2}px`,
            height: `${(i % 3) + 2}px`,
            backgroundColor: i % 3 === 0 ? '#10B981' : i % 3 === 1 ? '#7C3AED' : '#06B6D4',
            animationDuration: `${(i % 4) + 3}s`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function TypewriterText() {
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = typewriterTexts[textIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setCharIndex(charIndex + 1);
        } else {
          setTimeout(() => setIsDeleting(true), 2500);
        }
      } else {
        if (charIndex > 0) {
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % typewriterTexts.length);
        }
      }
    }, isDeleting ? 40 : 80);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex]);

  return (
    <span className="text-gradient">
      {typewriterTexts[textIndex].substring(0, charIndex)}
      <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-pulse" />
    </span>
  );
}

const stats = [
  { value: '10K+', label: 'Active Players', icon: Users },
  { value: '500+', label: 'Teams', icon: Trophy },
  { value: '100+', label: 'Tournaments', icon: Zap },
  { value: '50+', label: 'Games Supported', icon: Globe },
];

export default function EnterPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/feed');
    }
  }, [isAuthenticated, user, router]);

  if (isAuthenticated && user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Grid & Particles */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60" />
      <div className="absolute inset-0 bg-grid opacity-[0.03]" />
      <ParticleBackground />

      {/* Main Hero Container */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center space-y-8">
            {/* Brand Logo */}
            <div>
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-primary/20 flex items-center justify-center mx-auto shadow-xl relative shrink-0">
                <Image
                  src="/logo.jpg"
                  alt="GamerZ Hub Platform Logo"
                  width={80}
                  height={80}
                  priority
                  sizes="80px"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* P0 LCP Heading: Immediate Render, No Animation Delay */}
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-indigo-400 via-primary to-violet-500 bg-clip-text text-transparent">
                  Welcome to GamerZ Hub
                </span>
              </h1>
              <p className="text-base text-muted-foreground h-8">
                <TypewriterText />
              </p>
            </div>

            {/* Call To Action Buttons */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center w-full max-w-[280px] sm:max-w-none mx-auto">
                <div className="w-full sm:w-auto">
                  <Link href="/auth/register" aria-label="Create a new GamerZ Hub account" className="w-full">
                    <Button aria-label="Create Account" variant="gradient" size="xl" className="h-12 sm:h-14 w-full sm:w-auto px-6 sm:px-10 text-base sm:text-lg rounded-2xl gap-2 font-bold shadow-lg shadow-emerald-500/25">
                      <UserPlus className="h-5 w-5" />
                      Create Account
                    </Button>
                  </Link>
                </div>
                <div className="w-full sm:w-auto">
                  <Link href="/auth/login" aria-label="Sign in to your GamerZ Hub account" className="w-full">
                    <Button aria-label="Sign In" variant="outline" size="xl" className="h-12 sm:h-14 w-full sm:w-auto px-6 sm:px-8 text-base sm:text-lg rounded-2xl gap-2 font-bold">
                      <LogIn className="h-5 w-5" />
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Supported Games Badges */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-4">
              {['Valorant', 'CS2', 'League of Legends', 'Fortnite'].map((game) => (
                <span key={game} className="text-xs text-muted-foreground font-mono font-bold tracking-wide uppercase px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                  {game}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar (Below the fold) */}
      <div className="border-t border-border/30 bg-card/30 backdrop-blur-sm z-10">
        <div className="max-w-4xl mx-auto py-6 px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="text-center space-y-1">
                  <Icon className="h-5 w-5 mx-auto text-emerald-400" />
                  <p className="text-xl font-extrabold text-gradient">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
