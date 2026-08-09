'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Gamepad2, Sparkles } from 'lucide-react';
import { GAMES_CONFIG } from '@/config/gamesConfig';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOverlayStore } from '@/store/overlayStore';

export function PopularGamesPanel() {
  const router = useRouter();
  const closePanel = useOverlayStore((s) => s.closePanel);

  const goToConnections = () => {
    closePanel();
    router.push('/connections');
  };

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 border border-primary/25 text-primary">
          <Gamepad2 className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h3 className="flex items-center gap-1.5 font-bold text-lg tracking-tight">
            Popular Games <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
          </h3>
          <p className="text-xs text-muted-foreground">
            Connect your accounts and auto-sync stats, ranks & achievements to your Gamer Passport.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Object.values(GAMES_CONFIG).map((game, i) => (
          <motion.button
            key={game.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={goToConnections}
            className={`group relative overflow-hidden rounded-2xl border ${game.borderColor} bg-gradient-to-br ${game.bgGradient} p-4 text-left text-white shadow-lg transition-shadow hover:shadow-xl`}
          >
            <div className="flex items-start justify-between">
              <span className="text-3xl drop-shadow-md">{game.icon}</span>
              <ArrowRight className="h-4 w-4 text-white/40 transition-all group-hover:translate-x-0.5 group-hover:text-white" />
            </div>
            <p className="mt-3 text-sm font-bold leading-tight">{game.name}</p>
            <p className="mt-1 line-clamp-2 text-[10px] text-gray-300/80">{game.description}</p>
            <Badge className="mt-3 bg-black/40 text-[9px] font-bold text-white border border-white/15">
              CONNECT
            </Badge>
          </motion.button>
        ))}
      </div>

      <Button
        onClick={goToConnections}
        className="w-full gap-2 h-11 rounded-xl font-bold"
      >
        <Gamepad2 className="h-4 w-4" /> Manage Connections <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
