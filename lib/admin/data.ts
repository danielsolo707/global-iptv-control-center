import "server-only"
import { fetchIptvData, getLastUpdateTime } from "@/lib/iptv-service"
import type { AdminChannel, AdminOverview, ChannelAdminStatus } from "@/lib/admin/types"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

const CATEGORY_IMAGE: Record<string, string> = {
  sports: "/programs/sports.png",
  news: "/programs/news-studio.png",
  movies: "/programs/movie.png",
  kids: "/programs/kids.png",
  music: "/programs/music.png",
  documentary: "/programs/documentary.png",
  entertainment: "/programs/movie.png",
}

function imageForCategory(category: string | null | undefined): string {
  const key = (category || "entertainment").toLowerCase()
  return CATEGORY_IMAGE[key] || CATEGORY_IMAGE.entertainment
}

function asStatus(value: string | null | undefined): ChannelAdminStatus {
  const allowed: ChannelAdminStatus[] = ["online", "offline", "checking", "blocked", "removed", "disabled"]
  if (value && (allowed as string[]).includes(value)) return value as ChannelAdminStatus
  return "checking"
}

type DbChannel = {
  id: string
  channel_id: string
  name: string
  country: string
  country_code: string
  category: string | null
  language: string | null
  logo: string | null
  stream_url: string
  status: string
  last_checked: string | null
  response_time: number | null
  fail_count: number | null
}

function mapDbChannel(row: DbChannel, lastError?: string): AdminChannel {
  return {
    id: row.channel_id,
    slug: row.channel_id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || row.channel_id,
    name: row.name,
    image: row.logo || imageForCategory(row.category),
    country: row.country,
    countrySlug: row.country_code.toLowerCase(),
    category: row.category || "general",
    categorySlug: (row.category || "general").toLowerCase(),
    language: row.language || "Unknown",
    streamUrl: row.stream_url,
    status: asStatus(row.status),
    lastChecked: row.last_checked || new Date(0).toISOString(),
    responseTime: row.response_time || 0,
    failures: row.fail_count || 0,
    lastError,
  }
}

async function loadChannelsFromDatabase(): Promise<{
  channels: AdminChannel[]
  lastSync: string
  lastStreamCheck: string
  countries: number
  activeCountries: number
} | null> {
  // Prefer the service-role client so admins always see offline/blocked/removed rows.
  // Falls back to the session client (RLS allows any admin role to read all channels).
  const service = createSupabaseAdminClient()
  const session = service ? null : await createSupabaseServerClient()
  const db = service || session
  if (!db) return null

  const rows: DbChannel[] = []
  for (let start = 0; ; start += 1000) {
    const { data, error } = await db
      .from("channels")
      .select("id,channel_id,name,country,country_code,category,language,logo,stream_url,status,last_checked,response_time,fail_count")
      .order("name")
      .range(start, start + 999)
    if (error) {
      // Table may not exist yet on environments that only run migration 001.
      if (/does not exist|schema cache/i.test(error.message)) return null
      throw new Error(`Admin catalog query failed: ${error.message}`)
    }
    rows.push(...((data || []) as DbChannel[]))
    if (!data || data.length < 1000) break
  }

  // Latest error message per channel from stream_checks (best-effort).
  const problemIds = rows.filter((row) => row.status !== "online").map((row) => row.channel_id).slice(0, 200)
  const errors = new Map<string, string>()
  if (problemIds.length) {
    const { data: checks } = await db
      .from("stream_checks")
      .select("channel_id,error_message,checked_at")
      .in("channel_id", problemIds)
      .order("checked_at", { ascending: false })
      .limit(500)
    for (const check of checks || []) {
      if (check.error_message && !errors.has(check.channel_id)) {
        errors.set(check.channel_id, check.error_message)
      }
    }
  }

  const { data: countryRows } = await db.from("countries").select("code,enabled")
  const countries = countryRows?.length || 0
  const activeCountries = (countryRows || []).filter((country) => country.enabled).length

  let lastSync = new Date(0).toISOString()
  let lastStreamCheck = new Date(0).toISOString()
  for (const row of rows) {
    if (row.last_checked && row.last_checked > lastStreamCheck) lastStreamCheck = row.last_checked
  }
  const { data: syncRuns } = await db.from("sync_runs").select("created_at").order("created_at", { ascending: false }).limit(1)
  if (syncRuns?.[0]?.created_at) lastSync = syncRuns[0].created_at

  return {
    channels: rows.map((row) => mapDbChannel(row, errors.get(row.channel_id))),
    lastSync,
    lastStreamCheck,
    countries,
    activeCountries,
  }
}

/** Fallback overview when the persistent catalog table is unavailable. */
async function loadFallbackOverview(): Promise<AdminOverview> {
  const [data, supabase] = await Promise.all([fetchIptvData(), createSupabaseServerClient()])
  const { data: persisted } = supabase
    ? await supabase.from("admin_channels").select("channel_id,status,metadata")
    : { data: null }
  const overrides = new Map((persisted || []).map((item) => [item.channel_id, item]))
  const checkedAt = new Date().toISOString()
  const channels: AdminChannel[] = data.channels.map((channel) => {
    const override = overrides.get(channel.slug)
    const metadata = (override?.metadata || {}) as Record<string, string>
    const status = (override?.status as ChannelAdminStatus | undefined) || "online"
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
      status,
      lastChecked: checkedAt,
      responseTime: 0,
      failures: 0,
      lastError: status === "online" ? undefined : "Awaiting first automated health check",
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

export async function getAdminOverview(): Promise<AdminOverview> {
  const database = await loadChannelsFromDatabase()
  if (!database) return loadFallbackOverview()

  const count = (status: ChannelAdminStatus) => database.channels.filter((channel) => channel.status === status).length
  return {
    channels: database.channels,
    totals: {
      channels: database.channels.length,
      online: count("online"),
      offline: count("offline"),
      blocked: count("blocked"),
      removed: count("removed"),
      countries: database.countries,
      activeCountries: database.activeCountries,
    },
    lastSync: database.lastSync,
    lastStreamCheck: database.lastStreamCheck,
  }
}

export async function getAdminChannel(channelId: string): Promise<AdminChannel | null> {
  const overview = await getAdminOverview()
  return overview.channels.find((channel) => channel.id === channelId || channel.slug === channelId) || null
}

export async function getChannelHealthHistory(channelId: string, limit = 30) {
  const db = createSupabaseAdminClient() || (await createSupabaseServerClient())
  if (!db) return []
  const { data, error } = await db
    .from("stream_checks")
    .select("status,response_time_ms,http_status,codec,resolution,error_message,checked_at")
    .eq("channel_id", channelId)
    .order("checked_at", { ascending: false })
    .limit(limit)
  if (error) return []
  return data || []
}

export async function getRecentSyncRuns(limit = 10) {
  const db = createSupabaseAdminClient() || (await createSupabaseServerClient())
  if (!db) return []
  const { data } = await db
    .from("sync_runs")
    .select("id,type,status,duration_ms,imported_channels,updated_channels,removed_channels,created_at")
    .order("created_at", { ascending: false })
    .limit(limit)
  return data || []
}

export async function getManagedCountries() {
  const db = createSupabaseAdminClient() || (await createSupabaseServerClient())
  if (!db) {
    const data = await fetchIptvData()
    return data.countries.map((country) => ({
      code: country.code,
      name: country.name,
      enabled: true,
      totalChannels: country.channels,
      onlineChannels: country.channels,
      flag: country.flag,
    }))
  }
  const { data: countries } = await db.from("countries").select("code,name,enabled").order("name")
  const { data: report } = await db.from("country_availability_report").select("code,total_channels,online_channels")
  const reportByCode = new Map((report || []).map((row) => [row.code, row]))
  return (countries || []).map((country) => {
    const stats = reportByCode.get(country.code)
    return {
      code: country.code,
      name: country.name,
      enabled: country.enabled,
      totalChannels: Number(stats?.total_channels || 0),
      onlineChannels: Number(stats?.online_channels || 0),
      flag: "",
    }
  })
}

export async function getManagedCategories() {
  const db = createSupabaseAdminClient() || (await createSupabaseServerClient())
  if (!db) {
    const data = await fetchIptvData()
    return data.categories.map((category) => ({
      id: category.slug,
      name: category.name,
      enabled: true,
      channels: category.channels,
    }))
  }
  const { data: settings } = await db.from("category_settings").select("category_id,name,enabled")
  const settingsById = new Map((settings || []).map((row) => [row.category_id, row]))

  // Distinct categories from the catalog.
  const { data: rows } = await db.from("channels").select("category").neq("status", "removed")
  const counts = new Map<string, number>()
  for (const row of rows || []) {
    const key = (row.category || "general").toLowerCase()
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([id, channels]) => {
      const setting = settingsById.get(id)
      return {
        id,
        name: setting?.name || id,
        enabled: setting?.enabled ?? true,
        channels,
      }
    })
    .sort((a, b) => b.channels - a.channels)
}
