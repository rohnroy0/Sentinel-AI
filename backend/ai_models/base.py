from abc import ABC, abstractmethod
from typing import Dict, Any, List

class AIProvider(ABC):
    @abstractmethod
    async def generate_response(self, prompt: str, system_prompt: str = "") -> str:
        pass
        
    @abstractmethod
    async def generate_structured_response(self, prompt: str, schema: Dict[str, Any], system_prompt: str = "") -> Dict[str, Any]:
        pass
