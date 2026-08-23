export default function ProfileLoading() {
  return (
    <div className="space-y-4 p-4">
      {/* Banner skeleton */}
      <div className="h-40 w-full rounded-2xl bg-muted animate-pulse" />
      {/* Profile header */}
      <div className="flex items-end gap-4 -mt-12 px-4">
        <div className="w-24 h-24 rounded-full bg-muted animate-pulse border-4 border-background" />
        <div className="space-y-2 flex-1 pb-1">
          <div className="h-5 w-40 rounded bg-muted animate-pulse" />
          <div className="h-3 w-24 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-9 w-24 rounded-xl bg-muted animate-pulse" />
      </div>
      {/* Stats */}
      <div className="flex gap-6 px-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-4 w-8 rounded bg-muted animate-pulse" />
            <div className="h-2 w-12 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
      {/* Bio */}
      <div className="space-y-2 px-4">
        <div className="h-3 w-full rounded bg-muted animate-pulse" />
        <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
      </div>
      {/* Tabs */}
      <div className="flex gap-1 px-4 border-b border-border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-20 rounded-t bg-muted animate-pulse" />
        ))}
      </div>
      {/* Content */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}
