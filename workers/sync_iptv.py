"""Synchronize iptv-org's M3U directory into the enabled-country catalog."""
from __future__ import annotations

import asyncio
import re
from datetime import datetime, timezone

import httpx

from common import (
    chunks,
    log_system,
    normalize_category,
    resolve_stored_country_code,
    supabase_client,
)

M3U_URL = "https://iptv-org.github.io/iptv/index.m3u"
CHANNELS_URL = "https://iptv-org.github.io/api/channels.json"
ATTR = re.compile(r'([\w-]+)="([^"]*)"')


def parse_m3u(document: str, metadata: dict[str, dict]) -> list[dict]:
    entries: list[dict] = []
    pending = None
    for line in document.splitlines():
        line = line.strip()
        if line.startswith("#EXTINF:"):
            attrs = dict(ATTR.findall(line))
            pending = {"attrs": attrs, "name": line.rsplit(",", 1)[-1].strip()}
        elif pending and line and not line.startswith("#"):
            channel_id = pending["attrs"].get("tvg-id", "")
            base_id = re.sub(r"@[A-Za-z0-9]+$", "", channel_id)
            source = metadata.get(channel_id) or metadata.get(base_id) or {}
            raw_countries = source.get("country")
            if isinstance(raw_countries, list):
                raw_country = raw_countries[0] if raw_countries else None
            else:
                raw_country = raw_countries
            country_code = (raw_country or "").upper() if raw_country else None
            if channel_id and country_code:
                categories = source.get("categories")
                if isinstance(categories, list):
                    raw_category = categories[0] if categories else "general"
                else:
                    raw_category = categories or "general"
                languages = source.get("languages")
                if isinstance(languages, list):
                    language = languages[0] if languages else None
                else:
                    language = languages
                # Prefer ISO language name/code string; keep first token only.
                if isinstance(language, str):
                    language = language.strip() or None
                entries.append(
                    {
                        "channel_id": channel_id,
                        "name": source.get("name") or pending["name"],
                        "country_code": country_code,
                        "category": normalize_category(str(raw_category) if raw_category is not None else None),
                        "language": language,
                        "logo": pending["attrs"].get("tvg-logo") or source.get("logo"),
                        "stream_url": line,
                    }
                )
            pending = None
    return entries


async def main() -> None:
    db = supabase_client()
    started = datetime.now(timezone.utc)
    enabled = db.table("countries").select("code,name").eq("enabled", True).execute().data or []
    countries = {item["code"]: item["name"] for item in enabled}
    if not countries:
        print("No enabled countries; nothing to synchronize.")
        log_system(db, "Catalog sync skipped: no enabled countries", "sync", {"imported": 0})
        return

    async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
        m3u_response, metadata_response = await asyncio.gather(
            client.get(M3U_URL),
            client.get(CHANNELS_URL),
        )
        m3u_response.raise_for_status()
        metadata_response.raise_for_status()

    metadata = {channel["id"]: channel for channel in metadata_response.json() if channel.get("id")}
    source_rows = parse_m3u(m3u_response.text, metadata)
    now = datetime.now(timezone.utc).isoformat()
    rows_by_id: dict[str, dict] = {}

    for row in source_rows:
        stored_code = resolve_stored_country_code(row["country_code"], countries)
        if not stored_code:
            continue
        row = {
            **row,
            "country_code": stored_code,
            "country": countries[stored_code],
            "last_sync": now,
            "status": "checking",
        }
        rows_by_id[row["channel_id"]] = row

    existing = (
        db.table("channels")
        .select("channel_id,stream_url,status,fail_count")
        .in_("country_code", list(countries))
        .execute()
        .data
        or []
    )
    existing_by_id = {row["channel_id"]: row for row in existing}
    existing_ids = set(existing_by_id)
    imported = updated = restored = 0

    for channel_id, row in rows_by_id.items():
        old = existing_by_id.get(channel_id)
        if not old:
            imported += 1
            row["fail_count"] = 0
            continue

        updated += 1
        was_removed = old.get("status") == "removed"
        if was_removed:
            restored += 1

        if old.get("stream_url") == row["stream_url"]:
            # Critical fix: never keep status=removed for channels present upstream.
            if was_removed:
                row["status"] = "checking"
                row["fail_count"] = 0
            else:
                # Preserve health status + fail counter for unchanged stream URLs.
                row["status"] = old.get("status") or "checking"
                if "fail_count" in old and old["fail_count"] is not None:
                    row["fail_count"] = old["fail_count"]
        else:
            # URL changed — force re-validation from a clean slate.
            row["status"] = "checking"
            row["fail_count"] = 0

    for batch in chunks(list(rows_by_id.values())):
        db.table("channels").upsert(batch, on_conflict="channel_id").execute()

    missing_ids = list(existing_ids - set(rows_by_id))
    for batch in chunks(missing_ids, 200):
        db.table("channels").update({"status": "removed", "last_sync": now}).in_("channel_id", batch).execute()

    duration_ms = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
    try:
        db.table("sync_runs").insert(
            {
                "type": "daily-sync",
                "status": "completed",
                "duration_ms": duration_ms,
                "imported_channels": imported,
                "updated_channels": updated,
                "removed_channels": len(missing_ids),
            }
        ).execute()
    except Exception as error:  # noqa: BLE001
        print(f"sync_runs insert failed: {error}")

    summary = {
        "total": len(rows_by_id),
        "imported": imported,
        "updated": updated,
        "restored": restored,
        "removed": len(missing_ids),
        "duration_ms": duration_ms,
    }
    print(
        f"Synced {len(rows_by_id)} channels; imported={imported}, restored={restored}, "
        f"marked {len(missing_ids)} removed ({duration_ms}ms)."
    )
    log_system(db, f"Catalog sync completed: {len(rows_by_id)} active channels", "sync", summary)


if __name__ == "__main__":
    asyncio.run(main())
