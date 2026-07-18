import { authorizeAdminApi } from "@/lib/admin/auth"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const auth = await authorizeAdminApi("admin")
  if ("response" in auth) return auth.response
  const service = createSupabaseAdminClient()
  if (!service) return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required for invitations" }, { status: 503 })
  const body = await request.json()
  const email = String(body.email || "").trim().toLowerCase()
  const role = String(body.role || "viewer")
  if (!/^\S+@\S+\.\S+$/.test(email) || !["admin", "moderator", "viewer"].includes(role)) return Response.json({ error: "A valid email and role are required" }, { status: 400 })
  const { data, error } = await service.auth.admin.inviteUserByEmail(email)
  if (error || !data.user) return Response.json({ error: error?.message || "Invitation failed" }, { status: 400 })
  const { error: profileError } = await service.from("admin_users").upsert({ user_id: data.user.id, email, role }, { onConflict: "user_id" })
  if (profileError) return Response.json({ error: profileError.message }, { status: 400 })
  await auth.supabase.from("system_logs").insert({ type: "admin_action", message: `${auth.admin.email} invited ${email} as ${role}`, user_id: auth.admin.userId })
  return Response.json({ ok: true })
}
