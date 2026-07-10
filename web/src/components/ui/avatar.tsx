'use client';
import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    status?: 'online' | 'idle' | 'dnd' | 'offline' | 'invisible';
    hover?: boolean;
    ring?: boolean;
  }
>(({ className, status, hover = false, ring = false, ...props }, ref) => {
  const Component = hover ? motion.div : 'div';
  const motionProps = hover ? { whileHover: { scale: 1.05 } } : {};

  const statusColors = {
    online: 'bg-success',
    idle: 'bg-warning',
    dnd: 'bg-destructive',
    offline: 'bg-muted-foreground',
    invisible: 'bg-muted-foreground',
  };

  return (
    <div className="relative inline-flex shrink-0">
      <Component ref={ref as any} {...motionProps}>
        <AvatarPrimitive.Root
          ref={ref}
          className={cn(
            'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full transition-all duration-200',
            ring && 'ring-2 ring-primary/50',
            className
          )}
          {...props as any}
        />
      </Component>
      {status && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background',
            statusColors[status],
            status === 'online' && 'animate-ping-slow'
          )}
        >
          <span className={cn('absolute inset-0 rounded-full', statusColors[status])} />
        </span>
      )}
    </div>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground font-medium text-sm',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
