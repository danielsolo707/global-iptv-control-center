import { Hero } from "@/components/home/hero"
import { Rail, SectionHeader } from "@/components/ui/primitives"
import { ChannelCard, CountryCard, CategoryCard } from "@/components/cards"
import { Flame, Globe, LayoutGrid, Radio, Sparkles, Clock } from "lucide-react"
import {
  channels,
  categories,
  trendingChannels,
  trendingCountries,
} from "@/lib/data"

export default function HomePage() {
  const trending = trendingCountries()
  const liveTrending = trendingChannels()
  const featured = channels.slice(0, 8)
  const recentlyAdded = [...channels].reverse().slice(0, 8)

  return (
    <div className="mx-auto max-w-[1600px] space-y-12">
      <Hero />

      <section>
        <SectionHeader
          title="Trending Live Channels"
          icon={<Radio className="size-5 text-red-400" />}
          href="/trending"
        />
        <Rail>
          {liveTrending.map((c) => (
            <ChannelCard key={c.slug} channel={c} />
          ))}
        </Rail>
      </section>

      <section>
        <SectionHeader
          title="Trending Countries"
          icon={<Flame className="size-5 text-orange-400" />}
          href="/countries"
        />
        <Rail>
          {trending.map((c) => (
            <div key={c.slug} className="w-44 shrink-0 snap-start md:w-52">
              <CountryCard country={c} />
            </div>
          ))}
        </Rail>
      </section>

      <section>
        <SectionHeader
          title="Popular Categories"
          icon={<LayoutGrid className="size-5 text-blue" />}
          href="/categories"
        />
        <Rail>
          {categories.map((c) => (
            <CategoryCard key={c.slug} category={c} />
          ))}
        </Rail>
      </section>

      <section>
        <SectionHeader
          title="Featured Channels"
          icon={<Sparkles className="size-5 text-purple" />}
          href="/trending"
        />
        <Rail>
          {featured.map((c) => (
            <ChannelCard key={c.slug} channel={c} />
          ))}
        </Rail>
      </section>

      <section>
        <SectionHeader
          title="Popular Right Now"
          icon={<Globe className="size-5 text-emerald-400" />}
          href="/trending"
        />
        <Rail>
          {[...channels].sort((a, b) => b.viewers - a.viewers).slice(0, 8).map((c) => (
            <ChannelCard key={c.slug} channel={c} />
          ))}
        </Rail>
      </section>

      <section>
        <SectionHeader
          title="Recently Added"
          icon={<Clock className="size-5 text-muted-foreground" />}
          href="/trending"
        />
        <Rail>
          {recentlyAdded.map((c) => (
            <ChannelCard key={c.slug} channel={c} />
          ))}
        </Rail>
      </section>
    </div>
  )
}
