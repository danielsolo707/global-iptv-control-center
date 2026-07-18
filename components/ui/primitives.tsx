"use client"

import Link from "next/link"
import { useRef } from "react"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function SectionHeader({
  title,
  icon,
  href,
  action = "View all",
}: {
  title: string
  icon?: React.ReactNode
  href?: string
  action?: string
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight md:text-2xl">
        {icon}
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="group flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {action}
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}

export function Rail({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) => {
    ref.current?.scrollBy({ left: dir * (ref.current.clientWidth * 0.8), behavior: "smooth" })
  }
  return (
    <div className="group/rail relative">
      <div
        ref={ref}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
      >
        {children}
      </div>
      <button
        onClick={() => scroll(-1)}
        className="absolute -left-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 text-foreground opacity-0 shadow-lg backdrop-blur transition-opacity group-hover/rail:opacity-100 hover:bg-secondary lg:grid"
        aria-label="Scroll left"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        onClick={() => scroll(1)}
        className="absolute -right-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 text-foreground opacity-0 shadow-lg backdrop-blur transition-opacity group-hover/rail:opacity-100 hover:bg-secondary lg:grid"
        aria-label="Scroll right"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  )
}

export function Badge({
  children,
  className,
  color,
}: {
  children: React.ReactNode
  className?: string
  color?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        className,
      )}
      style={color ? { backgroundColor: `${color}20`, color } : undefined}
    >
      {children}
    </span>
  )
}

export function QualityBadge({ quality }: { quality: "SD" | "HD" | "4K" | "Unknown" }) {
  if (quality === "Unknown") return null

  const map = {
    SD: "bg-muted text-muted-foreground",
    HD: "bg-blue/15 text-blue",
    "4K": "bg-purple/15 text-purple",
  }
  return (
    <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", map[quality])}>
      {quality}
    </span>
  )
}

export function LiveDot({ label = "LIVE" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-red-500" />
      </span>
      {label}
    </span>
  )
}

export function PillButton({
  href,
  onClick,
  children,
  variant = "solid",
  className,
}: {
  href?: string
  onClick?: () => void
  children: React.ReactNode
  variant?: "solid" | "ghost" | "outline"
  className?: string
}) {
  const styles = {
    solid: "bg-gradient-brand text-white glow-purple hover:opacity-90",
    ghost: "bg-secondary text-foreground hover:bg-accent",
    outline: "border border-border bg-card/40 text-foreground hover:bg-secondary",
  }
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all active:scale-[0.98]",
    styles[variant],
    className,
  )
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    )
  }
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-card/30 px-6 py-20 text-center">
      <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white"
        >
          {action.label}
          <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  )
}
