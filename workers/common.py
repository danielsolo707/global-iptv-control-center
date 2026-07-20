import os
from typing import Iterable, Iterator, TypeVar

T = TypeVar("T")


def supabase_client():
    # Lazy import so pure helpers (and unit tests) do not require supabase installed.
    from supabase import Client, create_client

    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def chunks(items: list[T] | Iterable[T], size: int = 500) -> Iterator[list[T]]:
    sequence = list(items)
    for start in range(0, len(sequence), size):
        yield sequence[start : start + size]


def normalize_country_code(code: str | None) -> str | None:
    """Map iptv-org ISO codes onto the codes stored in our countries table."""
    if not code:
        return None
    upper = code.strip().upper()
    if len(upper) != 2 or not upper.isalpha():
        return None
    return "GB" if upper == "UK" else upper


def resolve_stored_country_code(upstream_code: str, enabled: dict[str, str]) -> str | None:
    normalized = normalize_country_code(upstream_code)
    if not normalized:
        return None
    if normalized in enabled:
        return normalized
    if normalized == "GB" and "UK" in enabled:
        return "UK"
    if normalized == "UK" and "GB" in enabled:
        return "GB"
    return None


def next_fail_count(current: int | None, success: bool) -> int:
    if success:
        return 0
    base = int(current or 0)
    if base < 0:
        base = 0
    return base + 1


def status_from_fail_count(fail_count: int) -> str:
    """
    Status state machine (exact product rules):
      0 fails              -> online
      1–2 consecutive fails -> checking
      3–9 consecutive fails -> offline
      10+ consecutive fails -> blocked
    """
    if fail_count <= 0:
        return "online"
    if fail_count >= 10:
        return "blocked"
    if fail_count >= 3:
        return "offline"
    return "checking"


def apply_stream_check(current_fail_count: int | None, success: bool) -> tuple[str, int]:
    fail_count = next_fail_count(current_fail_count, success)
    return status_from_fail_count(fail_count), fail_count


def log_system(db, message: str, type_: str = "worker", metadata: dict | None = None) -> None:
    try:
        db.table("system_logs").insert(
            {"type": type_, "message": message, "metadata": metadata or {}}
        ).execute()
    except Exception as error:  # noqa: BLE001 — logging must never fail the job
        print(f"system_logs insert failed: {error}")
