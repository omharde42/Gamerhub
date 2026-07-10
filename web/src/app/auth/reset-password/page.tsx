'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Eye, EyeOff, Check, X, ArrowLeft } from 'lucide-react';
import { AuthFormWrapper } from '@/components/auth/auth-form-wrapper';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token');
    }
  }, [token]);

  const passwordChecks = {
    length: password.length >= 6,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    match: password === confirmPassword && confirmPassword.length > 0,
  };

  const allChecks = Object.values(passwordChecks).every(Boolean);
  const isValid = password && allChecks && !!token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      toast.success('Password reset successfully!');
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const CheckIcon = ({ ok }: { ok: boolean }) => ok
    ? <Check className="h-3.5 w-3.5 text-success" />
    : <X className="h-3.5 w-3.5 text-muted-foreground/50" />;

  if (!token) {
    return (
      <AuthFormWrapper
        title="Invalid Link"
        subtitle="This password reset link is invalid or has expired"
        footer={
          <span>
            <Link href="/auth/forgot-password" className="text-primary hover:underline font-medium">Request a new link</Link>
          </span>
        }
      >
        <div className="text-center py-4">
          <Link href="/auth/forgot-password">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Request Reset Link
            </Button>
          </Link>
        </div>
      </AuthFormWrapper>
    );
  }

  if (done) {
    return (
      <AuthFormWrapper
        title="Password Reset!"
        subtitle="Your password has been updated successfully"
        footer=""
      >
        <div className="text-center py-4">
          <Link href="/auth/login">
            <Button variant="gradient" size="lg" className="gap-2" animate>
              <ArrowLeft className="h-4 w-4" /> Sign in with new password
            </Button>
          </Link>
        </div>
      </AuthFormWrapper>
    );
  }

  return (
    <AuthFormWrapper
      title="Set New Password"
      subtitle="Choose a strong password for your account"
      footer={
        <span>
          <Link href="/auth/login" className="text-primary hover:underline font-medium">Back to sign in</Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div className="space-y-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pr-10"
              variant="neon"
              autoFocus
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password && (
            <motion.div className="space-y-1.5 pt-1" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <div className="flex items-center gap-1.5 text-xs">
                <CheckIcon ok={passwordChecks.length} />
                <span className={passwordChecks.length ? 'text-success' : 'text-muted-foreground'}>At least 6 characters</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <CheckIcon ok={passwordChecks.upper} />
                <span className={passwordChecks.upper ? 'text-success' : 'text-muted-foreground'}>One uppercase letter</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <CheckIcon ok={passwordChecks.number} />
                <span className={passwordChecks.number ? 'text-success' : 'text-muted-foreground'}>One number</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div className="space-y-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-11"
            variant="neon"
            disabled={loading}
          />
          {confirmPassword && (
            <div className="flex items-center gap-1.5 text-xs">
              <CheckIcon ok={passwordChecks.match} />
              <span className={passwordChecks.match ? 'text-success' : 'text-muted-foreground'}>Passwords match</span>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full h-12 gap-2"
            disabled={loading || !isValid}
            animate
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
            Reset Password
          </Button>
        </motion.div>
      </form>
    </AuthFormWrapper>
  );
}
