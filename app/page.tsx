import { Hero } from "@/components/home/hero"
import { Rail, SectionHeader } from "@/components/ui/primitives"
import { ChannelCard, CountryCard, CategoryCard } from "@/components/cards"
import { Globe, LayoutGrid, Radio } from "lucide-react"
import { getAllData, getFeaturedChannels, getTopCountries } from "@/lib/api-client"

export default async function HomePage() {
  const [{ countries, categories, stats }, featuredChannels, topCountries] = await Promise.all([
    getAllData(),
    getFeaturedChannels(),
    getTopCountries(),
  ])

  const countryMap = new Map(countries.map((c) => [c.slug, c]))

  return (
    <div className="mx-auto max-w-[1600px] space-y-12">
      <Hero stats={stats} />

      <section>
        <SectionHeader
          title="Live Channels"
          icon={<Radio className="size-5 text-red-400" />}
          href="/trending"
        />
        <Rail>
          {featuredChannels.map((c) => (
            <ChannelCard key={c.slug} channel={c} country={countryMap.get(c.countrySlug)} className="w-64 shrink-0 snap-start" />
          ))}
        </Rail>
      </section>

      <section>
        <SectionHeader
          title="Countries with the Most Channels"
          icon={<Globe className="size-5 text-emerald-400" />}
          href="/countries"
        />
        <Rail>
          {topCountries.map((c) => (
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

    </div>
  )
}
