/** Canonical public category slugs used by the viewer and admin UI. */
export const PUBLIC_CATEGORY_SLUGS = [
  "sports",
  "news",
  "movies",
  "kids",
  "music",
  "documentary",
  "entertainment",
  "religion",
  "education",
  "business",
  "technology",
] as const

export type PublicCategorySlug = (typeof PUBLIC_CATEGORY_SLUGS)[number]

const CATEGORY_ALIASES: Record<string, PublicCategorySlug> = {
  sports: "sports",
  news: "news",
  movies: "movies",
  kids: "kids",
  music: "music",
  documentary: "documentary",
  entertainment: "entertainment",
  religion: "religion",
  education: "education",
  business: "business",
  technology: "technology",
  general: "entertainment",
  culture: "documentary",
  science: "technology",
  lifestyle: "entertainment",
  travel: "documentary",
  comedy: "entertainment",
  drama: "movies",
  family: "kids",
  animation: "kids",
  classic: "movies",
  outdoor: "sports",
  shop: "business",
  shopping: "business",
  weather: "news",
  legislative: "news",
  auto: "sports",
  cooking: "entertainment",
  series: "movies",
  relax: "entertainment",
  interactive: "entertainment",
}

export function normalizeCategory(raw: string | null | undefined): PublicCategorySlug {
  const key = (raw || "general").trim().toLowerCase()
  if (!key) return "entertainment"
  if (CATEGORY_ALIASES[key]) return CATEGORY_ALIASES[key]
  if ((PUBLIC_CATEGORY_SLUGS as readonly string[]).includes(key)) return key as PublicCategorySlug
  return "entertainment"
}
