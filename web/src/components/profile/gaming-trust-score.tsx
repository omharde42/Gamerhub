'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Trophy, Star, Award, CheckCircle2, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface GamingTrustScoreProps {
  score?: number;
  verifiedAccountsCount?: number;
  tournamentsCount?: number;
  communityRating?: number;
  fairPlayStatus?: string;
}

export function GamingTrustScore({
  score = 96,
  verifiedAccountsCount = 4,
  tournamentsCount = 18,
  communityRating = 4.9,
  fairPlayStatus = 'Verified Fair Play',
}: GamingTrustScoreProps) {
  return (
    <Card variant="glass" className="border-[#7C3AED]/30 relative overflow-hidden shadow-xl">
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#7C3AED]/10 rounded-full blur-3xl pointer-events-none" />
      <CardContent className="p-6 space-y-5 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white tracking-wide uppercase font-mono">Gaming Reputation</h3>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold gap-1">
            <CheckCircle2 className="h-3 w-3" /> {fairPlayStatus}
          </Badge>
        </div>

        {/* Big Score Display */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-center space-y-1">
            <p className="text-xs text-gray-400 font-medium">Trust Score</p>
            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-[#7C3AED]">
              {score}<span className="text-xs text-gray-400 font-normal">/100</span>
            </p>
            <p className="text-[10px] text-emerald-400 font-bold">Verified Gamer</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-center space-y-1">
            <p className="text-xs text-gray-400 font-medium">Linked Platforms</p>
            <p className="text-2xl font-black text-white">{verifiedAccountsCount}</p>
            <p className="text-[10px] text-gray-400">Verified OAuth</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-center space-y-1">
            <p className="text-xs text-gray-400 font-medium">Tournaments</p>
            <p className="text-2xl font-black text-[#FF6B00]">{tournamentsCount}</p>
            <p className="text-[10px] text-gray-400">Played / Scrims</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-center space-y-1">
            <p className="text-xs text-gray-400 font-medium">Community Rating</p>
            <p className="text-2xl font-black text-yellow-400 flex items-center justify-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {communityRating}
            </p>
            <p className="text-[10px] text-gray-400">Sportsmanship</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
