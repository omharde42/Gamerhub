'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Gamepad2, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); try { const { data } = await api.post('/auth/login', { email, password }); if (data.data.requiresTwoFactor) { router.push('/auth/2fa'); return; } setTokens(data.data.accessToken, data.data.refreshToken); setUser(data.data.user); toast.success('Welcome back!'); router.push('/dashboard'); } catch (error: any) { toast.error(error.response?.data?.message || 'Login failed'); } finally { setLoading(false); } };
  return (<div className="min-h-screen flex items-center justify-center bg-grid p-4"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md"><div className="text-center mb-8"><Link href="/" className="inline-flex items-center gap-2"><Gamepad2 className="h-8 w-8 text-gaming-purple" /><span className="text-2xl font-bold">GamerHub</span></Link></div><Card className="glass-card"><CardHeader className="text-center"><CardTitle className="text-2xl">Welcome back</CardTitle><CardDescription>Sign in to continue your journey</CardDescription></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-4"><div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div><div className="space-y-2"><Label htmlFor="password">Password</Label><div className="relative"><Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required /><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div></div><Button type="submit" variant="gradient" className="w-full" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign In</Button></form><p className="text-center text-sm text-muted-foreground mt-6">Don't have an account? <Link href="/auth/register" className="text-primary hover:underline font-medium">Sign up</Link></p><div className="text-center"><Link href="/auth/forgot-password" className="text-sm text-muted-foreground hover:text-primary">Forgot password?</Link></div></CardContent></Card></motion.div></div>);
}
