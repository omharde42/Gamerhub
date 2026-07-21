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

export default function EnterPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gaming-purple/5 via-transparent to-gaming-blue/5" />
      <div className="absolute inset-0 bg-grid opacity-[0.03]" />
      <div className="absolute inset-0 bg-dots opacity-[0.03]" />
      <div className="absolute inset-0 bg-gradient-animate" />

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
          <Particle key={i} index={i} />
        ))}
      </div>

      {/* Floating game icons */}
      <motion.div
        className="absolute top-20 left-[15%] text-gaming-purple/10 pointer-events-none animate-breathe"
        animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Gamepad2 className="h-24 w-24" />
      </motion.div>
      <motion.div
        className="absolute bottom-32 right-[12%] text-gaming-cyan/10 pointer-events-none animate-breathe"
        animate={{ y: [0, -20, 0], rotate: [0, -10, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <Zap className="h-20 w-20" />
      </motion.div>
      <motion.div
        className="absolute top-1/3 right-[20%] text-gaming-pink/10 pointer-events-none animate-breathe"
        animate={{ y: [0, -12, 0], rotate: [0, 15, -15, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      >
        <Star className="h-16 w-16" />
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="text-center space-y-8">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gaming-purple via-gaming-pink to-gaming-cyan flex items-center justify-center mx-auto shadow-2xl shadow-gaming-purple/30 relative">
                <Gamepad2 className="h-10 w-10 text-white" />
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gaming-purple via-gaming-pink to-gaming-cyan"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ filter: 'blur(12px)', zIndex: -1 }}
                />
              </div>
            </motion.div>

            <div className="space-y-3">
              <motion.h1
                className="text-4xl md:text-5xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="bg-gradient-to-r from-gaming-purple via-gaming-cyan to-gaming-pink bg-clip-text text-transparent animate-glow-rainbow">
                  Welcome to GamerHub
                </span>
              </motion.h1>
              <motion.p
                className="text-lg text-muted-foreground h-8"
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
              className="flex items-center justify-center gap-6 pt-4"
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
