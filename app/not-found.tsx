import Link from "next/link"
import { Compass } from "lucide-react"

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4">
      <div className="w-full rounded-3xl border border-dashed border-border/70 bg-card/30 p-8 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
          <Compass className="size-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This channel, country, or category may have moved since the live directory was last refreshed.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-white">
          Explore live TV
        </Link>
      </div>
    </div>
  )
}
