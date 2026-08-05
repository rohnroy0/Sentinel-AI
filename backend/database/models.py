from typing import Dict, Any, List, Optional
from database.repository import db_repository

def save_investigation(state: Dict[str, Any]) -> bool:
    """Save or update an investigation state. Requires user_id in state."""
    return db_repository.save_investigation(state)

def save_deterministic_investigation(inv) -> bool:
    """Persist a deterministic InvestigationState instance."""
    return db_repository.save_deterministic_investigation(inv)

def get_investigation_by_id(inv_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Fetch investigation by ID scoped to user_id."""
    if not user_id:
        return None
    return db_repository.get_investigation_by_id(inv_id, user_id)

def get_all_investigations(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Fetch all investigations scoped to user_id."""
    if not user_id:
        return []
    return db_repository.get_all_investigations(user_id)
