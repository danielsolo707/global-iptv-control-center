import "server-only"
import { redirect } from "next/navigation"
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import type { AdminIdentity, AdminRole } from "@/lib/admin/types"

const rank: Record<AdminRole, number> = { viewer: 1, moderator: 2, admin: 3 }

export async function getCurrentAdmin(): Promise<AdminIdentity | null> {
  const supabase = await createSupabaseServerClient()
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("admin_users")
    .select("id,user_id,email,role")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!data) return null
  return { id: data.id, userId: data.user_id, email: data.email, role: data.role as AdminRole }
}

export async function requireAdminPage(minimumRole: AdminRole = "viewer") {
  if (!isSupabaseConfigured()) redirect("/admin/login?error=configuration")
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/admin/login")
  if (rank[admin.role] < rank[minimumRole]) redirect("/admin?error=forbidden")
  return admin
}

export async function authorizeAdminApi(minimumRole: AdminRole = "viewer") {
  const supabase = await createSupabaseServerClient()
  if (!supabase) return { response: Response.json({ error: "Supabase is not configured" }, { status: 503 }) }
  const admin = await getCurrentAdmin()
  if (!admin) return { response: Response.json({ error: "Authentication required" }, { status: 401 }) }
  if (rank[admin.role] < rank[minimumRole]) return { response: Response.json({ error: "Insufficient permissions" }, { status: 403 }) }
  return { admin, supabase }
}
