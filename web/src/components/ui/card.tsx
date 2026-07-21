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
    'rounded-xl border border-border/60 bg-card text-card-foreground shadow-sm transition-all duration-150',
    hover && 'hover:-translate-y-0.5 hover:shadow-md hover:border-border/80',
    variant === 'glass' && 'bg-card/95 backdrop-blur-md border border-border/80 shadow-sm',
    variant === 'game' && 'bg-card border border-border shadow-sm',
    variant === 'premium' && 'bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20 shadow-md',
    className
  );
  return hover ? (
    <motion.div whileHover={{ y: -2 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} ref={ref as any}>
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
