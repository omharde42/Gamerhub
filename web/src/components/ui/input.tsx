import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'neon' | 'ghost';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, variant = 'default', ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
        variant === 'neon' && 'border-neon-cyan/30 focus-visible:ring-neon-cyan/50 focus-visible:border-neon-cyan',
        variant === 'ghost' && 'bg-transparent border-transparent focus-visible:bg-accent/50',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
