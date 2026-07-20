"""Compute top-N countries by stream-backed channel count and print SQL."""
from __future__ import annotations

import json
import urllib.request
from collections import Counter

N = 84
CHANNELS_URL = "https://iptv-org.github.io/api/channels.json"
COUNTRIES_URL = "https://iptv-org.github.io/api/countries.json"
STREAMS_URL = "https://iptv-org.github.io/api/streams.json"


def load(url: str):
    with urllib.request.urlopen(url, timeout=60) as response:
        return json.load(response)


def main() -> None:
    channels = load(CHANNELS_URL)
    countries = load(COUNTRIES_URL)
    streams = load(STREAMS_URL)
    with_stream = {s.get("channel") for s in streams if s.get("channel") and s.get("url")}

    counts: Counter[str] = Counter()
    for channel in channels:
        country = channel.get("country")
        if isinstance(country, list):
            country = country[0] if country else None
        if not country or channel.get("id") not in with_stream:
            continue
        code = str(country).upper()
        if code == "UK":
            code = "GB"
        counts[code] += 1

    name_by = {c["code"].upper(): c["name"] for c in countries if c.get("code") and c.get("name")}
    name_by["GB"] = name_by.get("GB") or name_by.get("UK") or "United Kingdom"

    top = counts.most_common(N)
    print(f"-- Top {len(top)} countries by stream-backed channel count (min={top[-1][1]})")
    print("insert into public.countries (name, code, enabled) values")
    rows = []
    for index, (code, n) in enumerate(top):
        name = (name_by.get(code) or code).replace("'", "''")
        comma = "," if index < len(top) - 1 else ""
        rows.append(f"  ('{name}', '{code}', true){comma}  -- {n} channels with streams")
    print("\n".join(rows))
    print(
        """on conflict (code) do update
  set name = excluded.name,
      enabled = true,
      updated_at = now();

-- Disable any country not in the top set (keep rows for FK safety).
update public.countries
set enabled = false, updated_at = now()
where code not in ({codes});
""".format(codes=", ".join(f"'{code}'" for code, _ in top))
    )
    print("-- CODES=" + ",".join(code for code, _ in top))


if __name__ == "__main__":
    main()
