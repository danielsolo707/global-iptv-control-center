import { NextResponse } from "next/server"
import { getOnlineChannels } from "@/lib/catalog"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  try {
    return NextResponse.json(await getOnlineChannels({
      country: searchParams.get("country"), category: searchParams.get("category"), language: searchParams.get("language"),
    }))
  } catch (error) {
    console.error("Channels API error:", error)
    return NextResponse.json({ error: "Unable to load channels" }, { status: 500 })
  }
}
