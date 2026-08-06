from typing import List, Dict, Any

def get_service_category(service: str, port: Any) -> str:
    s = str(service or "").lower()
    p = str(port or "").strip()
    if p in ("139", "445") or "smb" in s or "netbios" in s or "microsoft-ds" in s:
        return "smb"
    if p in ("389", "636", "3268", "3269") or "ldap" in s:
        return "ldap"
    if p in ("80", "443", "8080", "8443") or "http" in s:
        return "http"
    if p == "22" or "ssh" in s:
        return "ssh"
    if p == "21" or "ftp" in s:
        return "ftp"
    if p == "3389" or "rdp" in s or "ms-wbt-server" in s:
        return "rdp"
    if p == "3306" or "mysql" in s:
        return "mysql"
    if p == "5432" or "postgres" in s:
        return "postgresql"
    if p == "6379" or "redis" in s:
        return "redis"
    if p == "27017" or "mongodb" in s:
        return "mongodb"
    if p in ("9200", "9300") or "elastic" in s:
        return "elasticsearch"
    if p in ("5985", "5986") or "winrm" in s:
        return "winrm"
    return s or f"port_{p}"

def correlate_and_deduplicate_findings(risk_findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Correlates and deduplicates findings on the same host, service category, and rule_id.
    Merges affected ports and retains all forensic evidence without loss.
    """
    if not risk_findings:
        return []

    sev_weights = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1, "Info": 0}
    grouped = {}
    order = []

    for f in risk_findings:
        if not isinstance(f, dict):
            continue
        host = f.get("host") or "Unknown Host"
        port = str(f.get("port") or f.get("port_num") or "0")
        service = f.get("service") or f.get("title") or "unknown"
        rule_id = f.get("rule_id") or f.get("finding_id") or "GENERAL"
        svc_cat = get_service_category(service, port)

        group_key = f"{host}:{svc_cat}:{rule_id}"
        if group_key not in grouped:
            grouped[group_key] = []
            order.append(group_key)
        grouped[group_key].append(f)

    correlated_findings = []
    for key in order:
        group = grouped[key]
        primary = dict(group[0])

        # Collect unique ports & evidence across the group
        all_ports = []
        all_evidence = []
        highest_sev = primary.get("severity", "Info")

        for f in group:
            p_val = str(f.get("port", "")).strip()
            if p_val and p_val not in all_ports:
                all_ports.append(p_val)

            # Accumulate evidence
            ev = f.get("evidence", [])
            if isinstance(ev, list):
                for item in ev:
                    if item not in all_evidence:
                        all_evidence.append(item)
            elif isinstance(ev, str) and ev not in all_evidence:
                all_evidence.append(ev)

            # Track highest severity
            f_sev = f.get("severity", "Info")
            if sev_weights.get(f_sev, 0) > sev_weights.get(highest_sev, 0):
                highest_sev = f_sev

        merged_port_str = ", ".join(all_ports) if all_ports else str(primary.get("port", ""))
        
        # Build clean correlated title if multiple ports are merged
        svc_cat = get_service_category(primary.get("service", ""), all_ports[0] if all_ports else "")
        if len(all_ports) > 1:
            if svc_cat == "smb":
                primary["title"] = "SMB Service Exposure"
                all_evidence.insert(0, f"Multiple SMB services exposed externally on ports {merged_port_str}.")
            else:
                primary["title"] = f"{svc_cat.upper()} Service Exposure"
                all_evidence.insert(0, f"Multiple {svc_cat.upper()} services exposed externally on ports {merged_port_str}.")
        
        primary["port"] = merged_port_str
        primary["affected_ports"] = all_ports
        primary["severity"] = highest_sev
        primary["evidence"] = all_evidence

        correlated_findings.append(primary)

    return correlated_findings


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

