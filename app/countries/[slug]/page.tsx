import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ChannelCard, StatCard } from "@/components/cards"
import { ChannelPagination } from "@/components/channel-pagination"
import { SectionHeader, Badge } from "@/components/ui/primitives"
import { getCountry, channelsByCountry, getCategories } from "@/lib/api-client"
import { MapPin, Tv, ArrowLeft } from "lucide-react"

const PAGE_SIZE = 48

export default async function CountryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; category?: string }>
}) {
  const { slug } = await params
  const { page, category: categorySlug } = await searchParams
  const country = await getCountry(slug)
  if (!country) notFound()

  const [channels, allCategories] = await Promise.all([
    channelsByCountry(slug),
    getCategories(),
  ])

  const categoriesInCountry = allCategories.filter((cat) =>
    channels.some((ch) => ch.categorySlug === cat.slug)
  )
  const activeCategory = categorySlug
    ? categoriesInCountry.find((category) => category.slug === categorySlug.toLowerCase())
    : undefined
  const filteredChannels = activeCategory
    ? channels.filter((channel) => channel.categorySlug === activeCategory.slug)
    : channels
  const totalPages = Math.max(1, Math.ceil(filteredChannels.length / PAGE_SIZE))
  const requestedPage = Number.parseInt(page || "1", 10)
  const currentPage = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), totalPages) : 1
  const pageChannels = filteredChannels.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0">
          {country.image && <Image src={country.image} alt="" fill className="object-cover" priority />}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="relative p-8 pt-32">
          <Link
            href="/countries"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to Countries
          </Link>

          <div>
              <h1 className="text-4xl font-bold">{country.name}</h1>
              <p className="mt-1 text-muted-foreground">
                <MapPin className="inline size-4 mr-1" />
                {country.region} · {country.channels.toLocaleString()} channels
              </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<Tv className="size-4" />} value={country.channels.toLocaleString()} label="Channels" color="oklch(0.62 0.19 265)" />
            <StatCard icon={<Tv className="size-4" />} value="Free" label="Access" color="oklch(0.72 0.19 145)" />
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
                href={`/countries/${country.slug}?category=${cat.slug}`}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary ${activeCategory?.slug === cat.slug ? "border-blue bg-secondary text-foreground" : "border-border/60 bg-card"}`}
              >
                {cat.name}
                <Badge color={cat.color}>{channels.filter((c) => c.categorySlug === cat.slug).length}</Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {activeCategory && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/40 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{activeCategory.name}</span> channels from {country.name}.
          </p>
          <Link href={`/countries/${country.slug}`} className="text-sm font-medium text-blue hover:underline">
            Clear filter
          </Link>
        </div>
      )}

      {/* Live Channels */}
      <section>
        <SectionHeader title={`${activeCategory ? `${activeCategory.name} Channels` : "Live Channels"} (${filteredChannels.length})`} />
        {filteredChannels.length === 0 ? (
          <p className="text-muted-foreground">No channels are available for this country and category.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageChannels.map((channel) => (
              <ChannelCard key={channel.slug} channel={channel} country={country} />
            ))}
          </div>
        )}
      </section>

      <ChannelPagination
        basePath={`/countries/${country.slug}`}
        totalItems={filteredChannels.length}
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        query={{ category: activeCategory?.slug }}
      />
    </div>
  )
}
