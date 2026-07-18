import type { IptvChannel, IptvCountry, IptvCategory, IptvStats, IptvScheduleItem } from "./types"
import { fetchIptvData, searchChannels, programSchedule as _programSchedule } from "./iptv-service"

// Server-side: call service directly
// Client-side: call API route
function isServer(): boolean {
  return typeof window === "undefined"
}

let clientCache: {
  channels: IptvChannel[]
  countries: IptvCountry[]
  categories: IptvCategory[]
  stats: IptvStats
  lastUpdate: number
} | null = null

function isClientCacheValid(): boolean {
  return clientCache !== null && Date.now() - clientCache.lastUpdate < 5 * 60 * 1000
}

async function fetchData(): Promise<{
  channels: IptvChannel[]
  countries: IptvCountry[]
  categories: IptvCategory[]
  stats: IptvStats
}> {
  // Server-side: use service directly
  if (isServer()) {
    return fetchIptvData()
  }

  // Client-side: use cache or API
  if (isClientCacheValid() && clientCache) {
    return {
      channels: clientCache.channels,
      countries: clientCache.countries,
      categories: clientCache.categories,
      stats: clientCache.stats,
    }
  }

  const res = await fetch("/api/iptv", { next: { revalidate: 300 } })
  if (!res.ok) throw new Error("Failed to fetch IPTV data")
  const data = await res.json()

  if (data.error) throw new Error(data.error)

  clientCache = {
    channels: data.channels,
    countries: data.countries,
    categories: data.categories,
    stats: data.stats,
    lastUpdate: Date.now(),
  }

  return {
    channels: data.channels,
    countries: data.countries,
    categories: data.categories,
    stats: data.stats,
  }
}

export async function getAllData() {
  return fetchData()
}

export async function getChannels(): Promise<IptvChannel[]> {
  const { channels } = await fetchData()
  return channels
}

export async function getCountries(): Promise<IptvCountry[]> {
  const { countries } = await fetchData()
  return countries
}

export async function getCategories(): Promise<IptvCategory[]> {
  const { categories } = await fetchData()
  return categories
}

export async function getStats(): Promise<IptvStats> {
  const { stats } = await fetchData()
  return stats
}

export async function getChannel(slug: string): Promise<IptvChannel | undefined> {
  const { channels } = await fetchData()
  return channels.find((c) => c.slug === slug)
}

export async function getCountry(slug: string): Promise<IptvCountry | undefined> {
  const { countries } = await fetchData()
  return countries.find((c) => c.slug === slug)
}

export async function getCategory(slug: string): Promise<IptvCategory | undefined> {
  const { categories } = await fetchData()
  return categories.find((c) => c.slug === slug)
}

export async function channelsByCountry(slug: string): Promise<IptvChannel[]> {
  const { channels } = await fetchData()
  return channels.filter((c) => c.countrySlug === slug)
}

export async function channelsByCategory(slug: string): Promise<IptvChannel[]> {
  const { channels } = await fetchData()
  return channels.filter((c) => c.categorySlug === slug)
}

export async function getTrendingChannels(): Promise<IptvChannel[]> {
  const { channels } = await fetchData()
  return channels.filter((c) => c.trending).slice(0, 20)
}

export async function getTrendingCountries(): Promise<IptvCountry[]> {
  const { countries } = await fetchData()
  return countries.slice(0, 12)
}

export async function searchIptv(query: string): Promise<{
  channels: IptvChannel[]
  countries: IptvCountry[]
  categories: IptvCategory[]
}> {
  if (!query || query.length < 2) {
    return { channels: [], countries: [], categories: [] }
  }

  // Server-side: use service directly
  if (isServer()) {
    return searchChannels(query)
  }

  const res = await fetch(`/api/iptv/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error("Search failed")
  return res.json()
}

export function getProgramSchedule(seed = 0): IptvScheduleItem[] {
  return _programSchedule(seed)
}
