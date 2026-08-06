from typing import Dict, Any, List, Optional
from database.adapter import BaseDatabaseAdapter
from database.sqlite_adapter import SQLiteAdapter
from database.supabase_adapter import SupabaseAdapter
from config import config
from utils.logger import logger

class InvestigationRepository:
    """Repository Pattern abstraction isolating application logic from underlying DB persistence engine."""

    def __init__(self, adapter: Optional[BaseDatabaseAdapter] = None):
        if adapter:
            self.adapter = adapter
        else:
            self.adapter = self._factory_adapter()

    def _factory_adapter(self) -> BaseDatabaseAdapter:
        engine = config.DATABASE_ENGINE.lower()
        if engine == "supabase" and config.SUPABASE_URL and config.SUPABASE_SERVICE_ROLE_KEY:
            logger.info("Initializing InvestigationRepository with SupabaseAdapter (default production engine)")
            return SupabaseAdapter()
        elif engine == "sqlite":
            logger.info("Initializing InvestigationRepository with SQLiteAdapter (optional offline fallback)")
            return SQLiteAdapter()
        else:
            logger.warning(f"Database engine set to '{engine}' but Supabase credentials missing. Falling back to offline SQLiteAdapter.")
            return SQLiteAdapter()

    def save_investigation(self, state: Dict[str, Any]) -> bool:
        inv_id = state.get("investigation_id") or state.get("id") or "UNKNOWN"
        user_id = state.get("user_id") or "UNKNOWN"
        engine = config.DATABASE_ENGINE.lower()

        logger.info(f"SAVE START: INVESTIGATION ID: {inv_id} | USER ID: {user_id} | DATABASE ENGINE: {engine}")

        if not state.get("user_id"):
            logger.error(f"SAVE FAILURE: INVESTIGATION ID: {inv_id} | USER ID: {user_id} | DATABASE ENGINE: {engine} | Reason: user_id is missing.")
            return False

        res = self.adapter.save_investigation(state)
        if res:
            logger.info(f"SAVE SUCCESS: INVESTIGATION ID: {inv_id} | USER ID: {user_id} | DATABASE ENGINE: {engine}")
        else:
            logger.error(f"SAVE FAILURE: INVESTIGATION ID: {inv_id} | USER ID: {user_id} | DATABASE ENGINE: {engine} | Reason: Adapter save failed.")
        return res

    def save_deterministic_investigation(self, inv) -> bool:
        user_id = getattr(inv, "user_id", None)
        inv_id = getattr(inv, "id", "UNKNOWN")
        engine = config.DATABASE_ENGINE.lower()

        if not user_id:
            logger.error(f"SAVE FAILURE: INVESTIGATION ID: {inv_id} | USER ID: None | DATABASE ENGINE: {engine} | Reason: user_id is missing on InvestigationState.")
            return False

        attack_chains = getattr(inv, "attack_chains", {})
        if isinstance(attack_chains, dict):
            attack_chains = [attack_chains]

        full_state = {
            "investigation_id": inv.id,
            "inv_type": "deterministic",
            "user_id": user_id,
            "scan_name": "Deterministic Pipeline Investigation",
            "user_goal": "Deterministic Pipeline Investigation",
            "current_status": getattr(inv, "status", "Completed"),
            "status": getattr(inv, "status", "Completed"),
            "stage": getattr(inv, "stage", getattr(inv, "status", "Completed")),
            "progress": getattr(inv, "progress", 100),
            "is_complete": getattr(inv, "is_complete", False),
            "updated_at": getattr(inv, "updated_at", None),
            "scan_data": getattr(inv, "content", ""),
            "findings": getattr(inv, "findings", []),
            "vulnerabilities": getattr(inv, "findings", []),
            "detected_services": getattr(inv, "detected_services", []),
            "discovered_hosts": getattr(inv, "detected_services", []),
            "risk_dashboard": getattr(inv, "risk_dashboard", {}),
            "remediation": getattr(inv, "remediation", []),
            "investigation_graph": getattr(inv, "graph", {}),
            "attack_chains": attack_chains,
            "decision_log": getattr(inv, "decision_log", []),
            "final_report": getattr(inv, "report", {}),
            "investigation_summary": getattr(inv, "investigation_summary", {}),
            "duration_seconds": getattr(inv, "duration_seconds", 0),
        }

        return self.save_investigation(full_state)


    def get_investigation_by_id(self, inv_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        if not user_id:
            logger.error("Repository rejected get_investigation_by_id: user_id is missing.")
            return None
        return self.adapter.get_investigation_by_id(inv_id, user_id)

    def get_all_investigations(self, user_id: str) -> List[Dict[str, Any]]:
        if not user_id:
            logger.error("Repository rejected get_all_investigations: user_id is missing.")
            return []
        return self.adapter.get_all_investigations(user_id)

    def delete_investigation(self, inv_id: str, user_id: str) -> bool:
        if not user_id:
            logger.error("Repository rejected delete_investigation: user_id is missing.")
            return False
        return self.adapter.delete_investigation(inv_id, user_id)

    def health_check(self) -> Dict[str, Any]:
        return self.adapter.health_check()

# Global Singleton Repository instance
db_repository = InvestigationRepository()
