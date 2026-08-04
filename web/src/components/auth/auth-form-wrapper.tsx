'use client';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface AuthFormWrapperProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  footer: ReactNode;
}

export function AuthFormWrapper({ children, title, subtitle, footer }: AuthFormWrapperProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-y-auto bg-[#05070E] text-white">
      {/* Background aurora meshes */}
      <div className="absolute inset-0 bg-gradient-to-b from-gaming-purple/5 via-transparent to-gaming-blue/5 pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />
      <div className="absolute inset-0 bg-dots opacity-[0.03] pointer-events-none" />

      {/* Floating Back Button fixed at top-left with 44x44 Touch Target */}
      <div className="absolute top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-11 w-11 rounded-full bg-card/40 backdrop-blur-md border border-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40"
          aria-label="Go Back"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>

      {/* Centered dedicated content wrapper */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 z-10 w-full max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full flex flex-col space-y-6 pt-12 pb-6"
        >
          {/* Brand Identity Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-primary/20 shadow-xl shadow-primary/10 animate-bounce-in shrink-0">
                <img src="/logo.jpg" alt="GamerZ Hub Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-extrabold bg-gradient-to-r from-gaming-purple via-gaming-pink to-gaming-cyan bg-clip-text text-transparent tracking-tight">
                GamerZ Hub
              </span>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-heading font-extrabold tracking-tight text-foreground">{title}</h1>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">{subtitle}</p>
            </div>
          </div>

          {/* Form Content card (Full width on mobile, rounded card on desktop) */}
          <div className="bg-card/45 backdrop-blur-xl border border-white/[0.05] rounded-2xl p-5 sm:p-8 shadow-2xl shadow-black/50 space-y-6">
            {children}
          </div>

          {/* Footer Navigation link */}
          <div className="text-center text-sm text-muted-foreground font-medium pt-2">
            {footer}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
