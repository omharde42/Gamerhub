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
    let isSubscribed = true;

    const errorParam = searchParams.get('error');
    if (errorParam) {
      if (isSubscribed) {
        setStatus('error');
        setError(decodeURIComponent(errorParam));
      }
      return;
    }

    const verifyAndLogin = async (accessToken: string, refreshToken: string) => {
      try {
        const { data } = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        login(data.data, accessToken, refreshToken);
        if (isSubscribed) {
          setStatus('success');
          setTimeout(() => router.push('/feed'), 1000);
        }
      } catch {
        if (isSubscribed) {
          setStatus('error');
          setError('Failed to verify user session after social login.');
        }
      }
    };

    const processSession = async () => {
      try {
        // 1. Hash parameters from Backend OAuth redirects (#accessToken=...)
        //    Tokens live in the fragment, not the query string, so they never
        //    reach server logs, browser history, or Referer headers.
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const hashAccess = hashParams.get('accessToken');
          const hashRefresh = hashParams.get('refreshToken');
          if (hashAccess && hashRefresh) {
            await verifyAndLogin(hashAccess, hashRefresh);
            return;
          }
        }

        // 2. Legacy query parameters (kept for backward compatibility)
        const queryAccess = searchParams.get('accessToken');
        const queryRefresh = searchParams.get('refreshToken');
        if (queryAccess && queryRefresh) {
          await verifyAndLogin(queryAccess, queryRefresh);
          return;
        }

        // 3. Hash parameters from Direct Google OAuth (#access_token=...)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const googleAccessToken = hashParams.get('access_token');
          if (googleAccessToken) {
            try {
              const userInfoRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleAccessToken}`);
              const userInfo = await userInfoRes.json();
              if (userInfo.email) {
                const { data } = await api.post('/auth/google', {
                  email: userInfo.email,
                  displayName: userInfo.name || userInfo.email.split('@')[0],
                  avatar: userInfo.picture || null,
                  googleId: userInfo.sub,
                });
                login(data.data.user, data.data.accessToken, data.data.refreshToken);
                if (isSubscribed) {
                  setStatus('success');
                  setTimeout(() => router.push('/feed'), 1000);
                }
                return;
              }
            } catch (googleErr) {
              console.warn('Google userinfo fetch failed:', googleErr);
            }
          }
        }

        // 4. Supabase Auth session (Google / Discord via Supabase)
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.access_token) {
          const provider = session.user?.app_metadata?.provider || 'google';
          const { data } = await api.post('/auth/social-login', {
            token: session.access_token,
            provider,
          });

          login(data.data.user, data.data.accessToken, data.data.refreshToken);
          if (isSubscribed) {
            setStatus('success');
            setTimeout(() => router.push('/feed'), 1000);
          }
          return;
        }

        // 5. Supabase auth state listener fallback if session hydration takes a moment
        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          if (newSession && newSession.access_token && isSubscribed) {
            try {
              const provider = newSession.user?.app_metadata?.provider || 'google';
              const { data } = await api.post('/auth/social-login', {
                token: newSession.access_token,
                provider,
              });

              login(data.data.user, data.data.accessToken, data.data.refreshToken);
              setStatus('success');
              setTimeout(() => router.push('/feed'), 1000);
            } catch (err: any) {
              setStatus('error');
              setError(err.response?.data?.message || 'Failed to process social login');
            }
          }
        });

        // 5. Fallback timer if no credentials found
        const timer = setTimeout(() => {
          if (isSubscribed && status === 'loading') {
            setStatus('error');
            setError('Authentication cancelled or session expired. Please try signing in again.');
          }
        }, 3500);

        return () => {
          authListener.subscription.unsubscribe();
          clearTimeout(timer);
        };
      } catch (err: any) {
        if (isSubscribed) {
          setStatus('error');
          setError(err.response?.data?.message || err.message || 'Authentication exchange failed');
        }
      }
    };

    processSession();

    return () => {
      isSubscribed = false;
    };
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
