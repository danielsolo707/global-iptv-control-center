import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ChannelCard, StatCard } from "@/components/cards"
import { SectionHeader, Badge } from "@/components/ui/primitives"
import { getCountry, channelsByCountry, getCategories } from "@/lib/api-client"
import { MapPin, Radio, Tv, ArrowLeft, Heart } from "lucide-react"

export default async function CountryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const country = await getCountry(slug)
  if (!country) notFound()

  const [channels, allCategories] = await Promise.all([
    channelsByCountry(slug),
    getCategories(),
  ])

  const categoriesInCountry = allCategories.filter((cat) =>
    channels.some((ch) => ch.categorySlug === cat.slug)
  )

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0">
          <Image
            src={country.image || "/placeholder.svg"}
            alt={country.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="relative p-8 pt-32">
          <Link
            href="/countries"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to Countries
          </Link>

          <div className="flex items-end gap-4">
            <span className="text-5xl">{country.flag}</span>
            <div>
              <h1 className="text-4xl font-bold">{country.name}</h1>
              <p className="mt-1 text-muted-foreground">
                <MapPin className="inline size-4 mr-1" />
                {country.region} · {country.channels.toLocaleString()} channels
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<Tv className="size-4" />} value={country.channels.toLocaleString()} label="Channels" color="oklch(0.62 0.19 265)" />
            <StatCard icon={<Radio className="size-4" />} value={country.liveNow.toString()} label="Live Now" color="oklch(0.72 0.19 145)" />
            <StatCard icon={<span className="text-[10px] font-bold">HD</span>} value={country.hd.toString()} label="HD Channels" color="oklch(0.65 0.19 255)" />
            <StatCard icon={<span className="text-[10px] font-bold">4K</span>} value={country.uhd.toString()} label="4K Channels" color="oklch(0.6 0.22 300)" />
          </div>
        </div>
      </div>

      {/* Categories */}
      {categoriesInCountry.length > 0 && (
        <section>
          <SectionHeader title="Categories" />
          <div className="flex flex-wrap gap-2">
            {categoriesInCountry.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
              >
                {cat.name}
                <Badge color={cat.color}>{channels.filter((c) => c.categorySlug === cat.slug).length}</Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Live Channels */}
      <section>
        <SectionHeader title={`Live Channels (${channels.length})`} />
        {channels.length === 0 ? (
          <p className="text-muted-foreground">No channels available for this country.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {channels.map((channel) => (
              <ChannelCard key={channel.slug} channel={channel} country={country} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
