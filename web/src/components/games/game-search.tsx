'use client';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Gamepad2, X } from 'lucide-react';
import { GAMES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

interface GameSearchProps {
  selectedGames: string[];
  onToggle: (game: string) => void;
  placeholder?: string;
}

export function GameSearch({ selectedGames, onToggle, placeholder = 'Search games...' }: GameSearchProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return GAMES;
    const q = query.toLowerCase();
    return GAMES.filter(g => g.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 pr-9"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setQuery('')}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {selectedGames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedGames.map(game => (
            <Badge key={game} variant="secondary" className="gap-1 cursor-pointer" onClick={() => onToggle(game)}>
              <Gamepad2 className="h-3 w-3" />
              {game}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}

      {query && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {filtered.map((game, i) => {
            const isSelected = selectedGames.includes(game);
            return (
              <motion.div
                key={game}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:border-primary/50 ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}`}
                  onClick={() => onToggle(game)}
                >
                  <CardContent className="p-3 flex items-center gap-2">
                    <Gamepad2 className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium truncate">{game}</span>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground text-center py-4">No games found matching &quot;{query}&quot;</p>
          )}
        </div>
      )}

      {!query && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {GAMES.slice(0, 8).map((game) => {
            const isSelected = selectedGames.includes(game);
            return (
              <Card
                key={game}
                className={`cursor-pointer transition-all hover:border-primary/50 ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}`}
                onClick={() => onToggle(game)}
              >
                <CardContent className="p-3 flex items-center gap-2">
                  <Gamepad2 className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium truncate">{game}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
