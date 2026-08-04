from agent.state import AgentState
from ai_models.openai_provider import OpenAIProvider

async def generate_reasoning(state: AgentState) -> AgentState:
    """
    LangGraph Reasoning Node:
    Generates explainable security insights for each finding.
    
    Structure required for every finding:
    - Finding
    - Reason
    - Evidence
    - Impact
    - Recommendation
    """
    state["current_status"] = "Generating explainable security insights..."
    vulnerabilities = state.get("vulnerabilities", [])
    explained_findings = []
    
    for v in vulnerabilities:
        service = v.get("service", "Unknown Service")
        host = v.get("host", "Unknown Host")
        cve = v.get("cve_id", "N/A")
        severity = v.get("severity", "MEDIUM")
        port = v.get("port", "N/A")
        
        explained_findings.append({
            "finding": f"Exposed {service.upper()} Service on {host}:{port} ({cve})",
            "reason": f"{service.upper()} service is publicly accessible with identified vulnerability {cve}.",
            "evidence": [
                f"Host: {host}",
                f"Port: {port}",
                f"Service: {service}",
                f"CVE Identifier: {cve}",
                f"Severity Score: {v.get('score', 7.0)}"
            ],
            "impact": v.get("exploit_risk", f"Unauthorized remote access or service exploitation on {host}."),
            "recommendation": v.get("recommendation", f"Update {service} to the latest release and restrict network access."),
            "severity": severity,
            "host": host,
            "cve_id": cve
        })
        
    state["explained_findings"] = explained_findings
    state["reasoning_steps"].append({
        "stage": "Reasoning Engine",
        "action": "Generated 5-point explainable security insights",
        "findings_count": len(explained_findings)
    })
    
    return state
