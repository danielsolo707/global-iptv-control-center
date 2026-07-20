import { authorizeAdminApi } from "@/lib/admin/auth"
import { refreshIptvData } from "@/lib/iptv-service"
import { runCatalogSync } from "@/lib/catalog-sync"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type { AdminRole } from "@/lib/admin/types"
import { normalizeCountryCode } from "@/lib/country-codes"

const adminOnly = new Set([
  "start-sync",
  "force-sync",
  "clear-cache",
  "save-settings",
  "remove-admin",
  "delete-channel",
])
const viewerActions = new Set(["read"])

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const action = String(body.action || "")
  const minimum: AdminRole = adminOnly.has(action) ? "admin" : viewerActions.has(action) ? "viewer" : "moderator"
  const auth = await authorizeAdminApi(minimum)
  if ("response" in auth) return auth.response
  const { admin, supabase } = auth
  const service = createSupabaseAdminClient()

  try {
    if (action === "start-sync" || action === "force-sync") {
      const result = await runCatalogSync({ startedBy: admin.userId, type: action })
      return Response.json({ ok: true, action, ...result })
    }

    if (action === "clear-cache") {
      const started = Date.now()
      await refreshIptvData()
      await supabase.from("sync_runs").insert({
        type: action,
        status: "completed",
        duration_ms: Date.now() - started,
        imported_channels: 0,
        updated_channels: 0,
        removed_channels: 0,
        started_by: admin.userId,
      })
    } else if (action === "enable-channel" || action === "disable-channel") {
      const channelId = String(body.id || "")
      if (!channelId) return Response.json({ error: "Channel id is required" }, { status: 400 })
      const status = action === "enable-channel" ? "online" : "offline"
      // Prefer the persistent catalog table; keep admin_channels as a legacy override mirror.
      if (service) {
        const { error } = await service.from("channels").update({ status, fail_count: action === "enable-channel" ? 0 : 3 }).eq("channel_id", channelId)
        if (error && !/does not exist|schema cache/i.test(error.message)) throw error
      }
      await supabase.from("admin_channels").upsert(
        { channel_id: channelId, status: action === "enable-channel" ? "online" : "disabled", updated_by: admin.userId },
        { onConflict: "channel_id" },
      )
      await refreshIptvData().catch(() => undefined)
    } else if (action === "bulk-enable" || action === "bulk-disable") {
      const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : []
      if (!ids.length) return Response.json({ error: "No channel ids provided" }, { status: 400 })
      const status = action === "bulk-enable" ? "online" : "offline"
      if (service) {
        for (let i = 0; i < ids.length; i += 200) {
          const batch = ids.slice(i, i + 200)
          await service.from("channels").update({ status, fail_count: action === "bulk-enable" ? 0 : 3 }).in("channel_id", batch)
        }
      }
      await supabase.from("admin_channels").upsert(
        ids.map((id) => ({
          channel_id: id,
          status: action === "bulk-enable" ? "online" : "disabled",
          updated_by: admin.userId,
        })),
        { onConflict: "channel_id" },
      )
      await refreshIptvData().catch(() => undefined)
    } else if (action === "delete-channel") {
      const channelId = String(body.id || "")
      if (!channelId) return Response.json({ error: "Channel id is required" }, { status: 400 })
      // Soft-delete only — never hard-delete catalog rows.
      if (service) {
        await service.from("channels").update({ status: "removed" }).eq("channel_id", channelId)
      }
      await supabase.from("admin_channels").upsert(
        { channel_id: channelId, status: "removed", updated_by: admin.userId },
        { onConflict: "channel_id" },
      )
      await refreshIptvData().catch(() => undefined)
    } else if (action === "replace-url") {
      const channelId = String(body.id || "")
      const url = String(body.url || "").trim()
      if (!channelId || !/^https?:\/\//i.test(url)) {
        return Response.json({ error: "A channel id and http(s) URL are required" }, { status: 400 })
      }
      if (service) {
        await service
          .from("channels")
          .update({ stream_url: url, status: "checking", fail_count: 0 })
          .eq("channel_id", channelId)
      }
      await supabase.from("admin_channels").upsert(
        {
          channel_id: channelId,
          metadata: { stream_url: url },
          previous_urls: body.previousUrl ? [String(body.previousUrl)] : [],
          updated_by: admin.userId,
        },
        { onConflict: "channel_id" },
      )
      await refreshIptvData().catch(() => undefined)
    } else if (action === "toggle-country") {
      const rawId = String(body.id || "")
      const code = normalizeCountryCode(rawId) || rawId.toUpperCase()
      if (!/^[A-Z]{2}$/.test(code)) return Response.json({ error: "Invalid country code" }, { status: 400 })
      const enabled = Boolean(body.enabled)
      // Source of truth for workers + public catalog.
      if (service) {
        const { error } = await service.from("countries").update({ enabled }).eq("code", code)
        if (error) throw error
      }
      await supabase.from("country_settings").upsert(
        { country_id: code.toLowerCase(), enabled, updated_by: admin.userId },
        { onConflict: "country_id" },
      )
      await refreshIptvData().catch(() => undefined)
    } else if (action === "toggle-category") {
      const categoryId = String(body.id || "").toLowerCase()
      if (!categoryId) return Response.json({ error: "Category id is required" }, { status: 400 })
      await supabase.from("category_settings").upsert(
        {
          category_id: categoryId,
          name: typeof body.name === "string" ? body.name : categoryId,
          enabled: Boolean(body.enabled),
          updated_by: admin.userId,
        },
        { onConflict: "category_id" },
      )
      await refreshIptvData().catch(() => undefined)
    } else if (action === "save-settings") {
      const settings = typeof body.settings === "object" && body.settings ? body.settings : {}
      await supabase.from("system_settings").upsert({ id: "global", settings, updated_by: admin.userId })
    } else if (action === "remove-admin") {
      const id = String(body.id || "")
      if (!id) return Response.json({ error: "Admin id is required" }, { status: 400 })
      if (id === admin.id) return Response.json({ error: "You cannot remove your own admin account" }, { status: 400 })
      await supabase.from("admin_users").delete().eq("id", id)
    } else if (action !== "test-stream") {
      return Response.json({ error: "Unknown admin action" }, { status: 400 })
    }

    await supabase.from("system_logs").insert({
      type: "admin_action",
      message: `${admin.email} performed ${action}`,
      user_id: admin.userId,
      metadata: body,
    })
    return Response.json({ ok: true, action })
  } catch (error) {
    await supabase.from("system_logs").insert({
      type: "error",
      message: `Admin action failed: ${action}`,
      user_id: admin.userId,
      metadata: { error: error instanceof Error ? error.message : "Unknown error" },
    })
    return Response.json({ error: error instanceof Error ? error.message : "Action failed" }, { status: 500 })
  }
}
