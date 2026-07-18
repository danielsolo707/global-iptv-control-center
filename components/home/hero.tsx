import Image from "next/image"
import Link from "next/link"
import { PillButton, LiveDot } from "@/components/ui/primitives"
import { StatCard } from "@/components/cards"
import { Map, MapPin, Play, Tv, Wifi } from "lucide-react"
import type { IptvStats } from "@/lib/types"

export function Hero({ stats }: { stats: IptvStats }) {
  return (
    <section className="relative isolate min-h-[550px] overflow-hidden rounded-3xl border border-border/60 bg-[#020714] shadow-2xl shadow-blue/10">
      <Image
        src="/images/hero-earth-v1.png"
        alt=""
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 1400px"
        className="pointer-events-none object-cover object-[61%_center] sm:object-center"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(2,7,20,0.98)_0%,rgba(2,7,20,0.93)_32%,rgba(2,7,20,0.63)_55%,rgba(2,7,20,0.13)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(2,7,20,0.78)_0%,transparent_45%)]" />
      <div className="pointer-events-none absolute -left-20 top-0 size-72 rounded-full bg-blue/15 blur-3xl" />

      <div className="relative z-10 flex min-h-[550px] items-center p-6 md:p-10 lg:p-12">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <LiveDot label={`${stats.channels.toLocaleString()} LIVE CHANNELS`} />
          </span>

          <h1 className="font-heading mt-5 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl xl:text-6xl">
            Watch <span className="text-gradient">Live TV</span>
            <br /> from around the world
          </h1>

          <p className="mt-4 max-w-md text-pretty leading-relaxed text-muted-foreground">
            Browse thousands of free live TV channels from {stats.countries} countries in one global directory.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <PillButton href="/countries">
              <Map className="size-4" /> Browse Countries
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
            <StatCard icon={<MapPin className="size-4" />} value={`${stats.countries}`} label="Countries" color="oklch(0.65 0.19 255)" />
            <StatCard icon={<Tv className="size-4" />} value="Free" label="Access" color="oklch(0.72 0.19 145)" />
            <StatCard icon={<Wifi className="size-4" />} value="Online" label="Status" color="oklch(0.72 0.19 145)" />
          </div>
        </div>
      </div>
    </section>
  )
}
