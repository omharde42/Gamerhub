import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground border-border',
        success: 'border-transparent bg-success/15 text-success',
        warning: 'border-transparent bg-warning/15 text-warning',
        neon: 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan',
        pink: 'border-neon-pink bg-neon-pink/10 text-neon-pink',
        purple: 'border-neon-purple bg-neon-purple/10 text-neon-purple',
        rank: 'border-transparent',
        glowing: 'border-transparent bg-primary text-primary-foreground animate-glow-pulse',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  glow?: boolean;
}

const RANK_COLORS: Record<string, string> = {
  Bronze: 'bg-orange-900/30 text-orange-500 border-orange-700/30',
  Silver: 'bg-gray-600/30 text-gray-300 border-gray-500/30',
  Gold: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/30',
  Platinum: 'bg-cyan-900/30 text-cyan-400 border-cyan-700/30',
  Diamond: 'bg-blue-900/30 text-blue-400 border-blue-700/30',
  Master: 'bg-purple-900/30 text-purple-400 border-purple-700/30',
  Grandmaster: 'bg-red-900/30 text-red-400 border-red-700/30',
  Challenger: 'bg-yellow-900/30 text-yellow-300 border-yellow-600/30',
};

function Badge({ className, variant = 'default', glow = false, ...props }: BadgeProps) {
  const isRank = variant === 'rank';
  const rankClass = isRank && props.children ? RANK_COLORS[String(props.children).trim()] || '' : '';
  return (
    <div
      className={cn(
        badgeVariants({ variant }),
        isRank && rankClass,
        glow && 'glow-sm',
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
