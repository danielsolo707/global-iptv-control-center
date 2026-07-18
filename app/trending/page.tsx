import { ChannelCard, CountryCard } from "@/components/cards"
import { SectionHeader } from "@/components/ui/primitives"
import { getTrendingChannels, getTrendingCountries, getChannels } from "@/lib/api-client"
import { Radio, Flame, TrendingUp, Eye } from "lucide-react"

export default async function TrendingPage() {
  const [trendingChannels, trendingCountries, allChannels] = await Promise.all([
    getTrendingChannels(),
    getTrendingCountries(),
    getChannels(),
  ])

  const mostViewed = [...allChannels].sort((a, b) => b.viewers - a.viewers).slice(0, 8)

  return (
    <div className="mx-auto max-w-[1600px] space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Trending</h1>
        <p className="text-muted-foreground">The most popular live TV right now</p>
      </div>

      <section>
        <SectionHeader
          title="Trending Live Channels"
          icon={<Radio className="size-5 text-red-400" />}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {trendingChannels.map((c) => (
            <ChannelCard key={c.slug} channel={c} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Trending Countries"
          icon={<Flame className="size-5 text-orange-400" />}
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {trendingCountries.map((c) => (
            <CountryCard key={c.slug} country={c} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Most Viewed Today"
          icon={<Eye className="size-5 text-blue" />}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mostViewed.map((c) => (
            <ChannelCard key={c.slug} channel={c} />
          ))}
        </div>
      </section>
    </div>
  )
}
