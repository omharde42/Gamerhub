'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthFormWrapperProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  footer: ReactNode;
}

export function AuthFormWrapper({ children, title, subtitle, footer }: AuthFormWrapperProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-gaming-purple/10 via-transparent to-gaming-blue/10" />
      <div className="absolute inset-0 bg-grid opacity-[0.05]" />
      <div className="absolute inset-0 bg-dots opacity-[0.05]" />
      <div className="absolute inset-0 bg-gradient-animate" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="relative cyber-card">
          <div className="bg-card/70 backdrop-blur-2xl border border-primary/20 rounded-2xl p-5 xs:p-6 sm:p-8 shadow-[0_0_30px_hsl(var(--primary)/0.08)] space-y-6">
            <div className="text-center space-y-2">
              <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-primary/20 shadow-lg shadow-primary/10 animate-bounce-in shrink-0">
                  <img src="/logo.jpg" alt="GamerZ Hub" className="w-full h-full object-cover" />
                </div>
                <span className="text-xl font-extrabold bg-gradient-to-r from-gaming-purple to-gaming-cyan bg-clip-text text-transparent animate-glow-rainbow">GamerZ Hub</span>
              </Link>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>

            {children}

            <div className="text-center text-sm text-muted-foreground">
              {footer}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
