/**
 * Normalize country codes used across iptv-org (ISO 3166-1) and this app.
 * iptv-org publishes the United Kingdom as GB; older seeds used UK.
 */
export function normalizeCountryCode(code: string | null | undefined): string | null {
  if (!code) return null
  const upper = code.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(upper)) return null
  if (upper === "UK") return "GB"
  return upper
}

/** Build a lookup that accepts both UK and GB when either is enabled. */
export function countryAliasSet(enabledCodes: Iterable<string>): Set<string> {
  const set = new Set<string>()
  for (const code of enabledCodes) {
    const normalized = normalizeCountryCode(code)
    if (!normalized) continue
    set.add(normalized)
    if (normalized === "GB") {
      set.add("UK")
      set.add("GB")
    }
  }
  return set
}

/** Map an upstream code onto the code stored in our countries table. */
export function resolveStoredCountryCode(
  upstreamCode: string,
  enabledByCode: Map<string, string> | Record<string, string>,
): string | null {
  const map = enabledByCode instanceof Map ? enabledByCode : new Map(Object.entries(enabledByCode))
  const normalized = normalizeCountryCode(upstreamCode)
  if (!normalized) return null
  if (map.has(normalized)) return normalized
  if (normalized === "GB" && map.has("UK")) return "UK"
  if (normalized === "UK" && map.has("GB")) return "GB"
  return null
}
