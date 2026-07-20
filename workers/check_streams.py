"""Validate catalog streams and write results to the DB as each check finishes.

Progressive writes mean channels become `online` on the public site while the
GitHub Action is still running — you do not need to wait for the full batch.
"""
from __future__ import annotations

import asyncio
import os
import subprocess
import time
from datetime import datetime, timezone

import httpx

from common import apply_stream_check, log_system, supabase_client

TIMEOUT = float(os.getenv("STREAM_TIMEOUT_SECONDS", "8"))
CONCURRENCY = int(os.getenv("STREAM_CHECK_CONCURRENCY", "40"))
LIMIT = int(os.getenv("STREAM_CHECK_LIMIT", "0"))
# Optional FFprobe. Leave unset for a fast HTTP pass so working channels
# appear on the site quickly during long GitHub Actions runs.
FFPROBE_PATH = os.getenv("FFPROBE_PATH", "").strip()
# Print a progress line every N completed checks.
PROGRESS_EVERY = int(os.getenv("STREAM_CHECK_PROGRESS_EVERY", "25"))
# Flush online highlights more often so operators see them appear live.
ONLINE_LOG_EVERY = int(os.getenv("STREAM_CHECK_ONLINE_LOG_EVERY", "5"))
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
    "application/x-mpeg",
    "text/plain",  # some CDNs serve m3u8 as text/plain
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
    url_l = (url or "").lower()
    # Known playlist/path shapes are accepted even when Content-Type is missing/odd.
    if any(token in url_l for token in (".m3u8", "m3u8", "/hls", "playlist", "index.m3u")):
        return True
    if not lowered:
        return True  # many live edges omit Content-Type; HTTP success is enough for first pass
    if "html" in lowered or "javascript" in lowered:
        return False
    return any(hint in lowered for hint in ACCEPTABLE_CONTENT_HINTS) or "m3u" in lowered


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
    """Persist one check immediately so the public site can pick it up mid-run."""
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
            # Fall through to direct update path.
            if "not found" not in str(error).lower() and result["channel_id"] != "__missing__":
                print(f"RPC apply_stream_check_result failed for {result['channel_id']}: {error}; falling back.")

    update = {
        "status": result["status"],
        "fail_count": result["fail_count"],
        "last_checked": now,
        "response_time": result["response_time"],
    }
    try:
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
    except Exception as error:  # noqa: BLE001
        print(f"persist failed for {result['channel_id']}: {error}")
    return result["status"]


def detect_rpc(db) -> bool:
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
        return True
    except Exception as error:  # noqa: BLE001
        message = str(error).lower()
        if "could not find" in message or "pgrst202" in message or "does not exist" in message:
            return False
        if "not found" in message:
            return True
        return False


async def main() -> None:
    db = supabase_client()
    started = time.perf_counter()
    write_lock = asyncio.Lock()

    # Prefer never-checked / checking first so new imports go live ASAP.
    query = (
        db.table("channels")
        .select("channel_id,stream_url,fail_count,status,last_checked")
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

    use_rpc = detect_rpc(db)
    print(
        f"Starting progressive stream check: {len(channels)} channels, "
        f"concurrency={CONCURRENCY}, timeout={TIMEOUT}s, ffprobe={bool(FFPROBE_PATH)}, atomic_rpc={use_rpc}"
    )
    print("Working channels are written to the database immediately as they pass.")

    online = offline = checking = blocked = done = 0
    semaphore = asyncio.Semaphore(CONCURRENCY)

    async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=False) as client:
        tasks = [asyncio.create_task(probe_channel(channel, client, semaphore)) for channel in channels]

        for task in asyncio.as_completed(tasks):
            result = await task
            # Persist right away — do not wait for the rest of the batch.
            async with write_lock:
                status = await asyncio.to_thread(persist_result, db, result, use_rpc)

            done += 1
            if status == "online":
                online += 1
                if online == 1 or online % ONLINE_LOG_EVERY == 0:
                    print(f"  ✓ online now: {online} (latest {result['channel_id']}) — visible on site after ~2 min cache")
            elif status == "offline":
                offline += 1
            elif status == "blocked":
                blocked += 1
            else:
                checking += 1

            if done % PROGRESS_EVERY == 0 or done == len(channels):
                elapsed = round(time.perf_counter() - started)
                print(
                    f"Progress {done}/{len(channels)} in {elapsed}s | "
                    f"online={online} checking={checking} offline={offline} blocked={blocked}"
                )

    duration_ms = round((time.perf_counter() - started) * 1000)
    summary = {
        "checked": len(channels),
        "online": online,
        "offline": offline,
        "checking": checking,
        "blocked": blocked,
        "ffprobe": bool(FFPROBE_PATH),
        "atomic_rpc": use_rpc,
        "progressive": True,
        "duration_ms": duration_ms,
    }
    print(
        f"Checked {len(channels)} streams in {duration_ms}ms "
        f"(online={online}, checking={checking}, offline={offline}, blocked={blocked}, "
        f"ffprobe={bool(FFPROBE_PATH)}, progressive=true)."
    )
    log_system(db, f"Stream check completed: {len(channels)} channels ({online} online)", "stream_check", summary)


if __name__ == "__main__":
    asyncio.run(main())
