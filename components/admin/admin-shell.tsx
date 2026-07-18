"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { LayoutDashboard, Tv2, Globe2, Tags, RefreshCw, Activity, TriangleAlert, BarChart3, Users, ScrollText, Settings, Menu, X, Sun, Moon, LogOut, ShieldCheck, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AdminIdentity } from "@/lib/admin/types"
import { logoutAction } from "@/app/admin/login/actions"

const nav = [
  ["/admin", "Overview", LayoutDashboard], ["/admin/channels", "Channels", Tv2], ["/admin/countries", "Countries", Globe2],
  ["/admin/categories", "Categories", Tags], ["/admin/sync", "Synchronization", RefreshCw], ["/admin/monitoring", "Monitoring", Activity],
  ["/admin/problems", "Problem streams", TriangleAlert], ["/admin/analytics", "Analytics", BarChart3], ["/admin/users", "Admin users", Users],
  ["/admin/logs", "System logs", ScrollText], ["/admin/settings", "Settings", Settings],
] as const

export function AdminShell({ admin, children }: { admin: AdminIdentity; children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [light, setLight] = useState(false)
  useEffect(() => setMobileOpen(false), [pathname])
  const sidebar = (
    <div className="flex h-full flex-col p-4">
      <Link href="/admin" className="mb-7 flex items-center gap-3 px-2"><span className="grid size-10 place-items-center rounded-xl bg-gradient-brand text-white"><ShieldCheck className="size-5" /></span><span><b className="block font-heading text-sm">IPTV CONTROL</b><span className="text-[10px] tracking-[.18em] text-muted-foreground">ADMINISTRATION</span></span></Link>
      <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto">
        {nav.map(([href, label, Icon]) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href)
          return <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active ? "bg-blue/15 text-blue" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}><Icon className="size-[18px]" />{label}</Link>
        })}
      </nav>
      <div className="mt-4 rounded-2xl border border-border/60 bg-card/60 p-3"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-purple/15 text-xs font-bold text-purple">{admin.email[0]?.toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{admin.email}</span><span className="text-[10px] capitalize text-muted-foreground">{admin.role}</span></span><form action={logoutAction}><button title="Sign out" className="text-muted-foreground hover:text-red-400"><LogOut className="size-4" /></button></form></div></div>
    </div>
  )
  return (
    <div className={cn("min-h-screen bg-background text-foreground", light && "admin-light")}>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border/60 bg-card/40 backdrop-blur-xl lg:block">{sidebar}</aside>
      {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close navigation" className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} /><aside className="absolute inset-y-0 left-0 w-72 bg-background shadow-2xl">{sidebar}<button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 grid size-9 place-items-center rounded-lg bg-secondary"><X className="size-4" /></button></aside></div>}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-7"><button onClick={() => setMobileOpen(true)} className="grid size-9 place-items-center rounded-lg bg-secondary lg:hidden"><Menu className="size-5" /></button><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">Platform administration</p><p className="hidden text-xs text-muted-foreground sm:block">Secure operations, monitoring, and data control</p></div><Link href="/" className="hidden items-center gap-2 text-xs text-muted-foreground hover:text-foreground sm:flex">View platform <ExternalLink className="size-3.5" /></Link><button onClick={() => setLight((value) => !value)} aria-label="Toggle color theme" className="grid size-9 place-items-center rounded-lg border border-border bg-card">{light ? <Moon className="size-4" /> : <Sun className="size-4" />}</button></header>
        <main className="p-4 md:p-7">{children}</main>
      </div>
    </div>
  )
}
