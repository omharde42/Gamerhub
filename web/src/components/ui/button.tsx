import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:opacity-90 hover:shadow-lg hover:shadow-primary/20',
        destructive: 'bg-destructive text-destructive-foreground hover:opacity-90 hover:shadow-lg hover:shadow-destructive/20',
        outline: 'border border-border bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/30',
        secondary: 'bg-secondary text-secondary-foreground hover:opacity-80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        neon: 'bg-transparent border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-lg hover:shadow-neon-cyan/20 glow-sm',
        gradient: 'bg-gradient-to-r from-gaming-purple to-gaming-pink text-white hover:opacity-90 hover:shadow-lg hover:shadow-gaming-purple/20',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        xl: 'h-14 rounded-xl px-10 text-lg',
        icon: 'h-10 w-10',
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
