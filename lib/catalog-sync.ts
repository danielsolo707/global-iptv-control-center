import "server-only"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { normalizeCountryCode, resolveStoredCountryCode } from "@/lib/country-codes"
import { refreshIptvData } from "@/lib/iptv-service"

const M3U_URL = "https://iptv-org.github.io/iptv/index.m3u"
const CHANNELS_URL = "https://iptv-org.github.io/api/channels.json"
const ATTR = /([\w-]+)="([^"]*)"/g

export type CatalogSyncResult = {
  imported: number
  updated: number
  restored: number
  removed: number
  total: number
  durationMs: number
}

type SourceRow = {
  channel_id: string
  name: string
  country: string
  country_code: string
  category: string
  language: string | null
  logo: string | null
  stream_url: string
  last_sync: string
  status?: string
  fail_count?: number
}

function parseM3u(document: string, metadata: Map<string, Record<string, unknown>>): Omit<SourceRow, "country" | "last_sync" | "status">[] {
  const rows: Omit<SourceRow, "country" | "last_sync" | "status">[] = []
  let pending: { attrs: Record<string, string>; name: string } | null = null

  for (const rawLine of document.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line.startsWith("#EXTINF:")) {
      const attrs = Object.fromEntries([...line.matchAll(ATTR)].map((match) => [match[1], match[2]]))
      pending = { attrs, name: line.slice(line.lastIndexOf(",") + 1).trim() }
      continue
    }
    if (!pending || !line || line.startsWith("#")) continue

    const channelId = pending.attrs["tvg-id"] || ""
    const baseId = channelId.replace(/@[A-Za-z0-9]+$/, "")
    const source = (metadata.get(channelId) || metadata.get(baseId) || {}) as Record<string, unknown>
    const rawCountry = Array.isArray(source.country) ? source.country[0] : source.country
    const countryCode = normalizeCountryCode(typeof rawCountry === "string" ? rawCountry : null)
    if (channelId && countryCode) {
      const categories = source.categories
      const languages = source.languages
      rows.push({
        channel_id: channelId,
        name: (typeof source.name === "string" && source.name) || pending.name,
        country_code: countryCode,
        category: (Array.isArray(categories) ? String(categories[0] || "general") : String(categories || "general")) || "general",
        language: Array.isArray(languages) ? (languages[0] ? String(languages[0]) : null) : languages ? String(languages) : null,
        logo: pending.attrs["tvg-logo"] || (typeof source.logo === "string" ? source.logo : null),
        stream_url: line,
      })
    }
    pending = null
  }
  return rows
}

function chunk<T>(items: T[], size = 500): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size))
  return batches
}

/**
 * Synchronize the enabled-country catalog from iptv-org.
 * Soft-deletes missing channels as `removed` and restores reappearing rows.
 */
export async function runCatalogSync(options: { startedBy?: string | null; type?: string } = {}): Promise<CatalogSyncResult> {
  const db = createSupabaseAdminClient()
  if (!db) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for catalog synchronization")

  const started = Date.now()
  const { data: enabled, error: enabledError } = await db.from("countries").select("code,name").eq("enabled", true)
  if (enabledError) throw new Error(enabledError.message)
  const countries = new Map((enabled || []).map((row) => [row.code, row.name]))
  if (!countries.size) {
    return { imported: 0, updated: 0, restored: 0, removed: 0, total: 0, durationMs: Date.now() - started }
  }

  const [m3uResponse, metadataResponse] = await Promise.all([
    fetch(M3U_URL, { cache: "no-store", signal: AbortSignal.timeout(60_000) }),
    fetch(CHANNELS_URL, { cache: "no-store", signal: AbortSignal.timeout(60_000) }),
  ])
  if (!m3uResponse.ok || !metadataResponse.ok) throw new Error("Unable to download upstream IPTV sources")

  const metadataList = (await metadataResponse.json()) as Array<Record<string, unknown>>
  const metadata = new Map(metadataList.filter((item) => typeof item.id === "string").map((item) => [String(item.id), item]))
  const now = new Date().toISOString()
  const sourceRows = new Map<string, SourceRow>()

  for (const row of parseM3u(await m3uResponse.text(), metadata)) {
    const storedCode = resolveStoredCountryCode(row.country_code, countries)
    if (!storedCode) continue
    sourceRows.set(row.channel_id, {
      ...row,
      country_code: storedCode,
      country: countries.get(storedCode) || row.country_code,
      last_sync: now,
      status: "checking",
    })
  }

  const { data: existingRows, error: existingError } = await db
    .from("channels")
    .select("channel_id,stream_url,status,fail_count")
    .in("country_code", [...countries.keys()])
  if (existingError) throw new Error(existingError.message)

  const existing = new Map((existingRows || []).map((row) => [row.channel_id, row]))
  let imported = 0
  let updated = 0
  let restored = 0

  for (const [id, row] of sourceRows) {
    const old = existing.get(id)
    if (!old) {
      imported += 1
      row.fail_count = 0
      continue
    }
    updated += 1
    const wasRemoved = old.status === "removed"
    if (wasRemoved) restored += 1

    if (old.stream_url === row.stream_url) {
      // Reappearing channels must leave `removed`. Healthy rows keep their status.
      if (wasRemoved) {
        row.status = "checking"
        row.fail_count = 0
      } else {
        delete row.status
      }
    } else {
      // Stream URL changed — re-validate from a clean slate.
      row.status = "checking"
      row.fail_count = 0
    }
  }

  for (const batch of chunk([...sourceRows.values()])) {
    const { error } = await db.from("channels").upsert(batch, { onConflict: "channel_id" })
    if (error) throw new Error(error.message)
  }

  const missingIds = [...existing.keys()].filter((id) => !sourceRows.has(id))
  for (const batch of chunk(missingIds, 200)) {
    const { error } = await db.from("channels").update({ status: "removed", last_sync: now }).in("channel_id", batch)
    if (error) throw new Error(error.message)
  }

  const durationMs = Date.now() - started
  await db.from("sync_runs").insert({
    type: options.type || "catalog-sync",
    status: "completed",
    duration_ms: durationMs,
    imported_channels: imported,
    updated_channels: updated,
    removed_channels: missingIds.length,
    started_by: options.startedBy || null,
  })
  await db.from("system_logs").insert({
    type: "sync",
    message: `Catalog sync completed: ${sourceRows.size} active, ${imported} new, ${restored} restored, ${missingIds.length} removed`,
    user_id: options.startedBy || null,
    metadata: { imported, updated, restored, removed: missingIds.length, total: sourceRows.size, durationMs },
  })

  // Invalidate the short-lived viewer cache so additions/removals appear promptly.
  await refreshIptvData().catch(() => undefined)

  return {
    imported,
    updated,
    restored,
    removed: missingIds.length,
    total: sourceRows.size,
    durationMs,
  }
}
