import os
import httpx
from dotenv import load_dotenv

def reset_database():
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
    }

    tables = ["reports", "attack_chains", "decision_logs", "findings", "investigations"]

    for table in tables:
        url = f"{supabase_url}/rest/v1/{table}?id=not.is.null"
        # For tables that might not have an 'id' column, we can use a broader condition or just delete all
        # Let's try to delete all rows. Supabase requires a filter for DELETE. 
        # Using a filter that is always true. 
        # If 'id' is not in all tables, we can use 'investigation_id' for child tables.
        if table == "investigations":
            filter_query = "?id=not.is.null"
        else:
            filter_query = "?investigation_id=not.is.null"
            
        delete_url = f"{supabase_url}/rest/v1/{table}{filter_query}"
        
        # We might need to handle pagination if there are many rows, but usually DELETE with a broad filter 
        # deletes all matching rows. 
        resp = httpx.delete(delete_url, headers=headers)
        if resp.status_code in [200, 204]:
            print(f"Cleared {table}")
        else:
            print(f"Failed to clear {table}: {resp.status_code} {resp.text}")

    # Verify counts
    print("\n--- Verifying Counts ---")
    count_headers = dict(headers)
    count_headers["Prefer"] = "count=exact"
    
    for table in tables:
        # Use a limit=1 to avoid fetching data, just get the count
        url = f"{supabase_url}/rest/v1/{table}?select=id&limit=1"
        if table != "investigations":
            url = f"{supabase_url}/rest/v1/{table}?select=investigation_id&limit=1"
            
        resp = httpx.get(url, headers=count_headers)
        count = resp.headers.get('content-range', '0').split('/')[-1]
        print(f"SELECT COUNT(*) FROM {table}; -> {count}")

if __name__ == "__main__":
    reset_database()
