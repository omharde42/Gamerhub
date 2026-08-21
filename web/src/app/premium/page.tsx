'use client';
import { Crown, Sparkles, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PremiumPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-12 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/25">
          <Crown className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          Premium <Sparkles className="h-6 w-6 text-yellow-500" />
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Premium subscriptions are coming soon. All features are currently free for everyone during our launch period.
        </p>
      </motion.div>

      <Card variant="glass">
        <CardContent className="p-8 space-y-4">
          <h2 className="text-xl font-bold">What to expect</h2>
          <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-sm mx-auto">
            <li className="flex items-center gap-2"><span className="text-primary">✓</span> Enhanced profile customization</li>
            <li className="flex items-center gap-2"><span className="text-primary">✓</span> AI Coach &amp; personalized training</li>
            <li className="flex items-center gap-2"><span className="text-primary">✓</span> Advanced analytics &amp; heatmaps</li>
            <li className="flex items-center gap-2"><span className="text-primary">✓</span> Priority matchmaking</li>
            <li className="flex items-center gap-2"><span className="text-primary">✓</span> Team analytics dashboard</li>
          </ul>
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
