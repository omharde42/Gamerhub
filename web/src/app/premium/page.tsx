'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star, Sparkles, Shield, ChevronRight } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';

const plans = [
  {
    name: 'Pro', price: '$9.99', oldPrice: '$19.99', tier: 'PRO',
    features: ['Enhanced profile customization', 'AI matchmaking', 'Advanced analytics', 'Priority support', 'Custom badges', 'Ad-free experience'],
    icon: Zap, color: 'from-blue-500 to-cyan-500', popular: false
  },
  {
    name: 'Elite', price: '$19.99', oldPrice: '$39.99', tier: 'ELITE',
    features: ['Everything in Pro', 'AI Coach access', 'Personalized training plans', 'Heatmaps & insights', 'Priority in matchmaking', 'Early access to features'],
    icon: Star, color: 'from-gaming-purple to-gaming-pink', popular: true
  },
  {
    name: 'Team Pro', price: '$29.99', oldPrice: '$59.99', tier: 'TEAM_PRO',
    features: ['Everything in Elite', 'Team analytics dashboard', 'Advanced scouting tools', 'Recruitment dashboard', 'Organization verification', 'API access'],
    icon: Crown, color: 'from-yellow-500 to-orange-500', popular: false
  },
];

function ParticleBG() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: Math.random() * 4 + 1,
            height: Math.random() * 4 + 1,
            background: [0, 1, 2].includes(i % 3)
              ? 'hsl(var(--neon-purple)/0.3)'
              : 'hsl(var(--neon-cyan)/0.2)',
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 8,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

export default function PremiumPage() {
  const { user } = useAuthStore();
  const { data: subscription } = useQuery({ queryKey: ['subscription'], queryFn: () => api.get('/subscriptions').then(r => r.data.data), enabled: !!user });
  const checkout = useMutation({
    mutationFn: (tier: string) => api.post('/subscriptions/create-checkout-session', { tier }).then(r => r.data.data),
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: (err: any) => toast.error('Failed to start checkout'),
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative">
      <ParticleBG />

      <motion.div className="text-center space-y-4 relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Badge variant="default" className="text-sm px-4 py-1 animate-glow-pulse">
          <Crown className="h-4 w-4 mr-1" />Premium
        </Badge>
        <h1 className="text-4xl font-bold">
          <span className="bg-gradient-to-r from-gaming-purple via-gaming-cyan to-gaming-pink bg-clip-text text-transparent">
            Level Up Your Experience
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Unlock premium features to accelerate your gaming career.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 relative">
        {plans.map((plan, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            whileHover={{ y: -4 }}
            className="relative"
          >
            <Card className={`relative overflow-hidden ${plan.popular ? 'border-primary/50 ring-1 ring-primary/30 scale-105' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge variant="glowing" className="px-4 gap-1"><Sparkles className="h-3 w-3" /> Most Popular</Badge>
                </div>
              )}
              {/* Gradient background effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-[0.03]`} />
              <div className="absolute inset-0 bg-dots opacity-[0.03]" />

              <CardContent className="p-6 pt-8 space-y-6 relative">
                <motion.div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
                >
                  <plan.icon className="h-7 w-7 text-white" />
                </motion.div>

                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/mo</span>
                    {plan.oldPrice && <span className="text-sm text-muted-foreground line-through ml-2">{plan.oldPrice}</span>}
                  </div>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((f, j) => (
                    <motion.li
                      key={j}
                      className="flex items-start gap-2 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 + j * 0.05 }}
                    >
                      <div className="h-5 w-5 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-success" />
                      </div>
                      {f}
                    </motion.li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? 'gradient' : 'outline'}
                  className="w-full gap-1.5 group"
                  onClick={() => checkout.mutate(plan.tier)}
                  disabled={checkout.isPending}
                  animate
                >
                  {subscription?.tier === plan.tier ? (
                    'Current Plan'
                  ) : (
                    <>
                      Get {plan.name}
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <Card variant="glass" hover={false}>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Already have a subscription?</h2>
            <p className="text-muted-foreground mb-4">Manage your subscription and billing here.</p>
            <Link href="/premium/manage">
              <Button variant="outline">Manage Subscription</Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
