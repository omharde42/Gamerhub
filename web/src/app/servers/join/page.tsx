'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, Users, AlertCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function JoinServerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const { isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!code) {
      setStatus('error');
      setErrorMsg('No invite code provided. Please check your link.');
      return;
    }

    if (!isAuthenticated) {
      // Redirect to login page and preserve the redirect URL
      const redirectUrl = `/servers/join?code=${code}`;
      toast.error('Please log in to join this community');
      router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    const triggerJoin = async () => {
      try {
        const response = await api.post('/servers/join', { inviteCode: code });
        const { serverId } = response.data.data;
        setStatus('success');
        toast.success('Welcome! You have successfully joined the server.');
        router.push(`/servers/${serverId}`);
      } catch (err: any) {
        setStatus('error');
        const message = err.response?.data?.message || 'Failed to join server. Check if the code is correct.';
        setErrorMsg(message);
        toast.error(message);
      }
    };

    triggerJoin();
  }, [code, isAuthenticated, router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-primary/20 shadow-2xl shadow-primary/5 bg-muted/20 backdrop-blur-xl">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Users className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Community Invite</CardTitle>
          <CardDescription>You have been invited to join a GamerHub community</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex flex-col items-center justify-center min-h-[150px]">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground animate-pulse">Processing community invite...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center text-center gap-4 w-full">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 w-full justify-center">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => router.push('/servers')}>
                  <Home className="h-4 w-4" /> Go Home
                </Button>
                <Button className="flex-1" onClick={() => router.push('/servers')}>
                  Explore Servers
                </Button>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-2 text-center py-4">
              <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">Redirecting to server...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
