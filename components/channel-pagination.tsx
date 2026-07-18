import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function ChannelPagination({
  basePath,
  totalItems,
  currentPage,
  pageSize = 48,
  query,
}: {
  basePath: string
  totalItems: number
  currentPage: number
  pageSize?: number
  query?: Record<string, string | undefined>
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  if (totalPages <= 1) return null

  const hrefFor = (page: number) => {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(query || {})) {
      if (value) searchParams.set(key, value)
    }
    searchParams.set("page", String(page))
    return `${basePath}?${searchParams.toString()}`
  }
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/40 p-3" aria-label="Channel pagination">
      <p className="px-2 text-sm text-muted-foreground">
        Showing {start.toLocaleString()}–{end.toLocaleString()} of {totalItems.toLocaleString()} channels
      </p>
      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link href={hrefFor(currentPage - 1)} className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium hover:bg-secondary">
            <ChevronLeft className="size-4" /> Previous
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border border-border/50 px-3 py-2 text-sm text-muted-foreground/60">
            <ChevronLeft className="size-4" /> Previous
          </span>
        )}
        <span className="min-w-20 text-center text-sm text-muted-foreground">
          {currentPage} / {totalPages}
        </span>
        {currentPage < totalPages ? (
          <Link href={hrefFor(currentPage + 1)} className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium hover:bg-secondary">
            Next <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border border-border/50 px-3 py-2 text-sm text-muted-foreground/60">
            Next <ChevronRight className="size-4" />
          </span>
        )}
      </div>
    </nav>
  )
}
