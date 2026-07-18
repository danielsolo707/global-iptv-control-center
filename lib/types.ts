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
  popularity: number
  hd: number
  uhd: number
  languages: string[]
}

export type IptvChannel = {
  slug: string
  name: string
  logoColor: string
  countrySlug: string
  countryName: string
  categorySlug: string
  language: string
  quality: "SD" | "HD" | "4K" | "Unknown"
  image: string
  description: string
  streamUrl?: string
  streams: IptvStream[]
}

export type IptvStream = {
  url: string
  label?: string
  quality?: string
  referrer?: string
}

export type IptvStats = {
  channels: number
  countries: number
  hd: number
  uhd: number
}
