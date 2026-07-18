import { NextResponse } from "next/server"
import { searchChannels } from "@/lib/iptv-service"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || ""

  if (!q || q.length < 2) {
    return NextResponse.json({
      channels: [],
      countries: [],
      categories: [],
      totals: { channels: 0, countries: 0, categories: 0 },
    })
  }

  try {
    const results = await searchChannels(q)
    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    )
  }
}
