def analyze_results(findings, attack_chains):
    # In a real scenario, this would call OpenAI API or Ollama.
    # Here we mock the LLM explanation based on the deterministic findings.
    
    if not findings:
        return "No significant security misconfigurations were detected during the investigation."
        
    critical_count = len([f for f in findings if f['severity'] == 'Critical'])
    high_count = len([f for f in findings if f['severity'] == 'High'])
    
    summary = f"Sentinel analyzed the uploaded scan and identified {critical_count} critical and {high_count} high-risk misconfigurations. "
    
    if critical_count > 0:
        summary += "Immediate remediation is required to prevent remote compromise. The generated attack chains indicate direct paths from the public internet to sensitive internal services."
    else:
        summary += "Please review the identified findings and apply the recommended remediation steps."
        
    return summary
