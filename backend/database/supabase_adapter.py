import os
import json
import uuid
from typing import Dict, Any, List, Optional
from database.adapter import BaseDatabaseAdapter
from config import config
from utils.logger import logger

class SupabaseAdapter(BaseDatabaseAdapter):
    """Production Supabase Database Adapter using Supabase Python SDK."""

    def __init__(self, url: Optional[str] = None, key: Optional[str] = None):
        self.url = url or config.SUPABASE_URL
        self.key = key or config.SUPABASE_SERVICE_ROLE_KEY
        self.client = None
        self._init_client()

    def _init_client(self) -> None:
        if not self.url or not self.key:
            logger.warning("SupabaseAdapter: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.")
            return

        try:
            from supabase import create_client, Client
            self.client: Optional[Client] = create_client(self.url, self.key)
            logger.info("SupabaseAdapter successfully initialized using Supabase Python SDK.")
        except ImportError:
            logger.warning("SupabaseAdapter: 'supabase' Python SDK not installed. Falling back to HTTP client mode.")
            from database.supabase_client import get_supabase
            self.client = get_supabase()
        except Exception as e:
            logger.error(f"SupabaseAdapter initialization error: {e}")

    def save_investigation(self, state: Dict[str, Any]) -> bool:
        inv_id = state.get("investigation_id") or state.get("id") or str(uuid.uuid4())
        user_id = state.get("user_id")
        logger.info(f"SupabaseAdapter SAVE START: INVESTIGATION ID: {inv_id} | USER ID: {user_id} | DATABASE ENGINE: supabase")

        if not user_id:
            logger.error(f"SupabaseAdapter SAVE FAILURE: INVESTIGATION ID: {inv_id} | USER ID: None | DATABASE ENGINE: supabase | Reason: user_id is missing.")
            return False

        if not self.client:
            logger.error(f"SupabaseAdapter SAVE FAILURE: INVESTIGATION ID: {inv_id} | USER ID: {user_id} | DATABASE ENGINE: supabase | Reason: Supabase client uninitialized.")
            return False

        state["investigation_id"] = inv_id

        user_goal = state.get("user_goal") or state.get("scan_name") or "Autonomous Investigation"
        status = state.get("current_status") or state.get("status") or "Completed"
        risk_score = state.get("risk_dashboard", {}).get("overallScore", 0) if isinstance(state.get("risk_dashboard"), dict) else 0

        # Sanitize state dictionary to ensure PostgREST / JSON serialization compliance
        try:
            clean_state = json.loads(json.dumps(state, default=str))
        except Exception:
            clean_state = state

        data = {
            "id": inv_id,
            "user_id": user_id,
            "scan_name": user_goal,
            "user_goal": user_goal,
            "status": status,
            "risk_score": risk_score,
            "scan_data": state.get("scan_data", ""),
            "full_state": clean_state
        }

        try:
            if hasattr(self.client, "table"):
                self.client.table("investigations").upsert(data).execute()
            else:
                self.client.from_table("investigations").upsert(data).execute()
            logger.info(f"SupabaseAdapter SAVE SUCCESS: INVESTIGATION ID: {inv_id} | USER ID: {user_id} | DATABASE ENGINE: supabase")
            return True
        except Exception as e:
            logger.error(f"SupabaseAdapter SAVE FAILURE: INVESTIGATION ID: {inv_id} | USER ID: {user_id} | DATABASE ENGINE: supabase | Error: {e}", exc_info=True)
            return False


    def get_investigation_by_id(self, inv_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        if not user_id:
            logger.error("SupabaseAdapter get_investigation_by_id rejected: user_id is missing.")
            return None

        if not self.client:
            logger.error("SupabaseAdapter uninitialized: cannot get investigation.")
            return None

        try:
            if hasattr(self.client, "table"):
                res = self.client.table("investigations").select("*").eq("id", inv_id).eq("user_id", user_id).execute()
            else:
                res = self.client.from_table("investigations").select("*").eq("id", inv_id).eq("user_id", user_id).execute()

            rows = getattr(res, "data", [])
            if not rows:
                return None

            row = rows[0]
            full_state = row.get("full_state") or {}

            user_goal = row.get("user_goal") or row.get("scan_name") or full_state.get("user_goal", "")

            state = {
                "investigation_id": row["id"],
                "user_goal": user_goal,
                "current_status": row.get("status", full_state.get("current_status", "Completed")),
                "inv_type": full_state.get("inv_type", "deterministic"),
                "scan_data": full_state.get("scan_data", ""),
                "discovered_hosts": full_state.get("discovered_hosts", []),
                "vulnerabilities": full_state.get("vulnerabilities", full_state.get("findings", [])),
                "findings": full_state.get("findings", []),
                "selected_tools": full_state.get("selected_tools", []),
                "decision_log": full_state.get("decision_log", []),
                "reasoning_steps": full_state.get("decision_log", full_state.get("reasoning_steps", [])),
                "final_report": full_state.get("final_report", full_state.get("report", {})),
                "tool_results": full_state.get("tool_results", {}),
                "explained_findings": full_state.get("explained_findings", []),
                "remediation": full_state.get("remediation", []),
                "risk_dashboard": full_state.get("risk_dashboard", {}),
                "investigation_graph": full_state.get("investigation_graph", {}),
                "attack_chains": full_state.get("attack_chains", []),
                "user_id": row["user_id"],
                "created_at": row.get("created_at"),
            }

            for k, v in full_state.items():
                if v and (k not in state or not state[k]):
                    state[k] = v

            return state
        except Exception as e:
            logger.error(f"SupabaseAdapter error fetching investigation {inv_id}: {e}")
            return None

    def get_all_investigations(self, user_id: str) -> List[Dict[str, Any]]:
        if not user_id:
            logger.error("SupabaseAdapter get_all_investigations rejected: user_id is missing.")
            return []

        if not self.client:
            logger.error("SupabaseAdapter uninitialized: cannot fetch investigations.")
            return []

        try:
            fields = "id, user_goal, scan_name, status, risk_score, created_at, user_id"
            if hasattr(self.client, "table"):
                res = self.client.table("investigations").select(fields).eq("user_id", user_id).order("created_at", desc=True).execute()
            else:
                res = self.client.from_table("investigations").select(fields).eq("user_id", user_id).order("created_at", desc=True).execute()

            rows = getattr(res, "data", []) or []
            results = []
            for r in rows:
                user_goal = r.get("user_goal") or r.get("scan_name") or "Autonomous Investigation"
                results.append({
                    "investigation_id": r["id"],
                    "user_goal": user_goal,
                    "current_status": r.get("status", "Completed"),
                    "vulnerabilities": [],
                    "discovered_hosts": [],
                    "created_at": r.get("created_at"),
                    "user_id": r.get("user_id")
                })
            return results
        except Exception as e:
            logger.error(f"SupabaseAdapter error fetching investigations for user {user_id}: {e}")
            return []

    def delete_investigation(self, inv_id: str, user_id: str) -> bool:
        if not user_id:
            logger.error("SupabaseAdapter delete_investigation rejected: user_id is missing.")
            return False

        if not self.client:
            return False

        try:
            if hasattr(self.client, "table"):
                self.client.table("investigations").delete().eq("id", inv_id).eq("user_id", user_id).execute()
            else:
                self.client.from_table("investigations").delete().eq("id", inv_id).eq("user_id", user_id).execute()
            return True
        except Exception as e:
            logger.error(f"SupabaseAdapter error deleting investigation {inv_id}: {e}")
            return False

    def health_check(self) -> Dict[str, Any]:
        if not self.client:
            return {"status": "unconfigured", "engine": "supabase"}
        try:
            if hasattr(self.client, "table"):
                res = self.client.table("investigations").select("id", count="exact").limit(1).execute()
            else:
                res = self.client.from_table("investigations").select("*").execute()
            return {"status": "ok", "engine": "supabase"}
        except Exception as e:
            return {"status": "error", "engine": "supabase", "error": str(e)}
