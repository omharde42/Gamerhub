'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Sparkles, CheckCircle2, Shield, Swords, Gamepad2, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'RANK' | 'TOURNAMENT' | 'TEAM' | 'ACCOUNT' | 'ACHIEVEMENT';
  icon?: string;
}

const DEFAULT_EVENTS: TimelineEvent[] = [
  {
    id: '1',
    date: 'July 2026',
    title: 'Reached Radiant Rank in Valorant',
    description: 'Promoted to regional Top 500 leaderboard with 485 RR rating.',
    type: 'RANK',
    icon: '👑',
  },
  {
    id: '2',
    date: 'June 2026',
    title: 'Won 1st Place in PUBG Pro Scrims Cup',
    description: 'Secured tournament victory with Team Alpha taking home 5,000 Gamer Points.',
    type: 'TOURNAMENT',
    icon: '🏆',
  },
  {
    id: '3',
    date: 'May 2026',
    title: 'Reached FACEIT Level 10 Division',
    description: 'Surpassed 2,450 ELO in FACEIT CS2 competitive matchmaking.',
    type: 'RANK',
    icon: '⚡',
  },
  {
    id: '4',
    date: 'April 2026',
    title: 'Connected Official Steam Account',
    description: 'Linked verified Steam profile showcasing 100+ games and 1,280+ hours played.',
    type: 'ACCOUNT',
    icon: '🎮',
  },
  {
    id: '5',
    date: 'March 2026',
    title: 'Joined Esports Team Alpha as Main Duelist',
    description: 'Signed as starter entry fragger for regional competitive tournaments.',
    type: 'TEAM',
    icon: '⚔️',
  },
];

export function GamingTimeline({ events = DEFAULT_EVENTS }: { events?: TimelineEvent[] }) {
  return (
    <Card variant="glass" className="border-white/10 shadow-xl relative overflow-hidden">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#7C3AED]" />
            <h3 className="font-bold text-base text-white tracking-wide uppercase font-mono">Gaming Career Journey</h3>
          </div>
          <Badge className="bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/40 text-xs font-bold">
            Timeline
          </Badge>
        </div>

        {/* Vertical Timeline Track */}
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-[#7C3AED] before:via-emerald-500 before:to-[#FF6B00]">
          {events.map((evt, idx) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
              className="relative group"
            >
              {/* Timeline Bullet Node */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#111827] border-2 border-[#7C3AED] flex items-center justify-center shadow-lg group-hover:scale-125 group-hover:border-emerald-400 transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>

              {/* Event Content Box */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 hover:border-[#7C3AED]/50 transition-all space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    {evt.date}
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 text-gray-300">
                    {evt.type}
                  </Badge>
                </div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>{evt.icon}</span> {evt.title}
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">{evt.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
