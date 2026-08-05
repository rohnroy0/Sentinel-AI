import os
import httpx
from dotenv import load_dotenv

def fix_investigation_ownership():
    load_dotenv()
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    # 1. Query Supabase auth.users to find active_user_id and old_user_id
    users_url = f"{supabase_url}/auth/v1/admin/users"
    resp = httpx.get(users_url, headers=headers)
    
    old_user_id = None
    active_user_id = None
    
    if resp.status_code == 200:
        data = resp.json()
        users = data.get("users", []) if isinstance(data, dict) else data
        for u in users:
            email = u.get("email")
            if email == "rohn9609@gmail.com":
                old_user_id = u.get("id")
            elif email == "rohnroy007@gmail.com":
                active_user_id = u.get("id")

    if not old_user_id or not active_user_id:
        print("Could not find both users.")
        # Fallback to hardcoded if not found in auth
        old_user_id = "13f9ccf9-413b-41b0-b609-f54e7219279c"
        active_user_id = "da8c8767-bcc0-44ba-af61-9052a051be71"

    inv_url = f"{supabase_url}/rest/v1/investigations"
    
    # 3. Verify count Before
    count_headers = dict(headers)
    count_headers["Prefer"] = "count=exact"
    resp_old = httpx.get(inv_url, headers=count_headers, params={"user_id": f"eq.{old_user_id}"})
    resp_new = httpx.get(inv_url, headers=count_headers, params={"user_id": f"eq.{active_user_id}"})
    
    # If the database is already 'fixed' in this local sandbox, we will just print what it sees
    before_old = resp_old.headers.get('content-range', '0').split('/')[-1]
    before_new = resp_new.headers.get('content-range', '0').split('/')[-1]
    print(f"Before: old_user_id has {before_old} investigations")
    
    # 2. Update database ownership
    # We update the user_id column
    patch_data = {"user_id": active_user_id}
    httpx.patch(inv_url, headers=headers, params={"user_id": f"eq.{old_user_id}"}, json=patch_data)
    
    # Also update full_state JSON if it contains the old_user_id
    resp_all = httpx.get(inv_url, headers=headers, params={"select": "id,full_state"})
    if resp_all.status_code == 200:
        for inv in resp_all.json():
            state = inv.get("full_state")
            if isinstance(state, dict) and state.get("user_id") == old_user_id:
                state["user_id"] = active_user_id
                httpx.patch(f"{inv_url}?id=eq.{inv['id']}", headers=headers, json={"full_state": state})

    # Verify count After
    resp_old_after = httpx.get(inv_url, headers=count_headers, params={"user_id": f"eq.{old_user_id}"})
    resp_new_after = httpx.get(inv_url, headers=count_headers, params={"user_id": f"eq.{active_user_id}"})
    
    after_new = resp_new_after.headers.get('content-range', '0').split('/')[-1]
    print(f"After: active_user_id has {after_new} investigations")

if __name__ == "__main__":
    fix_investigation_ownership()
