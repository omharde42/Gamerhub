'use client';
import { motion } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gaming-purple via-gaming-pink to-gaming-cyan flex items-center justify-center mx-auto shadow-lg shadow-gaming-purple/20">
            <Gamepad2 className="h-8 w-8 text-white" />
          </div>
        </motion.div>
        <motion.p
          className="text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading...
        </motion.p>
      </div>
    </div>
  );
}
