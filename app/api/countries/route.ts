import { NextResponse } from "next/server"
import { getCountries } from "@/lib/catalog"

export async function GET() {
  try {
    return NextResponse.json(await getCountries())
  } catch (error) {
    console.error("Countries API error:", error)
    return NextResponse.json({ error: "Unable to load countries" }, { status: 500 })
  }
}
