import { SectionHeader, LiveDot } from "@/components/ui/primitives"
import { getChannels, getProgramSchedule } from "@/lib/api-client"
import { CalendarClock } from "lucide-react"

export default async function SchedulePage() {
  const channels = await getChannels()
  const featuredChannels = channels.slice(0, 8)

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
        <p className="text-muted-foreground">Electronic Program Guide for live channels</p>
      </div>

      <div className="space-y-6">
        {featuredChannels.map((channel) => {
          const schedule = getProgramSchedule(channel.slug.length)
          return (
            <div
              key={channel.slug}
              className="rounded-2xl border border-border/60 bg-card/50 p-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="grid size-10 place-items-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: channel.logoColor }}
                >
                  {channel.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{channel.name}</span>
                    <LiveDot />
                  </div>
                  <span className="text-xs text-muted-foreground">{channel.now}</span>
                </div>
              </div>

              <div className="space-y-2">
                {schedule.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
                      item.live
                        ? "border-red-500/30 bg-red-500/5"
                        : "border-border/40 bg-card/30"
                    }`}
                  >
                    <span className="w-12 text-sm font-mono font-medium">{item.time}</span>
                    <span className="flex-1 text-sm font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.duration}</span>
                    {item.live && <LiveDot />}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
