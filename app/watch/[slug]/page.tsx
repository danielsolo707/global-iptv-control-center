"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { VideoPlayer } from "@/components/video-player"
import { ChannelCard } from "@/components/cards"
import { SectionHeader, Badge, EmptyState, LiveDot, QualityBadge } from "@/components/ui/primitives"
import { useApp } from "@/components/app-provider"
import { useCallback, useEffect, useState } from "react"
import type { IptvChannel, IptvCountry } from "@/lib/types"
import {
  getChannel,
  getCountry,
  channelsByCountry,
  getFeaturedChannels,
} from "@/lib/api-client"
import {
  ArrowLeft,
  Heart,
  Globe,
  Radio,
} from "lucide-react"

export default function WatchPage() {
  const params = useParams()
  const slug = params.slug as string
  const { isFavorite, toggleFavorite, addRecent, settings } = useApp()
  const [channel, setChannel] = useState<IptvChannel | null>(null)
  const [country, setCountry] = useState<IptvCountry | null>(null)
  const [related, setRelated] = useState<IptvChannel[]>([])
  const [featured, setFeatured] = useState<IptvChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reportUnavailable = useCallback(() => {
    void fetch("/api/iptv/health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => undefined)
  }, [slug])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)

      try {
        const ch = await getChannel(slug)
        if (!ch) {
          if (!cancelled) setLoadError("This channel is no longer available.")
          return
        }

        const [co, coChannels, trend] = await Promise.all([
          getCountry(ch.countrySlug),
          channelsByCountry(ch.countrySlug),
          getFeaturedChannels(),
        ])
        if (cancelled) return

        setChannel(ch)
        addRecent(ch.slug)
        setCountry(co || null)
        setRelated(coChannels.filter((c) => c.slug !== slug).slice(0, 6))
        setFeatured(trend.filter((c) => c.slug !== slug).slice(0, 6))
      } catch {
        if (!cancelled) setLoadError("We couldn't load this channel. Please try again.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [slug, addRecent])

  if (loading && !channel) {
    return (
      <div className="grid h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="size-10 animate-pulse rounded-full bg-card" />
          <span>Loading channel...</span>
        </div>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="grid min-h-[calc(100dvh-4rem)] place-items-center px-4">
        <div className="w-full max-w-md">
          <EmptyState
            icon={<Radio className="size-8" />}
            title="Channel unavailable"
            description={loadError || "This channel is not available right now."}
            action={{ label: "Browse live channels", href: "/trending" }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      {/* Player */}
      <div className="space-y-4">
        <Link
          href={country ? `/countries/${country.slug}` : "/trending"}
          className="inline-flex h-10 items-center gap-2.5 rounded-xl border border-transparent px-3 text-sm text-muted-foreground transition-colors hover:border-border/60 hover:bg-card hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to {country?.name || "live channels"}
        </Link>

        <VideoPlayer
          sources={channel.streams}
          className="watch-player-frame aspect-video w-full"
          autoPlay={settings.autoplay}
          onAllSourcesUnavailable={reportUnavailable}
        />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className="grid size-12 place-items-center rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: channel.logoColor }}
            >
              {channel.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{channel.name}</h1>
                <LiveDot />
              </div>
              <p className="text-sm text-muted-foreground">{channel.language || "Language not listed"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(channel.slug)}
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              <Heart
                className={`size-4 ${isFavorite(channel.slug) ? "fill-red-500 text-red-500" : ""}`}
              />
              {isFavorite(channel.slug) ? "Favorited" : "Favorite"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className="bg-secondary">
          <Globe className="size-3" /> {country?.name || "Country not listed"}
        </Badge>
        <QualityBadge quality={channel.quality} />
        <Badge className="bg-secondary">{channel.language || "Language not listed"}</Badge>
      </div>

      {related.length > 0 && (
        <section>
          <SectionHeader title={`More from ${country?.name || "this country"}`} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {related.map((c) => (
              <ChannelCard key={c.slug} channel={c} country={country || undefined} />
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section>
          <SectionHeader title="Explore More Live Channels" icon={<Radio className="size-5 text-red-400" />} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((c) => (
              <ChannelCard key={c.slug} channel={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
