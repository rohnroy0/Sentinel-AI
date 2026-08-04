def correlate_findings(risk_findings):
    # Returns graph format { nodes: [], edges: [] }
    nodes = []
    edges = []
    
    for finding in risk_findings:
        # Node for the finding
        finding_node_id = f"finding_{finding['id']}"
        nodes.append({"id": finding_node_id, "data": {"label": finding['title']}})
        
        # Node for the Risk Condition
        risk_node_id = f"risk_{finding['id']}"
        nodes.append({"id": risk_node_id, "data": {"label": finding['riskLevel']}})
        
        # Edge linking them
        edges.append({"id": f"e_{finding_node_id}_{risk_node_id}", "source": finding_node_id, "target": risk_node_id})
        
        # Node for CWE or MITRE if present
        context = finding.get('context', {})
        if 'mitre_technique' in context:
            mitre_node_id = f"mitre_{finding['id']}"
            nodes.append({"id": mitre_node_id, "data": {"label": context['mitre_technique']}})
            edges.append({"id": f"e_{risk_node_id}_{mitre_node_id}", "source": risk_node_id, "target": mitre_node_id})

    return {"nodes": nodes, "edges": edges}
