from typing import List, Dict, Any
from ai.risk_engine.risk_calculator import calculate_risk, get_overall_risk, build_dynamic_risk_dashboard

def run(discovered_hosts: List[Dict[str, Any]], vulnerabilities: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Tool: Risk Analysis Tool
    Wraps dynamic risk calculator engine.
    """
    risk_findings = []
    for v in vulnerabilities:
        service_str = str(v.get("service", "")).lower()
        version_str = str(v.get("version", ""))
        
        rule_id = "RULE_019"
        if "2.4.49" in version_str or "apache" in service_str:
            rule_id = "RULE_002"
        elif "ssh" in service_str:
            rule_id = "RULE_001"
        elif "ftp" in service_str:
            rule_id = "RULE_004"
        elif "rdp" in service_str:
            rule_id = "RULE_010"

        risk_findings.append({
            "rule_id": rule_id,
            "title": f"Exposed Service {v.get('service')} ({v.get('cve_id')})",
            "severity": v.get("severity", "Medium"),
            "host": v.get("host"),
            "port": str(v.get("port", "80")),
            "service": v.get("service", ""),
            "cve_id": v.get("cve_id", "")
        })
        
    enriched = calculate_risk(risk_findings)
    risk_dash = build_dynamic_risk_dashboard(enriched, detected_services=discovered_hosts)
    
    return {
        "status": "success",
        "overall_score": risk_dash["overallScore"],
        "overall_category": risk_dash["overallRisk"],
        "risk_dashboard": risk_dash,
        "enriched_findings": enriched
    }

