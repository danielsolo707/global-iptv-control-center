import type { IptvChannel, IptvCountry, IptvCategory, IptvStats } from "./types"

/*
 * Global IPTV Data Service
 * Fetches real free-to-air IPTV data from iptv-org APIs
 * Smart cache with TTL for automatic updates
 */

const IPTV_BASE = "https://iptv-org.github.io/api"
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// In-memory cache
let cache: {
  channels: IptvChannel[]
  countries: IptvCountry[]
  categories: IptvCategory[]
  stats: IptvStats
  lastUpdate: number
} | null = null

// Popular country codes (countries with significant free-to-air presence)
const POPULAR_COUNTRY_CODES = new Set([
  "US", "GB", "JP", "KR", "FR", "DE", "IN", "BR", "ES", "IT",
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
  const code = countryCode.toUpperCase()
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
    GB: "Europe", FR: "Europe", DE: "Europe", IT: "Europe", ES: "Europe",
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

const nowShows = [
  "Evening News Live", "Champions Match", "Prime Movie Night", "Morning Show",
  "Live Concert", "World Report", "Tech Today", "Cinema Classics",
  "Documentary Special", "Sports Highlights", "Weather Update", "Comedy Hour",
]
const nextShows = [
  "Weather Update", "Post-Match Analysis", "Late Night Film", "Talk Hour",
  "Music Countdown", "Global Briefing", "Startup Stories", "Documentary Hour",
  "Evening Drama", "News Roundup", "Travel Show", "Late Night Comedy",
]

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

export async function fetchIptvData(): Promise<{
  channels: IptvChannel[]
  countries: IptvCountry[]
  categories: IptvCategory[]
  stats: IptvStats
}> {
  // Check cache first
  if (cache && Date.now() - cache.lastUpdate < CACHE_TTL_MS) {
    return {
      channels: cache.channels,
      countries: cache.countries,
      categories: cache.categories,
      stats: cache.stats,
    }
  }

  try {
    // Fetch all IPTV data in parallel
    const [channelsRes, streamsRes, countriesRes] = await Promise.all([
      fetch(`${IPTV_BASE}/channels.json`, { next: { revalidate: 300 } }),
      fetch(`${IPTV_BASE}/streams.json`, { next: { revalidate: 300 } }),
      fetch(`${IPTV_BASE}/countries.json`, { next: { revalidate: 300 } }),
    ])

    if (!channelsRes.ok || !streamsRes.ok || !countriesRes.ok) {
      throw new Error("Failed to fetch IPTV data")
    }

    const [channelsData, streamsData, countriesData] = await Promise.all([
      channelsRes.json(),
      streamsRes.json(),
      countriesRes.json(),
    ])

    // Build stream lookup by channel ID
    const streamMap = new Map<string, string>()
    for (const s of streamsData) {
      if (s.channel && s.url) {
        streamMap.set(s.channel, s.url)
      }
    }

    // Build country lookup
    const countryMetaMap = new Map<string, { name: string; lat: number; lng: number }>()
    for (const c of countriesData) {
      if (c.code && c.name) {
        countryMetaMap.set(c.code, {
          name: c.name,
          lat: c.latitude ?? 0,
          lng: c.longitude ?? 0,
        })
      }
    }

    // Process channels - filter to popular countries only
    const countryChannelMap = new Map<string, IptvChannel[]>()
    const processedChannels: IptvChannel[] = []

    for (let i = 0; i < channelsData.length; i++) {
      const ch = channelsData[i]
      const countryCode = ch.country && Array.isArray(ch.country) ? ch.country[0] : ch.country
      if (!countryCode || !POPULAR_COUNTRY_CODES.has(countryCode.toUpperCase())) continue

      const categoryKey = ch.categories && Array.isArray(ch.categories) && ch.categories.length > 0
        ? ch.categories[0].toLowerCase()
        : "entertainment"
      const catMap = CATEGORY_MAP[categoryKey] || DEFAULT_CATEGORY

      const streamUrl = streamMap.get(ch.id)
      if (!streamUrl) continue // Only include channels with actual streams

      const slug = ch.name
        ? ch.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        : ch.id

      const seed = i + 1
      const channel: IptvChannel = {
        slug: slug || `ch-${i}`,
        name: ch.name || "Unknown Channel",
        logoColor: logoColors[i % logoColors.length],
        countrySlug: countryCode.toLowerCase(),
        categorySlug: catMap.slug,
        language: ch.languages && Array.isArray(ch.languages) && ch.languages.length > 0
          ? ch.languages[0]
          : "English",
        quality: ch.resolution?.includes("4K") || ch.resolution?.includes("2160")
          ? "4K"
          : ch.resolution?.includes("1080") || ch.resolution?.includes("720")
            ? "HD"
            : "SD",
        viewers: Math.floor(2000 + seededRandom(seed) * 48000),
        image: catMap.image,
        now: nowShows[Math.floor(seededRandom(seed * 7) * nowShows.length)],
        next: nextShows[Math.floor(seededRandom(seed * 13) * nextShows.length)],
        description: `${ch.name || "Channel"} broadcasts live ${catMap.name.toLowerCase()} programming from ${countryMetaMap.get(countryCode)?.name || countryCode}.`,
        trending: seededRandom(seed * 3) > 0.7,
        streamUrl,
      }

      processedChannels.push(channel)

      if (!countryChannelMap.has(countryCode.toLowerCase())) {
        countryChannelMap.set(countryCode.toLowerCase(), [])
      }
      countryChannelMap.get(countryCode.toLowerCase())!.push(channel)
    }

    // Build countries from channel data
    const processedCountries: IptvCountry[] = []
    for (const [code, chs] of countryChannelMap) {
      const meta = countryMetaMap.get(code.toUpperCase())
      if (!meta) continue

      const hdCount = chs.filter((c) => c.quality === "HD").length
      const uhdCount = chs.filter((c) => c.quality === "4K").length
      const langs = Array.from(new Set(chs.map((c) => c.language)))
      const pop = Math.min(98, Math.floor(50 + chs.length * 0.3 + seededRandom(code.charCodeAt(0)) * 30))

      processedCountries.push({
        slug: code.toLowerCase(),
        name: meta.name,
        flag: getFlagEmoji(code),
        code: code.toUpperCase(),
        region: getRegion(code),
        image: `/countries/${code.toLowerCase()}.png`,
        channels: chs.length,
        liveNow: Math.floor(chs.length * 0.3 + seededRandom(code.charCodeAt(0)) * chs.length * 0.4),
        popularity: pop,
        hd: hdCount,
        uhd: uhdCount,
        languages: langs.length > 0 ? langs : ["English"],
        lat: meta.lat,
        lng: meta.lng,
      })
    }

    // Sort countries by popularity and channel count
    processedCountries.sort((a, b) => b.popularity - a.popularity || b.channels - a.channels)

    // Build categories from channel data
    const categoryMap = new Map<string, { cat: IptvCategory; count: number }>()
    for (const ch of processedChannels) {
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
      channels: processedChannels.length,
      countries: processedCountries.length,
      hd: processedChannels.filter((c) => c.quality === "HD").length,
      uhd: processedChannels.filter((c) => c.quality === "4K").length,
    }

    // Update cache
    cache = {
      channels: processedChannels,
      countries: processedCountries,
      categories: processedCategories,
      stats,
      lastUpdate: Date.now(),
    }

    return { channels: processedChannels, countries: processedCountries, categories: processedCategories, stats }
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

// Force refresh
export async function refreshIptvData(): Promise<void> {
  cache = null
  await fetchIptvData()
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

export async function trendingChannels() {
  const { channels } = await fetchIptvData()
  return channels.filter((c) => c.trending).slice(0, 20)
}

export async function trendingCountries() {
  const { countries } = await fetchIptvData()
  return countries.slice(0, 12)
}

export async function searchChannels(query: string) {
  const q = query.toLowerCase()
  const { channels, countries, categories } = await fetchIptvData()

  const matchedChannels = channels.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.language.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q),
  )

  const matchedCountries = countries.filter(
    (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q,
  )

  const matchedCategories = categories.filter((c) => c.name.toLowerCase().includes(q))

  return { channels: matchedChannels, countries: matchedCountries, categories: matchedCategories }
}

export function programSchedule(seed = 0) {
  const titles = [
    "Morning Brief", "Live Talk", "Headline News", "Feature Film",
    "Sports Central", "World Today", "Music Hour", "Prime Time",
    "Late Edition", "Night Owl", "Morning Show", "Afternoon Live",
  ]
  return Array.from({ length: 12 }).map((_, i) => {
    const hour = (6 + i * 2) % 24
    return {
      time: `${hour.toString().padStart(2, "0")}:00`,
      title: titles[(i + seed) % titles.length],
      duration: "2h",
      live: i === 2 || i === 3,
    }
  })
}
