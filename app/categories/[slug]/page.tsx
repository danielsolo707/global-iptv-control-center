import Link from "next/link"
import { notFound } from "next/navigation"
import { ChannelCard } from "@/components/cards"
import { SectionHeader, Badge } from "@/components/ui/primitives"
import { getCategory, channelsByCategory, getCountries } from "@/lib/api-client"
import { ArrowLeft, LayoutGrid } from "lucide-react"

export default async function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = await getCategory(slug)
  if (!category) notFound()

  const [channels, countries] = await Promise.all([
    channelsByCategory(slug),
    getCountries(),
  ])

  const countryMap = new Map(countries.map((c) => [c.slug, c]))

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/30 p-8">
        <div
          className="absolute inset-0 bg-gradient-to-br opacity-40"
          style={{ backgroundImage: `linear-gradient(135deg, ${category.color}33, transparent)` }}
        />
        <div className="relative">
          <Link
            href="/categories"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to Categories
          </Link>

          <div className="flex items-center gap-4">
            <span
              className="grid size-16 place-items-center rounded-2xl"
              style={{ backgroundColor: `${category.color}22`, color: category.color }}
            >
              <LayoutGrid className="size-8" />
            </span>
            <div>
              <h1 className="text-4xl font-bold">{category.name}</h1>
              <p className="mt-1 text-muted-foreground">
                {category.channels.toLocaleString()} channels available
              </p>
            </div>
          </div>
        </div>
      </div>

      <section>
        <SectionHeader title={`All Channels (${channels.length})`} />
        {channels.length === 0 ? (
          <p className="text-muted-foreground">No channels available in this category.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {channels.map((channel) => (
              <ChannelCard key={channel.slug} channel={channel} country={countryMap.get(channel.countrySlug)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
