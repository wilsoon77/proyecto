export default function ProductosLoading() {
  return (
    <div className="public-container py-10 sm:py-12">
      <div className="mb-10 animate-pulse space-y-3">
        <div className="h-3 w-24 rounded bg-border" />
        <div className="h-12 w-full max-w-xl rounded bg-border" />
        <div className="h-4 w-80 rounded bg-border" />
      </div>
      <div className="mb-8 h-28 animate-pulse rounded-2xl bg-muted" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
        {Array.from({ length: 8 }, (_, index) => <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />)}
      </div>
    </div>
  )
}
