export type IptvCategory = {
  slug: string
  name: string
  icon: string
  channels: number
  color: string
  gradient: string
  image: string
}

export type IptvCountry = {
  slug: string
  name: string
  flag: string
  code: string
  region: string
  image: string
  channels: number
  liveNow: number
  popularity: number
  hd: number
  uhd: number
  languages: string[]
  lat: number
  lng: number
}

export type IptvChannel = {
  slug: string
  name: string
  logoColor: string
  countrySlug: string
  categorySlug: string
  language: string
  quality: "SD" | "HD" | "4K"
  viewers: number
  image: string
  now: string
  next: string
  description: string
  trending?: boolean
  streamUrl?: string
}

export type IptvScheduleItem = {
  time: string
  title: string
  duration: string
  live: boolean
}

export type IptvStats = {
  channels: number
  countries: number
  hd: number
  uhd: number
}
