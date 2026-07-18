// Re-export types from the new centralized types file
export type { IptvChannel as Channel, IptvCountry as Country, IptvCategory as Category, IptvStats as Stats } from "./types"

// Backward-compatible re-exports for existing components
// These will be replaced by real data from the API at runtime
export { programSchedule } from "./iptv-service"
