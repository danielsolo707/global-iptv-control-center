"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search, Bell, Menu, X, Radio, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { SidebarNav } from "@/components/sidebar-nav"
import { cn } from "@/lib/utils"
import { searchIptv } from "@/lib/api-client"
import type { IptvChannel } from "@/lib/types"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)
  const [sidebarReady, setSidebarReady] = useState(false)
  const [query, setQuery] = useState("")
  const [previewChannels, setPreviewChannels] = useState<IptvChannel[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [notice, setNotice] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMobileOpen(false)
    if (pathname !== "/search") setQuery("")
  }, [pathname])

  useEffect(() => {
    const trimmedQuery = query.trim()
    if (trimmedQuery.length < 2) {
      setPreviewChannels([])
      setPreviewLoading(false)
      return
    }

    let cancelled = false
    setPreviewChannels([])
    setPreviewLoading(true)
    const timeout = window.setTimeout(() => {
      searchIptv(trimmedQuery)
        .then((results) => {
          if (!cancelled) setPreviewChannels(results.channels.slice(0, 4))
        })
        .catch(() => {
          if (!cancelled) setPreviewChannels([])
        })
        .finally(() => {
          if (!cancelled) setPreviewLoading(false)
        })
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [query])

  useEffect(() => {
    setDesktopCollapsed(window.localStorage.getItem("global-iptv-sidebar-collapsed") === "true")
    setSidebarReady(true)
  }, [])

  useEffect(() => {
    if (sidebarReady) {
      window.localStorage.setItem("global-iptv-sidebar-collapsed", String(desktopCollapsed))
    }
  }, [desktopCollapsed, sidebarReady])

  // Cmd+K / Ctrl+K keyboard shortcut to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(""), 3500)
    return () => window.clearTimeout(timeout)
  }, [notice])

  // Immersive routes hide the standard chrome padding
  const isImmersive = pathname.startsWith("/watch")

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    showAllResults()
  }

  function showAllResults() {
    const trimmedQuery = query.trim()
    router.push(`/search${trimmedQuery ? `?q=${encodeURIComponent(trimmedQuery)}` : ""}`)
  }

  return (
    <div className="flex min-h-screen overflow-x-clip">
      {/* Desktop sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden overflow-x-hidden overflow-y-auto border-r border-border/60 bg-[#080B12]/80 backdrop-blur-xl transition-[width] duration-300 lg:block", desktopCollapsed ? "w-16" : "w-64")}>
        <SidebarNav collapsed={desktopCollapsed} />
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

      <div className={cn("flex min-w-0 flex-1 flex-col transition-[padding] duration-300", desktopCollapsed ? "lg:pl-16" : "lg:pl-64")}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center gap-2 border-b border-border/60 bg-background/70 px-3 backdrop-blur-xl sm:gap-3 sm:px-4 md:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-secondary lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <button
            onClick={() => setDesktopCollapsed((collapsed) => !collapsed)}
            className="hidden size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:grid"
            aria-label={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {desktopCollapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
          </button>

          <form onSubmit={submitSearch} className="relative mx-auto min-w-0 flex-1 max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search channels, countries, categories..."
              className="h-11 w-full rounded-xl border border-border/70 bg-card/60 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-blue focus:bg-card"
              aria-label="Search"
            />
            {query.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-border/70 bg-popover shadow-2xl">
                <div className="border-b border-border/60 px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  {previewLoading ? "Searching channels..." : "Channel preview"}
                </div>
                {!previewLoading && previewChannels.length > 0 && (
                  <div className="p-2">
                    {previewChannels.map((channel) => (
                      <button
                        key={channel.slug}
                        type="button"
                        onClick={() => router.push(`/channel/${channel.slug}`)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-secondary"
                      >
                        <span
                          className="grid size-9 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
                          style={{ backgroundColor: channel.logoColor }}
                        >
                          {channel.name.slice(0, 1)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{channel.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{channel.countryName} · {channel.quality}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {!previewLoading && previewChannels.length === 0 && (
                  <p className="px-4 py-3 text-sm text-muted-foreground">No matching channels found.</p>
                )}
                <div className="border-t border-border/60 p-2">
                  <button
                    type="button"
                    onClick={showAllResults}
                    className="w-full rounded-lg px-3 py-2 text-sm font-medium text-blue transition-colors hover:bg-blue/10"
                  >
                    Show all results
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 sm:flex">
              <Radio className="size-3.5" /> Online
            </span>
            <button
              onClick={() => setNotice("You're all caught up. Live channel data is available.")}
              className="grid size-10 place-items-center rounded-xl border border-border/70 bg-card/60 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-[18px]" />
            </button>
          </div>
        </header>

        {notice && (
          <div role="status" className="fixed right-4 top-20 z-50 max-w-sm rounded-xl border border-border/70 bg-card px-4 py-3 text-sm shadow-xl md:right-6">
            {notice}
          </div>
        )}

        <main className={cn("min-w-0 flex-1 overflow-x-clip", !isImmersive && "px-4 py-6 md:px-8 md:py-8")}>{children}</main>
      </div>
    </div>
  )
}
