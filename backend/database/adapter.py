from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseDatabaseAdapter(ABC):
    """Abstract Base Class for Sentinel-AI Database Adapters."""

    @abstractmethod
    def save_investigation(self, state: Dict[str, Any]) -> bool:
        """Persist or update an investigation state dictionary."""
        pass

    @abstractmethod
    def get_investigation_by_id(self, inv_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a specific investigation by ID scoped to user_id."""
        pass

    @abstractmethod
    def get_all_investigations(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch all investigations scoped to user_id."""
        pass

    @abstractmethod
    def delete_investigation(self, inv_id: str, user_id: str) -> bool:
        """Delete an investigation by ID scoped to user_id."""
        pass

    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        """Verify database connection health."""
        pass
