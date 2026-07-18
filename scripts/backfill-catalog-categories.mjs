import { existsSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

const envFile = existsSync(".env.local") ? ".env.local" : ".env"
if (!existsSync(envFile)) throw new Error("Missing .env.local or .env")
process.loadEnvFile(envFile)

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const { data, error } = await db.from("channels").update({ category: "general" }).is("category", null).select("id")
if (error) throw error
console.log(`Categorized ${data?.length || 0} channels without a source category as general.`)
