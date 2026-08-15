'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Danger-zone card for permanently deleting the account. Requires the user to
 * type their username to confirm and (for password accounts) their password,
 * then calls DELETE /auth/account and clears the local session.
 */
export function DeleteAccountCard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const username = user?.profile?.username || (user as any)?.username || '';
  const canSubmit = confirmText.trim() === username && username.length > 0;

  const handleDelete = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      await api.delete('/auth/account', { data: { password: password || undefined } });

      // Best-effort: also sign out of any Supabase session in this browser.
      try {
        const { supabase } = await import('@/lib/supabase');
        await supabase.auth.signOut();
      } catch {
        // Ignore — the backend account is already gone.
      }

      logout();
      toast.success('Your account has been deleted. Goodbye, gamer!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="glass" className="border-destructive/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Danger Zone
        </CardTitle>
        <CardDescription className="text-xs">
          Permanently delete your account and all associated data — profile, posts, matches, teams, and
          connections. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Deleting your account removes your Gamer Passport, analytics, and community content forever.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive/40 hover:bg-destructive/10 shrink-0"
          onClick={() => setOpen(true)}
        >
          Delete Account
        </Button>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete your account?
            </DialogTitle>
            <DialogDescription>
              This permanently deletes your Gamer Passport, match history, posts, teams, and all personal data.
              It cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-muted-foreground">
              Type <span className="font-mono font-bold text-foreground">{username}</span> to confirm. This action
              is irreversible.
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delete-username" className="text-xs font-semibold">Type your username</Label>
              <Input
                id="delete-username"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={username}
                variant="neon"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delete-password" className="text-xs font-semibold">Password (required for password accounts)</Label>
              <Input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                variant="neon"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!canSubmit || loading}
              onClick={handleDelete}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
