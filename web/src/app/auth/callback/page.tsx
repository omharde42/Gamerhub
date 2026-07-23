'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { supabase } from '@/lib/supabase';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setStatus('error');
      setError(decodeURIComponent(errorParam));
      return;
    }

    const verifyAndLogin = async (accessToken: string, refreshToken: string) => {
      try {
        const { data } = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        login(data.data, accessToken, refreshToken);
        setStatus('success');
        setTimeout(() => router.push('/feed'), 1500);
      } catch {
        setStatus('error');
        setError('Failed to verify your identity');
      }
    };

    const checkSession = async () => {
      try {
        // Get the Supabase session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          // Fallback to query params if Supabase session is not found
          const queryAccess = searchParams.get('accessToken');
          const queryRefresh = searchParams.get('refreshToken');
          if (queryAccess && queryRefresh) {
            await verifyAndLogin(queryAccess, queryRefresh);
          } else {
            setStatus('error');
            setError(sessionError?.message || 'Missing authentication tokens');
          }
          return;
        }

        const provider = session.user?.app_metadata?.provider || 'google';
        const { data } = await api.post('/auth/social-login', {
          token: session.access_token,
          provider
        });

        login(data.data.user, data.data.accessToken, data.data.refreshToken);
        setStatus('success');
        setTimeout(() => router.push('/feed'), 1500);
      } catch (err: any) {
        setStatus('error');
        setError(err.response?.data?.message || err.message || 'Failed to exchange credentials');
      }
    };

    checkSession();
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-background/95">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Completing authentication...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <CheckCircle className="h-16 w-16 text-success" />
            </motion.div>
            <p className="text-lg font-semibold">Authenticated!</p>
            <p className="text-sm text-muted-foreground">Redirecting to your feed...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-destructive" />
            <p className="text-lg font-semibold">Authentication Failed</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
