"use client"

import dynamic from "next/dynamic"
import { Globe as GlobeIcon } from "lucide-react"
import type { Country } from "@/lib/data"

const GlobeScene = dynamic(() => import("@/components/globe/globe-scene"), {
  ssr: false,
  loading: () => (
    <div className="grid size-full place-items-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <GlobeIcon className="size-10 animate-spin-slow text-blue" />
        <span className="text-sm">Loading Earth...</span>
      </div>
    </div>
  ),
})

export function Globe(props: {
  interactive?: boolean
  autoRotate?: boolean
  onSelect?: (c: Country) => void
  onHover?: (c: Country | null) => void
  selectedSlug?: string
}) {
  return (
    <div className="relative size-full overflow-hidden rounded-full">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, oklch(0.22 0.05 265) 0%, oklch(0.14 0.03 265) 55%, transparent 75%)",
        }}
      />
      <GlobeScene {...props} />
    </div>
  )
}
