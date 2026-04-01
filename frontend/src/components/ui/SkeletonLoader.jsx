export function SkeletonLine({ width = 'w-full', height = 'h-4' }) {
  return <div className={`${width} ${height} shimmer-bg rounded-lg`} />
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`glass-card p-5 space-y-3 ${className}`}>
      <SkeletonLine height="h-5" width="w-2/3" />
      <SkeletonLine height="h-3" width="w-full" />
      <SkeletonLine height="h-3" width="w-4/5" />
      <SkeletonLine height="h-3" width="w-3/4" />
    </div>
  )
}

export function SkeletonResults() {
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {[1,2,3,4].map((i) => (
          <div key={i} className="w-28 h-9 shimmer-bg rounded-lg" />
        ))}
      </div>
      {/* Content blocks */}
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3">
        {[3,2,2,2,1].map((w, i) => (
          <div key={i} className={`flex-${w} h-3 shimmer-bg rounded`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass-card flex gap-4 px-4 py-4 items-center">
          {[3,2,2,2,1].map((w, j) => (
            <div key={j} className={`flex-${w} h-4 shimmer-bg rounded`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default SkeletonCard
