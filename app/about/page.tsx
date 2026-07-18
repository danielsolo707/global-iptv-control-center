import { SectionHeader } from "@/components/ui/primitives"
import { getStats } from "@/lib/api-client"
import { Globe, Radio, Tv, Info, HelpCircle, Mail } from "lucide-react"

export default async function AboutPage() {
  const stats = await getStats()

  return (
    <div className="mx-auto max-w-[1600px] space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">About Global IPTV</h1>
        <p className="text-muted-foreground">Explore live television from around the world</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
          <Tv className="mx-auto size-8 text-blue" />
          <p className="mt-3 text-2xl font-extrabold">{stats.channels.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Live Channels</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
          <Globe className="mx-auto size-8 text-purple" />
          <p className="mt-3 text-2xl font-extrabold">{stats.countries}</p>
          <p className="text-sm text-muted-foreground">Countries</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
          <Radio className="mx-auto size-8 text-emerald-400" />
          <p className="mt-3 text-2xl font-extrabold">{stats.hd.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">HD Channels</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
          <Tv className="mx-auto size-8 text-amber-400" />
          <p className="mt-3 text-2xl font-extrabold">{stats.uhd.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">4K Channels</p>
        </div>
      </div>

      {/* How it Works */}
      <section className="rounded-2xl border border-border/60 bg-card/30 p-8">
        <SectionHeader title="How It Works" icon={<Info className="size-5 text-blue" />} />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <span className="grid size-10 place-items-center rounded-xl bg-blue/10 text-lg font-bold text-blue">1</span>
            <h3 className="text-lg font-bold">Browse</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Explore thousands of free-to-air live TV channels from {stats.countries} countries. Use the globe, search, or browse by country and category.
            </p>
          </div>
          <div className="space-y-2">
            <span className="grid size-10 place-items-center rounded-xl bg-purple/10 text-lg font-bold text-purple">2</span>
            <h3 className="text-lg font-bold">Select</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Click on any channel to see its details, current program, schedule, and related channels from the same country.
            </p>
          </div>
          <div className="space-y-2">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-lg font-bold text-emerald-400">3</span>
            <h3 className="text-lg font-bold">Watch</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Press Watch Live to start streaming. All channels are free-to-air and publicly available. No account required.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <SectionHeader title="Frequently Asked Questions" icon={<HelpCircle className="size-5 text-purple" />} />
        <div className="space-y-3">
          {[
            {
              q: "Is this service free?",
              a: "Yes, Global IPTV is completely free. We only aggregate publicly available free-to-air television streams.",
            },
            {
              q: "Do I need an account?",
              a: "No account is required. Your favorites and watch history are stored locally in your browser.",
            },
            {
              q: "Where does the data come from?",
              a: "Channel listings and stream URLs are sourced from the iptv-org open database of free-to-air television channels.",
            },
            {
              q: "Why is a channel not working?",
              a: "Stream availability depends on the broadcaster. Some channels may be temporarily offline. We update our data every few minutes.",
            },
            {
              q: "Is this legal?",
              a: "We only list free-to-air channels that are legally broadcast without subscription. We do not host any streams.",
            },
          ].map((faq, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card/50 p-5">
              <h3 className="font-semibold">{faq.q}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-2xl border border-border/60 bg-card/30 p-8">
        <SectionHeader title="Contact" icon={<Mail className="size-5 text-blue" />} />
        <p className="text-muted-foreground">
          For questions, suggestions, or issues, reach out via the platform's feedback channels.
        </p>
      </section>
    </div>
  )
}
