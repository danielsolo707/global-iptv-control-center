"use client"

import Link from "next/link"
import { ChannelCard, CountryCard } from "@/components/cards"
import { EmptyState } from "@/components/ui/primitives"
import { useApp } from "@/components/app-provider"
import { useEffect, useState } from "react"
import type { IptvChannel, IptvCountry } from "@/lib/types"
import { getChannels, getCountries } from "@/lib/api-client"
import { Heart } from "lucide-react"

export default function FavoritesPage() {
  const { favorites, favoriteCountries } = useApp()
  const [channels, setChannels] = useState<IptvChannel[]>([])
  const [countries, setCountries] = useState<IptvCountry[]>([])

  useEffect(() => {
    async function load() {
      const [allChannels, allCountries] = await Promise.all([getChannels(), getCountries()])
      setChannels(allChannels.filter((c) => favorites.includes(c.slug)))
      setCountries(allCountries.filter((c) => favoriteCountries.includes(c.slug)))
    }
    load()
  }, [favorites, favoriteCountries])

  return (
    <div className="mx-auto max-w-[1600px] space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Favorites</h1>
        <p className="text-muted-foreground">Your saved channels and countries</p>
      </div>

      {channels.length === 0 && countries.length === 0 && (
        <EmptyState
          icon={<Heart className="size-8" />}
          title="No favorites yet"
          description="Add channels and countries to your favorites to see them here."
          action={{ label: "Browse live channels", href: "/trending" }}
        />
      )}

      {channels.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">Favorite Channels ({channels.length})</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {channels.map((c) => (
              <ChannelCard key={c.slug} channel={c} />
            ))}
          </div>
        </section>
      )}

      {countries.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">Favorite Countries ({countries.length})</h2>
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
