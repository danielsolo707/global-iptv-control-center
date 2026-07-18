import os

from common import supabase_client


MINIMUM_CHANNELS_PER_COUNTRY = int(os.getenv("MINIMUM_CHANNELS_PER_COUNTRY", "10"))


def main() -> None:
    rows = supabase_client().table("country_availability_report").select("*").eq("enabled", True).gte("total_channels", MINIMUM_CHANNELS_PER_COUNTRY).order("name").execute().data
    print("# Country availability report\n")
    for row in rows:
        print(f"## {row['name']} ({row['code']})\n")
        print(f"- Total channels: {row['total_channels']}")
        print(f"- Online: {row['online_channels']}")
        print(f"- Offline/blocked: {row['offline_channels']}\n")


if __name__ == "__main__":
    main()
