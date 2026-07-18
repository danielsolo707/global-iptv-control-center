import { existsSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

const envFile = existsSync(".env.local") ? ".env.local" : ".env"
if (!existsSync(envFile)) throw new Error("Missing .env.local or .env")
process.loadEnvFile(envFile)

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const response = await fetch("https://iptv-org.github.io/api/countries.json")
if (!response.ok) throw new Error("Unable to download the IPTV country list")
const countries = (await response.json())
  .filter((country) => /^[A-Z]{2}$/.test(country.code || "") && country.name)
  .map((country) => ({ code: country.code, name: country.name, enabled: true }))

for (let start = 0; start < countries.length; start += 500) {
  const { error } = await db.from("countries").upsert(countries.slice(start, start + 500), { onConflict: "code" })
  if (error) throw error
}
console.log(`Enabled ${countries.length} countries from the IPTV source.`)
