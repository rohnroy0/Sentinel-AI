from typing import List, Dict, Any
from ai.attack_chain_builder.builder import build_chains
from ai.investigation_graph.builder import build_investigation_graph

def run(discovered_hosts: List[Dict[str, Any]], vulnerabilities: List[Dict[str, Any]], remediations: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Tool: Attack Graph Tool
    Wraps existing attack chain builder and investigation graph.
    """
    formatted_risk_findings = []
    for i, v in enumerate(vulnerabilities or []):
        title = v.get("title") or f"Exposed {v.get('service', 'service')} ({v.get('cve_id', 'CVE-Unknown')})"
        formatted_risk_findings.append({
            "id": v.get("id", f"finding-{i}"),
            "rule_id": v.get("rule_id", f"RULE_00{i+1}"),
            "title": title,
            "severity": v.get("severity", "High"),
            "confidence": v.get("confidence", "High"),
            "host": v.get("host", "192.168.1.10"),
            "port": v.get("port", "80"),
            "service": v.get("service", "http"),
            "cve_id": v.get("cve_id") or v.get("cve"),
            "cve": v.get("cve_id") or v.get("cve"),
            "mitre": v.get("mitre") or v.get("mitre_technique"),
            "cwe": v.get("cwe"),
            "riskLevel": v.get("riskLevel") or f"{v.get('severity', 'High')} Exposure",
            "evidence": v.get("evidence", [f"Identified vulnerable service {v.get('service')}"]),
        })
        
    # Generate default remediations if none provided
    rems = remediations or []
    if not rems:
        for i, f in enumerate(formatted_risk_findings):
            rems.append({
                "id": f.get("id"),
                "priority": i + 1,
                "rule_id": f.get("rule_id", f"RULE_00{i+1}"),
                "title": f"Mitigate {f.get('title', 'Security Finding')}",
                "action": f"Patch {f.get('service', 'service')} and restrict network exposure on port {f.get('port', '80')}.",
                "severity": f.get("severity", "High"),
                "estimated_difficulty": "Medium",
                "why": "Eliminate security exposure and potential exploit vectors.",
                "improvement": f"Secures host {f.get('host', 'target')} against unauthorized compromise."
            })
    
    chains = build_chains(formatted_risk_findings, discovered_hosts=discovered_hosts, remediations=rems)
    
    investigation_graph = build_investigation_graph(
        parsed_data={"open_ports": discovered_hosts},
        detected_services=discovered_hosts,
        rule_findings=formatted_risk_findings,
        risk_findings=formatted_risk_findings,
        chain_data=chains,
        remediation=rems,
    )
    
    return {
        "status": "success",
        "attack_chains": [chains],
        "investigation_graph": investigation_graph
    }
