'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
export default function ResetPasswordPage() {
  const searchParams = useSearchParams(); const router = useRouter();
  const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState(''); const [showPassword, setShowPassword] = useState(false); const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (password !== confirmPassword) { toast.error('Passwords do not match'); return; } setLoading(true); try { await api.post('/auth/reset-password', { token: searchParams.get('token'), password }); toast.success('Password reset successfully!'); router.push('/auth/login'); } catch (error: any) { toast.error(error.response?.data?.message || 'Failed to reset password'); } finally { setLoading(false); } };
  return (<div className="min-h-screen flex items-center justify-center bg-grid p-4"><Card className="glass-card max-w-md w-full"><CardHeader className="text-center"><CardTitle className="text-2xl">Reset Password</CardTitle><CardDescription>Enter your new password</CardDescription></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-4"><div className="space-y-2"><Label>New Password</Label><div className="relative"><Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required /><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div></div><div className="space-y-2"><Label>Confirm Password</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div><Button type="submit" variant="gradient" className="w-full" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Reset Password</Button></form></CardContent></Card></div>);
}
