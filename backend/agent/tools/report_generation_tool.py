from typing import Dict, Any, List
from ai.report_generator.generator import generate_report

def run(discovered_hosts: List[Dict[str, Any]], 
        vulnerabilities: List[Dict[str, Any]], 
        risk_data: Dict[str, Any], 
        attack_chains: List[Any],
        memory_summary: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Tool: Report Generation Tool
    Wraps existing report generator module.
    """
    llm_summary = (
        f"Autonomous investigation completed for {len(discovered_hosts)} target host(s). "
        f"Identified {len(vulnerabilities)} vulnerability finding(s). "
        f"Overall risk assessment: {risk_data.get('overall_category', 'HIGH')}."
    )
    
    report = generate_report(
        findings=vulnerabilities,
        attack_chains=attack_chains,
        llm_summary=llm_summary
    )
    
    if memory_summary and isinstance(report, dict):
        report["memory_insights"] = memory_summary
        
    return {
        "status": "success",
        "report": report
    }
