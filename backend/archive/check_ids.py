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
}

url = f"{supabase_url}/rest/v1/investigations"
resp = httpx.get(url, headers=headers, params={"select": "id,full_state"})
if resp.status_code == 200:
    investigations = resp.json()
    uids_in_state = {}
    for r in investigations:
        state = r.get("full_state") or {}
        uid = state.get("user_id")
        uids_in_state[uid] = uids_in_state.get(uid, 0) + 1
    print("User IDs inside full_state:", uids_in_state)
