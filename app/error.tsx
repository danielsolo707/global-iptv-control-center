"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application route error:", error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4">
      <div className="w-full rounded-3xl border border-border/70 bg-card/50 p-8 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-500/10 text-red-400">
          <AlertTriangle className="size-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">We couldn't load this page</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The live channel source may be temporarily unavailable. Your saved favorites and settings are safe.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-white"
          >
            <RefreshCw className="size-4" /> Try again
          </button>
          <Link href="/" className="rounded-xl border border-border/70 bg-card px-4 py-2.5 text-sm font-semibold hover:bg-secondary">
            Return home
          </Link>
        </div>
      </div>
    </div>
  )
}
