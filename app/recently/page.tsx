"use client"

import Link from "next/link"
import { ChannelCard, CountryCard } from "@/components/cards"
import { EmptyState } from "@/components/ui/primitives"
import { useApp } from "@/components/app-provider"
import { useEffect, useState } from "react"
import type { IptvChannel, IptvCountry } from "@/lib/types"
import { getChannel, getCountry, getChannels, getCountries } from "@/lib/api-client"
import { History, Clock, Play } from "lucide-react"

export default function RecentlyPage() {
  const { recent, clearRecent } = useApp()
  const [channels, setChannels] = useState<IptvChannel[]>([])
  const [countries, setCountries] = useState<IptvCountry[]>([])

  useEffect(() => {
    async function load() {
      const [allChannels, allCountries] = await Promise.all([getChannels(), getCountries()])
      // recent is ordered newest first, maintain that order
      const chs: IptvChannel[] = []
      const cos: IptvCountry[] = []
      for (const slug of recent) {
        const ch = allChannels.find((c) => c.slug === slug)
        if (ch) chs.push(ch)
        const co = allCountries.find((c) => c.slug === slug)
        if (co) cos.push(co)
      }
      setChannels(chs)
      setCountries(cos)
    }
    load()
  }, [recent])

  return (
    <div className="mx-auto max-w-[1600px] space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Recently Watched</h1>
          <p className="text-muted-foreground">Your viewing history</p>
        </div>
        {recent.length > 0 && (
          <button
            onClick={clearRecent}
            className="rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Clear History
          </button>
        )}
      </div>

      {channels.length === 0 && countries.length === 0 && (
        <EmptyState
          icon={<History className="size-8" />}
          title="No recent activity"
          description="Channels and countries you visit will appear here."
          action={{ label: "Start Watching", href: "/trending" }}
        />
      )}

      {channels.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Play className="size-5 text-blue" />
            <h2 className="text-xl font-bold">Recently Watched Channels</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {channels.map((c) => (
              <ChannelCard key={c.slug} channel={c} />
            ))}
          </div>
        </section>
      )}

      {countries.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Clock className="size-5 text-purple" />
            <h2 className="text-xl font-bold">Recently Viewed Countries</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {countries.map((c) => (
              <CountryCard key={c.slug} country={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
