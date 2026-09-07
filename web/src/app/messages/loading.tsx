export default function MessagesLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar skeleton */}
      <div className="w-80 border-r border-border p-3 space-y-2 hidden md:block">
        <div className="h-9 w-full rounded-xl bg-muted animate-pulse" />
        <div className="h-4 w-24 mt-4 mb-2 rounded bg-muted animate-pulse" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-28 rounded bg-muted animate-pulse" />
              <div className="h-2 w-36 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      {/* Chat area skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b border-border flex items-center px-4 gap-3">
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          <div className="h-3 w-24 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className={`h-9 rounded-2xl bg-muted animate-pulse ${i % 2 === 0 ? 'w-48' : 'w-40'}`} />
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-border">
          <div className="h-10 w-full rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}
