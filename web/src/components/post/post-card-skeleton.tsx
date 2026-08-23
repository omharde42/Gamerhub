'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PostCardSkeletonProps {
  /** Number of skeleton cards to render (default 3) */
  count?: number;
  /** Whether to show media skeleton */
  withMedia?: boolean;
}

function SingleSkeleton({ withMedia = false }: { withMedia?: boolean }) {
  return (
    <Card variant="glass" className="border-border/60">
      <CardContent className="p-4 space-y-4">
        {/* Author row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-[90%]" />
          <Skeleton className="h-3 w-[75%]" />
        </div>

        {/* Media placeholder */}
        {withMedia && (
          <Skeleton className="h-48 w-full rounded-xl" />
        )}

        {/* Action buttons row */}
        <div className="flex items-center justify-between border-t border-border/50 pt-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-7 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PostCardSkeleton({ count = 3, withMedia = false }: PostCardSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-fade-in"
          style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
        >
          <SingleSkeleton withMedia={withMedia} />
        </div>
      ))}
    </div>
  );
}
