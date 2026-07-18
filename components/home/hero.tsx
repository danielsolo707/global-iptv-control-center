"use client"

import { useState } from "react"
import Link from "next/link"
import { Globe } from "@/components/globe/globe"
import { PillButton, LiveDot } from "@/components/ui/primitives"
import { StatCard } from "@/components/cards"
import { Globe as GlobeIcon, Play, Tv, Wifi } from "lucide-react"
import type { IptvCountry, IptvStats } from "@/lib/types"

export function Hero({ stats, countries }: { stats: IptvStats; countries: IptvCountry[] }) {
  const [hovered, setHovered] = useState<IptvCountry | null>(null)

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/30">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -left-20 top-0 size-72 rounded-full bg-blue/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 size-80 rounded-full bg-purple/20 blur-3xl" />

      <div className="relative grid items-center gap-6 p-6 md:p-10 lg:grid-cols-2">
        {/* Left */}
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <LiveDot label={`${stats.channels.toLocaleString()} LIVE CHANNELS`} />
          </span>

          <h1 className="font-heading mt-5 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl xl:text-6xl">
            Explore <span className="text-gradient">Live TV</span>
            <br /> from around the world
          </h1>

          <p className="mt-4 max-w-md text-pretty leading-relaxed text-muted-foreground">
            Watch thousands of free live TV channels from {stats.countries} countries in HD & 4K quality.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <PillButton href="/explore">
              <GlobeIcon className="size-4" /> Explore Countries
            </PillButton>
            <Link href="/about" className="group flex items-center gap-3 text-sm font-semibold">
              <span className="grid size-11 place-items-center rounded-full border border-border bg-card/60 transition-colors group-hover:bg-secondary">
                <Play className="size-4 fill-foreground" />
              </span>
              <span>
                How it works?
                <span className="block text-xs font-normal text-muted-foreground">Learn more</span>
              </span>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<Tv className="size-4" />} value={stats.channels.toLocaleString()} label="Channels" color="oklch(0.62 0.19 265)" />
            <StatCard icon={<GlobeIcon className="size-4" />} value={`${stats.countries}`} label="Countries" color="oklch(0.65 0.19 255)" />
            <StatCard icon={<span className="text-[10px] font-bold">HD</span>} value={`${stats.hd}`} label="HD Channels" color="oklch(0.72 0.19 145)" />
            <StatCard icon={<Wifi className="size-4" />} value="Online" label="Status" color="oklch(0.72 0.19 145)" />
          </div>
        </div>

        {/* Right — globe */}
        <div className="relative aspect-square w-full">
          <div className="absolute inset-0">
            <Globe interactive autoRotate countries={countries} onHover={setHovered} />
          </div>

          {/* Floating info card */}
          <div
            className="pointer-events-none absolute right-2 top-6 w-56 rounded-2xl border border-white/10 bg-black/70 p-4 backdrop-blur-xl transition-opacity duration-300 md:right-6"
            style={{ opacity: hovered ? 1 : 0 }}
          >
            {hovered && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{hovered.flag}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{hovered.name}</p>
                      <p className="text-xs text-white/60">{hovered.channels.toLocaleString()} Channels</p>
                    </div>
                  </div>
                  <span className="grid size-8 place-items-center rounded-full bg-gradient-brand">
                    <GlobeIcon className="size-4 text-white" />
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {hovered.languages.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-white/70">
                  <span className="size-1.5 rounded-full bg-emerald-400" /> Live Now: {hovered.liveNow}
                </p>
              </>
            )}
          </div>
          <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-center text-xs text-muted-foreground">
            Hover a marker to preview · Drag to rotate
          </p>
        </div>
      </div>
    </section>
  )
}
