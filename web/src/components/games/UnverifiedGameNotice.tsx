'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

interface UnverifiedGameNoticeProps {
  title?: string;
  message?: string;
}

/**
 * Honest empty state for games that do not currently support verified account
 * connection. GamerZ Hub never fabricates statistics for these titles, so the
 * UI clearly says verification is unavailable instead of showing invented
 * numbers or a fake "verified" badge.
 */
export function UnverifiedGameNotice({
  title = 'Verification unavailable',
  message = 'This game does not currently support verified account connection. GamerZ Hub only verifies Clash of Clans, PUBG PC/Console and Steam accounts through their official APIs — no statistics are ever fabricated.',
}: UnverifiedGameNoticeProps) {
  return (
    <Card variant="glass" className="border-amber-500/30 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-sm text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
