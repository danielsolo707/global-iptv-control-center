"""Validate catalog streams using HTTP (and optional FFprobe) and persist history."""
from __future__ import annotations

import asyncio
import os
import subprocess
import time
from datetime import datetime, timezone

import httpx

from common import apply_stream_check, chunks, log_system, supabase_client

TIMEOUT = float(os.getenv("STREAM_TIMEOUT_SECONDS", "12"))
CONCURRENCY = int(os.getenv("STREAM_CHECK_CONCURRENCY", "20"))
LIMIT = int(os.getenv("STREAM_CHECK_LIMIT", "0"))
# Optional: only run FFprobe when explicitly configured (matches product spec).
FFPROBE_PATH = os.getenv("FFPROBE_PATH", "").strip()
# Include blocked channels so a healthy check can restore them to online.
PROBE_STATUSES = ["online", "offline", "checking", "blocked"]
ACCEPTABLE_CONTENT_HINTS = (
    "mpegurl",
    "x-mpegurl",
    "vnd.apple.mpegurl",
    "video",
    "octet-stream",
    "application/octet-stream",
    "binary",
    "audio",
)


def ffprobe(url: str) -> tuple[bool, str | None]:
    if not FFPROBE_PATH:
        return True, None
    try:
        completed = subprocess.run(
            [
                FFPROBE_PATH,
                "-v",
                "error",
                "-select_streams",
                "v:0",
                "-show_entries",
                "stream=codec_name",
                "-of",
                "default=nw=1:nk=1",
                url,
            ],
            capture_output=True,
            text=True,
            timeout=TIMEOUT + 5,
            check=False,
        )
        codec = completed.stdout.strip()
        if completed.returncode == 0 and codec:
            return True, codec
        return False, (codec or completed.stderr.strip() or "no video stream")[:300]
    except (OSError, subprocess.TimeoutExpired) as error:
        return False, str(error)[:300]


def content_type_ok(content_type: str, url: str) -> bool:
    lowered = (content_type or "").lower()
    if not lowered:
        # Many CDN edges omit Content-Type for m3u8; accept known path shapes.
        return ".m3u8" in url.lower() or "m3u8" in url.lower()
    return any(hint in lowered for hint in ACCEPTABLE_CONTENT_HINTS) or "m3u8" in lowered


async def probe_channel(channel: dict, client: httpx.AsyncClient, semaphore: asyncio.Semaphore) -> dict:
    started = time.perf_counter()
    error: str | None = None
    http_status: int | None = None
    codec: str | None = None

    async with semaphore:
        try:
            response = await client.get(
                channel["stream_url"],
                headers={"Range": "bytes=0-2048", "User-Agent": "Global-IPTV-StreamCheck/3.0"},
            )
            http_status = response.status_code
            content_type = response.headers.get("content-type", "")
            if not response.is_success:
                error = f"HTTP {http_status}; content-type={content_type or 'missing'}"
            elif not content_type_ok(content_type, channel["stream_url"]):
                error = f"HTTP {http_status}; content-type={content_type or 'missing'}"
            elif FFPROBE_PATH:
                valid, result = await asyncio.to_thread(ffprobe, channel["stream_url"])
                codec = result if valid else None
                error = None if valid else f"FFprobe: {result}"
            else:
                error = None
        except httpx.HTTPError as exc:
            error = str(exc)[:300]

    elapsed = round((time.perf_counter() - started) * 1000)
    success = error is None
    status, failures = apply_stream_check(channel.get("fail_count"), success)
    return {
        "channel_id": channel["channel_id"],
        "success": success,
        "status": status,
        "fail_count": failures,
        "response_time": elapsed,
        "http_status": http_status,
        "codec": codec,
        "error": error,
        "expected_fail_count": int(channel.get("fail_count") or 0),
    }


def persist_result(db, result: dict, use_rpc: bool) -> str:
    """Persist one check. Prefer the atomic SQL helper when migration 003 is applied."""
    now = datetime.now(timezone.utc).isoformat()
    if use_rpc:
        try:
            response = db.rpc(
                "apply_stream_check_result",
                {
                    "p_channel_id": result["channel_id"],
                    "p_success": result["success"],
                    "p_response_time": result["response_time"],
                    "p_http_status": result["http_status"],
                    "p_codec": result["codec"],
                    "p_resolution": None,
                    "p_error_message": result["error"],
                },
            ).execute()
            row = response.data
            if isinstance(row, list) and row:
                return row[0].get("status") or result["status"]
            if isinstance(row, dict):
                return row.get("status") or result["status"]
            return result["status"]
        except Exception as error:  # noqa: BLE001
            print(f"RPC apply_stream_check_result failed for {result['channel_id']}: {error}; falling back.")

    # Fallback path with optimistic concurrency on fail_count.
    update = {
        "status": result["status"],
        "fail_count": result["fail_count"],
        "last_checked": now,
        "response_time": result["response_time"],
    }
    matched = (
        db.table("channels")
        .update(update)
        .eq("channel_id", result["channel_id"])
        .eq("fail_count", result["expected_fail_count"])
        .execute()
    )
    if not matched.data:
        latest = (
            db.table("channels")
            .select("fail_count")
            .eq("channel_id", result["channel_id"])
            .limit(1)
            .execute()
            .data
        )
        if latest:
            status, failures = apply_stream_check(latest[0].get("fail_count"), result["success"])
            update = {**update, "status": status, "fail_count": failures}
            db.table("channels").update(update).eq("channel_id", result["channel_id"]).execute()
            result["status"] = status
            result["fail_count"] = failures

    db.table("stream_checks").insert(
        {
            "channel_id": result["channel_id"],
            "status": result["status"],
            "response_time_ms": result["response_time"],
            "http_status": result["http_status"],
            "codec": result["codec"],
            "error_message": result["error"],
            "checked_at": now,
        }
    ).execute()
    return result["status"]


async def main() -> None:
    db = supabase_client()
    started = time.perf_counter()

    query = (
        db.table("channels")
        .select("channel_id,stream_url,fail_count,status")
        .in_("status", PROBE_STATUSES)
        .order("last_checked", desc=False)
    )
    if LIMIT > 0:
        query = query.limit(LIMIT)

    channels = query.execute().data or []
    if not channels:
        print("No channels to check.")
        log_system(db, "Stream check completed: 0 channels", "stream_check", {"checked": 0})
        return

    # Detect whether migration 003's atomic helper is available.
    use_rpc = True
    try:
        db.rpc(
            "apply_stream_check_result",
            {
                "p_channel_id": "__missing__",
                "p_success": True,
                "p_response_time": 0,
                "p_http_status": None,
                "p_codec": None,
                "p_resolution": None,
                "p_error_message": None,
            },
        ).execute()
    except Exception as error:  # noqa: BLE001
        message = str(error).lower()
        if "could not find" in message or "pgrst202" in message or "does not exist" in message:
            use_rpc = False
        # Channel-not-found means the function exists.
        elif "not found" in message:
            use_rpc = True
        else:
            use_rpc = False

    semaphore = asyncio.Semaphore(CONCURRENCY)
    # Redirects disabled: a 302 to an internal host is an SSRF risk.
    async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=False) as client:
        results = await asyncio.gather(*(probe_channel(channel, client, semaphore) for channel in channels))

    online = offline = checking = blocked = 0
    for result in results:
        status = persist_result(db, result, use_rpc=use_rpc)
        if status == "online":
            online += 1
        elif status == "offline":
            offline += 1
        elif status == "blocked":
            blocked += 1
        else:
            checking += 1

    duration_ms = round((time.perf_counter() - started) * 1000)
    summary = {
        "checked": len(channels),
        "online": online,
        "offline": offline,
        "checking": checking,
        "blocked": blocked,
        "ffprobe": bool(FFPROBE_PATH),
        "atomic_rpc": use_rpc,
        "duration_ms": duration_ms,
    }
    print(
        f"Checked {len(channels)} streams in {duration_ms}ms "
        f"(online={online}, checking={checking}, offline={offline}, blocked={blocked}, "
        f"ffprobe={bool(FFPROBE_PATH)}, atomic_rpc={use_rpc})."
    )
    log_system(db, f"Stream check completed: {len(channels)} channels", "stream_check", summary)


if __name__ == "__main__":
    asyncio.run(main())
