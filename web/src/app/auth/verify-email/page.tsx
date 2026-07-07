'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  useEffect(() => { const token = searchParams.get('token'); if (token) { api.get(`/auth/verify-email?token=${token}`).then(() => setStatus('success')).catch(() => setStatus('error')); } else { setStatus('error'); } }, [searchParams]);
  return (<div className="min-h-screen flex items-center justify-center bg-grid p-4"><Card className="glass-card max-w-md w-full"><CardHeader className="text-center"><CardTitle className="text-2xl">Email Verification</CardTitle><CardDescription>{status === 'loading' ? 'Verifying your email...' : status === 'success' ? 'Email verified!' : 'Verification failed'}</CardDescription></CardHeader><CardContent className="text-center space-y-4">{status === 'loading' ? <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" /> : status === 'success' ? (<><CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" /><p className="text-muted-foreground">Your email has been verified. You can now log in.</p><Link href="/auth/login"><Button variant="gradient">Go to Login</Button></Link></>) : (<><XCircle className="h-16 w-16 text-destructive mx-auto" /><p className="text-muted-foreground">The verification link is invalid or expired.</p><Link href="/auth/login"><Button variant="outline">Back to Login</Button></Link></>)}</CardContent></Card></div>);
}
