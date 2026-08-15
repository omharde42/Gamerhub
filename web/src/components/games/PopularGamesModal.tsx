'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GAMES_CATALOG, GameCatalogItem } from '@/config/gamesCatalog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, CheckCircle2, Sparkles, X, Info, Gamepad2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PopularGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userConnections?: any[];
  onSelectGameToConnect?: (gameId: string) => void;
}

export function PopularGamesModal({
  isOpen,
  onClose,
  userConnections = [],
  onSelectGameToConnect,
}: PopularGamesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LIVE' | 'CONNECTED' | 'COMING_SOON'>('ALL');
  const [infoGame, setInfoGame] = useState<GameCatalogItem | null>(null);

  // Map user connected games
  const connectedGameIds = new Set<string>();
  userConnections.forEach((acc: any) => {
    const raw = (acc.game || '').toLowerCase().replace(/_/g, '');
    if (raw.includes('clashroyale') || raw === 'cr') connectedGameIds.add('clash_royale');
    else if (raw.includes('clash')) connectedGameIds.add('clash_of_clans');
    if (raw.includes('brawlstars') || raw === 'bs') connectedGameIds.add('brawl_stars');
    else if (raw.includes('pubg') && raw.includes('mobile')) connectedGameIds.add('bgmi');
    else if (raw.includes('pubg')) connectedGameIds.add('pubg');
    if (raw.includes('freefire')) connectedGameIds.add('freefire');
    if (raw.includes('valorant')) connectedGameIds.add('valorant');
    if (raw.includes('steam')) connectedGameIds.add('steam');
    if (raw.includes('bgmi')) connectedGameIds.add('bgmi');
  });

  const filteredGames = GAMES_CATALOG.filter((game) => {
    const isConnected = connectedGameIds.has(game.id);

    // Filter tab check
    if (activeFilter === 'LIVE' && game.status !== 'LIVE') return false;
    if (activeFilter === 'CONNECTED' && !isConnected) return false;
    if (activeFilter === 'COMING_SOON' && game.status !== 'COMING_SOON') return false;

    // Search query check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = game.name.toLowerCase().includes(q);
      const matchDev = game.developer.toLowerCase().includes(q);
      const matchPlatform = game.platform.toLowerCase().includes(q);
      return matchName || matchDev || matchPlatform;
    }

    return true;
  });

  const handleGameClick = (game: GameCatalogItem) => {
    const isConnected = connectedGameIds.has(game.id);

    if (isConnected) {
      toast.success(`${game.name} is already connected to your Gamer Passport!`);
      return;
    }

    if (game.status === 'LIVE' && !game.community) {
      onClose();
      if (onSelectGameToConnect) {
        onSelectGameToConnect(game.id);
      }
    } else {
      setInfoGame(game);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-4xl bg-card border border-border/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-border/50 bg-muted/20 relative flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[11px] font-mono font-bold">
                  CONNECT YOUR GAMES
                </Badge>
                <span className="text-xs text-muted-foreground">• Official Game Catalog</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
                Build your complete Gamer Passport <Sparkles className="h-5 w-5 text-amber-400" />
              </h2>
              <p className="text-xs text-muted-foreground">
                Connect your official game accounts to showcase real stats & achievements.
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 sm:p-5 border-b border-border/40 bg-background/50 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search games (e.g. Clash, PUBG, VALORANT)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted/40 border-border/50 text-xs h-10 rounded-xl"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                {(['ALL', 'LIVE', 'CONNECTED', 'COMING_SOON'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeFilter === filter
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40'
                    }`}
                  >
                    {filter === 'ALL'
                      ? 'All Games'
                      : filter === 'LIVE'
                      ? '● Live / Available'
                      : filter === 'CONNECTED'
                      ? '✓ Connected'
                      : 'Coming Soon'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Games Grid Container */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[60vh]">
            {filteredGames.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Gamepad2 className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-semibold text-muted-foreground">
                  No games matched your search query.
                </p>
                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setActiveFilter('ALL'); }}>
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredGames.map((game) => {
                  const isConnected = connectedGameIds.has(game.id);

                  return (
                    <motion.div key={game.id} whileHover={{ scale: 1.01 }} transition={{ duration: 0.15 }}>
                      <Card variant="glass" className={`border ${game.borderColor} bg-gradient-to-br ${game.bgGradient} h-full flex flex-col justify-between overflow-hidden relative group`}>
                        <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div>
                            {/* Top Row: Icon + Badges */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-xl shadow-md shrink-0">
                                {game.icon}
                              </div>

                              <div>
                                {isConnected ? (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold gap-1 px-2.5 py-0.5">
                                    <CheckCircle2 className="h-3 w-3" /> Connected
                                  </Badge>
                                ) : game.status === 'LIVE' && game.community ? (
                                  <Badge className="bg-sky-500/20 text-sky-400 border border-sky-500/40 text-[10px] font-bold px-2.5 py-0.5">
                                    🎮 COMMUNITY
                                  </Badge>
                                ) : game.status === 'LIVE' ? (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2.5 py-0.5">
                                    ● LIVE
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-muted/40 text-muted-foreground border-border/50 text-[10px] font-semibold px-2.5 py-0.5">
                                    COMING SOON
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Game Title & Platform */}
                            <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                              {game.name}
                            </h3>
                            <p className="text-[11px] text-gray-400 font-mono font-medium">
                              {game.developer} • {game.platform}
                            </p>

                            {/* Short Description */}
                            <p className="text-xs text-gray-300/80 mt-2 line-clamp-2 leading-relaxed">
                              {game.description}
                            </p>
                          </div>

                          {/* Action Button */}
                          <div className="pt-3 border-t border-white/10 mt-2">
                            {isConnected ? (
                              <Button
                                disabled
                                className="w-full h-9 text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default"
                              >
                                ✓ Connected
                              </Button>
                            ) : game.status === 'LIVE' && game.community ? (
                              <Button
                                onClick={() => handleGameClick(game)}
                                className="w-full h-9 text-xs font-extrabold bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-400 hover:to-cyan-500 text-black shadow-lg"
                              >
                                🎮 Community Game
                              </Button>
                            ) : game.status === 'LIVE' ? (
                              <Button
                                onClick={() => handleGameClick(game)}
                                className="w-full h-9 text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black shadow-lg"
                              >
                                Connect Game
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleGameClick(game)}
                                variant="outline"
                                className="w-full h-9 text-xs font-semibold text-gray-400 border-white/10 hover:bg-white/5 hover:text-white"
                              >
                                Coming Soon
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {filteredGames.length} games</span>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl">
              Close
            </Button>
          </div>
        </motion.div>

        {/* Coming Soon Info Modal */}
        <AnimatePresence>
          {infoGame && (
            <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md">
                <Card variant="glass" className="border-border/60 bg-gradient-to-br from-card via-background to-black">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl p-2 rounded-2xl bg-muted/60 border border-border/40">
                        {infoGame.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-foreground">{infoGame.name}</h3>
                        <p className="text-xs text-muted-foreground">{infoGame.developer} • {infoGame.platform}</p>
                      </div>
                    </div>

                    {infoGame.community ? (
                      <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-start gap-2.5">
                        <Info className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-sky-200">Community Game</p>
                          <p className="text-xs text-sky-300/80 leading-relaxed">
                            {infoGame.name} has no official player-stat API, so GamerZ Hub treats it as a community game. Challenge other gamers from their profile — participation is community-based and no statistics are fabricated.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                        <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-amber-200">Integration Coming Soon</p>
                          <p className="text-xs text-amber-300/80 leading-relaxed">
                            {infoGame.name} official player-data integration is currently being prepared for GamerZ Hub. No working API connection is available yet.
                          </p>
                        </div>
                      </div>
                    )}

                    <Button onClick={() => setInfoGame(null)} className="w-full rounded-xl font-extrabold h-10">
                      Got it
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
