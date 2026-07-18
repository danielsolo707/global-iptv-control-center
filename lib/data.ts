export type Category = {
  slug: string
  name: string
  icon: string
  channels: number
  color: string // css color var reference
  gradient: string
  image: string
}

export type Country = {
  slug: string
  name: string
  flag: string // emoji flag
  code: string
  region: string
  image: string
  channels: number
  liveNow: number
  popularity: number // 0-100
  hd: number
  uhd: number
  languages: string[]
  lat: number
  lng: number
}

export type Channel = {
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
}

export const categories: Category[] = [
  { slug: "sports", name: "Sports", icon: "Trophy", channels: 2345, color: "oklch(0.72 0.19 145)", gradient: "from-emerald-500/25 to-emerald-500/5", image: "/programs/sports.png" },
  { slug: "news", name: "News", icon: "Newspaper", channels: 2124, color: "oklch(0.65 0.19 255)", gradient: "from-blue-500/25 to-blue-500/5", image: "/programs/news-studio.png" },
  { slug: "movies", name: "Movies", icon: "Clapperboard", channels: 3457, color: "oklch(0.6 0.22 300)", gradient: "from-purple-500/25 to-purple-500/5", image: "/programs/movie.png" },
  { slug: "kids", name: "Kids", icon: "Baby", channels: 1234, color: "oklch(0.8 0.16 85)", gradient: "from-amber-400/25 to-amber-400/5", image: "/programs/kids.png" },
  { slug: "music", name: "Music", icon: "Music", channels: 1025, color: "oklch(0.65 0.23 350)", gradient: "from-pink-500/25 to-pink-500/5", image: "/programs/music.png" },
  { slug: "documentary", name: "Documentary", icon: "Clapperboard", channels: 1234, color: "oklch(0.7 0.14 200)", gradient: "from-cyan-500/25 to-cyan-500/5", image: "/programs/documentary.png" },
  { slug: "entertainment", name: "Entertainment", icon: "Sparkles", channels: 2890, color: "oklch(0.68 0.2 30)", gradient: "from-orange-500/25 to-orange-500/5", image: "/programs/movie.png" },
  { slug: "religion", name: "Religion", icon: "Sun", channels: 640, color: "oklch(0.78 0.15 95)", gradient: "from-yellow-500/25 to-yellow-500/5", image: "/programs/documentary.png" },
  { slug: "education", name: "Education", icon: "GraduationCap", channels: 812, color: "oklch(0.66 0.16 175)", gradient: "from-teal-500/25 to-teal-500/5", image: "/programs/news-studio.png" },
  { slug: "business", name: "Business", icon: "TrendingUp", channels: 534, color: "oklch(0.62 0.14 250)", gradient: "from-indigo-500/25 to-indigo-500/5", image: "/programs/news-studio.png" },
  { slug: "technology", name: "Technology", icon: "Cpu", channels: 418, color: "oklch(0.68 0.16 220)", gradient: "from-sky-500/25 to-sky-500/5", image: "/programs/documentary.png" },
]

export const countries: Country[] = [
  { slug: "usa", name: "United States", flag: "🇺🇸", code: "US", region: "Americas", image: "/countries/usa.png", channels: 1452, liveNow: 312, popularity: 98, hd: 820, uhd: 210, languages: ["English", "Spanish"], lat: 39, lng: -98 },
  { slug: "japan", name: "Japan", flag: "🇯🇵", code: "JP", region: "Asia", image: "/countries/japan.png", channels: 1123, liveNow: 254, popularity: 94, hd: 610, uhd: 180, languages: ["Japanese"], lat: 36, lng: 138 },
  { slug: "korea", name: "South Korea", flag: "🇰🇷", code: "KR", region: "Asia", image: "/countries/korea.png", channels: 887, liveNow: 176, popularity: 90, hd: 500, uhd: 140, languages: ["Korean"], lat: 36, lng: 128 },
  { slug: "uk", name: "United Kingdom", flag: "🇬🇧", code: "GB", region: "Europe", image: "/countries/uk.png", channels: 716, liveNow: 158, popularity: 88, hd: 420, uhd: 96, languages: ["English"], lat: 54, lng: -2 },
  { slug: "iran", name: "Iran", flag: "🇮🇷", code: "IR", region: "Middle East", image: "/countries/iran.png", channels: 184, liveNow: 73, popularity: 76, hd: 92, uhd: 18, languages: ["Persian"], lat: 32, lng: 53 },
  { slug: "france", name: "France", flag: "🇫🇷", code: "FR", region: "Europe", image: "/countries/france.png", channels: 602, liveNow: 141, popularity: 85, hd: 360, uhd: 88, languages: ["French"], lat: 46, lng: 2 },
  { slug: "germany", name: "Germany", flag: "🇩🇪", code: "DE", region: "Europe", image: "/countries/germany.png", channels: 512, liveNow: 128, popularity: 84, hd: 300, uhd: 74, languages: ["German"], lat: 51, lng: 10 },
  { slug: "india", name: "India", flag: "🇮🇳", code: "IN", region: "Asia", image: "/countries/india.png", channels: 395, liveNow: 112, popularity: 82, hd: 210, uhd: 40, languages: ["Hindi", "English"], lat: 22, lng: 79 },
  { slug: "brazil", name: "Brazil", flag: "🇧🇷", code: "BR", region: "Americas", image: "/countries/brazil.png", channels: 468, liveNow: 121, popularity: 80, hd: 250, uhd: 52, languages: ["Portuguese"], lat: -14, lng: -51 },
  { slug: "spain", name: "Spain", flag: "🇪🇸", code: "ES", region: "Europe", image: "/countries/spain.png", channels: 421, liveNow: 104, popularity: 79, hd: 240, uhd: 48, languages: ["Spanish"], lat: 40, lng: -4 },
  { slug: "italy", name: "Italy", flag: "🇮🇹", code: "IT", region: "Europe", image: "/countries/italy.png", channels: 389, liveNow: 96, popularity: 77, hd: 220, uhd: 44, languages: ["Italian"], lat: 42, lng: 12 },
  { slug: "uae", name: "United Arab Emirates", flag: "🇦🇪", code: "AE", region: "Middle East", image: "/countries/uae.png", channels: 276, liveNow: 84, popularity: 74, hd: 160, uhd: 60, languages: ["Arabic", "English"], lat: 24, lng: 54 },
]

const logoColors = [
  "oklch(0.65 0.19 255)",
  "oklch(0.6 0.22 300)",
  "oklch(0.72 0.19 145)",
  "oklch(0.68 0.2 30)",
  "oklch(0.65 0.23 350)",
  "oklch(0.7 0.14 200)",
]

const nowShows = ["Evening News Live", "Champions Match", "Prime Movie Night", "Morning Show", "Live Concert", "World Report", "Tech Today", "Cinema Classics"]
const nextShows = ["Weather Update", "Post-Match Analysis", "Late Night Film", "Talk Hour", "Music Countdown", "Global Briefing", "Startup Stories", "Documentary Hour"]

function makeChannel(name: string, countrySlug: string, categorySlug: string, i: number): Channel {
  const cat = categories.find((c) => c.slug === categorySlug)!
  const country = countries.find((c) => c.slug === countrySlug)!
  const qualities: Channel["quality"][] = ["HD", "4K", "HD", "SD", "4K", "HD"]
  return {
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    name,
    logoColor: logoColors[i % logoColors.length],
    countrySlug,
    categorySlug,
    language: country.languages[0],
    quality: qualities[i % qualities.length],
    viewers: 2000 + ((i * 971) % 48000),
    image: cat.image,
    now: nowShows[i % nowShows.length],
    next: nextShows[i % nextShows.length],
    description: `${name} broadcasts premium ${cat.name.toLowerCase()} programming live from ${country.name}, available free-to-air in ${country.languages[0]}.`,
    trending: i % 3 === 0,
  }
}

const channelSeeds: [string, string, string][] = [
  ["Global Sports One", "usa", "sports"],
  ["Prime News 24", "usa", "news"],
  ["Cinema Max", "usa", "movies"],
  ["Kids Wonder", "usa", "kids"],
  ["Nippon Live", "japan", "entertainment"],
  ["Tokyo Sports HD", "japan", "sports"],
  ["Anime World", "japan", "kids"],
  ["Seoul Music", "korea", "music"],
  ["K-Drama Plus", "korea", "movies"],
  ["Korea News Now", "korea", "news"],
  ["Britannia News", "uk", "news"],
  ["Premier Football", "uk", "sports"],
  ["London Docs", "uk", "documentary"],
  ["Persian Vision", "iran", "entertainment"],
  ["Tehran News", "iran", "news"],
  ["Iran Sports", "iran", "sports"],
  ["Paris Cinema", "france", "movies"],
  ["France Actu", "france", "news"],
  ["Berlin Eins", "germany", "entertainment"],
  ["Deutsch Sport", "germany", "sports"],
  ["Bollywood TV", "india", "movies"],
  ["India Today Live", "india", "news"],
  ["Rio Esporte", "brazil", "sports"],
  ["Globo Novela", "brazil", "entertainment"],
  ["Madrid Deportes", "spain", "sports"],
  ["Canal Cultura", "spain", "documentary"],
  ["Roma Uno", "italy", "entertainment"],
  ["Serie A Live", "italy", "sports"],
  ["Dubai One", "uae", "entertainment"],
  ["Gulf Business", "uae", "business"],
  ["World Music Live", "usa", "music"],
  ["Discovery Earth", "uk", "documentary"],
  ["Tech Frontier", "usa", "technology"],
  ["EduWorld", "france", "education"],
  ["Market Watch Live", "usa", "business"],
  ["Faith Channel", "usa", "religion"],
]

export const channels: Channel[] = channelSeeds.map(([n, co, ca], i) => makeChannel(n, co, ca, i))

export const stats = {
  channels: 18543,
  countries: 134,
  hd: 520,
  uhd: 138,
}

// helpers
export const getCountry = (slug: string) => countries.find((c) => c.slug === slug)
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug)
export const getChannel = (slug: string) => channels.find((c) => c.slug === slug)
export const channelsByCountry = (slug: string) => channels.filter((c) => c.countrySlug === slug)
export const channelsByCategory = (slug: string) => channels.filter((c) => c.categorySlug === slug)
export const trendingChannels = () => channels.filter((c) => c.trending)
export const trendingCountries = () => [...countries].sort((a, b) => b.popularity - a.popularity)

export function programSchedule(seed = 0) {
  const titles = ["Morning Brief", "Live Talk", "Headline News", "Feature Film", "Sports Central", "World Today", "Music Hour", "Prime Time", "Late Edition", "Night Owl"]
  return Array.from({ length: 10 }).map((_, i) => {
    const hour = (6 + i * 2) % 24
    return {
      time: `${hour.toString().padStart(2, "0")}:00`,
      title: titles[(i + seed) % titles.length],
      duration: "2h",
      live: i === 2,
    }
  })
}
