from ai.risk_engine.risk_calculator import get_overall_risk

def generate_report(findings, attack_chains, llm_summary):
    overall_risk = get_overall_risk(findings)
    
    report = {
        "executiveSummary": llm_summary,
        "overallRisk": overall_risk,
        "findingCount": len(findings),
        "criticalCount": len([f for f in findings if f.get('severity') == 'Critical']),
        "highCount": len([f for f in findings if f.get('severity') == 'High']),
    }
    
    return report
