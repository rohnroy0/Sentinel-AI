import os
import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def test_flow():
    # 1. Sign in or sign up a test user to get a real Supabase JWT access token
    auth_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    
    test_email = "rohnroy007@gmail.com"
    # Try logging in
    # If password is unknown, let's create a temporary user or fetch a user token via admin API
    admin_url = f"{SUPABASE_URL}/auth/v1/admin/users"
    admin_headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    
    resp = httpx.get(admin_url, headers=admin_headers)
    print("Users response status:", resp.status_code)
    users = resp.json().get("users", [])
    print(f"Total users in Supabase Auth: {len(users)}")
    for u in users:
        print(f"User Email: {u.get('email')}, ID: {u.get('id')}")

if __name__ == "__main__":
    test_flow()
