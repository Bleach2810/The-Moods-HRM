import urllib.request
import json

url = "http://127.0.0.1:5078/api/attendance/config?locationId=govap-branch"

def main():
    print("Testing local API connection on server...")
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            data = json.loads(html)
            print("API Status: SUCCESS")
            print("Response data:")
            for item in data:
                if item.get("configKey") == "ManagerNote":
                    print(f"-> ManagerNote: {item.get('configValue')}")
    except Exception as e:
        print(f"API Status: FAILED - {e}")

if __name__ == "__main__":
    main()
