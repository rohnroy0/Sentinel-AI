import sqlite3
import json
import os
import sys

# Add the parent directory to sys.path so we can import from database
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.supabase_client import get_supabase
from dotenv import load_dotenv

def find_sqlite_db():
    # Search common paths for investigations.db
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    paths_to_check = [
        os.path.join(base_dir, 'investigations.db'),
        os.path.join(base_dir, 'data', 'investigations.db'),
        os.path.join(base_dir, '..', 'data', 'investigations.db'), # in case base_dir is backend/backend
        os.path.join(base_dir, '..', 'backend', 'data', 'investigations.db')
    ]
    
    # Also check config path
    try:
        from config import config
        config_path = config.DATABASE_PATH
        if not os.path.isabs(config_path):
            paths_to_check.insert(0, os.path.abspath(os.path.join(base_dir, config_path)))
            paths_to_check.insert(0, os.path.abspath(os.path.join(base_dir, '..', config_path)))
        else:
            paths_to_check.insert(0, config_path)
    except ImportError:
        pass
        
    for p in paths_to_check:
        if os.path.exists(p):
            return p
            
    return None

def migrate():
    load_dotenv()
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.")
        print("Migration aborted.")
        sys.exit(1)
        
    supabase = get_supabase()
    
    db_path = find_sqlite_db()
    
    if not db_path:
        print("ERROR: Could not find investigations.db in any common locations.")
        print("Migration aborted.")
        sys.exit(1)
        
    print(f"Selected SQLite database: {db_path}")
    
    default_user_id = os.getenv("DEFAULT_MIGRATION_USER_ID")
    if default_user_id:
        print(f"Using default migration user ID: {default_user_id}")
    else:
        print("No DEFAULT_MIGRATION_USER_ID provided. Legacy records without a user ID will be skipped.")
        
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM investigations")
    rows = cursor.fetchall()
    
    print(f"Found {len(rows)} investigations to migrate.")
    
    for row in rows:
        inv_id = row["id"]
        cols = row.keys()
        user_id = row["user_id"] if "user_id" in cols and row["user_id"] else default_user_id
        
        if not user_id:
            print(f"Skipping investigation {inv_id} because it lacks a user_id and no default user was provided.")
            continue
            
        full_state_raw = row["full_state"] if "full_state" in cols else "{}"
        try:
            full_state = json.loads(full_state_raw) if full_state_raw else {}
        except json.JSONDecodeError:
            full_state = {}
            
        for col in cols:
            if col not in ["id", "user_id", "full_state"] and col not in full_state:
                try:
                    full_state[col] = json.loads(row[col]) if row[col] else None
                except (json.JSONDecodeError, TypeError):
                    full_state[col] = row[col]

        risk_dash = full_state.get("risk_dashboard", {})
        risk_score = risk_dash.get("overallScore", 0) if isinstance(risk_dash, dict) else 0

        # Migrate main investigations table (preserving full_state)
        inv_data = {
            "id": inv_id,
            "user_id": user_id,
            "scan_name": full_state.get("user_goal", row["user_goal"]),
            "status": row["status"],
            "risk_score": risk_score,
            "full_state": full_state,
            "created_at": row["created_at"]
        }
        
        print(f"Migrating investigation {inv_id} for user {user_id}...")
        try:
            supabase.from_table("investigations").upsert(inv_data).execute()
        except Exception as e:
            print(f" ✗ Failed to migrate investigation {inv_id}: {e}")
            continue
            
        # Migrate findings
        findings = full_state.get("findings", full_state.get("vulnerabilities", []))
        for finding in findings:
            if isinstance(finding, dict):
                f_data = {
                    "investigation_id": inv_id,
                    "severity": finding.get("severity", "Unknown"),
                    "cve_id": finding.get("cve_id", finding.get("cve", "N/A")),
                    "evidence": str(finding.get("evidence", finding.get("description", "")))
                }
                try:
                    supabase.from_table("findings").upsert(f_data).execute()
                except Exception as e:
                    print(f"   ✗ Failed to migrate finding for {inv_id}: {e}")
                    
        # Migrate decision logs
        decisions = full_state.get("decision_log", full_state.get("reasoning_steps", []))
        for d in decisions:
            if isinstance(d, dict):
                d_data = {
                    "investigation_id": inv_id,
                    "stage": d.get("stage", "Unknown"),
                    "reasoning": d.get("reasoning", d.get("why", "")),
                    "evidence": str(d.get("evidence", d.get("data", ""))),
                    "timestamp": d.get("timestamp", row["created_at"])
                }
                try:
                    supabase.from_table("decision_logs").upsert(d_data).execute()
                except Exception as e:
                    print(f"   ✗ Failed to migrate decision for {inv_id}: {e}")

        # Migrate attack chains
        chains = full_state.get("attack_chains", [])
        if chains:
            if isinstance(chains, dict):
                chains = [chains]
            for chain in chains:
                c_data = {
                    "investigation_id": inv_id,
                    "graph_data": chain
                }
                try:
                    supabase.from_table("attack_chains").upsert(c_data).execute()
                except Exception as e:
                    print(f"   ✗ Failed to migrate attack chain for {inv_id}: {e}")
                    
        # Migrate reports (if reports table exists)
        report = full_state.get("report", full_state.get("final_report", {}))
        if report:
            r_data = {
                "investigation_id": inv_id,
                "report_data": report
            }
            try:
                supabase.from_table("reports").upsert(r_data).execute()
            except Exception as e:
                pass
                
        print(f" [OK] Successfully migrated {inv_id} and all its child objects.")
            
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
