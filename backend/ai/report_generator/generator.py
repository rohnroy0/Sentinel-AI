from ai.risk_engine.risk_calculator import get_overall_risk

def generate_report(findings, attack_chains, llm_summary):
    overall_risk = get_overall_risk(findings)
    
    mitre_nodes = []
    if attack_chains and "nodes" in attack_chains:
        mitre_nodes = [n for n in attack_chains["nodes"] if n.get("id", "").startswith("mitre-")]

    report = {
        "executiveSummary": llm_summary,
        "overallRisk": overall_risk,
        "findingCount": len(findings),
        "criticalCount": len([f for f in findings if f.get('severity') == 'Critical']),
        "highCount": len([f for f in findings if f.get('severity') == 'High']),
        "findings": findings,
        "mitreJourney": mitre_nodes,
    }
    
    return report
