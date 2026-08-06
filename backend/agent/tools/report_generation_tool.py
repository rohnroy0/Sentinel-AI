from typing import List, Dict, Any
from ai.llm.analyzer import analyze_results
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
    llm_summary = analyze_results(vulnerabilities, attack_chains)
    
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
