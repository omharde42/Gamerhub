export default function FeedLoading() {
  return (
    <div className="space-y-4 p-4">
      {/* Story-like skeleton */}
      <div className="flex gap-3 overflow-hidden pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
            <div className="w-10 h-2 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
      {/* Post skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/50 bg-card/50 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
              <div className="h-2 w-16 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-48 w-full rounded-xl bg-muted animate-pulse" />
          <div className="flex gap-4 pt-1">
            <div className="h-3 w-12 rounded bg-muted animate-pulse" />
            <div className="h-3 w-12 rounded bg-muted animate-pulse" />
            <div className="h-3 w-12 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
