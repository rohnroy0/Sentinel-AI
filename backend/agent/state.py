from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    investigation_id: str
    user_goal: str
    scan_data: Optional[str]
    discovered_hosts: List[Dict[str, Any]]
    vulnerabilities: List[Dict[str, Any]]
    selected_tools: List[str]
    tool_results: Dict[str, Any]
    reasoning_steps: List[Dict[str, Any]]
    final_report: Dict[str, Any]
    current_status: str
    user_id: Optional[str]
