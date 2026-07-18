"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ChannelCard, CountryCard, CategoryCard } from "@/components/cards"
import { SectionHeader, EmptyState } from "@/components/ui/primitives"
import { searchIptv } from "@/lib/api-client"
import type { IptvChannel, IptvCountry, IptvCategory } from "@/lib/types"
import { Search, Radio, Globe, LayoutGrid } from "lucide-react"

type SearchScope = "all" | "channels" | "countries" | "categories"

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const [results, setResults] = useState<{
    channels: IptvChannel[]
    countries: IptvCountry[]
    categories: IptvCategory[]
    totals?: {
      channels: number
      countries: number
      categories: number
    }
    truncated?: boolean
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [scope, setScope] = useState<SearchScope>("all")

  useEffect(() => {
    if (query.length < 2) {
      setResults(null)
      setError(false)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(false)
    searchIptv(query)
      .then((r) => {
        if (!cancelled) setResults(r)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [query])

  if (!query) {
    return (
      <EmptyState
        icon={<Search className="size-8" />}
        title="Search for channels, countries, or categories"
        description="Type at least 2 characters to start searching."
      />
    )
  }

  if (loading) {
    return (
      <div className="grid h-64 place-items-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="size-10 animate-spin rounded-full border-2 border-border border-t-foreground" />
          <span>Searching...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={<Search className="size-8" />}
        title="Search is temporarily unavailable"
        description="Please check your connection and try again in a moment."
      />
    )
  }

  if (!results) return null

  const total = (results.totals?.channels ?? results.channels.length)
    + (results.totals?.countries ?? results.countries.length)
    + (results.totals?.categories ?? results.categories.length)

  if (total === 0) {
    return (
      <EmptyState
        icon={<Search className="size-8" />}
        title={`No results for "${query}"`}
        description="Try a different search term."
      />
    )
  }

  return (
    <div className="space-y-10">
      {results.truncated && (
        <p className="rounded-xl border border-border/60 bg-card/40 px-4 py-3 text-sm text-muted-foreground">
          Showing the first 100 matches. Refine your search to narrow the results.
        </p>
      )}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Search result type">
        {([
          ["all", "All", total],
          ["channels", "Channels", results.totals?.channels ?? results.channels.length],
          ["countries", "Countries", results.totals?.countries ?? results.countries.length],
          ["categories", "Categories", results.totals?.categories ?? results.categories.length],
        ] as const).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={scope === value}
            onClick={() => setScope(value)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${scope === value ? "border-blue bg-blue/15 text-foreground" : "border-border/60 bg-card text-muted-foreground hover:bg-secondary"}`}
          >
            {label} <span className="ml-1 text-xs opacity-75">{count}</span>
          </button>
        ))}
      </div>

      {(scope === "all" || scope === "channels") && results.channels.length > 0 && (
        <section>
          <SectionHeader
            title={`Channels (${results.totals?.channels ?? results.channels.length})`}
            icon={<Radio className="size-5 text-red-400" />}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.channels.map((c) => (
              <ChannelCard key={c.slug} channel={c} />
            ))}
          </div>
        </section>
      )}

      {(scope === "all" || scope === "countries") && results.countries.length > 0 && (
        <section>
          <SectionHeader
            title={`Countries (${results.totals?.countries ?? results.countries.length})`}
            icon={<Globe className="size-5 text-blue" />}
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {results.countries.map((c) => (
              <CountryCard key={c.slug} country={c} />
            ))}
          </div>
        </section>
      )}

      {(scope === "all" || scope === "categories") && results.categories.length > 0 && (
        <section>
          <SectionHeader
            title={`Categories (${results.totals?.categories ?? results.categories.length})`}
            icon={<LayoutGrid className="size-5 text-purple" />}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.categories.map((c) => (
              <CategoryCard key={c.slug} category={c} wide />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">Find channels, countries, and categories</p>
      </div>

      <Suspense
        fallback={
          <div className="grid h-64 place-items-center">
            <div className="size-10 animate-spin rounded-full border-2 border-border border-t-foreground" />
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </div>
  )
}
