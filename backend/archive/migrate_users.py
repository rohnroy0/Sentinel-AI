import os
import httpx
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

old_user_id = "13f9ccf9-413b-41b0-b609-f54e7219279c"
new_user_id = "da8c8767-bcc0-44ba-af61-9052a051be71"

url = f"{supabase_url}/rest/v1/investigations"

# Count before
count_headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Prefer": "count=exact"
}
resp_old = httpx.get(url, headers=count_headers, params={"user_id": f"eq.{old_user_id}"})
print(f"Old user count: {resp_old.headers.get('content-range')}")

resp_new = httpx.get(url, headers=count_headers, params={"user_id": f"eq.{new_user_id}"})
print(f"New user count: {resp_new.headers.get('content-range')}")

# Update
data = {"user_id": new_user_id}
response = httpx.patch(url, headers=headers, params={"user_id": f"eq.{old_user_id}"}, json=data)

if response.status_code >= 400:
    print(f"Error: {response.status_code} {response.text}")
else:
    updated = response.json()
    print(f"Updated {len(updated)} investigations.")

# Count after
resp_old_after = httpx.get(url, headers=count_headers, params={"user_id": f"eq.{old_user_id}"})
print(f"Old user count after: {resp_old_after.headers.get('content-range')}")

resp_new_after = httpx.get(url, headers=count_headers, params={"user_id": f"eq.{new_user_id}"})
print(f"New user count after: {resp_new_after.headers.get('content-range')}")
