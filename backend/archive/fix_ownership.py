import os
import httpx
from dotenv import load_dotenv

def fix_ownership():
    load_dotenv()
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("Missing Supabase credentials")
        return

    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    old_user_id = "13f9ccf9-413b-41b0-b609-f54e7219279c" # rohn9609@gmail.com
    new_user_id = "da8c8767-bcc0-44ba-af61-9052a051be71" # rohnroy007@gmail.com

    url = f"{supabase_url}/rest/v1/investigations"

    # Verify counts before
    count_headers = dict(headers)
    count_headers["Prefer"] = "count=exact"
    resp_old = httpx.get(url, headers=count_headers, params={"user_id": f"eq.{old_user_id}"})
    resp_new = httpx.get(url, headers=count_headers, params={"user_id": f"eq.{new_user_id}"})
    
    print(f"Before: old_user_id has {resp_old.headers.get('content-range', '0').split('/')[-1]} investigations")
    print(f"Before: active_user_id has {resp_new.headers.get('content-range', '0').split('/')[-1]} investigations")

    # We need to fetch and update to preserve JSON data
    # Actually, a simple PATCH on user_id works, but we also want to update full_state.user_id just in case
    resp = httpx.get(url, headers=headers)
    if resp.status_code == 200:
        investigations = resp.json()
        updated_count = 0
        for inv in investigations:
            # If the investigation is assigned to the old user OR if we need to force it
            # The prompt says they are assigned to the wrong user. If they are already da8c8767 we just report it.
            if inv.get("user_id") == old_user_id:
                state = inv.get("full_state", {})
                if isinstance(state, dict):
                    state["user_id"] = new_user_id
                
                patch_data = {
                    "user_id": new_user_id,
                    "full_state": state
                }
                patch_resp = httpx.patch(f"{url}?id=eq.{inv['id']}", headers=headers, json=patch_data)
                if patch_resp.status_code < 400:
                    updated_count += 1
        
        print(f"Migrated {updated_count} investigations from old_user_id to active_user_id.")

    # Verify counts after
    resp_old = httpx.get(url, headers=count_headers, params={"user_id": f"eq.{old_user_id}"})
    resp_new = httpx.get(url, headers=count_headers, params={"user_id": f"eq.{new_user_id}"})
    print(f"After: old_user_id has {resp_old.headers.get('content-range', '0').split('/')[-1]} investigations")
    print(f"After: active_user_id has {resp_new.headers.get('content-range', '0').split('/')[-1]} investigations")

if __name__ == "__main__":
    fix_ownership()
