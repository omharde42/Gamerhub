'use client';
import { Crown, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ManageSubscriptionPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-12 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/25">
        <Crown className="h-8 w-8 text-white" />
      </div>
      <h1 className="text-2xl font-bold">No Active Subscription</h1>
      <Card variant="glass">
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Premium subscriptions are coming soon. All features are currently free during our launch period.
          </p>
        </CardContent>
      </Card>
      <Link href="/feed">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Feed
        </Button>
      </Link>
    </div>
  );
}
