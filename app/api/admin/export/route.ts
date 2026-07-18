import { authorizeAdminApi } from "@/lib/admin/auth"
import { getAdminOverview } from "@/lib/admin/data"

function csv(value: unknown) { return `"${String(value ?? "").replaceAll('"','""')}"` }
export async function GET() {
  const auth = await authorizeAdminApi("viewer"); if ("response" in auth) return auth.response
  const data = await getAdminOverview(); const headers=["id","name","country","category","language","stream_url","status","last_checked","response_time_ms"]
  const rows=data.channels.map(channel=>[channel.id,channel.name,channel.country,channel.category,channel.language,channel.streamUrl,channel.status,channel.lastChecked,channel.responseTime].map(csv).join(","))
  return new Response([headers.join(","),...rows].join("\n"),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="global-iptv-channels-${new Date().toISOString().slice(0,10)}.csv"`}})
}
