import { existsSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

const envFile = existsSync(".env.local") ? ".env.local" : ".env"
if (!existsSync(envFile)) throw new Error("Missing .env.local or .env")
process.loadEnvFile(envFile)

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
const attrPattern = /([\w-]+)="([^"]*)"/g

function normalizeCountryCode(code) {
  if (!code) return null
  const upper = String(code).trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(upper)) return null
  return upper === "UK" ? "GB" : upper
}

function resolveStoredCountryCode(upstreamCode, countries) {
  const normalized = normalizeCountryCode(upstreamCode)
  if (!normalized) return null
  if (countries.has(normalized)) return normalized
  if (normalized === "GB" && countries.has("UK")) return "UK"
  if (normalized === "UK" && countries.has("GB")) return "GB"
  return null
}

function parseM3u(document, metadata) {
  const rows = []
  let pending = null
  for (const rawLine of document.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line.startsWith("#EXTINF:")) {
      const attrs = Object.fromEntries([...line.matchAll(attrPattern)].map(([, key, value]) => [key, value]))
      pending = { attrs, name: line.slice(line.lastIndexOf(",") + 1).trim() }
    } else if (pending && line && !line.startsWith("#")) {
      const channelId = pending.attrs["tvg-id"]
      const source = metadata.get(channelId) || metadata.get(channelId?.replace(/@[A-Za-z0-9]+$/, ""))
      const country = Array.isArray(source?.country) ? source.country[0] : source?.country
      const countryCode = normalizeCountryCode(country)
      if (channelId && countryCode) {
        rows.push({
          channel_id: channelId,
          name: source.name || pending.name,
          country_code: countryCode,
          category: (Array.isArray(source.categories) ? source.categories[0] : source.categories) || "general",
          language: (Array.isArray(source.languages) ? source.languages[0] : source.languages) || null,
          logo: pending.attrs["tvg-logo"] || source.logo || null,
          stream_url: line,
        })
      }
      pending = null
    }
  }
  return rows
}

function batch(items, size = 500) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size))
}

const enabledResult = await db.from("countries").select("code,name").eq("enabled", true)
if (enabledResult.error) throw enabledResult.error
const countries = new Map(enabledResult.data.map((country) => [country.code, country.name]))
if (!countries.size) throw new Error("No countries are enabled")

const [m3uResponse, channelsResponse] = await Promise.all([
  fetch("https://iptv-org.github.io/iptv/index.m3u"),
  fetch("https://iptv-org.github.io/api/channels.json"),
])
if (!m3uResponse.ok || !channelsResponse.ok) throw new Error("Unable to download the IPTV source")
const metadata = new Map((await channelsResponse.json()).filter((channel) => channel.id).map((channel) => [channel.id, channel]))
const now = new Date().toISOString()
const sourceRows = new Map()
let imported = 0
let restored = 0

for (const row of parseM3u(await m3uResponse.text(), metadata)) {
  const storedCode = resolveStoredCountryCode(row.country_code, countries)
  if (!storedCode) continue
  sourceRows.set(row.channel_id, {
    ...row,
    country_code: storedCode,
    country: countries.get(storedCode),
    last_sync: now,
    status: "checking",
  })
}

const existingResult = await db
  .from("channels")
  .select("channel_id,stream_url,status,fail_count")
  .in("country_code", [...countries.keys()])
if (existingResult.error) throw existingResult.error
const existing = new Map(existingResult.data.map((row) => [row.channel_id, row]))

for (const [id, row] of sourceRows) {
  const old = existing.get(id)
  if (!old) {
    imported += 1
    row.fail_count = 0
    continue
  }
  const wasRemoved = old.status === "removed"
  if (wasRemoved) restored += 1
  if (old.stream_url === row.stream_url) {
    // Never keep removed for channels present upstream.
    if (wasRemoved) {
      row.status = "checking"
      row.fail_count = 0
    } else {
      delete row.status
      if (old.fail_count != null) row.fail_count = old.fail_count
    }
  } else {
    row.status = "checking"
    row.fail_count = 0
  }
}

for (const rows of batch([...sourceRows.values()])) {
  const { error } = await db.from("channels").upsert(rows, { onConflict: "channel_id", defaultToNull: false })
  if (error) throw error
}

const removed = [...existing.keys()].filter((id) => !sourceRows.has(id))
for (const ids of batch(removed, 200)) {
  const { error } = await db.from("channels").update({ status: "removed", last_sync: now }).in("channel_id", ids)
  if (error) throw error
}

await db.from("sync_runs").insert({
  type: "script-sync",
  status: "completed",
  duration_ms: 0,
  imported_channels: imported,
  updated_channels: sourceRows.size - imported,
  removed_channels: removed.length,
})

console.log(
  `Synced ${sourceRows.size} channels; imported=${imported}, restored=${restored}, marked ${removed.length} removed.`,
)
