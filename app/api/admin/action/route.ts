import { authorizeAdminApi } from "@/lib/admin/auth"
import { refreshIptvData } from "@/lib/iptv-service"
import type { AdminRole } from "@/lib/admin/types"

const adminOnly = new Set(["start-sync","force-sync","clear-cache","save-settings","remove-admin","toggle-country","toggle-category","delete-channel"])
const viewerActions = new Set(["read"])

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }) }
  const action = String(body.action || "")
  const minimum: AdminRole = adminOnly.has(action) ? "admin" : viewerActions.has(action) ? "viewer" : "moderator"
  const auth = await authorizeAdminApi(minimum)
  if ("response" in auth) return auth.response
  const { admin, supabase } = auth

  try {
    if (["start-sync","force-sync","clear-cache"].includes(action)) {
      const started = Date.now(); await refreshIptvData()
      await supabase.from("sync_runs").insert({ type: action, status: "completed", duration_ms: Date.now()-started, imported_channels: 0, updated_channels: 0, removed_channels: 0, started_by: admin.userId })
    } else if (["enable-channel","disable-channel"].includes(action)) {
      await supabase.from("admin_channels").upsert({ channel_id: String(body.id), status: action === "enable-channel" ? "online" : "disabled", updated_by: admin.userId }, { onConflict: "channel_id" })
    } else if (["bulk-enable","bulk-disable"].includes(action)) {
      const ids = Array.isArray(body.ids) ? body.ids.map(String) : []
      await supabase.from("admin_channels").upsert(ids.map((id)=>({ channel_id:id, status:action==="bulk-enable"?"online":"disabled", updated_by:admin.userId })), { onConflict:"channel_id" })
    } else if (action === "delete-channel") {
      await supabase.from("admin_channels").upsert({ channel_id:String(body.id), status:"removed", updated_by:admin.userId }, { onConflict:"channel_id" })
    } else if (action === "replace-url") {
      await supabase.from("admin_channels").upsert({ channel_id:String(body.id), metadata:{ stream_url:String(body.url||"") }, previous_urls:body.previousUrl?[String(body.previousUrl)]:[], updated_by:admin.userId }, { onConflict:"channel_id" })
    } else if (action === "toggle-country") {
      await supabase.from("country_settings").upsert({ country_id:String(body.id), enabled:Boolean(body.enabled), updated_by:admin.userId }, { onConflict:"country_id" })
    } else if (action === "toggle-category") {
      await supabase.from("category_settings").upsert({ category_id:String(body.id), enabled:Boolean(body.enabled), updated_by:admin.userId }, { onConflict:"category_id" })
    } else if (action === "save-settings") {
      const settings = typeof body.settings === "object" && body.settings ? body.settings : {}
      await supabase.from("system_settings").upsert({ id:"global", settings, updated_by:admin.userId })
    } else if (action === "remove-admin") {
      await supabase.from("admin_users").delete().eq("id",String(body.id))
    } else if (action !== "test-stream") {
      return Response.json({ error: "Unknown admin action" }, { status: 400 })
    }
    await supabase.from("system_logs").insert({ type:"admin_action", message:`${admin.email} performed ${action}`, user_id:admin.userId, metadata:body })
    return Response.json({ ok:true, action })
  } catch (error) {
    await supabase.from("system_logs").insert({ type:"error", message:`Admin action failed: ${action}`, user_id:admin.userId, metadata:{ error:error instanceof Error?error.message:"Unknown error" } })
    return Response.json({ error:error instanceof Error?error.message:"Action failed" }, { status:500 })
  }
}
