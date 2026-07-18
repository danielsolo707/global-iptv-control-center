"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search, Bell, Menu, X, Radio } from "lucide-react"
import { SidebarNav } from "@/components/sidebar-nav"
import { cn } from "@/lib/utils"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState("")
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Immersive routes hide the standard chrome padding
  const isImmersive = pathname.startsWith("/explore") || pathname.startsWith("/watch")

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/search${query ? `?q=${encodeURIComponent(query)}` : ""}`)
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border/60 bg-[#080B12]/80 backdrop-blur-xl lg:block">
        <SidebarNav />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-border/60 bg-[#080B12] shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-5 grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-secondary lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <form onSubmit={submitSearch} className="relative mx-auto w-full max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search channels, countries, categories..."
              className="h-11 w-full rounded-xl border border-border/70 bg-card/60 pl-11 pr-16 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-blue focus:bg-card"
              aria-label="Search"
            />
            <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-secondary px-2 py-1 text-[10px] font-medium text-muted-foreground sm:block">
              ⌘K
            </kbd>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 sm:flex">
              <Radio className="size-3.5" /> Online
            </span>
            <button
              className="grid size-10 place-items-center rounded-xl border border-border/70 bg-card/60 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-[18px]" />
            </button>
          </div>
        </header>

        <main className={cn("flex-1", !isImmersive && "px-4 py-6 md:px-8 md:py-8")}>{children}</main>
      </div>
    </div>
  )
}
