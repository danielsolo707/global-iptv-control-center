import { NextResponse } from "next/server"
import { getCatalogStatistics } from "@/lib/catalog"

export async function GET() {
  try {
    return NextResponse.json(await getCatalogStatistics())
  } catch (error) {
    console.error("Statistics API error:", error)
    return NextResponse.json({ error: "Unable to load statistics" }, { status: 500 })
  }
}
