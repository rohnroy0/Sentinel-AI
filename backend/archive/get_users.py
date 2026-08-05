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

response = httpx.get(f"{supabase_url}/auth/v1/admin/users", headers=headers)
users = response.json()
if isinstance(users, list):
    for u in users:
        if u.get("email") in ["rohn9609@gmail.com", "rohnroy007@gmail.com"]:
            print(f"User: {u.get('email')} -> {u.get('id')}")
else:
    print(response.status_code, response.text)
