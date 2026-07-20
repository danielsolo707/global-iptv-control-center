"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from "recharts"
import { Search, ChevronLeft, ChevronRight, MoreHorizontal, Play, Ban, CheckCircle2, Trash2, Download, RefreshCw, Loader2, X, Check, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AdminChannel, AdminRole, ChannelAdminStatus } from "@/lib/admin/types"

export function PageTitle({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</div>
}

export function MetricCard({ label, value, detail, tone = "blue", icon }: { label: string; value: string | number; detail?: string; tone?: "blue" | "green" | "red" | "purple" | "amber"; icon: React.ReactNode }) {
  const colors = { blue: "bg-blue/10 text-blue", green: "bg-emerald-500/10 text-emerald-500", red: "bg-red-500/10 text-red-500", purple: "bg-purple/10 text-purple", amber: "bg-amber-500/10 text-amber-500" }
  return <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 font-heading text-2xl font-extrabold">{value}</p>{detail && <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>}</div><span className={cn("grid size-10 place-items-center rounded-xl", colors[tone])}>{icon}</span></div></div>
}

export function Panel({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-border/60 bg-card/60 shadow-sm", className)}><div className="border-b border-border/60 px-5 py-4"><h2 className="font-heading font-bold">{title}</h2>{description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}</div><div className="p-5">{children}</div></section>
}

const chartData = [
  { day: "Mon", online: 84, latency: 690, failures: 5 }, { day: "Tue", online: 87, latency: 620, failures: 4 }, { day: "Wed", online: 85, latency: 740, failures: 6 },
  { day: "Thu", online: 89, latency: 570, failures: 3 }, { day: "Fri", online: 91, latency: 510, failures: 2 }, { day: "Sat", online: 88, latency: 650, failures: 4 }, { day: "Sun", online: 92, latency: 480, failures: 2 },
]

export function HealthAreaChart() {
  return <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="online" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#5b8cff" stopOpacity={0.45}/><stop offset="95%" stopColor="#5b8cff" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" opacity={0.15}/><XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false}/><YAxis domain={[70,100]} tick={{ fontSize: 11 }} axisLine={false}/><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }}/><Area type="monotone" dataKey="online" stroke="#5b8cff" fill="url(#online)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div>
}

export function HealthPie({ online, offline, blocked }: { online: number; offline: number; blocked: number }) {
  const data = [{ name: "Online", value: online, color: "#10b981" }, { name: "Offline", value: offline, color: "#ef4444" }, { name: "Blocked", value: blocked, color: "#f59e0b" }]
  return <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3}>{data.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}</Pie><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }}/></PieChart></ResponsiveContainer></div>
}

export function AnalyticsBars() {
  return <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" opacity={0.15}/><XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false}/><YAxis tick={{ fontSize: 11 }} axisLine={false}/><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }}/><Bar dataKey="latency" fill="#8b5cf6" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>
}

export function StatusBadge({ status }: { status: ChannelAdminStatus }) {
  const styles: Record<ChannelAdminStatus, string> = {
    online: "bg-emerald-500/10 text-emerald-500",
    offline: "bg-red-500/10 text-red-500",
    checking: "bg-sky-500/10 text-sky-500",
    blocked: "bg-amber-500/10 text-amber-500",
    removed: "bg-muted text-muted-foreground",
    disabled: "bg-purple/10 text-purple",
  }
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize", styles[status])}><span className="size-1.5 rounded-full bg-current" />{status}</span>
}

async function adminAction(action: string, payload: Record<string, unknown> = {}) {
  const streamTest = action === "test-stream"
  const response = await fetch(streamTest ? "/api/admin/test-stream" : "/api/admin/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(streamTest ? { ...payload, channelId: payload.id } : { action, ...payload }) })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || "Action failed")
  return result
}

export function ActionButton({ action, payload, children, disabled, className }: { action: string; payload?: Record<string, unknown>; children: React.ReactNode; disabled?: boolean; className?: string }) {
  const [loading, setLoading] = useState(false); const [message, setMessage] = useState("")
  return <><button disabled={disabled || loading} onClick={async () => { setLoading(true); try { await adminAction(action, payload); setMessage("Done") } catch (error) { setMessage(error instanceof Error ? error.message : "Failed") } finally { setLoading(false); setTimeout(() => setMessage(""), 3000) } }} className={cn("inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold transition hover:bg-secondary disabled:opacity-50", className)}>{loading && <Loader2 className="size-3.5 animate-spin" />}{children}</button>{message && <span className="fixed bottom-5 right-5 z-[100] rounded-xl border border-border bg-popover px-4 py-3 text-sm shadow-2xl">{message}</span>}</>
}

export function ChannelsManager({ initialChannels, role, problemOnly = false }: { initialChannels: AdminChannel[]; role: AdminRole; problemOnly?: boolean }) {
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("all"); const [page, setPage] = useState(1); const [selected, setSelected] = useState<string[]>([])
  const pageSize = 12
  const filtered = useMemo(() => initialChannels.filter((channel) => (!problemOnly || channel.status !== "online") && (status === "all" || channel.status === status) && [channel.name, channel.country, channel.category, channel.language].join(" ").toLowerCase().includes(query.toLowerCase())), [initialChannels, problemOnly, query, status])
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize)); const visible = filtered.slice((page - 1) * pageSize, page * pageSize); const canEdit = role !== "viewer"
  return <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
    <div className="flex flex-col gap-3 border-b border-border/60 p-4 lg:flex-row lg:items-center"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search channels, countries, categories..." className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-blue"/></div><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="h-10 rounded-lg border border-border bg-background px-3 text-sm"><option value="all">All statuses</option><option>online</option><option>checking</option><option>offline</option><option>blocked</option><option>removed</option><option>disabled</option></select><a href="/api/admin/export" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-secondary"><Download className="size-4"/> Export CSV</a></div>
    {selected.length > 0 && <div className="flex flex-wrap items-center gap-2 border-b border-border bg-blue/5 px-4 py-3 text-xs"><b>{selected.length} selected</b><ActionButton action="bulk-enable" payload={{ ids: selected }} disabled={!canEdit}><Check className="size-3"/>Enable</ActionButton><ActionButton action="bulk-disable" payload={{ ids: selected }} disabled={!canEdit}><Ban className="size-3"/>Disable</ActionButton><button onClick={() => setSelected([])} className="ml-auto"><X className="size-4"/></button></div>}
    <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-xs"><thead className="bg-secondary/50 text-muted-foreground"><tr><th className="p-3"><input type="checkbox" checked={visible.length > 0 && visible.every((item) => selected.includes(item.id))} onChange={(event) => setSelected(event.target.checked ? Array.from(new Set([...selected, ...visible.map((item) => item.id)])) : selected.filter((id) => !visible.some((item) => item.id === id)))}/></th>{["Channel","Country","Category","Language","Stream URL","Status","Last checked","Response","Actions"].map((header) => <th key={header} className="whitespace-nowrap px-3 py-3 font-semibold">{header}</th>)}</tr></thead><tbody>{visible.map((channel) => <tr key={channel.id} className="border-t border-border/50 hover:bg-secondary/25"><td className="p-3"><input type="checkbox" checked={selected.includes(channel.id)} onChange={() => setSelected((items) => items.includes(channel.id) ? items.filter((id) => id !== channel.id) : [...items, channel.id])}/></td><td className="px-3 py-3"><div className="flex items-center gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue/10 font-bold text-blue">{channel.name[0]}</span><Link href={`/admin/channels/${channel.id}`} className="max-w-36 truncate font-semibold hover:text-blue">{channel.name}</Link></div></td><td className="px-3 py-3">{channel.country}</td><td className="px-3 py-3 capitalize">{channel.category}</td><td className="px-3 py-3">{channel.language}</td><td className="max-w-48 truncate px-3 py-3 font-mono text-[10px] text-muted-foreground">{channel.streamUrl}</td><td className="px-3 py-3"><StatusBadge status={channel.status}/></td><td className="px-3 py-3 text-muted-foreground">{channel.lastChecked ? new Date(channel.lastChecked).toLocaleString() : "Never"}</td><td className="px-3 py-3">{channel.responseTime}ms</td><td className="px-3 py-3"><div className="flex gap-1"><Link title="Details" href={`/admin/channels/${channel.id}`} className="grid size-8 place-items-center rounded-lg hover:bg-secondary"><MoreHorizontal className="size-4"/></Link><ActionButton action="test-stream" payload={{ id: channel.id, url: channel.streamUrl }} disabled={!canEdit}><Play className="size-3"/></ActionButton><ActionButton action={channel.status === "disabled" ? "enable-channel" : "disable-channel"} payload={{ id: channel.id }} disabled={!canEdit}>{channel.status === "disabled" ? <CheckCircle2 className="size-3"/> : <Ban className="size-3"/>}</ActionButton><ActionButton action="delete-channel" payload={{ id: channel.id }} disabled={role !== "admin"}><Trash2 className="size-3"/></ActionButton></div></td></tr>)}</tbody></table></div>
    <div className="flex items-center justify-between border-t border-border/60 p-4 text-xs text-muted-foreground"><span>{filtered.length.toLocaleString()} results</span><div className="flex items-center gap-2"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="grid size-8 place-items-center rounded-lg border border-border disabled:opacity-40"><ChevronLeft className="size-4"/></button><span>Page {page} of {pages}</span><button disabled={page === pages} onClick={() => setPage((value) => value + 1)} className="grid size-8 place-items-center rounded-lg border border-border disabled:opacity-40"><ChevronRight className="size-4"/></button></div></div>
  </div>
}

export function ToggleRow({ id, label, detail, checked = true, role, kind }: { id: string; label: string; detail: string; checked?: boolean; role: AdminRole; kind: "country" | "category" }) {
  const [enabled, setEnabled] = useState(checked)
  // Moderators may toggle countries/categories; viewers are read-only.
  const canEdit = role === "admin" || role === "moderator"
  return <div className="flex items-center gap-4 border-b border-border/50 py-4 last:border-0"><span className={cn("grid size-9 place-items-center rounded-xl", enabled ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground")}>{enabled ? <Wifi className="size-4"/> : <WifiOff className="size-4"/>}</span><div className="min-w-0 flex-1"><p className="font-semibold">{label}</p><p className="text-xs text-muted-foreground">{detail}</p></div><button disabled={!canEdit} aria-pressed={enabled} onClick={async () => { const next = !enabled; setEnabled(next); try { await adminAction(`toggle-${kind}`, { id, enabled: next }) } catch { setEnabled(!next) } }} className={cn("relative h-7 w-12 rounded-full transition disabled:opacity-50", enabled ? "bg-gradient-brand" : "bg-muted")}><span className={cn("absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform", enabled && "translate-x-5")}/></button></div>
}

export function StreamTest({ channel, role = "admin" }: { channel: AdminChannel; role?: AdminRole }) {
  const [loading, setLoading] = useState(false); const [result, setResult] = useState<Record<string, string | number | boolean | null> | null>(null)
  return <div><button disabled={role === "viewer"} onClick={async () => { setLoading(true); const response = await fetch("/api/admin/test-stream", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: channel.streamUrl, channelId: channel.id }) }); setResult(await response.json()); setLoading(false) }} className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-brand px-4 text-sm font-semibold text-white disabled:opacity-50">{loading ? <Loader2 className="size-4 animate-spin"/> : <Play className="size-4"/>}Test Stream Now</button>{result && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(result).filter(([key]) => !["error","details"].includes(key)).map(([key,value]) => <div key={key} className="rounded-xl bg-secondary/50 p-3"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{key}</p><p className="mt-1 truncate text-sm font-semibold">{String(value ?? "—")}</p></div>)}</div>}</div>
}
