from common import supabase_client


def main() -> None:
    rows = supabase_client().table("country_availability_report").select("*").eq("enabled", True).order("name").execute().data
    print("# Country availability report\n")
    for row in rows:
        print(f"## {row['name']} ({row['code']})\n")
        print(f"- Total channels: {row['total_channels']}")
        print(f"- Online: {row['online_channels']}")
        print(f"- Offline/blocked: {row['offline_channels']}\n")


if __name__ == "__main__":
    main()
