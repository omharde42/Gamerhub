'use client';
import Link from 'next/link';
import { Gamepad2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-6">
        <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200 }}>
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gaming-purple via-gaming-pink to-gaming-cyan flex items-center justify-center mx-auto shadow-2xl shadow-gaming-purple/20">
            <Gamepad2 className="h-12 w-12 text-white" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="text-8xl font-bold">
            <span className="bg-gradient-to-r from-gaming-purple via-gaming-cyan to-gaming-pink bg-clip-text text-transparent">404</span>
          </h1>
          <h2 className="text-2xl font-semibold mt-2">Lost in the Game?</h2>
          <p className="text-muted-foreground">This page doesn't exist or has been removed.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Link href="/">
            <Button variant="gradient" size="lg" className="gap-2" animate>
              <Home className="h-4 w-4" />
              Return Home
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
