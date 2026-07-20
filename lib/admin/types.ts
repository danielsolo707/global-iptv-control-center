export type AdminRole = "admin" | "moderator" | "viewer"
export type ChannelAdminStatus = "online" | "offline" | "checking" | "blocked" | "removed" | "disabled"

export type AdminIdentity = {
  id: string
  userId: string
  email: string
  role: AdminRole
}

export type AdminChannel = {
  id: string
  slug: string
  name: string
  image: string
  country: string
  countrySlug: string
  category: string
  categorySlug: string
  language: string
  streamUrl: string
  status: ChannelAdminStatus
  lastChecked: string
  responseTime: number
  failures: number
  lastError?: string
}

export type AdminOverview = {
  channels: AdminChannel[]
  totals: {
    channels: number
    online: number
    offline: number
    blocked: number
    removed: number
    checking?: number
    countries: number
    activeCountries: number
  }
  lastSync: string
  lastStreamCheck: string
}
