'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star, Sparkles, Shield } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import Link from 'next/link';

const plans = [{ name: 'Pro', price: '$9.99', oldPrice: '$19.99', tier: 'PRO', features: ['Enhanced profile customization', 'AI matchmaking', 'Advanced analytics', 'Priority support', 'Custom badges', 'Ad-free experience'], icon: Zap, color: 'from-blue-500 to-cyan-500', popular: false }, { name: 'Elite', price: '$19.99', oldPrice: '$39.99', tier: 'ELITE', features: ['Everything in Pro', 'AI Coach access', 'Personalized training plans', 'Heatmaps & insights', 'Priority in matchmaking', 'Early access to features'], icon: Star, color: 'from-gaming-purple to-gaming-pink', popular: true }, { name: 'Team Pro', price: '$29.99', oldPrice: '$59.99', tier: 'TEAM_PRO', features: ['Everything in Elite', 'Team analytics dashboard', 'Advanced scouting tools', 'Recruitment dashboard', 'Organization verification', 'API access'], icon: Crown, color: 'from-yellow-500 to-orange-500', popular: false }];

export default function PremiumPage() {
  const { user } = useAuthStore();
  const { data: subscription } = useQuery({ queryKey: ['subscription'], queryFn: () => api.get('/subscriptions').then(r => r.data.data), enabled: !!user });
  const checkout = useMutation({ mutationFn: (tier: string) => api.post('/subscriptions/create-checkout-session', { tier }).then(r => r.data.data), onSuccess: (data) => { if (data.url) window.location.href = data.url; }, onError: (err: any) => toast.error('Failed to start checkout') });

  return (<div className="max-w-6xl mx-auto space-y-8"><div className="text-center space-y-4"><Badge variant="premium" className="text-sm px-4 py-1"><Crown className="h-4 w-4 mr-1" />Premium</Badge><h1 className="text-4xl font-bold">Level Up Your <span className="text-gradient">Experience</span></h1><p className="text-lg text-muted-foreground max-w-2xl mx-auto">Unlock premium features to accelerate your gaming career.</p></div>
    <div className="grid md:grid-cols-3 gap-6">{plans.map((plan, i) => (<Card key={i} className={`glass-card relative ${plan.popular ? 'border-gaming-purple ring-1 ring-gaming-purple scale-105' : ''}`}>{plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge variant="premium" className="px-4">Most Popular</Badge></div>}<CardContent className="p-6 pt-8 space-y-6"><div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}><plan.icon className="h-6 w-6 text-white" /></div><div><h3 className="text-xl font-bold">{plan.name}</h3><div className="mt-2"><span className="text-4xl font-bold">{plan.price}</span><span className="text-muted-foreground">/mo</span>{plan.oldPrice && <span className="text-sm text-muted-foreground line-through ml-2">{plan.oldPrice}</span>}</div></div><ul className="space-y-3">{plan.features.map((f, j) => (<li key={j} className="flex items-start gap-2 text-sm"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />{f}</li>))}</ul><Button variant={plan.popular ? 'gradient' : 'outline'} className="w-full" onClick={() => checkout.mutate(plan.tier)} disabled={checkout.isPending}>{subscription?.tier === plan.tier ? 'Current Plan' : `Get ${plan.name}`}</Button></CardContent></Card>))}</div>
    <Card className="glass-card"><CardContent className="p-8 text-center"><h2 className="text-2xl font-bold mb-2">Already have a subscription?</h2><p className="text-muted-foreground mb-4">Manage your subscription and billing here.</p><Link href="/premium/manage"><Button variant="outline">Manage Subscription</Button></Link></CardContent></Card></div>);
}
