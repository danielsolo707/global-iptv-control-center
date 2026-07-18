import { existsSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

const envFile = existsSync(".env.local") ? ".env.local" : ".env"
if (!existsSync(envFile)) throw new Error("Create .env.local (or .env) from .env.example first.")
process.loadEnvFile(envFile)

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceRoleKey || url.includes("your-project") || serviceRoleKey.includes("your-service-role-key")) {
  throw new Error("Valid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY values are required.")
}

const db = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function ensureSchema() {
  const checks = await Promise.all([
    db.from("admin_users").select("user_id").limit(1),
    db.from("countries").select("code").limit(1),
    db.from("channels").select("id", { count: "exact", head: true }),
  ])
  const failed = checks.find((result) => result.error)
  if (failed?.error) {
    throw new Error(`Required schema is unavailable: ${failed.error.message}. Run migrations 001 and 002 in the Supabase SQL Editor.`)
  }
  return checks[2].count || 0
}

async function findUserByEmail(email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase())
    if (user) return user
    if (data.users.length < 1000) break
  }
  return null
}

async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required for --bootstrap-admin.")
  if (password.length < 8) throw new Error("The admin password must be at least 8 characters.")

  let user = await findUserByEmail(email)
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true })
    if (error) throw error
    user = data.user
  } else {
    const { data, error } = await db.auth.admin.updateUserById(user.id, { password, email_confirm: true })
    if (error) throw error
    user = data.user
  }
  if (!user) throw new Error("Supabase did not return an admin user.")
  const { error } = await db.from("admin_users").upsert({ user_id: user.id, email, role: "admin" }, { onConflict: "user_id" })
  if (error) throw error
  console.log("Supabase connection, schema, and admin account are ready.")
}

async function alignSourceCountryCodes() {
  const { data: legacyCountry, error } = await db.from("countries").select("code").eq("code", "GB").maybeSingle()
  if (error) throw error
  if (legacyCountry) {
    const { error: updateError } = await db.from("countries").update({ code: "UK" }).eq("code", "GB")
    if (updateError) throw updateError
    console.log("Aligned United Kingdom country code from GB to UK.")
  }
}

const channelCount = await ensureSchema()
if (process.argv.includes("--align-source-countries")) await alignSourceCountryCodes()
else if (process.argv.includes("--bootstrap-admin")) await bootstrapAdmin()
else if (process.argv.includes("--summary")) {
  const channels = []
  for (let start = 0; ; start += 1000) {
    const { data, error } = await db.from("channels").select("status").range(start, start + 999)
    if (error) throw error
    channels.push(...data)
    if (data.length < 1000) break
  }
  const { data: countries, error: countryError } = await db.from("country_availability_report").select("code,total_channels,online_channels,offline_channels").eq("enabled", true).order("code")
  if (countryError) throw countryError
  const statuses = Object.groupBy(channels, (channel) => channel.status)
  console.log(`Catalog rows: ${channelCount}`)
  console.log(`Status counts: ${Object.entries(statuses).map(([status, rows]) => `${status}=${rows.length}`).join(", ")}`)
  console.log(`Enabled-country rows: ${countries.map((country) => `${country.code}=${country.total_channels}`).join(", ")}`)
}
else console.log(`Supabase connection and schema are ready. Current catalog rows: ${channelCount}.`)
