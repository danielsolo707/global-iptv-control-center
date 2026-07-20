import { spawn } from "node:child_process"
import { authorizeAdminApi } from "@/lib/admin/auth"
import { validatePublicHttpUrl, UnsafeUrlError } from "@/lib/ssrf"
import { applyStreamCheck } from "@/lib/stream-health"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { refreshIptvData } from "@/lib/iptv-service"

export const runtime = "nodejs"

function probe(url: string) {
  return new Promise<{ codec: string; resolution: string; probeError: string | null }>((resolve) => {
    const path = process.env.FFPROBE_PATH
    if (!path) {
      resolve({ codec: "Not configured", resolution: "Unknown", probeError: "Set FFPROBE_PATH to enable codec validation" })
      return
    }
    const child = spawn(
      path,
      ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height", "-of", "json", url],
      { windowsHide: true },
    )
    let output = ""
    let error = ""
    const timer = setTimeout(() => child.kill(), 12_000)
    child.stdout.on("data", (chunk) => {
      output += chunk
    })
    child.stderr.on("data", (chunk) => {
      error += chunk
    })
    child.on("error", (event) => {
      clearTimeout(timer)
      resolve({ codec: "Unavailable", resolution: "Unknown", probeError: event.message })
    })
    child.on("close", () => {
      clearTimeout(timer)
      try {
        const parsed = JSON.parse(output) as { streams?: Array<{ codec_name?: string; width?: number; height?: number }> }
        const stream = parsed.streams?.[0]
        resolve({
          codec: stream?.codec_name?.toUpperCase() || "Unknown",
          resolution: stream?.width && stream?.height ? `${stream.width}x${stream.height}` : "Unknown",
          probeError: error || null,
        })
      } catch {
        resolve({ codec: "Unknown", resolution: "Unknown", probeError: error || "No video stream metadata returned" })
      }
    })
  })
}

export async function POST(request: Request) {
  const auth = await authorizeAdminApi("moderator")
  if ("response" in auth) return auth.response

  try {
    const body = await request.json()
    const url = await validatePublicHttpUrl(String(body.url || ""))
    const channelId = String(body.channelId || body.id || "unknown")

    const started = performance.now()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    let response: Response
    try {
      try {
        response = await fetch(url, {
          method: "HEAD",
          redirect: "error",
          signal: controller.signal,
          headers: { "User-Agent": "Global-IPTV-Admin/1.0" },
        })
      } catch {
        response = await fetch(url, {
          method: "GET",
          redirect: "error",
          signal: controller.signal,
          headers: { Range: "bytes=0-2047", "User-Agent": "Global-IPTV-Admin/1.0" },
        })
      }
    } finally {
      clearTimeout(timeout)
    }

    const latency = Math.round(performance.now() - started)
    const metadata = await probe(url.toString())
    // HTTP success is enough for online when FFprobe is not configured.
    // When FFprobe is configured, require a successful codec probe as well.
    const ffprobeRequired = Boolean(process.env.FFPROBE_PATH)
    const online = response.ok && (!ffprobeRequired || !metadata.probeError || metadata.codec !== "Unknown")

    const service = createSupabaseAdminClient()
    if (service && channelId !== "unknown") {
      const { data: current } = await service.from("channels").select("fail_count").eq("channel_id", channelId).maybeSingle()
      if (current) {
        const next = applyStreamCheck(current.fail_count ?? 0, online)
        await service
          .from("channels")
          .update({
            status: next.status,
            fail_count: next.failCount,
            last_checked: new Date().toISOString(),
            response_time: latency,
          })
          .eq("channel_id", channelId)
      }
      await service.from("stream_checks").insert({
        channel_id: channelId,
        status: online ? "online" : "offline",
        response_time_ms: latency,
        http_status: response.status,
        codec: metadata.codec,
        resolution: metadata.resolution,
        error_message: metadata.probeError,
      })
      await refreshIptvData().catch(() => undefined)
    } else {
      await auth.supabase.from("stream_checks").insert({
        channel_id: channelId,
        status: online ? "online" : "offline",
        response_time_ms: latency,
        http_status: response.status,
        codec: metadata.codec,
        resolution: metadata.resolution,
        error_message: metadata.probeError,
      })
    }

    return Response.json({
      status: online ? "ONLINE" : "OFFLINE",
      latency: `${latency}ms`,
      httpStatus: response.status,
      codec: metadata.codec,
      resolution: metadata.resolution,
      ffprobe: metadata.probeError ? "warning" : "validated",
    })
  } catch (error) {
    const message = error instanceof UnsafeUrlError || error instanceof Error ? error.message : "Stream test failed"
    return Response.json({ status: "OFFLINE", error: message }, { status: 400 })
  }
}
