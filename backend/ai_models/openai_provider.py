import json
import logging
from typing import Dict, Any
from ai_models.base import AIProvider
from config import config

logger = logging.getLogger(__name__)

class OpenAIProvider(AIProvider):
    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or config.OPENAI_API_KEY
        self.model = model or config.OPENAI_MODEL
        self.client = None
        
        if self.api_key:
            try:
                import openai
                self.client = openai.OpenAI(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {e}")

    async def generate_response(self, prompt: str, system_prompt: str = "") -> str:
        if self.client:
            try:
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})
                
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0.2
                )
                return response.choices[0].message.content
            except Exception as e:
                logger.warning(f"OpenAI completion error: {e}")
        
        # Fallback response generator if key is missing or call fails
        return f"[AI Security Insights]: Analysis based on rule correlation for request."

    async def generate_structured_response(self, prompt: str, schema: Dict[str, Any], system_prompt: str = "") -> Dict[str, Any]:
        raw_resp = await self.generate_response(prompt, system_prompt)
        try:
            return json.loads(raw_resp)
        except Exception:
            return {"raw_response": raw_resp}
