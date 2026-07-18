"use client"

import Link from "next/link"
import Image from "next/image"
import {
  Trophy,
  Newspaper,
  Clapperboard,
  Baby,
  Music,
  Sparkles,
  Sun,
  GraduationCap,
  TrendingUp,
  Cpu,
  Heart,
  Play,
  Eye,
} from "lucide-react"
import type { IptvChannel, IptvCountry, IptvCategory } from "@/lib/types"
import { useApp } from "@/components/app-provider"
import { QualityBadge, LiveDot, Badge } from "@/components/ui/primitives"
import { cn } from "@/lib/utils"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy,
  Newspaper,
  Clapperboard,
  Baby,
  Music,
  Sparkles,
  Sun,
  GraduationCap,
  TrendingUp,
  Cpu,
}

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] ?? Sparkles
  return <Icon className={className} />
}

function formatViewers(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`
}

export function FavoriteButton({ slug, className }: { slug: string; className?: string }) {
  const { isFavorite, toggleFavorite } = useApp()
  const fav = isFavorite(slug)
  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleFavorite(slug)
      }}
      aria-label={fav ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "grid size-9 place-items-center rounded-full border border-border/70 bg-background/70 backdrop-blur transition-colors hover:bg-secondary",
        className,
      )}
    >
      <Heart className={cn("size-4", fav ? "fill-red-500 text-red-500" : "text-foreground")} />
    </button>
  )
}

export function ChannelCard({ channel, country }: { channel: IptvChannel; country?: IptvCountry }) {
  return (
    <Link
      href={`/channel/${channel.slug}`}
      className="group relative flex w-64 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-blue/40 hover:shadow-xl hover:shadow-blue/5"
    >
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={channel.image || "/placeholder.svg"}
          alt={channel.name}
          fill
          sizes="256px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <LiveDot />
          <QualityBadge quality={channel.quality} />
        </div>
        <FavoriteButton slug={channel.slug} className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-full bg-gradient-brand opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100">
          <Play className="size-5 fill-white text-white" />
        </div>
      </div>
      <div className="flex items-center gap-3 p-3">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
          style={{ backgroundColor: channel.logoColor }}
        >
          {channel.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{channel.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {country?.flag} {country?.name || channel.countrySlug}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border/50 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="truncate">Now: {channel.now}</span>
        <span className="flex shrink-0 items-center gap-1">
          <Eye className="size-3" /> {formatViewers(channel.viewers)}
        </span>
      </div>
    </Link>
  )
}

export function CountryCard({ country, className }: { country: IptvCountry; className?: string }) {
  return (
    <Link
      href={`/countries/${country.slug}`}
      className={cn(
        "group relative flex aspect-[4/5] w-full shrink-0 flex-col justify-end overflow-hidden rounded-2xl border border-border/60 transition-all duration-300 hover:-translate-y-1 hover:border-purple/40 hover:shadow-xl hover:shadow-purple/5",
        className,
      )}
    >
      <Image
        src={country.image || "/placeholder.svg"}
        alt={country.name}
        fill
        sizes="(max-width: 768px) 45vw, 240px"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="absolute right-3 top-3">
        <Badge className="glass text-foreground">
          <span className="size-1.5 rounded-full bg-emerald-400" /> {country.liveNow} live
        </Badge>
      </div>
      <div className="relative p-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-lg">{country.flag}</span>
          <span className="font-bold text-white">{country.name}</span>
        </div>
        <p className="text-xs text-white/70">{country.channels.toLocaleString()} channels</p>
      </div>
    </Link>
  )
}

export function CategoryCard({ category, wide }: { category: IptvCategory; wide?: boolean }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        "group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue/40 hover:shadow-xl hover:shadow-blue/5",
        wide ? "w-full" : "w-60 shrink-0 snap-start",
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", category.gradient)} />
      <span
        className="relative grid size-14 shrink-0 place-items-center rounded-2xl"
        style={{ backgroundColor: `${category.color}22`, color: category.color }}
      >
        <CategoryIcon name={category.icon} className="size-7" />
      </span>
      <div className="relative min-w-0">
        <p className="truncate font-bold">{category.name}</p>
        <p className="text-xs text-muted-foreground">{category.channels.toLocaleString()} Channels</p>
      </div>
    </Link>
  )
}

export function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: string
  label: string
  color: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-3 backdrop-blur">
      <span className="grid size-9 place-items-center rounded-lg" style={{ backgroundColor: `${color}22`, color }}>
        {icon}
      </span>
      <div>
        <p className="text-lg font-extrabold leading-none">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
