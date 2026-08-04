def build_chains(risk_findings):
    nodes = []
    edges = []
    
    # We will build a simulated attack chain if Critical/High risks exist
    has_critical = any(f['severity'] == 'Critical' for f in risk_findings)
    has_high = any(f['severity'] == 'High' for f in risk_findings)
    
    nodes.append({"id": "start", "data": {"label": "Internet"}})
    
    if has_critical:
        # e.g., SSH Root Login or Apache RCE
        target_finding = next((f for f in risk_findings if f['severity'] == 'Critical'), None)
        if target_finding:
            nodes.append({"id": "vuln", "data": {"label": target_finding['title']}})
            nodes.append({"id": "exploit", "data": {"label": "Exploitation / Access"}})
            nodes.append({"id": "compromise", "data": {"label": "Full Server Compromise"}})
            
            edges.append({"id": "e1", "source": "start", "target": "vuln"})
            edges.append({"id": "e2", "source": "vuln", "target": "exploit"})
            edges.append({"id": "e3", "source": "exploit", "target": "compromise"})
    elif has_high:
        nodes.append({"id": "vuln", "data": {"label": "High Risk Exposure"}})
        nodes.append({"id": "impact", "data": {"label": "Partial Compromise / Data Leak"}})
        
        edges.append({"id": "e1", "source": "start", "target": "vuln"})
        edges.append({"id": "e2", "source": "vuln", "target": "impact"})
    else:
        nodes.append({"id": "end", "data": {"label": "No Critical Attack Path Detected"}})
        edges.append({"id": "e1", "source": "start", "target": "end"})
        
    return {"nodes": nodes, "edges": edges}
