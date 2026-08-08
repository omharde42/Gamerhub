'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Swords, Sparkles, RefreshCw, Clock, ArrowRight, Shield, Zap, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getInitials } from '@/lib/utils';

export default function ComparePage() {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  // 1. Fetch Common Connected Games (Single Source of Truth)
  const { data: commonData, isLoading: isLoadingGames } = useQuery({
    queryKey: ['compare-common-games', selectedFriendId],
    queryFn: async () => {
      const url = selectedFriendId ? `/compare/games?friendId=${selectedFriendId}` : '/compare/games';
      const res = await api.get(url);
      return res.data.data || { userHasConnectedGames: false, commonGames: [], userConnectedGames: [] };
    },
  });

  const games = commonData?.commonGames || [];
  const userHasConnectedGames = commonData?.userHasConnectedGames || false;
  const userConnectedGames = commonData?.userConnectedGames || [];

  useEffect(() => {
    if (games.length > 0) {
      if (!selectedGameId || !games.some((g: any) => g.id === selectedGameId)) {
        setSelectedGameId(games[0].id);
      }
    } else {
      setSelectedGameId(null);
    }
  }, [games, selectedGameId]);

  // 2. Fetch Friends Leaderboard for selected game (Game-isolated)
  const { data: leaderboardData, isLoading: isLoadingLeaderboard, refetch, isFetching } = useQuery({
    queryKey: ['compare-leaderboard', selectedGameId],
    queryFn: async () => {
      if (!selectedGameId) return null;
      console.log('[FRONTEND:COMPARE] Fetching leaderboard for:', selectedGameId);
      const res = await api.get(`/compare/${selectedGameId}/leaderboard`);
      return res.data.data;
    },
    enabled: Boolean(selectedGameId),
    staleTime: 5 * 60 * 1000,
  });

  // 3. Fetch 1v1 Comparison if friend selected
  const { data: versusData } = useQuery({
    queryKey: ['compare-versus', selectedGameId, selectedFriendId],
    queryFn: async () => {
      if (!selectedGameId || !selectedFriendId) return null;
      const res = await api.get(`/compare/${selectedGameId}/versus/${selectedFriendId}`);
      return res.data.data;
    },
    enabled: Boolean(selectedGameId && selectedFriendId),
  });

  if (isLoadingGames) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-white/10 rounded-xl" />
        <div className="h-20 bg-white/5 rounded-2xl" />
        <div className="h-64 bg-white/5 rounded-3xl" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto pb-10 px-2 sm:px-4">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Trophy className="h-7 w-7 text-amber-400" />
            Compare Yourself
          </h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            Compete with your friends using your real verified gaming statistics.
          </p>
        </div>

        <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-xs font-bold gap-1.5 px-3 py-1.5">
          <Shield className="h-3.5 w-3.5" /> 100% Real API Verified
        </Badge>
      </div>

      {/* PHASE 9: EMPTY STATES */}
      {!userHasConnectedGames ? (
        // Case A: Current User Has NO Connected Games
        <Card variant="glass" className="border-amber-500/30 bg-gradient-to-br from-[#1F1708] via-[#0F0D06] to-black text-center p-8 sm:p-12 space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto text-3xl">
            🎮
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-extrabold text-white">No connected games yet</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Connect your Clash of Clans, PUBG PC, or Valorant account to start competing on the live friends leaderboard.
            </p>
          </div>
          <Link href="/connections" className="inline-block pt-2">
            <Button variant="gradient" size="default" className="font-extrabold text-xs gap-2 rounded-xl px-6">
              <Plus className="h-4 w-4" /> Connect a Game
            </Button>
          </Link>
        </Card>
      ) : games.length === 0 ? (
        // Case B: Current User Has Connected Games, but Friends Have Not Connected Same Games
        <Card variant="glass" className="border-purple-500/30 bg-gradient-to-br from-[#180A29] via-[#0D0517] to-black text-center p-8 sm:p-12 space-y-4">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto text-3xl">
            🤝
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-extrabold text-white">No common connected games yet</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              You have connected <span className="text-purple-300 font-bold">{userConnectedGames.map((g: any) => g.name).join(', ')}</span>.
              Connect another game or invite your accepted friends to connect their accounts!
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/connections">
              <Button variant="gradient" size="default" className="font-extrabold text-xs gap-2 rounded-xl px-5">
                <Plus className="h-4 w-4" /> Connect Another Game
              </Button>
            </Link>
            <Link href="/friends">
              <Button variant="outline" size="default" className="font-bold text-xs gap-2 rounded-xl px-5 border-white/20">
                <Users className="h-4 w-4" /> View Friends
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* PHASE 4 & 8: GAME SELECTION TABS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {games.map((g: any) => {
              const isActive = selectedGameId === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => {
                    setSelectedGameId(g.id);
                  }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold border transition-all shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black border-yellow-400 shadow-lg shadow-amber-500/30 font-black'
                      : 'bg-black/60 text-gray-300 border-white/10 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <span className="text-base">{g.icon}</span>
                  <span>{g.name}</span>
                  {g.friendsCount !== undefined && (
                    <Badge variant="outline" className={`text-[10px] font-bold ${isActive ? 'bg-black/20 text-black border-black/30' : 'bg-white/10 text-gray-400 border-white/10'}`}>
                      {g.friendsCount} {g.friendsCount === 1 ? 'friend' : 'friends'}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* LEADERBOARD DASHBOARD & GAME-ISOLATED STATS */}
          {isLoadingLeaderboard ? (
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 animate-pulse space-y-4 text-center">
              <div className="h-6 w-48 bg-white/10 rounded mx-auto" />
              <p className="text-xs text-amber-400 font-mono font-bold animate-bounce">
                Syncing {games.find((g: any) => g.id === selectedGameId)?.name || 'Game'} statistics...
              </p>
              <div className="h-16 bg-white/5 rounded-2xl" />
              <div className="h-16 bg-white/5 rounded-2xl" />
            </div>
          ) : leaderboardData ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedGameId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* COMPETITIVE INDICATOR & GAP HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-amber-950/60 via-black/80 to-purple-950/40 border border-amber-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-lg">
                      #{leaderboardData.userRank}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <span>{leaderboardData.gameName} Leaderboard</span>
                      </h3>
                      <p className="text-xs text-amber-300 font-semibold mt-0.5">{leaderboardData.gapText}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[11px] text-gray-400 gap-1 font-mono">
                      <Clock className="h-3 w-3" /> Updated just now
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                      disabled={isFetching}
                      className="text-xs font-bold gap-1.5 rounded-xl h-9 border-amber-500/30 hover:border-amber-500/60 bg-black/40 text-amber-300"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-amber-400' : ''}`} />
                      {isFetching ? 'Syncing...' : 'Sync'}
                    </Button>
                  </div>
                </div>

                {/* LEADERBOARD LIST */}
                <div className="space-y-3">
                  {leaderboardData.leaderboard.map((player: any) => {
                    const isUser = player.isCurrentUser;
                    const isSelectedFriend = selectedFriendId === player.userId;

                    return (
                      <motion.div
                        key={player.userId}
                        whileHover={{ scale: 1.01 }}
                        className={`p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
                          isUser
                            ? 'bg-gradient-to-r from-amber-500/20 via-black/80 to-yellow-500/10 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                            : isSelectedFriend
                            ? 'bg-purple-950/40 border-purple-500/50'
                            : 'bg-black/60 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Rank & User Details */}
                        <div className="flex items-center gap-3.5">
                          <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                            player.rank === 1 ? 'bg-amber-400 text-black shadow-md shadow-amber-400/40' :
                            player.rank === 2 ? 'bg-slate-300 text-black' :
                            player.rank === 3 ? 'bg-amber-700 text-white' : 'bg-white/10 text-gray-400'
                          }`}>
                            {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : `#${player.rank}`}
                          </div>

                          <Avatar className="h-10 w-10 border border-white/10">
                            <AvatarImage src={player.avatar || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                              {getInitials(player.displayName)}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-white">{player.displayName}</span>
                              {isUser && (
                                <Badge className="bg-amber-500 text-black font-extrabold text-[10px] px-1.5 py-0">
                                  YOU
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 font-mono">
                              {player.inGameName} <span className="text-gray-500">({player.tag})</span>
                            </p>
                          </div>
                        </div>

                        {/* Score & 1v1 Compare Action */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-base font-black text-amber-400">{player.scoreLabel}</div>
                            <p className="text-[10px] text-gray-400 uppercase font-semibold">Verified Live Stats</p>
                          </div>

                          {!isUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFriendId(isSelectedFriend ? null : player.userId)}
                              className={`text-xs font-bold rounded-xl h-9 px-3 border ${
                                isSelectedFriend
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                  : 'bg-white/5 text-gray-300 border-white/10 hover:border-amber-500/40 hover:text-amber-300'
                              }`}
                            >
                              <Swords className="h-3.5 w-3.5 mr-1" />
                              {isSelectedFriend ? 'Comparing' : 'Compare 1v1'}
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* 1-ON-1 HEAD-TO-HEAD COMPARISON CARD */}
                <AnimatePresence>
                  {versusData && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card variant="glass" className="border-purple-500/40 bg-gradient-to-br from-purple-950/40 via-black to-zinc-950 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Swords className="h-5 w-5 text-purple-400" />
                            <h4 className="font-extrabold text-base text-white">Head-to-Head Comparison</h4>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFriendId(null)}
                            className="text-xs text-gray-400 hover:text-white"
                          >
                            Close 1v1
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* YOU */}
                          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3">
                            <Badge className="bg-amber-500 text-black font-extrabold text-xs px-2.5">YOU</Badge>
                            <h5 className="font-extrabold text-sm text-white">{versusData.user.displayName}</h5>
                            <div className="text-xl font-black text-amber-400">{versusData.user.scoreLabel}</div>
                            <p className="text-xs text-gray-400 font-mono">{versusData.user.tag}</p>
                          </div>

                          {/* FRIEND */}
                          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-center space-y-3">
                            <Badge className="bg-purple-500 text-white font-extrabold text-xs px-2.5">FRIEND</Badge>
                            <h5 className="font-extrabold text-sm text-white">{versusData.friend.displayName}</h5>
                            <div className="text-xl font-black text-purple-400">{versusData.friend.scoreLabel}</div>
                            <p className="text-xs text-gray-400 font-mono">{versusData.friend.tag}</p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          ) : null}
        </>
      )}
    </motion.div>
  );
}
