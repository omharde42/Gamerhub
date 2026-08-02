'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Loader2, Shield, Check, AlertTriangle } from 'lucide-react';

export default function ManageSubscriptionPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.get('/subscriptions').then(r => r.data.data),
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post('/subscriptions/cancel'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('Subscription will be cancelled at the end of the billing period');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to cancel subscription'),
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/premium">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Manage Subscription
          </h1>
          <p className="text-xs text-muted-foreground">View and manage your premium plan</p>
        </div>
      </div>

      {!subscription ? (
        <Card variant="glass">
          <CardContent className="p-8 text-center space-y-4">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <div>
              <h3 className="font-semibold">No Active Subscription</h3>
              <p className="text-sm text-muted-foreground mt-1">You don&apos;t have any active subscription plan.</p>
            </div>
            <Link href="/premium">
              <Button variant="gradient" animate>
                View Plans
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  {subscription.tier?.replace('_', ' ')} Plan
                </span>
                <Badge variant={subscription.status === 'ACTIVE' ? 'success' : 'secondary'}>
                  {subscription.status}
                </Badge>
              </CardTitle>
              <CardDescription>
                {subscription.cancelAtPeriodEnd
                  ? 'Your subscription will be cancelled at the end of the current billing period.'
                  : 'Your subscription is active and will renew automatically.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription.currentPeriodEnd && (
                <div className="flex items-center gap-2 text-sm bg-muted/30 rounded-xl p-3 border border-border/50">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                  <span>
                    Current period ends:{' '}
                    <strong>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</strong>
                  </span>
                </div>
              )}

              {subscription.cancelAtPeriodEnd ? (
                <div className="flex items-center gap-2 text-sm bg-success/5 rounded-xl p-3 border border-success/20 text-success">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Cancellation confirmed — access continues until period end.</span>
                </div>
              ) : (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel your subscription? You will retain access until the end of the billing period.')) {
                      cancelMutation.mutate();
                    }
                  }}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Cancel Subscription
                </Button>
              )}

              <div className="text-center pt-2">
                <Link href="/premium">
                  <Button variant="outline" size="sm">
                    Change Plan
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
