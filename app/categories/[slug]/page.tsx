import Link from "next/link"
import { notFound } from "next/navigation"
import { ChannelCard } from "@/components/cards"
import { ChannelPagination } from "@/components/channel-pagination"
import { SectionHeader, Badge } from "@/components/ui/primitives"
import { getCategory, channelsByCategory, getCountries } from "@/lib/api-client"
import { ArrowLeft, LayoutGrid } from "lucide-react"

const PAGE_SIZE = 48

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const { page } = await searchParams
  const category = await getCategory(slug)
  if (!category) notFound()

  const [channels, countries] = await Promise.all([
    channelsByCategory(slug),
    getCountries(),
  ])

  const countryMap = new Map(countries.map((c) => [c.slug, c]))
  const totalPages = Math.max(1, Math.ceil(channels.length / PAGE_SIZE))
  const requestedPage = Number.parseInt(page || "1", 10)
  const currentPage = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), totalPages) : 1
  const pageChannels = channels.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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
            {pageChannels.map((channel) => (
              <ChannelCard key={channel.slug} channel={channel} country={countryMap.get(channel.countrySlug)} />
            ))}
          </div>
        )}
      </section>

      <ChannelPagination
        basePath={`/categories/${category.slug}`}
        totalItems={channels.length}
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}
