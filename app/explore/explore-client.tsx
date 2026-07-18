"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Globe } from "@/components/globe/globe"
import type { IptvCountry } from "@/lib/types"
import { MapPin, Radio, ArrowRight } from "lucide-react"

export default function ExploreClient({ countries }: { countries: IptvCountry[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<IptvCountry | null>(null)

  return (
    <div className="fixed inset-0 z-10 bg-background">
      <div className="absolute inset-0">
        <Globe
          interactive
          autoRotate
          countries={countries}
          onSelect={(c) => router.push(`/countries/${c.slug}`)}
          onHover={setSelected}
          selectedSlug={selected?.slug}
        />
      </div>

      {selected && (
        <div className="absolute right-8 top-24 z-20 w-72 rounded-2xl border border-white/10 bg-black/80 p-5 backdrop-blur-xl transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selected.flag}</span>
              <div>
                <p className="text-lg font-bold text-white">{selected.name}</p>
                <p className="text-xs text-white/60">{selected.channels.toLocaleString()} Channels</p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/countries/${selected.slug}`)}
              className="grid size-9 place-items-center rounded-full bg-gradient-brand"
            >
              <ArrowRight className="size-4 text-white" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {selected.languages.slice(0, 3).map((lang) => (
              <span key={lang} className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-white/80">
                {lang}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-white/70">
            <span className="flex items-center gap-1">
              <Radio className="size-3" /> {selected.liveNow} Live
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3" /> {selected.region}
            </span>
          </div>
        </div>
      )}

      <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-center">
        <p className="rounded-full bg-black/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
          Click any country to explore its channels · Drag to rotate · Scroll to zoom
        </p>
      </div>
    </div>
  )
}
