import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'game' | 'premium';
  hover?: boolean;
  glow?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, variant = 'default', hover = true, glow = false, ...props }, ref) => {
  const classes = cn(
    'rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm transition-all duration-300',
    hover && 'hover:-translate-y-1 hover:shadow-xl hover:border-border/80',
    variant === 'glass' && 'bg-card/40 backdrop-blur-xl border border-border/40 shadow-lg shadow-black/10',
    variant === 'game' && 'bg-card/80 backdrop-blur-md border border-indigo-500/10 shadow-md hover:border-indigo-500/30',
    variant === 'premium' && 'bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20 shadow-lg shadow-primary/5 hover:border-primary/40',
    glow && 'shadow-[0_0_20px_rgba(99,102,241,0.15)] border-primary/30',
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
