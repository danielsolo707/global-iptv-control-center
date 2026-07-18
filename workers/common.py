import os
from supabase import Client, create_client


def supabase_client() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def chunks(items: list[dict], size: int = 500):
    for start in range(0, len(items), size):
        yield items[start : start + size]
