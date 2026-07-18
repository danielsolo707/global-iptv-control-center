import { NextResponse } from "next/server"
import { fetchIptvData, refreshIptvData, getLastUpdateTime } from "@/lib/iptv-service"

export async function GET() {
  try {
    const data = await fetchIptvData()
    return NextResponse.json({
      ...data,
      lastUpdate: getLastUpdateTime(),
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch IPTV data" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    await refreshIptvData()
    const data = await fetchIptvData()
    return NextResponse.json({
      ...data,
      lastUpdate: getLastUpdateTime(),
      refreshed: true,
    })
  } catch (error) {
    console.error("Refresh error:", error)
    return NextResponse.json(
      { error: "Failed to refresh IPTV data" },
      { status: 500 }
    )
  }
}
