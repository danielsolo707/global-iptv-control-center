import { ChannelCard, CountryCard } from "@/components/cards"
import { SectionHeader } from "@/components/ui/primitives"
import { getFeaturedChannels, getTopCountries } from "@/lib/api-client"
import { Radio, Globe } from "lucide-react"

export default async function TrendingPage() {
  const [featuredChannels, topCountries] = await Promise.all([
    getFeaturedChannels(),
    getTopCountries(),
  ])

  return (
    <div className="mx-auto max-w-[1600px] space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Discover</h1>
        <p className="text-muted-foreground">Live channels and countries from the global free-to-air directory</p>
      </div>

      <section>
        <SectionHeader
          title="Live Channels"
          icon={<Radio className="size-5 text-red-400" />}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featuredChannels.map((c) => (
            <ChannelCard key={c.slug} channel={c} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Countries with the Most Channels"
          icon={<Globe className="size-5 text-emerald-400" />}
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {topCountries.map((c) => (
            <CountryCard key={c.slug} country={c} />
          ))}
        </div>
      </section>
    </div>
  )
}
