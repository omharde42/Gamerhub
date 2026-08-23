'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface GamerPassportEmptyStateProps {
  onOpenPopularGames: () => void;
}

export function GamerPassportEmptyState({ onOpenPopularGames }: GamerPassportEmptyStateProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card variant="glass" className="border-border/60 bg-gradient-to-br from-card via-background to-muted/20 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <CardContent className="p-8 sm:p-12 max-w-lg mx-auto space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto shadow-xl">
            <Gamepad2 className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center justify-center gap-2">
              Build your Gamer Passport <Sparkles className="h-5 w-5 text-amber-400" />
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Connect your games to automatically showcase your real gaming achievements and statistics across Clash of Clans and PUBG PC.
            </p>
          </div>

          <Button
            onClick={onOpenPopularGames}
            className="bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-600 text-primary-foreground font-extrabold px-6 rounded-2xl h-11 shadow-lg gap-2"
          >
            <Sparkles className="h-4 w-4" /> Connect a Game
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
