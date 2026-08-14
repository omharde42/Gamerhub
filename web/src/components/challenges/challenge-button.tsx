'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Swords } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { CreateChallengeModal } from './create-challenge-modal';

export function ChallengeButton({
  opponentId,
  opponentUsername,
  opponentDisplayName,
  opponentAvatar,
}: {
  opponentId: string;
  opponentUsername: string;
  opponentDisplayName?: string | null;
  opponentAvatar?: string | null;
}) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);

  if (!user || !opponentId) return null;
  // Community games (e.g. Smash Karts) don't require a connected account, so a
  // challenge is always possible — the modal offers community games plus any
  // connected official games the opponent has.

  return (
    <>
      <Button
        variant="gradient"
        size="sm"
        animate
        onClick={() => setOpen(true)}
        className="gap-1.5 min-w-[110px] w-full sm:w-auto h-11 relative overflow-hidden"
        title="Challenge this gamer to Clash of Clans, PUBG or Smash Karts — no friendship required"
      >
        <Swords className="h-4 w-4" />
        Challenge
      </Button>

      <CreateChallengeModal
        open={open}
        onClose={() => setOpen(false)}
        opponent={{
          id: opponentId,
          username: opponentUsername,
          displayName: opponentDisplayName,
          avatar: opponentAvatar,
        }}
      />
    </>
  );
}
