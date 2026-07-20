import { notFound } from "next/navigation"
import { ArrowLeft, Clock3, Globe2, Languages, Tags, Tv2 } from "lucide-react"
import Link from "next/link"
import { getAdminChannel, getChannelHealthHistory } from "@/lib/admin/data"
import { PageTitle, Panel, StatusBadge, StreamTest } from "@/components/admin/admin-ui"
import { requireAdminPage } from "@/lib/admin/auth"

export default async function AdminChannelDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [admin, channel, history] = await Promise.all([
    requireAdminPage(),
    getAdminChannel(id),
    getChannelHealthHistory(id, 30),
  ])
  if (!channel) notFound()

  const checks = history.length
    ? history.map((item) => item.status === "online")
    : Array.from({ length: 0 })

  return (
    <div>
      <Link href="/admin/channels" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to channels
      </Link>
      <PageTitle
        title={channel.name}
        description="Channel metadata, stream configuration, and health history."
        actions={<StatusBadge status={channel.status} />}
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Channel information">
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["Country", channel.country, Globe2],
                ["Category", channel.category, Tags],
                ["Language", channel.language, Languages],
                ["Channel ID", channel.id, Tv2],
              ] as const
            ).map(([label, value, Icon]) => (
              <div key={label} className="rounded-xl bg-secondary/40 p-4">
                <Icon className="mb-3 size-4 text-blue" />
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 truncate text-sm font-semibold capitalize">{value}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Stream information">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Current URL</p>
              <p className="mt-1 break-all rounded-xl bg-secondary/40 p-3 font-mono text-xs">{channel.streamUrl}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="size-4" />
              Last checked: {channel.lastChecked ? new Date(channel.lastChecked).toLocaleString() : "Never"}
              {channel.responseTime ? ` · ${channel.responseTime}ms` : ""}
            </div>
            {channel.lastError && <p className="text-xs text-red-400">{channel.lastError}</p>}
            <StreamTest channel={channel} role={admin.role} />
          </div>
        </Panel>
      </div>
      <Panel className="mt-5" title="Health history" description="Last 30 automated checks">
        {checks.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {history.map((item, index) => (
              <span
                key={`${item.checked_at}-${index}`}
                title={`${new Date(item.checked_at).toLocaleString()}: ${item.status}${item.error_message ? ` — ${item.error_message}` : ""}`}
                className={`size-4 rounded-full ${
                  item.status === "online"
                    ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,.35)]"
                    : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,.35)]"
                }`}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No stream checks recorded yet for this channel.</p>
        )}
      </Panel>
    </div>
  )
}
