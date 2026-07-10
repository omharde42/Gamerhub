'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthFormWrapper } from '@/components/auth/auth-form-wrapper';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
      toast.success('Check your email for reset instructions');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthFormWrapper
        title="Check Your Email"
        subtitle="We've sent password reset instructions"
        footer={
          <span>
            Remember your password?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </span>
        }
      >
        <div className="text-center space-y-4 py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </motion.div>
          <p className="text-sm text-muted-foreground">
            If an account exists for <strong className="text-foreground">{email}</strong>, you'll receive a password reset link shortly.
          </p>
          <p className="text-xs text-muted-foreground">Check your spam folder if you don't see it.</p>
          <Button variant="outline" className="gap-2" onClick={() => setSent(false)}>
            <ArrowLeft className="h-4 w-4" /> Try another email
          </Button>
        </div>
      </AuthFormWrapper>
    );
  }

  return (
    <AuthFormWrapper
      title="Forgot Password?"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <span>
          Remember your password?{' '}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div className="space-y-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
            variant="neon"
            autoFocus
            disabled={loading}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full h-12 gap-2"
            disabled={loading || !email.trim()}
            animate
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
            Send Reset Link
          </Button>
        </motion.div>

        <div className="text-center">
          <Link href="/auth/login" className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to sign in
          </Link>
        </div>
      </form>
    </AuthFormWrapper>
  );
}
