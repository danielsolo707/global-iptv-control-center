import type { IptvChannel, IptvCountry, IptvCategory, IptvStats, IptvStream } from "./types"
import { createClient } from "@supabase/supabase-js"

/*
 * Global IPTV Data Service
 * Fetches real free-to-air IPTV data from iptv-org APIs
 * Smart cache with TTL for automatic updates
 */

const IPTV_BASE = "https://iptv-org.github.io/api"
const CACHE_TTL_MS = 2 * 60 * 1000 // Keep provider additions and removals in sync quickly.
const SEARCH_RESULT_LIMIT = 100
const UNAVAILABLE_CHANNEL_TTL_MS = 10 * 60 * 1000
const MINIMUM_CHANNELS_PER_COUNTRY = 10

// In-memory cache
type IptvData = {
  channels: IptvChannel[]
  countries: IptvCountry[]
  categories: IptvCategory[]
  stats: IptvStats
}

let cache: IptvData & {
  lastUpdate: number
} | null = null
let inFlightRequest: Promise<IptvData> | null = null
const reportedUnavailableChannels = new Map<string, number>()

// Popular country codes (countries with significant free-to-air presence)
const POPULAR_COUNTRY_CODES = new Set([
  "US", "GB", "UK", "JP", "KR", "FR", "DE", "IN", "BR", "ES", "IT",
  "RU", "CN", "MX", "CA", "AU", "NL", "TR", "ID", "SA", "AE",
  "IR", "TH", "VN", "PL", "SE", "NO", "DK", "FI", "BE", "CH",
  "AT", "PT", "GR", "IL", "ZA", "EG", "PK", "BD", "MY", "PH",
  "UA", "CZ", "HU", "RO", "BG", "HR", "SI", "SK", "LT", "LV",
  "EE", "IS", "IE", "NZ", "SG", "HK", "TW", "AR", "CO", "CL",
  "PE", "VE", "EC", "UY", "PY", "BO", "CR", "PA", "GT", "HN",
  "SV", "NI", "DO", "CU", "PR", "JM", "TT", "BB", "BS", "BZ",
  "GW", "GN", "DJ", "KM", "MR", "NE", "TD", "CF", "SS", "ER",
])

// Category mapping from iptv-org to our categories
const CATEGORY_MAP: Record<string, { slug: string; name: string; icon: string; color: string; gradient: string; image: string }> = {
  sports: { slug: "sports", name: "Sports", icon: "Trophy", color: "oklch(0.72 0.19 145)", gradient: "from-emerald-500/25 to-emerald-500/5", image: "/programs/sports.png" },
  news: { slug: "news", name: "News", icon: "Newspaper", color: "oklch(0.65 0.19 255)", gradient: "from-blue-500/25 to-blue-500/5", image: "/programs/news-studio.png" },
  movies: { slug: "movies", name: "Movies", icon: "Clapperboard", color: "oklch(0.6 0.22 300)", gradient: "from-purple-500/25 to-purple-500/5", image: "/programs/movie.png" },
  kids: { slug: "kids", name: "Kids", icon: "Baby", color: "oklch(0.8 0.16 85)", gradient: "from-amber-400/25 to-amber-400/5", image: "/programs/kids.png" },
  music: { slug: "music", name: "Music", icon: "Music", color: "oklch(0.65 0.23 350)", gradient: "from-pink-500/25 to-pink-500/5", image: "/programs/music.png" },
  documentary: { slug: "documentary", name: "Documentary", icon: "Clapperboard", color: "oklch(0.7 0.14 200)", gradient: "from-cyan-500/25 to-cyan-500/5", image: "/programs/documentary.png" },
  entertainment: { slug: "entertainment", name: "Entertainment", icon: "Sparkles", color: "oklch(0.68 0.2 30)", gradient: "from-orange-500/25 to-orange-500/5", image: "/programs/movie.png" },
  religion: { slug: "religion", name: "Religion", icon: "Sun", color: "oklch(0.78 0.15 95)", gradient: "from-yellow-500/25 to-yellow-500/5", image: "/programs/documentary.png" },
  education: { slug: "education", name: "Education", icon: "GraduationCap", color: "oklch(0.66 0.16 175)", gradient: "from-teal-500/25 to-teal-500/5", image: "/programs/news-studio.png" },
  business: { slug: "business", name: "Business", icon: "TrendingUp", color: "oklch(0.62 0.14 250)", gradient: "from-indigo-500/25 to-indigo-500/5", image: "/programs/news-studio.png" },
  technology: { slug: "technology", name: "Technology", icon: "Cpu", color: "oklch(0.68 0.16 220)", gradient: "from-sky-500/25 to-sky-500/5", image: "/programs/documentary.png" },
  general: { slug: "entertainment", name: "Entertainment", icon: "Sparkles", color: "oklch(0.68 0.2 30)", gradient: "from-orange-500/25 to-orange-500/5", image: "/programs/movie.png" },
  culture: { slug: "documentary", name: "Documentary", icon: "Clapperboard", color: "oklch(0.7 0.14 200)", gradient: "from-cyan-500/25 to-cyan-500/5", image: "/programs/documentary.png" },
  science: { slug: "technology", name: "Technology", icon: "Cpu", color: "oklch(0.68 0.16 220)", gradient: "from-sky-500/25 to-sky-500/5", image: "/programs/documentary.png" },
  lifestyle: { slug: "entertainment", name: "Entertainment", icon: "Sparkles", color: "oklch(0.68 0.2 30)", gradient: "from-orange-500/25 to-orange-500/5", image: "/programs/movie.png" },
  travel: { slug: "documentary", name: "Documentary", icon: "Clapperboard", color: "oklch(0.7 0.14 200)", gradient: "from-cyan-500/25 to-cyan-500/5", image: "/programs/documentary.png" },
  comedy: { slug: "entertainment", name: "Entertainment", icon: "Sparkles", color: "oklch(0.68 0.2 30)", gradient: "from-orange-500/25 to-orange-500/5", image: "/programs/movie.png" },
  drama: { slug: "movies", name: "Movies", icon: "Clapperboard", color: "oklch(0.6 0.22 300)", gradient: "from-purple-500/25 to-purple-500/5", image: "/programs/movie.png" },
  family: { slug: "kids", name: "Kids", icon: "Baby", color: "oklch(0.8 0.16 85)", gradient: "from-amber-400/25 to-amber-400/5", image: "/programs/kids.png" },
  animation: { slug: "kids", name: "Kids", icon: "Baby", color: "oklch(0.8 0.16 85)", gradient: "from-amber-400/25 to-amber-400/5", image: "/programs/kids.png" },
  classic: { slug: "movies", name: "Movies", icon: "Clapperboard", color: "oklch(0.6 0.22 300)", gradient: "from-purple-500/25 to-purple-500/5", image: "/programs/movie.png" },
  outdoor: { slug: "sports", name: "Sports", icon: "Trophy", color: "oklch(0.72 0.19 145)", gradient: "from-emerald-500/25 to-emerald-500/5", image: "/programs/sports.png" },
  shop: { slug: "business", name: "Business", icon: "TrendingUp", color: "oklch(0.62 0.14 250)", gradient: "from-indigo-500/25 to-indigo-500/5", image: "/programs/news-studio.png" },
  weather: { slug: "news", name: "News", icon: "Newspaper", color: "oklch(0.65 0.19 255)", gradient: "from-blue-500/25 to-blue-500/5", image: "/programs/news-studio.png" },
  legislative: { slug: "news", name: "News", icon: "Newspaper", color: "oklch(0.65 0.19 255)", gradient: "from-blue-500/25 to-blue-500/5", image: "/programs/news-studio.png" },
}

const DEFAULT_CATEGORY = CATEGORY_MAP.entertainment

// Country flag emoji helper
function getFlagEmoji(countryCode: string): string {
  const code = countryCode.toUpperCase() === "UK" ? "GB" : countryCode.toUpperCase()
  if (!code || code.length !== 2 || !/^[A-Z]{2}$/.test(code)) return "🏳️"
  return code
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("")
}

// Region mapping
function getRegion(countryCode: string): string {
  const regionMap: Record<string, string> = {
    US: "Americas", CA: "Americas", MX: "Americas", BR: "Americas", AR: "Americas",
    CO: "Americas", CL: "Americas", PE: "Americas", VE: "Americas", EC: "Americas",
    UY: "Americas", PY: "Americas", BO: "Americas", CR: "Americas", PA: "Americas",
    GT: "Americas", HN: "Americas", SV: "Americas", NI: "Americas", DO: "Americas",
    CU: "Americas", PR: "Americas", JM: "Americas", TT: "Americas", BB: "Americas",
    BS: "Americas", BZ: "Americas",
    GB: "Europe", UK: "Europe", FR: "Europe", DE: "Europe", IT: "Europe", ES: "Europe",
    NL: "Europe", BE: "Europe", CH: "Europe", AT: "Europe", PT: "Europe",
    GR: "Europe", SE: "Europe", NO: "Europe", DK: "Europe", FI: "Europe",
    IE: "Europe", IS: "Europe", PL: "Europe", CZ: "Europe", HU: "Europe",
    RO: "Europe", BG: "Europe", HR: "Europe", SI: "Europe", SK: "Europe",
    LT: "Europe", LV: "Europe", EE: "Europe", UA: "Europe", RU: "Europe",
    TR: "Europe",
    JP: "Asia", KR: "Asia", CN: "Asia", IN: "Asia", ID: "Asia",
    TH: "Asia", VN: "Asia", MY: "Asia", PH: "Asia", PK: "Asia",
    BD: "Asia", IR: "Asia", SA: "Asia", AE: "Asia", IL: "Asia",
    SG: "Asia", HK: "Asia", TW: "Asia",
    ZA: "Africa", EG: "Africa", NG: "Africa", KE: "Africa", GH: "Africa",
    AU: "Oceania", NZ: "Oceania",
  }
  return regionMap[countryCode.toUpperCase()] || "Other"
}

const logoColors = [
  "oklch(0.65 0.19 255)",
  "oklch(0.6 0.22 300)",
  "oklch(0.72 0.19 145)",
  "oklch(0.68 0.2 30)",
  "oklch(0.65 0.23 350)",
  "oklch(0.7 0.14 200)",
]

const COUNTRY_IMAGES: Record<string, string> = {
  US: "/countries/usa.png",
  UK: "/countries/uk.png",
  GB: "/countries/uk.png",
  IN: "/countries/india.png",
  DE: "/countries/germany.png",
  FR: "/countries/france.png",
  BR: "/countries/brazil.png",
  IT: "/countries/italy.png",
  IR: "/countries/iran.png",
  JP: "/countries/japan.png",
  KR: "/countries/korea.png",
  ES: "/countries/spain.png",
  AE: "/countries/uae.png",
}

function countryImageFor(code: string): string {
  const upper = code.toUpperCase() === "UK" ? "GB" : code.toUpperCase()
  return COUNTRY_IMAGES[upper] || COUNTRY_IMAGES[code.toUpperCase()] || ""
}

function qualityValue(quality?: string): number {
  if (!quality) return 0
  if (/4k|2160/i.test(quality)) return 2160
  const match = quality.match(/(\d{3,4})p?/i)
  return match ? Number(match[1]) : 0
}

function qualityFromStreams(streams: IptvStream[]): IptvChannel["quality"] {
  const max = Math.max(...streams.map((stream) => qualityValue(stream.quality)), 0)
  if (max >= 2160) return "4K"
  if (max >= 720) return "HD"
  if (max > 0) return "SD"
  return "Unknown"
}

function isKnownUnavailableStream(stream: { status?: unknown; url?: unknown }): boolean {
  if (typeof stream.url !== "string" || !/^https?:\/\//i.test(stream.url)) return true
  if (typeof stream.status !== "string") return false
  return /^(?:offline|error|timeout|broken|unavailable)$/i.test(stream.status.trim())
}

function pruneUnavailableChannels() {
  const now = Date.now()
  for (const [slug, expiresAt] of reportedUnavailableChannels) {
    if (expiresAt <= now) reportedUnavailableChannels.delete(slug)
  }
}

function isReportedUnavailable(slug: string): boolean {
  return (reportedUnavailableChannels.get(slug.toLowerCase()) || 0) > Date.now()
}

export async function fetchIptvData(): Promise<IptvData> {
  pruneUnavailableChannels()
  // Check cache first
  if (cache && Date.now() - cache.lastUpdate < CACHE_TTL_MS) {
    return {
      channels: cache.channels,
      countries: cache.countries,
      categories: cache.categories,
      stats: cache.stats,
    }
  }

  // Several server components can ask for the same data during one render.
  // Share a single refresh so we don't repeatedly download the large source files.
  if (!inFlightRequest) {
    inFlightRequest = loadIptvData().finally(() => {
      inFlightRequest = null
    })
  }

  return inFlightRequest
}

function remember(data: IptvData): IptvData {
  cache = { ...data, lastUpdate: Date.now() }
  return data
}

async function loadIptvData(): Promise<IptvData> {
  try {
    const databaseData = await loadSupabaseCatalog()
    if (databaseData) return remember(databaseData)

    // Fallback: live iptv-org APIs when Supabase is not configured.
    const [channelsRes, streamsRes, countriesRes] = await Promise.all([
      fetch(`${IPTV_BASE}/channels.json`, { cache: "no-store", signal: AbortSignal.timeout(30_000) }),
      fetch(`${IPTV_BASE}/streams.json`, { cache: "no-store", signal: AbortSignal.timeout(30_000) }),
      fetch(`${IPTV_BASE}/countries.json`, { cache: "no-store", signal: AbortSignal.timeout(30_000) }),
    ])

    if (!channelsRes.ok || !streamsRes.ok || !countriesRes.ok) {
      throw new Error("Failed to fetch IPTV data")
    }

    const [channelsData, streamsData, countriesData] = await Promise.all([
      channelsRes.json(),
      streamsRes.json(),
      countriesRes.json(),
    ])

    // Keep every provider-published stream per channel. A working fallback is more useful
    // than silently losing alternatives when a source goes offline.
    const streamMap = new Map<string, IptvStream[]>()
    for (const s of streamsData) {
      if (s.channel && !isKnownUnavailableStream(s)) {
        const options = streamMap.get(s.channel) || []
        const option: IptvStream = {
          url: s.url,
          label: s.label || s.title || undefined,
          quality: s.quality || undefined,
          referrer: s.referrer || undefined,
        }
        if (!options.some((existing) => existing.url === option.url)) {
          options.push(option)
          streamMap.set(s.channel, options)
        }
      }
    }

    // Build country lookup
    const countryMetaMap = new Map<string, { name: string }>()
    for (const c of countriesData) {
      if (c.code && c.name) {
        countryMetaMap.set(c.code, {
          name: c.name,
        })
      }
    }
    // Accept both GB (ISO) and legacy UK lookups.
    if (countryMetaMap.has("GB") && !countryMetaMap.has("UK")) {
      countryMetaMap.set("UK", countryMetaMap.get("GB")!)
    }

    // Process channels - filter to popular countries only
    const processedChannels: IptvChannel[] = []
    const existingSlugs = new Set<string>()

    for (let i = 0; i < channelsData.length; i++) {
      const ch = channelsData[i]
      const rawCountry = ch.country && Array.isArray(ch.country) ? ch.country[0] : ch.country
      if (!rawCountry) continue
      // Normalize UK → GB (ISO 3166-1 / iptv-org).
      const code = String(rawCountry).toUpperCase() === "UK" ? "GB" : String(rawCountry).toUpperCase()
      if (!POPULAR_COUNTRY_CODES.has(code)) continue

      const categoryKey = ch.categories && Array.isArray(ch.categories) && ch.categories.length > 0
        ? ch.categories[0].toLowerCase()
        : "entertainment"
      const catMap = CATEGORY_MAP[categoryKey] || DEFAULT_CATEGORY

      const streams = streamMap.get(ch.id)
      if (!streams || streams.length === 0) continue // Only include channels with provider-published streams

      const baseSlug = ch.name
        ? ch.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        : ch.id

      // Ensure unique slugs by appending country code and counter if needed
      let slug = `${baseSlug}-${code.toLowerCase()}`
      let counter = 1
      while (existingSlugs.has(slug)) {
        counter++
        slug = `${baseSlug}-${code.toLowerCase()}-${counter}`
      }
      existingSlugs.add(slug)

      const quality = qualityFromStreams(streams)

      const channel: IptvChannel = {
        slug: slug || `ch-${i}`,
        name: ch.name || "Unknown Channel",
        logoColor: logoColors[i % logoColors.length],
        countrySlug: code.toLowerCase(),
        countryName: countryMetaMap.get(code)?.name || "Country not listed",
        categorySlug: catMap.slug,
        language: ch.languages && Array.isArray(ch.languages) && ch.languages.length > 0
          ? ch.languages[0]
          : "English",
        quality,
        image: catMap.image,
        description: `${ch.name || "Channel"} broadcasts live ${catMap.name.toLowerCase()} programming from ${countryMetaMap.get(code)?.name || "its country of origin"}.`,
        streamUrl: streams[0].url,
        streams,
      }

      processedChannels.push(channel)
    }

    const visibleChannels = processedChannels.filter((channel) => !isReportedUnavailable(channel.slug))
    const countryChannelMap = new Map<string, IptvChannel[]>()
    for (const channel of visibleChannels) {
      const channelList = countryChannelMap.get(channel.countrySlug) || []
      channelList.push(channel)
      countryChannelMap.set(channel.countrySlug, channelList)
    }

    // Build countries from channel data
    const processedCountries: IptvCountry[] = []
    for (const [code, chs] of countryChannelMap) {
      const meta = countryMetaMap.get(code.toUpperCase())
      if (!meta) continue

      const hdCount = chs.filter((c) => c.quality === "HD").length
      const uhdCount = chs.filter((c) => c.quality === "4K").length
      const langs = Array.from(new Set(chs.map((c) => c.language)))
      const pop = chs.length

      processedCountries.push({
        slug: code.toLowerCase(),
        name: meta.name,
        flag: getFlagEmoji(code),
        code: code.toUpperCase(),
        region: getRegion(code),
        image: countryImageFor(code),
        channels: chs.length,
        popularity: pop,
        hd: hdCount,
        uhd: uhdCount,
        languages: langs.length > 0 ? langs : ["English"],
      })
    }

    // The source does not publish viewership trends, so rank countries by the real size of their live directory.
    processedCountries.sort((a, b) => b.channels - a.channels || a.name.localeCompare(b.name))

    // Build categories from channel data
    const categoryMap = new Map<string, { cat: IptvCategory; count: number }>()
    for (const ch of visibleChannels) {
      const catKey = ch.categorySlug
      if (!categoryMap.has(catKey)) {
        const catData = Object.values(CATEGORY_MAP).find((c) => c.slug === catKey) || DEFAULT_CATEGORY
        categoryMap.set(catKey, {
          cat: {
            slug: catData.slug,
            name: catData.name,
            icon: catData.icon,
            channels: 0,
            color: catData.color,
            gradient: catData.gradient,
            image: catData.image,
          },
          count: 0,
        })
      }
      categoryMap.get(catKey)!.count++
    }

    const processedCategories = Array.from(categoryMap.values())
      .map(({ cat, count }) => ({ ...cat, channels: count }))
      .sort((a, b) => b.channels - a.channels)

    const stats: IptvStats = {
      channels: visibleChannels.length,
      countries: processedCountries.length,
      hd: visibleChannels.filter((c) => c.quality === "HD").length,
      uhd: visibleChannels.filter((c) => c.quality === "4K").length,
    }

    return remember({ channels: visibleChannels, countries: processedCountries, categories: processedCategories, stats })
  } catch (error) {
    console.error("IPTV data fetch error:", error)
    // Return cached data if available, otherwise throw
    if (cache) {
      return {
        channels: cache.channels,
        countries: cache.countries,
        categories: cache.categories,
        stats: cache.stats,
      }
    }
    throw error
  }
}

// Once configured, the viewer catalog comes from Supabase. RLS only permits
// anonymous reads of enabled countries and validated online channels.
async function loadSupabaseCatalog(): Promise<IptvData | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url.includes("your-project") || key.includes("your-anon-key")) return null

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const [{ data: countryRows, error: countryError }, { data: countryReport, error: reportError }, { data: categorySettings }] = await Promise.all([
    db.from("countries").select("name,code").eq("enabled", true).order("name"),
    db.from("country_availability_report").select("code,total_channels").eq("enabled", true).gte("total_channels", MINIMUM_CHANNELS_PER_COUNTRY),
    db.from("category_settings").select("category_id,enabled"),
  ])
  if (countryError || reportError) throw new Error(countryError?.message || reportError?.message || "Supabase catalog query failed")
  const visibleCountryCodes = new Set((countryReport || []).map((country) => country.code))
  if (!visibleCountryCodes.size) {
    return { channels: [], countries: [], categories: [], stats: { channels: 0, countries: 0, hd: 0, uhd: 0 } }
  }

  const disabledCategories = new Set(
    (categorySettings || []).filter((row) => row.enabled === false).map((row) => String(row.category_id).toLowerCase()),
  )

  const rows: Array<{ channel_id: string; name: string; country: string; country_code: string; category: string | null; language: string | null; logo: string | null; stream_url: string; response_time: number | null }> = []
  for (let start = 0; ; start += 1000) {
    const { data, error } = await db.from("channels")
      .select("channel_id,name,country,country_code,category,language,logo,stream_url,response_time")
      .eq("status", "online").in("country_code", [...visibleCountryCodes]).order("name").range(start, start + 999)
    if (error) throw new Error(`Supabase catalog query failed: ${error.message}`)
    rows.push(...(data || []))
    if (!data || data.length < 1000) break
  }

  const countriesByCode = new Map((countryRows || []).map((country) => [country.code, country.name]))
  const channels: IptvChannel[] = rows
    .filter((channel) => !disabledCategories.has((channel.category || "").toLowerCase()))
    .filter((channel) => !isReportedUnavailable(channel.channel_id.toLowerCase().replace(/[^a-z0-9]+/g, "-")))
    .map((channel, index) => {
      const category = CATEGORY_MAP[(channel.category || "").toLowerCase()] || DEFAULT_CATEGORY
      const code = channel.country_code.toUpperCase() === "UK" ? "GB" : channel.country_code.toUpperCase()
      return {
        slug: channel.channel_id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `channel-${index}`,
        name: channel.name,
        logoColor: logoColors[index % logoColors.length],
        countrySlug: code.toLowerCase(),
        countryName: channel.country || countriesByCode.get(channel.country_code) || code,
        categorySlug: category.slug,
        language: channel.language || "Unknown",
        quality: "Unknown" as const,
        image: category.image,
        description: `${channel.name} broadcasts live ${category.name.toLowerCase()} programming from ${channel.country || countriesByCode.get(channel.country_code) || code}.`,
        streamUrl: channel.stream_url,
        streams: [{ url: channel.stream_url }],
      }
    })
  const countries = (countryRows || []).filter((country) => visibleCountryCodes.has(country.code)).map((country) => {
    const code = country.code.toUpperCase() === "UK" ? "GB" : country.code.toUpperCase()
    const countryChannels = channels.filter((channel) => channel.countrySlug === code.toLowerCase() || channel.countrySlug === country.code.toLowerCase())
    return { slug: code.toLowerCase(), name: country.name, flag: getFlagEmoji(code), code, region: getRegion(code), image: countryImageFor(code), channels: countryChannels.length, popularity: countryChannels.length, hd: 0, uhd: 0, languages: Array.from(new Set(countryChannels.map((channel) => channel.language))) }
  })
  const categoryCounts = new Map<string, number>()
  for (const channel of channels) categoryCounts.set(channel.categorySlug, (categoryCounts.get(channel.categorySlug) || 0) + 1)
  const categories = Array.from(categoryCounts, ([slug, count]) => {
    const category = Object.values(CATEGORY_MAP).find((item) => item.slug === slug) || DEFAULT_CATEGORY
    return { slug, name: category.name, icon: category.icon, channels: count, color: category.color, gradient: category.gradient, image: category.image }
  }).sort((a, b) => b.channels - a.channels)
  return { channels, countries, categories, stats: { channels: channels.length, countries: countries.length, hd: 0, uhd: 0 } }
}

// Force refresh
export async function refreshIptvData(): Promise<void> {
  // Let an active refresh finish before starting an explicitly requested one.
  if (inFlightRequest) {
    await inFlightRequest.catch(() => undefined)
  }
  cache = null
  await fetchIptvData()
}

// The upstream API does not currently publish a live health field. When every
// provider-published source fails in the player, suppress that channel briefly
// and refresh from the source instead of continuing to advertise a dead stream.
export function reportChannelUnavailable(slug: string): void {
  if (!slug) return
  reportedUnavailableChannels.set(slug.toLowerCase(), Date.now() + UNAVAILABLE_CHANNEL_TTL_MS)
  cache = null
}

// Get last update time
export function getLastUpdateTime(): number | null {
  return cache?.lastUpdate ?? null
}

// Helpers
export async function getCountry(slug: string) {
  const { countries } = await fetchIptvData()
  return countries.find((c) => c.slug === slug.toLowerCase())
}

export async function getCategory(slug: string) {
  const { categories } = await fetchIptvData()
  return categories.find((c) => c.slug === slug.toLowerCase())
}

export async function getChannel(slug: string) {
  const { channels } = await fetchIptvData()
  return channels.find((c) => c.slug === slug.toLowerCase())
}

export async function channelsByCountry(slug: string) {
  const { channels } = await fetchIptvData()
  return channels.filter((c) => c.countrySlug === slug.toLowerCase())
}

export async function channelsByCategory(slug: string) {
  const { channels } = await fetchIptvData()
  return channels.filter((c) => c.categorySlug === slug.toLowerCase())
}

export async function featuredChannels() {
  const { channels } = await fetchIptvData()
  return channels.slice(0, 20)
}

export async function topCountries() {
  const { countries } = await fetchIptvData()
  return countries.slice(0, 12)
}

export async function searchChannels(query: string, limit = SEARCH_RESULT_LIMIT) {
  const q = query.trim().toLowerCase()
  const { channels, countries, categories } = await fetchIptvData()
  const safeLimit = Math.min(Math.max(limit, 1), SEARCH_RESULT_LIMIT)
  const countryNames = new Map(countries.map((country) => [country.slug, `${country.name} ${country.code}`.toLowerCase()]))
  const categoryNames = new Map(categories.map((category) => [category.slug, `${category.name} ${category.slug}`.toLowerCase()]))

  const matchedChannels = channels.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.language.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      countryNames.get(c.countrySlug)?.includes(q) ||
      categoryNames.get(c.categorySlug)?.includes(q),
  )

  const matchedCountries = countries.filter(
    (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q,
  )

  const matchedCategories = categories.filter((c) => c.name.toLowerCase().includes(q) || c.slug.includes(q))

  return {
    channels: matchedChannels.slice(0, safeLimit),
    countries: matchedCountries.slice(0, safeLimit),
    categories: matchedCategories.slice(0, safeLimit),
    totals: {
      channels: matchedChannels.length,
      countries: matchedCountries.length,
      categories: matchedCategories.length,
    },
    truncated: matchedChannels.length > safeLimit || matchedCountries.length > safeLimit || matchedCategories.length > safeLimit,
  }
}
