'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Gamepad2, Loader2, ArrowLeft, Mail } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); try { await api.post('/auth/forgot-password', { email }); setSent(true); toast.success('Reset link sent!'); } catch (error: any) { toast.error(error.response?.data?.message || 'Failed'); } finally { setLoading(false); } };
  return (<div className="min-h-screen flex items-center justify-center bg-grid p-4"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md"><div className="text-center mb-8"><Link href="/" className="inline-flex items-center gap-2"><Gamepad2 className="h-8 w-8 text-gaming-purple" /><span className="text-2xl font-bold">GamerHub</span></Link></div><Card className="glass-card"><CardHeader className="text-center"><CardTitle className="text-2xl">Forgot Password</CardTitle><CardDescription>{sent ? 'Check your email for the reset link' : 'Enter your email to receive a reset link'}</CardDescription></CardHeader><CardContent>{sent ? (<div className="text-center space-y-4"><div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto"><Mail className="h-8 w-8 text-green-500" /></div><p className="text-muted-foreground">If an account with that email exists, we've sent a password reset link.</p><Link href="/auth/login"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Back to Login</Button></Link></div>) : (<form onSubmit={handleSubmit} className="space-y-4"><div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div><Button type="submit" variant="gradient" className="w-full" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send Reset Link</Button></form>)}<div className="text-center mt-4"><Link href="/auth/login" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" />Back to Login</Link></div></CardContent></Card></motion.div></div>);
}
