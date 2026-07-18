"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { VideoPlayer } from "@/components/video-player"
import { ChannelCard } from "@/components/cards"
import { SectionHeader, Badge, LiveDot, QualityBadge } from "@/components/ui/primitives"
import { useApp } from "@/components/app-provider"
import { useEffect, useState } from "react"
import type { IptvChannel, IptvCountry } from "@/lib/types"
import {
  getChannel,
  getCountry,
  channelsByCountry,
  getTrendingChannels,
  getProgramSchedule,
} from "@/lib/api-client"
import {
  ArrowLeft,
  Heart,
  Globe,
  Eye,
  Radio,
  Clock,
  Calendar,
  SkipBack,
  SkipForward,
} from "lucide-react"

export default function WatchPage() {
  const params = useParams()
  const slug = params.slug as string
  const { isFavorite, toggleFavorite, addRecent } = useApp()
  const [channel, setChannel] = useState<IptvChannel | null>(null)
  const [country, setCountry] = useState<IptvCountry | null>(null)
  const [related, setRelated] = useState<IptvChannel[]>([])
  const [trending, setTrending] = useState<IptvChannel[]>([])
  const [schedule, setSchedule] = useState<ReturnType<typeof getProgramSchedule>>([])

  useEffect(() => {
    async function load() {
      const ch = await getChannel(slug)
      if (!ch) return
      setChannel(ch)
      addRecent(ch.slug)

      const [co, coChannels, trend] = await Promise.all([
        getCountry(ch.countrySlug),
        channelsByCountry(ch.countrySlug),
        getTrendingChannels(),
      ])
      setCountry(co || null)
      setRelated(coChannels.filter((c) => c.slug !== slug).slice(0, 6))
      setTrending(trend.filter((c) => c.slug !== slug).slice(0, 6))
      setSchedule(getProgramSchedule(slug.length))
    }
    load()
  }, [slug, addRecent])

  if (!channel) {
    return (
      <div className="grid h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="size-10 animate-pulse rounded-full bg-card" />
          <span>Loading channel...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      {/* Player */}
      <div className="space-y-4">
        <Link
          href={`/channel/${channel.slug}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Channel Info
        </Link>

        <VideoPlayer
          src={channel.streamUrl || ""}
          className="aspect-video w-full"
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
              <p className="text-sm text-muted-foreground">{channel.now}</p>
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

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left - Info & Schedule */}
        <div className="space-y-6 lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-secondary">
              <Globe className="size-3" /> {country?.flag} {country?.name}
            </Badge>
            <QualityBadge quality={channel.quality} />
            <Badge className="bg-secondary">
              <Eye className="size-3" /> {channel.viewers.toLocaleString()} watching
            </Badge>
          </div>

          <section>
            <SectionHeader title="Schedule" icon={<Calendar className="size-5 text-blue" />} />
            <div className="space-y-2">
              {schedule.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
                    item.live
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-border/60 bg-card/50"
                  }`}
                >
                  <span className="w-12 text-sm font-mono font-medium">{item.time}</span>
                  <span className="flex-1 text-sm font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.duration}</span>
                  {item.live && <LiveDot />}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right - Related */}
        <div className="space-y-6">
          {related.length > 0 && (
            <section>
              <SectionHeader title={`More from ${country?.name}`} />
              <div className="space-y-3">
                {related.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/watch/${c.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 transition-colors hover:bg-secondary"
                  >
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: c.logoColor }}
                    >
                      {c.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.now}</p>
                    </div>
                    <LiveDot />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Trending */}
      {trending.length > 0 && (
        <section>
          <SectionHeader title="Trending Channels" icon={<Radio className="size-5 text-red-400" />} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {trending.map((c) => (
              <ChannelCard key={c.slug} channel={c} country={country || undefined} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
