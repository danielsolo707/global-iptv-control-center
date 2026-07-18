"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Globe,
  Map,
  LayoutGrid,
  Flame,
  CalendarClock,
  Heart,
  History,
  Info,
  Settings,
  Play,
} from "lucide-react"
import { cn } from "@/lib/utils"

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Globe },
  { href: "/countries", label: "Countries", icon: Map },
  { href: "/categories", label: "Categories", icon: LayoutGrid },
  { href: "/trending", label: "Trending", icon: Flame },
  { href: "/schedule", label: "Schedule", icon: CalendarClock },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/recently", label: "Recently Watched", icon: History },
  { href: "/about", label: "About", icon: Info },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col gap-6 px-4 py-6">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-3 px-2">
        <span className="grid size-10 place-items-center rounded-xl bg-gradient-brand glow-purple">
          <Play className="size-5 fill-white text-white" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-extrabold tracking-wide">GLOBAL IPTV</span>
          <span className="block text-[10px] font-medium tracking-[0.2em] text-muted-foreground">
            EXPLORE LIVE TV
          </span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 -translate-y-1/2 w-1 rounded-r-full bg-gradient-brand" />
              )}
              <Icon className={cn("size-[18px] transition-colors", active && "text-blue")} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
        <p className="text-xs font-semibold">100% Free-to-Air</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          No account. No subscription. Just live TV from around the world.
        </p>
      </div>
    </div>
  )
}
