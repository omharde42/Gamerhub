'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setError(decodeURIComponent(errorParam));
      return;
    }

    if (!accessToken || !refreshToken) {
      setStatus('error');
      setError('Missing authentication tokens');
      return;
    }

    const verifyAndLogin = async () => {
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

    verifyAndLogin();
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
