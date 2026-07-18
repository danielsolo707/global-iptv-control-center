"""Synchronize iptv-org's M3U directory into the enabled-country catalog."""
import asyncio
import os
import re
from datetime import datetime, timezone

import httpx

from common import chunks, supabase_client

M3U_URL = "https://iptv-org.github.io/iptv/index.m3u"
CHANNELS_URL = "https://iptv-org.github.io/api/channels.json"
ATTR = re.compile(r'([\w-]+)="([^"]*)"')


def parse_m3u(document: str, metadata: dict[str, dict]) -> list[dict]:
    entries, pending = [], None
    for line in document.splitlines():
        line = line.strip()
        if line.startswith("#EXTINF:"):
            attrs = dict(ATTR.findall(line))
            pending = {"attrs": attrs, "name": line.rsplit(",", 1)[-1].strip()}
        elif pending and line and not line.startswith("#"):
            channel_id = pending["attrs"].get("tvg-id", "")
            source = metadata.get(channel_id, {})
            countries = source.get("country") or []
            country_code = countries[0].upper() if countries else None
            if channel_id and country_code:
                entries.append({
                    "channel_id": channel_id,
                    "name": source.get("name") or pending["name"],
                    "country_code": country_code,
                    "category": (source.get("categories") or [None])[0],
                    "language": (source.get("languages") or [None])[0],
                    "logo": pending["attrs"].get("tvg-logo") or source.get("logo"),
                    "stream_url": line,
                })
            pending = None
    return entries


async def main() -> None:
    db = supabase_client()
    enabled = db.table("countries").select("code,name").eq("enabled", True).execute().data
    countries = {item["code"]: item["name"] for item in enabled}
    if not countries:
        print("No enabled countries; nothing to synchronize.")
        return

    async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
        m3u_response, metadata_response = await asyncio.gather(
            client.get(M3U_URL), client.get(CHANNELS_URL)
        )
        m3u_response.raise_for_status()
        metadata_response.raise_for_status()
    metadata = {channel["id"]: channel for channel in metadata_response.json() if channel.get("id")}
    source_rows = parse_m3u(m3u_response.text, metadata)
    now = datetime.now(timezone.utc).isoformat()
    rows_by_id: dict[str, dict] = {}
    for row in source_rows:
        if row["country_code"] in countries:
            row["country"] = countries[row["country_code"]]
            row["last_sync"] = now
            row["status"] = "checking"
            rows_by_id[row["channel_id"]] = row

    existing = db.table("channels").select("channel_id,stream_url,status").in_("country_code", list(countries)).execute().data
    existing_ids = {row["channel_id"] for row in existing}
    # Do not turn a known healthy channel back to checking unless its stream URL changed.
    existing_by_id = {row["channel_id"]: row for row in existing}
    for channel_id, row in rows_by_id.items():
        old = existing_by_id.get(channel_id)
        if old and old["stream_url"] == row["stream_url"]:
            row.pop("status")
        elif old:
            row["fail_count"] = 0

    for batch in chunks(list(rows_by_id.values())):
        db.table("channels").upsert(batch, on_conflict="channel_id").execute()

    missing_ids = list(existing_ids - set(rows_by_id))
    for start in range(0, len(missing_ids), 200):
        db.table("channels").update({"status": "removed", "last_sync": now}).in_("channel_id", missing_ids[start:start + 200]).execute()
    print(f"Synced {len(rows_by_id)} channels; marked {len(missing_ids)} removed.")


if __name__ == "__main__":
    asyncio.run(main())
