from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

class HealthResponse(BaseModel):
    status: str = Field(..., example="ok")
    version: str = Field(..., example="1.0.0")
    db_engine: str = Field(..., example="supabase")
    db_status: Dict[str, Any] = Field(..., example={"status": "ok", "engine": "supabase"})
    auth_mode: str = Field(..., example="supabase")
    environment_mode: str = Field(..., example="production")

class InfoResponse(BaseModel):
    name: str
    version: str
    build: str
    description: str

class UploadRequest(BaseModel):
    content: str

class UploadResponse(BaseModel):
    investigationId: str

class AgentInvestigateRequest(BaseModel):
    goal: Optional[str] = "Analyze network threats and security posture"
    scan_data: str

class AgentInvestigateResponse(BaseModel):
    investigation_id: str
    status: str

class AskSentinelRequest(BaseModel):
    investigation_id: str
    question: str

class AskSentinelResponse(BaseModel):
    investigation_id: str
    question: str
    answer: str
