import Link from "next/link"
import { notFound } from "next/navigation"
import { ChannelCard } from "@/components/cards"
import { SectionHeader, Badge, LiveDot, QualityBadge } from "@/components/ui/primitives"
import { getChannel, getCountry, channelsByCountry, getProgramSchedule } from "@/lib/api-client"
import { Play, ArrowLeft, Radio, Globe, Eye, Clock, Calendar } from "lucide-react"

export default async function ChannelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const channel = await getChannel(slug)
  if (!channel) notFound()

  const [country, countryChannels] = await Promise.all([
    getCountry(channel.countrySlug),
    channelsByCountry(channel.countrySlug),
  ])

  const schedule = getProgramSchedule(slug.length)
  const related = countryChannels.filter((c) => c.slug !== slug).slice(0, 6)

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href={country ? `/countries/${country.slug}` : "/countries"}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to {country?.name || "Countries"}
        </Link>

        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Logo & Info */}
          <div className="flex items-center gap-5">
            <span
              className="grid size-20 place-items-center rounded-2xl text-xl font-bold text-white"
              style={{ backgroundColor: channel.logoColor }}
            >
              {channel.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{channel.name}</h1>
                <LiveDot />
              </div>
              <p className="mt-1 text-muted-foreground">{channel.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className="bg-secondary">
                  <Globe className="size-3" /> {country?.flag} {country?.name}
                </Badge>
                <QualityBadge quality={channel.quality} />
                <Badge className="bg-secondary">
                  <Eye className="size-3" /> {channel.viewers.toLocaleString()} watching
                </Badge>
              </div>
            </div>
          </div>

          {/* Watch Button */}
          <div className="md:ml-auto">
            <Link
              href={`/watch/${channel.slug}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-8 py-4 text-lg font-bold text-white glow-purple transition-opacity hover:opacity-90"
            >
              <Play className="size-5 fill-white" /> Watch Live
            </Link>
          </div>
        </div>
      </div>

      {/* Now & Next */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Radio className="size-4 text-red-400" /> Now Playing
          </div>
          <p className="mt-2 text-xl font-bold">{channel.now}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Clock className="size-4 text-blue" /> Up Next
          </div>
          <p className="mt-2 text-xl font-bold">{channel.next}</p>
        </div>
      </div>

      {/* Schedule */}
      <section>
        <SectionHeader title="Schedule" icon={<Calendar className="size-5 text-blue" />} />
        <div className="space-y-2">
          {schedule.map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
                item.live
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-border/60 bg-card/50"
              }`}
            >
              <span className="w-12 text-sm font-mono font-medium">{item.time}</span>
              <span className="flex-1 text-sm font-medium">{item.title}</span>
              <span className="text-xs text-muted-foreground">{item.duration}</span>
              {item.live && <LiveDot />}
            </div>
          ))}
        </div>
      </section>

      {/* Related Channels */}
      {related.length > 0 && (
        <section>
          <SectionHeader title={`More from ${country?.name}`} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {related.map((c) => (
              <ChannelCard key={c.slug} channel={c} country={country || undefined} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
