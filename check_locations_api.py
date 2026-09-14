import urllib.request
import json

def get_data(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8'))

def main():
    print("Fetching locations...")
    try:
        locations = get_data("http://127.0.0.1:5078/api/locations")
        print(f"Found {len(locations)} locations:")
        for loc in locations:
            loc_id = loc.get("id")
            loc_name = loc.get("name")
            print(f"Location: {loc_name} ({loc_id})")
            
            # Fetch config for this location
            config = get_data(f"http://127.0.0.1:5078/api/attendance/config?locationId={loc_id}")
            note = next((c.get("configValue") for c in config if c.get("configKey") == "ManagerNote"), None)
            print(f"  -> ManagerNote: {note}")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
