'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AuthFormWrapper } from '@/components/auth/auth-form-wrapper';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No verification token provided'); return; }
    api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => { setStatus('success'); setMessage('Email verified! You can now log in.'); })
      .catch((err) => { setStatus('error'); setMessage(err.response?.data?.message || 'Verification failed'); });
  }, [token]);

  return (
    <AuthFormWrapper title="Email Verification" subtitle="Verifying your email address"
      footer={<Link href="/auth/login" className="text-primary hover:underline font-medium">Go to login</Link>}>
      <div className="flex flex-col items-center py-8 space-y-4">
        {status === 'loading' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
        {status === 'success' && <CheckCircle className="h-12 w-12 text-success" />}
        {status === 'error' && <XCircle className="h-12 w-12 text-destructive" />}
        <p className="text-sm text-center">{message}</p>
        {status !== 'loading' && (
          <Link href="/auth/login">
            <Button variant="gradient" animate>Go to Login</Button>
          </Link>
        )}
      </div>
    </AuthFormWrapper>
  );
}
