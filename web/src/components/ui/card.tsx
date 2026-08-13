import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'bento' | 'game' | 'premium' | 'cyber';
  hover?: boolean;
  glow?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, variant = 'default', hover = true, glow = false, ...props }, ref) => {
  const classes = cn(
    'rounded-[26px] border border-white/10 dark:border-white/10 border-slate-200 bg-card/75 backdrop-blur-2xl text-card-foreground shadow-xl transition-all duration-300',
    hover && 'hover:-translate-y-1.5 hover:shadow-2xl hover:border-primary/40 hover:shadow-primary/10',
    variant === 'glass' && 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-xl shadow-black/10',
    variant === 'bento' && 'bg-white/65 dark:bg-slate-900/65 backdrop-blur-2xl border border-white/80 dark:border-white/10 rounded-[28px] p-6 shadow-2xl hover:border-primary/50 hover:shadow-primary/15',
    variant === 'game' && 'bg-card/85 backdrop-blur-xl border border-indigo-500/20 shadow-lg hover:border-indigo-500/40',
    variant === 'premium' && 'bg-gradient-to-br from-card via-card to-primary/15 border border-primary/40 shadow-xl shadow-primary/15 hover:border-primary/60',
    variant === 'cyber' && 'cyber-card',
    glow && 'shadow-[0_0_30px_rgba(124,58,237,0.3)] border-primary/50',
    className
  );
  return hover ? (
    <motion.div whileHover={{ y: -4 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} ref={ref as any}>
      <div className={classes} {...props} />
    </motion.div>
  ) : (
    <div ref={ref} className={classes} {...props} />
  );
});
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-base font-semibold leading-none tracking-tight', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
