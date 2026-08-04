from typing import List, Dict, Any
from knowledge_base.mitre_mapping import map_findings_to_mitre

def run(vulnerabilities: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Tool: Threat Intelligence Tool
    Wraps MITRE ATT&CK knowledge mapping and security context.
    """
    mitre_enriched = map_findings_to_mitre(vulnerabilities)
    
    return {
        "status": "success",
        "mitre_findings": mitre_enriched
    }
