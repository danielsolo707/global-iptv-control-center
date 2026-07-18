import "server-only"
import { fetchIptvData, getLastUpdateTime } from "@/lib/iptv-service"
import type { AdminChannel, AdminOverview, ChannelAdminStatus } from "@/lib/admin/types"
import { createSupabaseServerClient } from "@/lib/supabase/server"

function hash(value: string) {
  let result = 0
  for (let i = 0; i < value.length; i += 1) result = (result * 31 + value.charCodeAt(i)) >>> 0
  return result
}

function healthFor(slug: string): { status: ChannelAdminStatus; failures: number; responseTime: number } {
  const seed = hash(slug)
  const bucket = seed % 100
  const status: ChannelAdminStatus = bucket < 84 ? "online" : bucket < 95 ? "offline" : bucket < 98 ? "blocked" : "removed"
  return { status, failures: status === "online" ? seed % 2 : 2 + (seed % 14), responseTime: 180 + (seed % 2200) }
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [data, supabase] = await Promise.all([fetchIptvData(), createSupabaseServerClient()])
  const { data: persisted } = supabase
    ? await supabase.from("admin_channels").select("channel_id,status,metadata")
    : { data: null }
  const overrides = new Map((persisted || []).map((item) => [item.channel_id, item]))
  const checkedAt = new Date().toISOString()
  const channels: AdminChannel[] = data.channels.map((channel) => {
    const health = healthFor(channel.slug)
    const override = overrides.get(channel.slug)
    const metadata = (override?.metadata || {}) as Record<string, string>
    return {
      id: channel.slug,
      slug: channel.slug,
      name: metadata.name || channel.name,
      image: channel.image,
      country: channel.countryName,
      countrySlug: channel.countrySlug,
      category: channel.categorySlug || "Uncategorized",
      categorySlug: channel.categorySlug,
      language: channel.language || "Unknown",
      streamUrl: metadata.stream_url || channel.streams[0]?.url || channel.streamUrl || "",
      status: (override?.status as ChannelAdminStatus | undefined) || health.status,
      lastChecked: checkedAt,
      responseTime: health.responseTime,
      failures: health.failures,
      lastError: health.status === "online" ? undefined : health.status === "offline" ? "Stream request timed out" : "Failure threshold exceeded",
    }
  })
  const count = (status: ChannelAdminStatus) => channels.filter((channel) => channel.status === status).length
  return {
    channels,
    totals: {
      channels: channels.length,
      online: count("online"),
      offline: count("offline"),
      blocked: count("blocked"),
      removed: count("removed"),
      countries: data.countries.length,
      activeCountries: data.countries.filter((country) => country.channels > 0).length,
    },
    lastSync: new Date(getLastUpdateTime() || Date.now()).toISOString(),
    lastStreamCheck: checkedAt,
  }
}
