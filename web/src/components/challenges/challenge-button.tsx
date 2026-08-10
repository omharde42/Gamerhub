'use client';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Swords } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { normalizeGameKey } from './challenge-utils';
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

  const { data: opponentAccounts = [] } = useQuery({
    queryKey: ['user-game-connections', opponentId],
    queryFn: () => api.get(`/game/user-connections?userId=${opponentId}`).then((r) => r.data.data || []),
    enabled: !!opponentId && !!user,
  });

  const hasSupportedGame = useMemo(
    () => (opponentAccounts as any[]).some((acc) => normalizeGameKey(acc.game || '') !== null),
    [opponentAccounts]
  );

  if (!user || !opponentId) return null;
  if (!hasSupportedGame) return null;

  return (
    <>
      <Button
        variant="gradient"
        size="sm"
        animate
        onClick={() => setOpen(true)}
        className="gap-1.5 min-w-[110px] w-full sm:w-auto h-11 relative overflow-hidden"
        title="Challenge this gamer to Clash of Clans or PUBG — no friendship required"
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
