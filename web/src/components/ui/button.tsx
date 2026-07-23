import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md active:scale-[0.98] shadow-sm',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98] shadow-sm',
        outline: 'border border-border bg-background hover:bg-muted hover:text-foreground hover:border-border/80 active:scale-[0.98] shadow-sm',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98] shadow-sm',
        ghost: 'hover:bg-muted hover:text-foreground active:scale-[0.98]',
        link: 'text-primary underline-offset-4 hover:underline active:opacity-80',
        neon: 'border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/10 hover:shadow-md hover:shadow-cyan-500/10 active:bg-cyan-500/15 focus-visible:ring-2 focus-visible:ring-cyan-500 shadow-sm',
        gradient: 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg hover:shadow-indigo-500/25 active:from-indigo-700 active:to-violet-700 focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-sm',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-xl px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        xl: 'h-14 rounded-xl px-10 text-lg',
        icon: 'h-10 w-10 rounded-xl',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  animate?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, animate = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  const classes = cn(buttonVariants({ variant, size, className }));

  if (animate) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className={classes}
        ref={ref as any}
        {...(props as any)}
      />
    );
  }

  return <Comp className={classes} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
