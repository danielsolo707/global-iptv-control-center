"use client"

import { useState } from "react"
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
} from "lucide-react"
import type { IptvChannel, IptvCountry, IptvCategory } from "@/lib/types"
import { useApp } from "@/components/app-provider"
import { QualityBadge, LiveDot } from "@/components/ui/primitives"
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

export function FavoriteCountryButton({ slug, className }: { slug: string; className?: string }) {
  const { isFavoriteCountry, toggleFavoriteCountry } = useApp()
  const fav = isFavoriteCountry(slug)
  return (
    <button
      onClick={() => toggleFavoriteCountry(slug)}
      aria-label={fav ? "Remove country from favorites" : "Add country to favorites"}
      className={cn(
        "grid size-9 place-items-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/70",
        className,
      )}
    >
      <Heart className={cn("size-4", fav ? "fill-red-500 text-red-500" : "text-white")} />
    </button>
  )
}

function SafeImage({
  src,
  alt,
  fill,
  sizes,
  className,
}: {
  src: string
  alt: string
  fill?: boolean
  sizes?: string
  className?: string
}) {
  const [imgSrc, setImgSrc] = useState(src)

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={className}
      onError={() => setImgSrc("/placeholder.svg")}
    />
  )
}

export function ChannelCard({ channel, country, className }: { channel: IptvChannel; country?: IptvCountry; className?: string }) {
  return (
    <article className={cn("group relative min-w-0 w-full", className)}>
      <Link
        href={`/watch/${channel.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-blue/40 hover:shadow-xl hover:shadow-blue/5"
      >
        <div className="relative aspect-video overflow-hidden">
          <SafeImage
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
              {country?.name || channel.countryName || "Country not listed"}
            </p>
          </div>
        </div>
        <div className="border-t border-border/50 px-3 py-2 text-[11px] text-muted-foreground">
          <span className="truncate">{channel.language || "Language not listed"}</span>
        </div>
      </Link>
      <FavoriteButton slug={channel.slug} className="absolute right-3 top-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100" />
    </article>
  )
}

export function CountryCard({ country, className }: { country: IptvCountry; className?: string }) {
  return (
    <article className={cn("group relative", className)}>
      <Link
        href={`/countries/${country.slug}`}
        className="relative flex aspect-[4/5] w-full shrink-0 flex-col justify-end overflow-hidden rounded-2xl border border-border/60 transition-all duration-300 hover:-translate-y-1 hover:border-purple/40 hover:shadow-xl hover:shadow-purple/5"
      >
        {country.image ? (
          <SafeImage
            src={country.image}
            alt={country.name}
            fill
            sizes="(max-width: 768px) 45vw, 240px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.27_0.05_265),transparent_62%)]" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div className="relative p-4">
          <p className="mb-1 font-bold text-white">{country.name}</p>
          <p className="text-xs text-white/70">{country.channels.toLocaleString()} channels</p>
        </div>
      </Link>
      <FavoriteCountryButton slug={country.slug} className="absolute left-3 top-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100" />
    </article>
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
