def analyze_results(findings, attack_chains):
    if not findings:
        return "No findings available for analysis."
        
    summary_parts = [f"Analysis of {len(findings)} findings:"]
    
    for idx, f in enumerate(findings):
        evidence = f.get('evidence', [])
        evidence_str = "; ".join(evidence) if isinstance(evidence, list) else str(evidence)
        summary_parts.append(f"{idx+1}. {f.get('title')} (Risk: {f.get('severity')}) - Evidence: {evidence_str}")
        
    return "\n".join(summary_parts)
