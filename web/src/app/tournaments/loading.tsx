export default function TournamentsLoading() {
  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded bg-muted animate-pulse" />
      </div>
      {/* Filter bar */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 shrink-0 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
      {/* Tournament cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/50 bg-card/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="h-3 w-48 rounded bg-muted animate-pulse" />
          <div className="flex gap-3">
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 rounded-xl bg-muted animate-pulse" />
            <div className="h-9 w-9 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
