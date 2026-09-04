'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Target, Clock, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

const GAMES = [
  { id: 'valorant', name: 'Valorant', emoji: '🎯' },
  { id: 'bgmi', name: 'BGMI', emoji: '🔫' },
  { id: 'freefire', name: 'Free Fire', emoji: '🔥' },
  { id: 'fortnite', name: 'Fortnite', emoji: '🏗️' },
  { id: 'apex', name: 'Apex Legends', emoji: '🦊' },
  { id: 'codm', name: 'COD Mobile', emoji: '💥' },
  { id: 'minecraft', name: 'Minecraft', emoji: '⛏️' },
  { id: 'genshin', name: 'Genshin Impact', emoji: '⚔️' },
  { id: 'pubg', name: 'PUBG PC', emoji: '🪖' },
  { id: 'lol', name: 'League of Legends', emoji: '🏆' },
  { id: 'dota2', name: 'Dota 2', emoji: '🐉' },
  { id: 'cs2', name: 'CS2', emoji: '💣' },
];

const SKILL_LEVELS = [
  { id: 'beginner', name: 'Beginner', desc: 'Just getting started', color: 'text-green-400' },
  { id: 'intermediate', name: 'Intermediate', desc: 'Know the basics', color: 'text-blue-400' },
  { id: 'advanced', name: 'Advanced', desc: 'Competitive player', color: 'text-purple-400' },
  { id: 'pro', name: 'Professional', desc: 'Esports level', color: 'text-yellow-400' },
];

const PLAYSTYLES = [
  { id: 'competitive', name: 'Competitive', emoji: '🏆' },
  { id: 'casual', name: 'Casual', emoji: '😎' },
  { id: 'social', name: 'Social', emoji: '💬' },
  { id: 'content', name: 'Content Creator', emoji: '🎬' },
];

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
  'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles',
  'Australia/Sydney', 'Pacific/Auckland',
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState('');
  const [playstyle, setPlaystyle] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  const saveProfile = useMutation({
    mutationFn: () => api.post('/profiles/onboarding', {
      games: selectedGames,
      skillLevel,
      playstyle,
      timezone,
    }),
    onSuccess: () => {
      toast.success('Profile set up! Welcome to GamerZ Hub');
      router.push('/feed');
    },
    onError: () => {
      toast.error('Failed to save preferences');
    },
  });

  const toggleGame = (id: string) => {
    setSelectedGames((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const steps = [
    {
      title: 'Pick your games',
      desc: 'Select the games you play',
      icon: Gamepad2,
      content: (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => toggleGame(game.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                selectedGames.includes(game.id)
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-border/80 text-muted-foreground'
              }`}
            >
              <span className="text-2xl">{game.emoji}</span>
              <div>
                <p className="text-sm font-medium">{game.name}</p>
                {selectedGames.includes(game.id) && (
                  <Check className="h-3 w-3 text-primary" />
                )}
              </div>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Skill level',
      desc: 'How competitive are you?',
      icon: Target,
      content: (
        <div className="grid grid-cols-2 gap-3">
          {SKILL_LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => setSkillLevel(level.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                skillLevel === level.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <p className={`text-sm font-bold ${level.color}`}>{level.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{level.desc}</p>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Playstyle',
      desc: 'What brings you here?',
      icon: Sparkles,
      content: (
        <div className="grid grid-cols-2 gap-3">
          {PLAYSTYLES.map((ps) => (
            <button
              key={ps.id}
              onClick={() => setPlaystyle(ps.id)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                playstyle === ps.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-border/80 text-muted-foreground'
              }`}
            >
              <span className="text-2xl">{ps.emoji}</span>
              <span className="text-sm font-medium">{ps.name}</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Timezone',
      desc: 'For tournament scheduling',
      icon: Clock,
      content: (
        <div className="space-y-2">
          {TIMEZONES.map((tz) => (
            <button
              key={tz}
              onClick={() => setTimezone(tz)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                timezone === tz
                  ? 'border-primary bg-primary/5 text-primary font-medium'
                  : 'border-border hover:border-border/80 text-muted-foreground'
              }`}
            >
              {tz.replace('/', ' / ').replace('_', ' ')}
            </button>
          ))}
        </div>
      ),
    },
  ];

  const current = steps[step];
  const canProceed = step === 0 ? selectedGames.length > 0 : step === 1 ? !!skillLevel : step === 2 ? !!playstyle : true;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg">
        <CardContent className="p-6 space-y-6">
          {/* Progress */}
          <div className="flex items-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <current.icon className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">{current.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{current.desc}</p>
          </div>

          {/* Content */}
          <AnimatePresence>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.15 }}
              className="max-h-[40vh] overflow-y-auto pr-1"
            >
              {current.content}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            {step < steps.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => saveProfile.mutate()}
                disabled={saveProfile.isPending}
                className="gap-2"
              >
                {saveProfile.isPending ? 'Saving...' : 'Get Started'}
                <Sparkles className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Skip */}
          {step < steps.length - 1 && (
            <div className="text-center">
              <button
                onClick={() => router.push('/feed')}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
