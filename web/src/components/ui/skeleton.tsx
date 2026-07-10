import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gradient-to-r from-muted via-muted/80 to-muted bg-[length:200%_100%]',
        className
      )}
      style={{ animation: 'shimmer 1s ease-in-out infinite, pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
      {...props}
    />
  );
}

export { Skeleton };
