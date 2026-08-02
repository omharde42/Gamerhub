'use client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: any;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, icon: Icon, actionText, onAction }: EmptyStateProps) {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-border/40 bg-card/20 backdrop-blur-sm space-y-4 max-w-md mx-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
        <Icon className="h-8 w-8 text-primary animate-pulse" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-bold text-base text-foreground tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">{description}</p>
      </div>
      {actionText && onAction && (
        <Button 
          variant="gradient" 
          size="sm" 
          onClick={onAction}
          className="h-9 px-4 rounded-xl text-xs font-bold shadow-md shadow-primary/10"
          animate
        >
          {actionText}
        </Button>
      )}
    </motion.div>
  );
}
