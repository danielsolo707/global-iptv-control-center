import { NextResponse } from "next/server"
import { fetchIptvData, getLastUpdateTime } from "@/lib/iptv-service"

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
      { status: 500 },
    )
  }
}

// Cache refresh is an admin-only operation (see /api/admin/action clear-cache / start-sync).
// Public POST refresh was removed to prevent unauthenticated cache thrashing.
