import { NextResponse } from "next/server"
import { reportChannelUnavailable } from "@/lib/iptv-service"

export async function POST(request: Request) {
  try {
    const body = await request.json() as { slug?: unknown }
    if (typeof body.slug !== "string" || !body.slug.trim()) {
      return NextResponse.json({ error: "A channel slug is required" }, { status: 400 })
    }

    reportChannelUnavailable(body.slug)
    return NextResponse.json({ reported: true })
  } catch {
    return NextResponse.json({ error: "Invalid health report" }, { status: 400 })
  }
}
