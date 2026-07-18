"""Validate catalog streams using HTTP followed by ffprobe and persist history."""
import asyncio
import os
import subprocess
import time
from datetime import datetime, timezone

import httpx

from common import chunks, supabase_client

TIMEOUT = float(os.getenv("STREAM_TIMEOUT_SECONDS", "12"))
CONCURRENCY = int(os.getenv("STREAM_CHECK_CONCURRENCY", "20"))
LIMIT = int(os.getenv("STREAM_CHECK_LIMIT", "0"))


def ffprobe(url: str) -> tuple[bool, str | None]:
    binary = os.getenv("FFPROBE_PATH", "ffprobe")
    try:
        completed = subprocess.run(
            [binary, "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name", "-of", "default=nw=1:nk=1", url],
            capture_output=True, text=True, timeout=TIMEOUT + 5, check=False,
        )
        codec = completed.stdout.strip()
        return completed.returncode == 0 and bool(codec), codec or completed.stderr.strip()[:300]
    except (OSError, subprocess.TimeoutExpired) as error:
        return False, str(error)


async def check(channel: dict, client: httpx.AsyncClient, semaphore: asyncio.Semaphore) -> tuple[dict, dict]:
    started = time.perf_counter()
    error, http_status, codec = None, None, None
    async with semaphore:
        try:
            response = await client.get(channel["stream_url"], headers={"Range": "bytes=0-2048"})
            http_status = response.status_code
            content_type = response.headers.get("content-type", "")
            if not response.is_success or not any(value in content_type.lower() for value in ("mpegurl", "video", "octet-stream")):
                error = f"HTTP {http_status}; content-type={content_type or 'missing'}"
            else:
                valid, result = await asyncio.to_thread(ffprobe, channel["stream_url"])
                codec = result if valid else None
                error = None if valid else f"FFprobe: {result}"
        except httpx.HTTPError as exc:
            error = str(exc)[:300]
    elapsed = round((time.perf_counter() - started) * 1000)
    success = error is None
    failures = 0 if success else int(channel["fail_count"]) + 1
    status = "online" if success else ("blocked" if failures >= 10 else "offline" if failures >= 3 else "checking")
    now = datetime.now(timezone.utc).isoformat()
    update = {"status": status, "fail_count": failures, "last_checked": now, "response_time": elapsed}
    history = {"channel_id": channel["channel_id"], "status": status, "response_time_ms": elapsed, "http_status": http_status, "codec": codec, "error_message": error, "checked_at": now}
    return update, history


async def main() -> None:
    db = supabase_client()
    query = db.table("channels").select("channel_id,stream_url,fail_count").in_("status", ["online", "offline", "checking"]).order("last_checked", desc=False)
    if LIMIT > 0:
        query = query.limit(LIMIT)
    channels = query.execute().data
    semaphore = asyncio.Semaphore(CONCURRENCY)
    async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
        results = await asyncio.gather(*(check(channel, client, semaphore) for channel in channels))
    updates, history = zip(*results) if results else ([], [])
    # Use PATCH rather than an upsert: partial rows must never be treated as
    # new channels because the catalog has required metadata columns.
    for old, update in zip(channels, updates):
        db.table("channels").update(update).eq("channel_id", old["channel_id"]).execute()
    for batch in chunks(list(history)):
        db.table("stream_checks").insert(batch).execute()
    print(f"Checked {len(channels)} streams.")


if __name__ == "__main__":
    asyncio.run(main())
