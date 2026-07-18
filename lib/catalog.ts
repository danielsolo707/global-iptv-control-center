import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { fetchIptvData } from "@/lib/iptv-service"

type ChannelFilters = { country?: string | null; category?: string | null; language?: string | null }

export type CatalogChannel = {
  id: string
  channelId: string
  name: string
  country: string
  countryCode: string
  category: string | null
  language: string | null
  logo: string | null
  url: string
  responseTime: number | null
}

export async function getOnlineChannels(filters: ChannelFilters = {}): Promise<CatalogChannel[]> {
  if (!isSupabaseConfigured()) {
    const { channels } = await fetchIptvData()
    return channels
      .filter((channel) => !filters.country || channel.countrySlug === filters.country.toLowerCase())
      .filter((channel) => !filters.category || channel.categorySlug === filters.category.toLowerCase())
      .filter((channel) => !filters.language || channel.language.toLowerCase() === filters.language.toLowerCase())
      .map((channel) => ({
        id: channel.slug, channelId: channel.slug, name: channel.name, country: channel.countryName,
        countryCode: channel.countrySlug.toUpperCase(), category: channel.categorySlug, language: channel.language,
        logo: null, url: channel.streamUrl || channel.streams[0]?.url || "", responseTime: null,
      }))
  }
  const db = await createSupabaseServerClient()
  if (!db) return []
  const { data: visibleCountries, error: countryError } = await db.from("country_availability_report")
    .select("code").eq("enabled", true).gte("total_channels", 10)
  if (countryError) throw new Error(`Country visibility query failed: ${countryError.message}`)
  const visibleCodes = (visibleCountries || []).map((country) => country.code)
  if (filters.country && !visibleCodes.includes(filters.country.toUpperCase())) return []
  if (!visibleCodes.length) return []
  let query = db.from("channels")
    .select("id,channel_id,name,country,country_code,category,language,logo,stream_url,response_time")
    .eq("status", "online").in("country_code", visibleCodes).order("name").limit(500)
  if (filters.country) query = query.eq("country_code", filters.country.toUpperCase())
  if (filters.category) query = query.eq("category", filters.category)
  if (filters.language) query = query.eq("language", filters.language)
  const { data, error } = await query
  if (error) throw new Error(`Catalog query failed: ${error.message}`)
  return (data || []).map((channel) => ({
    id: channel.id, channelId: channel.channel_id, name: channel.name, country: channel.country,
    countryCode: channel.country_code, category: channel.category, language: channel.language,
    logo: channel.logo, url: channel.stream_url, responseTime: channel.response_time,
  }))
}

export async function getCountries() {
  if (!isSupabaseConfigured()) {
    const { countries } = await fetchIptvData()
    return countries.map(({ name, code, channels }) => ({ name, code, channelCount: channels }))
  }
  const db = await createSupabaseServerClient()
  if (!db) return []
  const { data, error } = await db.from("country_availability_report").select("name,code,online_channels").eq("enabled", true).gte("total_channels", 10).order("name")
  if (error) throw new Error(`Country query failed: ${error.message}`)
  return (data || []).map((country) => ({ name: country.name, code: country.code, channelCount: country.online_channels }))
}

export async function getCatalogStatistics() {
  if (!isSupabaseConfigured()) {
    const { stats } = await fetchIptvData()
    return { totalChannels: stats.channels, onlineChannels: stats.channels, offlineChannels: 0, countriesCount: stats.countries }
  }
  const db = await createSupabaseServerClient()
  if (!db) return { totalChannels: 0, onlineChannels: 0, offlineChannels: 0, countriesCount: 0 }
  const { data, error } = await db.from("country_availability_report")
    .select("total_channels,online_channels,offline_channels").eq("enabled", true).gte("total_channels", 10)
  if (error) throw new Error(`Statistics query failed: ${error.message}`)
  return {
    totalChannels: (data || []).reduce((sum, country) => sum + Number(country.total_channels || 0), 0),
    onlineChannels: (data || []).reduce((sum, country) => sum + Number(country.online_channels || 0), 0),
    offlineChannels: (data || []).reduce((sum, country) => sum + Number(country.offline_channels || 0), 0),
    countriesCount: data?.length || 0,
  }
}
