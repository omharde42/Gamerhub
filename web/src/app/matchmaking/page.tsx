'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Zap, Users, Target, Shield, Gamepad2, ChevronLeft, ChevronRight, Sparkles, Trophy, Flame, Play, Settings } from 'lucide-react';
import { getInitials, getRankColor } from '@/lib/utils';
import { PageBackButton } from '@/components/ui/page-back-button';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const GAME_MODES = [
  {
    id: 'quick-match',
    title: 'QUICK MATCH',
    game: 'PUBG / BGMI',
    desc: 'Randomize teammates and battle it out in 4v4 Squads. Instant AI compatibility matchmaking.',
    badge: '1v1 & 4v4',
    color: 'from-[#7C3AED] via-[#9333EA] to-[#EC4899]',
    buttonText: 'FIND QUICK MATCH',
    mascotText: 'Battle it out! Instant AI algorithm connects you with online teammates matching your K/D ratio.',
  },
  {
    id: 'ranked-squad',
    title: 'RANKED SQUAD',
    game: 'VALORANT',
    desc: 'Competitive duo/trio matchmaking filtered strictly by Rank, Role (Duelist, Sentinel), and Win Rate.',
    badge: 'RANKED COMPETITIVE',
    color: 'from-[#FF6B00] via-[#FF3D71] to-[#7C3AED]',
    buttonText: 'SEARCH RANKED SQUAD',
    mascotText: 'No hardstuck games! Filter teammates by verified in-game rank, role preference, and communication.',
  },
  {
    id: 'custom-tournament',
    title: 'CUSTOM ARENA',
    game: 'FREE FIRE',
    desc: 'Create or join custom room scrims, clan matches, and high-stakes tournament prize pools.',
    badge: 'CUSTOM ROOM SCRIMS',
    color: 'from-[#00E676] via-[#059669] to-[#3B82F6]',
    buttonText: 'ENTER SCRIM ARENA',
    mascotText: 'Test your squad in custom rooms. Earn Gamer Points and level up your Gamer Passport rank.',
  },
  {
    id: 'practice-range',
    title: 'AI COACH PRACTICE',
    game: 'ALL GAMES',
    desc: 'Solo practice drills with AI Tactical Coach analysis, heatmap insights, and mechanics breakdown.',
    badge: 'SOLO / TRAINING',
    color: 'from-[#3B82F6] via-[#6366F1] to-[#8B5CF6]',
    buttonText: 'LAUNCH PRACTICE DRILL',
    mascotText: 'Refine your aim, map awareness, and utility usage with instant AI post-game feedback.',
  },
];

export default function MatchmakingPage() {
  const [selectedGameFilter, setSelectedGameFilter] = useState('');
  const [activeModeIndex, setActiveModeIndex] = useState(0);
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);

  const activeMode = GAME_MODES[activeModeIndex];

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['matchmaking', selectedGameFilter],
    queryFn: () => api.get(`/matchmaking/recommendations?game=${selectedGameFilter}`).then(r => r.data.data).catch(() => []),
  });

  const nextMode = () => setActiveModeIndex((prev) => (prev + 1) % GAME_MODES.length);
  const prevMode = () => setActiveModeIndex((prev) => (prev - 1 + GAME_MODES.length) % GAME_MODES.length);

  const handleStartMatchmaking = () => {
    setIsSearchingMatch(true);
    toast.loading(`Searching for ${activeMode.title} teammates...`, { id: 'mm-toast' });
    setTimeout(() => {
      setIsSearchingMatch(false);
      toast.success(`Matched with compatible ${activeMode.game} squad!`, { id: 'mm-toast' });
    }, 2500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative pb-10">
      {/* Top Controller Header Banner */}
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#0B1220] border border-[#7C3AED]/30 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <PageBackButton fallbackHref="/dashboard" className="text-white hover:bg-white/10 rounded-xl" aria-label="Back" />
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#FF6B00] flex items-center justify-center shadow-lg shadow-[#7C3AED]/30">
            <Gamepad2 className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wide text-white uppercase flex items-center gap-2 font-mono">
              MATCHMAKING ARENA
            </h1>
            <p className="text-xs text-muted-foreground">Select Mode & Match with Compatible Squads</p>
          </div>
        </div>

        {/* Gamepad Control Prompts */}
        <div className="hidden md:flex items-center gap-3 text-xs font-mono">
          <Badge className="bg-white/10 text-white border border-white/20 px-3 py-1 gap-1.5 font-bold">
            <span className="w-4 h-4 rounded-full bg-red-500/80 text-white flex items-center justify-center text-[10px] font-black">O</span> BACK
          </Badge>
          <Badge className="bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/40 px-3 py-1 gap-1.5 font-bold">
            <span className="w-4 h-4 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-[10px] font-black">X</span> START
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/40 px-3 py-1 gap-1.5 font-bold">
            <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black">△</span> RULES
          </Badge>
        </div>
      </div>

      {/* Arcade Carousel Section */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#0B1220] via-[#05070E] to-[#0B1220] border border-white/10 p-6 md:p-8 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-grid opacity-15 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Mode Selector Header */}
        <div className="text-center space-y-1 mb-6 relative z-10">
          <Badge className="bg-gradient-to-r from-[#7C3AED] to-[#FF6B00] text-white font-extrabold text-[10px] uppercase px-3 py-0.5 tracking-wider">
            {activeMode.badge}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-wider font-mono">
            {activeMode.title}
          </h2>
          <p className="text-xs text-primary font-semibold tracking-widest uppercase">{activeMode.game}</p>
        </div>

        {/* Arcade Card Carousel Track */}
        <div className="relative flex items-center justify-center gap-4 md:gap-6 my-4 z-10 min-h-[220px]">
          {/* Left Arrow Button */}
          <button
            onClick={prevMode}
            className="w-11 h-11 rounded-2xl bg-white/5 border border-white/15 hover:border-[#7C3AED] text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shrink-0"
            title="Previous Mode"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Active Mode Glowing Main Display Card */}
          <motion.div
            key={activeMode.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-lg rounded-2xl bg-[#111827] border-2 border-[#7C3AED] shadow-[0_0_30px_rgba(124,58,237,0.4)] p-6 text-center space-y-4 relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${activeMode.color} opacity-10`} />
            <p className="text-sm md:text-base text-gray-200 font-medium relative z-10 leading-relaxed">
              {activeMode.desc}
            </p>

            <div className="pt-2 relative z-10 flex flex-col items-center justify-center gap-3">
              <Button
                variant="gradient"
                size="lg"
                onClick={handleStartMatchmaking}
                disabled={isSearchingMatch}
                className="w-full max-w-xs font-black tracking-wider text-sm h-12 shadow-xl shadow-[#7C3AED]/40 gap-2 border border-white/20"
                animate
              >
                {isSearchingMatch ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Play className="h-5 w-5 fill-white" />
                )}
                {isSearchingMatch ? 'MATCHMAKING...' : activeMode.buttonText}
              </Button>
            </div>
          </motion.div>

          {/* Right Arrow Button */}
          <button
            onClick={nextMode}
            className="w-11 h-11 rounded-2xl bg-white/5 border border-white/15 hover:border-[#7C3AED] text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shrink-0"
            title="Next Mode"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Arcade Character Mascot Dialogue Box */}
        <div className="mt-8 p-4 rounded-2xl bg-[#0B1220]/90 border border-white/15 flex items-start gap-4 relative z-10 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#FF6B00] flex items-center justify-center shrink-0 border border-white/20 shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">AI Tactical Mascot</p>
            <p className="text-xs text-gray-300 italic font-mono leading-relaxed">
              &ldquo;{activeMode.mascotText}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Teammates Grid */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-[#7C3AED]" /> Compatible Squad Recommendations
          </h3>
          <span className="text-xs text-muted-foreground">Updated in Real-Time</span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations?.map((rec: any, i: number) => (
            <Link key={i} href={`/profile/${rec.username}`}>
              <Card className="bg-[#111827] border-white/10 hover:border-[#7C3AED] transition-all relative overflow-hidden group">
                <div className="absolute top-2 right-2 z-10">
                  <Badge variant={rec.compatibility >= 80 ? 'success' : rec.compatibility >= 60 ? 'warning' : 'secondary'} className="text-xs font-bold">
                    {rec.compatibility}% Match
                  </Badge>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-[#7C3AED]">
                      <AvatarImage src={rec.avatar || ''} />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold">{getInitials(rec.username)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-base text-white group-hover:text-[#7C3AED] transition-colors">{rec.username}</h4>
                      <p className={`text-xs font-semibold ${getRankColor(rec.rank)}`}>
                        {rec.rank || 'Unranked'} • {rec.role || 'Flex'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Target className="h-4 w-4 text-emerald-400" /> {rec.winRate || 68}% Win Rate
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {rec.reasons?.map((reason: string, j: number) => (
                      <Badge key={j} variant="outline" className="text-[10px] bg-white/5 border-white/10 text-gray-300">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {(!recommendations || recommendations.length === 0) && !isLoading && (
            <div className="col-span-full text-center py-12 bg-[#111827]/60 rounded-2xl border border-white/10">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <h4 className="text-base font-bold text-white mb-1">No Active Teammates Found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Complete your Gamer Passport profile with your main games and ranks to unlock AI teammate recommendations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
