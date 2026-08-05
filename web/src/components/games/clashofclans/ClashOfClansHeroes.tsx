'use client';

import { Shield, Crown, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ClashOfClansHeroes({ heroes = [], pets = [] }: { heroes?: any[]; pets?: any[] }) {
  if (!heroes || heroes.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-gray-400 bg-black/40 rounded-2xl border border-white/10">
        No Hero data available for this player tag.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <Crown className="h-4 w-4 text-yellow-400" /> Supercell Heroes & Pets
      </h5>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {heroes.map((hero, i) => (
          <div key={i} className="p-3 rounded-2xl bg-black/50 border border-yellow-500/20 space-y-1">
            <p className="text-xs font-bold text-white truncate">{hero.name}</p>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-yellow-400 font-bold">Lvl {hero.level}</span>
              <span className="text-gray-400 text-[10px]">Max: {hero.maxLevel}</span>
            </div>
          </div>
        ))}
        {pets.map((pet, i) => (
          <div key={i} className="p-3 rounded-2xl bg-black/50 border border-purple-500/20 space-y-1">
            <p className="text-xs font-bold text-purple-300 truncate">{pet.name} (Pet)</p>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-purple-400 font-bold">Lvl {pet.level}</span>
              <span className="text-gray-400 text-[10px]">Max: {pet.maxLevel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
