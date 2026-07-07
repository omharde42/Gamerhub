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
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; } if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; } setLoading(true); try { await api.post('/auth/register', { email: form.email, password: form.password, username: form.username }); toast.success('Account created! Please check your email to verify.'); router.push('/auth/login'); } catch (error: any) { const msg = error.response?.data?.message || error.response?.data?.errors?.password?.[0] || 'Registration failed'; toast.error(msg); } finally { setLoading(false); } };
  return (<div className="min-h-screen flex items-center justify-center bg-grid p-4"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md"><div className="text-center mb-8"><Link href="/" className="inline-flex items-center gap-2"><Gamepad2 className="h-8 w-8 text-gaming-purple" /><span className="text-2xl font-bold">GamerHub</span></Link></div><Card className="glass-card"><CardHeader className="text-center"><CardTitle className="text-2xl">Create Account</CardTitle><CardDescription>Join the ultimate gaming network</CardDescription></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-4"><div className="space-y-2"><Label htmlFor="username">Username</Label><Input id="username" placeholder="GamerTag (3-30 chars)" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div><div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div><div className="space-y-2"><Label htmlFor="password">Password</Label><div className="relative"><Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Min 8 chars, uppercase, lowercase, number" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div></div><div className="space-y-2"><Label htmlFor="confirmPassword">Confirm Password</Label><Input id="confirmPassword" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required /></div><Button type="submit" variant="gradient" className="w-full" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Account</Button></form><p className="text-center text-sm text-muted-foreground mt-6">Already have an account? <Link href="/auth/login" className="text-primary hover:underline font-medium">Sign in</Link></p></CardContent></Card></motion.div></div>);
}
