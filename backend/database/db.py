import sqlite3
import os
import json
import logging
from config import config

logger = logging.getLogger(__name__)

DB_PATH = config.DATABASE_PATH

def get_db_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS investigations (
        id TEXT PRIMARY KEY,
        user_goal TEXT,
        status TEXT,
        scan_data TEXT,
        discovered_hosts TEXT,
        vulnerabilities TEXT,
        selected_tools TEXT,
        decision_log TEXT,
        final_report TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Ensure all required data persistence columns exist
    existing_cols = [row[1] for row in cursor.execute("PRAGMA table_info(investigations)").fetchall()]
    new_cols = {
        "tool_results": "TEXT",
        "explained_findings": "TEXT",
        "remediation": "TEXT",
        "risk_dashboard": "TEXT",
        "investigation_graph": "TEXT",
        "attack_chains": "TEXT",
        "full_state": "TEXT",
    }
    for col, col_type in new_cols.items():
        if col not in existing_cols:
            cursor.execute(f"ALTER TABLE investigations ADD COLUMN {col} {col_type}")

    conn.commit()
    conn.close()

# Initialize table on import
try:
    init_db()
except Exception as e:
    logger.error(f"Error initializing SQLite database: {e}")
