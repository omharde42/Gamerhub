'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Gamepad2, Sparkles, Zap, Trophy, Users, Globe, Star, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PARTICLE_COUNT = 40;
const typewriterTexts = [
  'Connect with pro gamers worldwide',
  'Compete in epic tournaments',
  'Level up your gaming career',
  'Build your ultimate team',
  'Track every stat, every win',
];

function Particle({ index }: { index: number }) {
  const random = useRef({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
    driftX: (Math.random() - 0.5) * 30,
    driftY: (Math.random() - 0.5) * 30,
  });
  const r = random.current;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${r.x}%`,
        top: `${r.y}%`,
        width: r.size,
        height: r.size,
        background: index % 3 === 0
          ? 'hsl(var(--neon-cyan))'
          : index % 3 === 1
          ? 'hsl(var(--neon-purple))'
          : 'hsl(var(--neon-pink))',
      }}
      animate={{
        x: [0, r.driftX, -r.driftX * 0.5, 0],
        y: [0, r.driftY, -r.driftY * 0.7, 0],
        opacity: [0, 0.8, 0.4, 0],
        scale: [0, 1, 0.8, 0],
      }}
      transition={{
        duration: r.duration,
        repeat: Infinity,
        delay: r.delay,
        ease: 'linear',
      }}
    />
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
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (charIndex > 0) {
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % typewriterTexts.length);
        }
      }
    }, isDeleting ? 30 : 60);

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

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function EnterPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/feed');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Sleek, professional grid background with subtle dark gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60" />
      <div className="absolute inset-0 bg-grid opacity-[0.03]" />
      <div className="absolute inset-0 bg-dots opacity-[0.02]" />

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-md animate-card-enter"
        >
          <div className="text-center space-y-8">
            {/* Brand Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-primary/20 flex items-center justify-center mx-auto shadow-xl relative shrink-0">
                <img src="/logo.jpg" alt="GamerZ Hub" className="w-full h-full object-cover" />
              </div>
            </motion.div>

            <div className="space-y-3">
              <motion.h1
                className="text-4xl md:text-5xl font-extrabold tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="bg-gradient-to-r from-indigo-400 via-primary to-violet-500 bg-clip-text text-transparent">
                  Welcome to GamerZ Hub
                </span>
              </motion.h1>
              <motion.p
                className="text-base text-muted-foreground h-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <TypewriterText />
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center w-full max-w-[280px] sm:max-w-none mx-auto">
                <motion.div className="w-full sm:w-auto" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link href="/auth/register" className="w-full">
                    <Button variant="gradient" size="xl" className="h-12 sm:h-14 w-full sm:w-auto px-6 sm:px-10 text-base sm:text-lg rounded-2xl gap-2" animate>
                      <UserPlus className="h-5 w-5" />
                      Create Account
                    </Button>
                  </Link>
                </motion.div>
                <motion.div className="w-full sm:w-auto" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link href="/auth/login" className="w-full">
                    <Button variant="outline" size="xl" className="h-12 sm:h-14 w-full sm:w-auto px-6 sm:px-8 text-base sm:text-lg rounded-2xl gap-2">
                      <LogIn className="h-5 w-5" />
                      Sign In
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {['Valorant', 'CS2', 'League of Legends', 'Fortnite'].map((game) => (
                <span key={game} className="text-[11px] text-muted-foreground/60 font-medium tracking-wide uppercase">
                  {game}
                </span>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Stats bar */}
      <motion.div
        className="border-t border-border/30 bg-card/30 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <div className="max-w-4xl mx-auto py-6 px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  className="text-center space-y-1 animate-card-enter"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 + i * 0.1 }}
                >
                  <Icon className="h-5 w-5 mx-auto text-primary/60" />
                  <p className="text-xl font-bold text-gradient animate-bounce-in">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
