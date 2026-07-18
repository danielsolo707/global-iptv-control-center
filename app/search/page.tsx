"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ChannelCard, CountryCard, CategoryCard } from "@/components/cards"
import { SectionHeader, EmptyState } from "@/components/ui/primitives"
import { searchIptv } from "@/lib/api-client"
import type { IptvChannel, IptvCountry, IptvCategory } from "@/lib/types"
import { Search, Radio, Globe, LayoutGrid, Clock } from "lucide-react"

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const [results, setResults] = useState<{
    channels: IptvChannel[]
    countries: IptvCountry[]
    categories: IptvCategory[]
  } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length < 2) {
      setResults(null)
      return
    }
    setLoading(true)
    searchIptv(query)
      .then((r) => setResults(r))
      .finally(() => setLoading(false))
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

  if (!results) return null

  const total = results.channels.length + results.countries.length + results.categories.length

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
      {results.channels.length > 0 && (
        <section>
          <SectionHeader
            title={`Channels (${results.channels.length})`}
            icon={<Radio className="size-5 text-red-400" />}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.channels.map((c) => (
              <ChannelCard key={c.slug} channel={c} />
            ))}
          </div>
        </section>
      )}

      {results.countries.length > 0 && (
        <section>
          <SectionHeader
            title={`Countries (${results.countries.length})`}
            icon={<Globe className="size-5 text-blue" />}
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {results.countries.map((c) => (
              <CountryCard key={c.slug} country={c} />
            ))}
          </div>
        </section>
      )}

      {results.categories.length > 0 && (
        <section>
          <SectionHeader
            title={`Categories (${results.categories.length})`}
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
