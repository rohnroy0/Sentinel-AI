from typing import List, Dict, Any, Optional, Tuple

SENSITIVE_PORTS = {
    "21", "22", "23", "25", "53", "80", "110", "135", "139", "143",
    "443", "445", "1433", "1521", "2049", "2375", "2376", "3306",
    "3389", "5432", "5900", "5985", "5986", "6379", "6443", "8080",
    "8443", "9200", "9300", "10250", "27017"
}

SEV_WEIGHTS = {
    "Critical": 25.0,
    "High": 14.0,
    "Medium": 6.0,
    "Low": 2.0,
    "Info": 0.5,
}

def calculate_risk(enriched_findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    for finding in enriched_findings:
        rule_id = finding.get("rule_id")

        # Deterministic Risk Scoring
        if rule_id == "RULE_001":  # Root Login
            finding["severity"] = "Critical"
            finding["riskLevel"] = "High Risk Remote Access"

        elif rule_id == "RULE_002":  # Apache 2.4.49 (RCE)
            finding["severity"] = "Critical"
            finding["riskLevel"] = "Possible Remote Code Execution"

        elif rule_id == "RULE_003":  # TLS 1.0
            finding["severity"] = "Medium"
            finding["riskLevel"] = "Weak Encryption Configuration"

        elif rule_id == "RULE_004":  # FTP Anon
            finding["severity"] = "High"
            finding["riskLevel"] = "Anonymous File Access Risk"

        # ─── Windows & Active Directory ──────────────────────────────────
        elif rule_id == "RULE_005":  # Windows Server
            finding["severity"] = "High"
            finding["riskLevel"] = "Windows Server Service Exposed"
        elif rule_id == "RULE_006":  # Active Directory
            finding["severity"] = "High"
            finding["riskLevel"] = "Active Directory Authentication Surface"
        elif rule_id == "RULE_007":  # IIS
            finding["severity"] = "Medium"
            finding["riskLevel"] = "Microsoft IIS Web Server Exposed"
        elif rule_id == "RULE_008":  # SMB
            finding["severity"] = "High"
            finding["riskLevel"] = "SMB File Sharing Exposed"
        elif rule_id == "RULE_009":  # LDAP
            finding["severity"] = "Medium"
            finding["riskLevel"] = "LDAP Authentication Service Exposed"
        elif rule_id == "RULE_010":  # RDP
            finding["severity"] = "High"
            finding["riskLevel"] = "Remote Desktop Protocol Exposed"
        elif rule_id == "RULE_011":  # WinRM
            finding["severity"] = "Critical"
            finding["riskLevel"] = "Windows Remote Management Exposed"

        # ─── DevOps / Data tier ──────────────────────────────────────────
        elif rule_id == "RULE_012":  # Jenkins
            finding["severity"] = "High"
            finding["riskLevel"] = "Continuous Integration Server Exposed"
        elif rule_id == "RULE_013":  # Redis
            finding["severity"] = "Medium"
            finding["riskLevel"] = "In-Memory Data Store Exposed"
        elif rule_id == "RULE_014":  # Docker
            finding["severity"] = "Critical"
            finding["riskLevel"] = "Container Daemon API Exposed"
        elif rule_id == "RULE_015":  # Kubernetes
            finding["severity"] = "Critical"
            finding["riskLevel"] = "Container Orchestration API Exposed"
        elif rule_id == "RULE_016":  # Elasticsearch
            finding["severity"] = "Critical"
            finding["riskLevel"] = "Search and Analytics Cluster Exposed"
        elif rule_id == "RULE_017":  # MongoDB
            finding["severity"] = "Medium"
            finding["riskLevel"] = "Document Database Exposed"
        elif rule_id == "RULE_018":  # PostgreSQL
            finding["severity"] = "Medium"
            finding["riskLevel"] = "PostgreSQL Database Exposed"
        elif rule_id == "RULE_019":  # MySQL
            finding["severity"] = "Medium"
            finding["riskLevel"] = "MySQL Database Exposed"

        else:
            if not finding.get("severity"):
                finding["severity"] = "Info"
            if not finding.get("riskLevel"):
                finding["riskLevel"] = "Informational"

        # Format Remediation from context
        context = finding.get("context", {})
        if "remediation_template" in context:
            finding["remediation"] = context["remediation_template"]
        elif not finding.get("remediation"):
            finding["remediation"] = "Review and apply standard hardening guidelines."

    return enriched_findings


def get_overall_risk(findings: List[Dict[str, Any]]) -> str:
    if not findings:
        return "Info"
    severities = [f.get("severity") for f in findings if f.get("severity")]
    if "Critical" in severities:
        return "Critical"
    if "High" in severities:
        return "High"
    if "Medium" in severities:
        return "Medium"
    if "Low" in severities:
        return "Low"
    return "Info"


def calculate_dynamic_risk_score(
    findings: List[Dict[str, Any]],
    detected_services: Optional[List[Dict[str, Any]]] = None,
    chain_data: Optional[Dict[str, Any]] = None
) -> Tuple[int, str]:
    """
    Calculates dynamic risk score (0-100) and severity level based on:
    - Finding counts & severity weights
    - CVSS ratings from CVE lookups
    - Exposed network services & sensitive port exposures
    - Multi-stage attack chain depth
    """
    if not findings and not detected_services:
        return 0, "Info"

    counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Info": 0}
    cvss_scores = []
    
    for f in findings:
        raw_sev = str(f.get("severity", "Info")).capitalize()
        sev = raw_sev if raw_sev in counts else "Info"
        counts[sev] += 1
        
        # Extract CVSS if present
        cvss = f.get("cvss") or f.get("cvss_score") or f.get("score") or (f.get("context") or {}).get("cvss")
        if cvss is not None:
            try:
                cvss_scores.append(float(cvss))
            except (ValueError, TypeError):
                pass

    # 1. Base Score calculation according to highest severity category
    n_crit = counts["Critical"]
    n_high = counts["High"]
    n_med = counts["Medium"]
    n_low = counts["Low"]
    n_info = counts["Info"]
    
    services = detected_services or []
    n_services = len(services)
    
    if n_crit > 0:
        base_score = 80.0 + min(12.0, (n_crit - 1) * 4.0 + n_high * 2.5 + n_med * 1.0)
    elif n_high > 0:
        base_score = 58.0 + min(18.0, (n_high - 1) * 4.5 + n_med * 2.0 + n_low * 0.8)
    elif n_med > 0:
        base_score = 34.0 + min(20.0, (n_med - 1) * 5.0 + n_low * 2.0 + n_info * 0.5)
    elif n_low > 0:
        base_score = 16.0 + min(16.0, (n_low - 1) * 3.5 + n_info * 0.8)
    elif n_services > 0:
        base_score = 6.0 + min(8.0, (n_services - 1) * 1.0)
    else:
        base_score = 0.0

    # 2. CVSS Score Influence
    if cvss_scores:
        max_cvss = max(cvss_scores)
        cvss_delta = (max_cvss * 10.0 - base_score) * 0.2
        base_score += cvss_delta

    # 3. Exposure Additive (Sensitive ports & attack surface)
    sensitive_count = 0
    for s in services:
        p = str(s.get("port", s.get("portid", ""))).split("/")[0].strip()
        if p in SENSITIVE_PORTS:
            sensitive_count += 1
    for f in findings:
        p = str(f.get("port", (f.get("raw_port") or {}).get("port", ""))).split("/")[0].strip()
        if p in SENSITIVE_PORTS:
            sensitive_count += 1
            
    exposure_additive = min(5.0, sensitive_count * 1.2) + min(3.0, n_services * 0.4)

    # 4. Attack Chain Progression Additive
    chain_additive = 0.0
    if chain_data:
        nodes = chain_data.get("nodes", []) if isinstance(chain_data, dict) else []
        stage_nodes = [n for n in nodes if n.get("id") not in ("start", "mitre-start")]
        if len(stage_nodes) >= 3:
            chain_additive = 4.0
        elif len(stage_nodes) >= 1:
            chain_additive = 2.0

    # Final calculated score
    total_score = round(base_score + exposure_additive + chain_additive)
    total_score = max(0, min(100, total_score))

    # Determine Severity Level
    if total_score >= 80:
        level = "Critical"
    elif total_score >= 60:
        level = "High"
    elif total_score >= 40:
        level = "Medium"
    elif total_score >= 15:
        level = "Low"
    else:
        level = "Info" if total_score > 0 else "None"

    return total_score, level


def build_dynamic_risk_dashboard(
    findings: List[Dict[str, Any]],
    detected_services: Optional[List[Dict[str, Any]]] = None,
    chain_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Builds the full active investigation risk dashboard model with real dynamic
    scores, counts, distributions, top findings, and exposed services.
    """
    sev_order = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1, "Info": 0}
    counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Info": 0}
    for f in findings:
        raw_sev = str(f.get("severity", "Info")).capitalize()
        sev = raw_sev if raw_sev in counts else "Info"
        counts[sev] += 1

    score, level = calculate_dynamic_risk_score(
        findings=findings,
        detected_services=detected_services,
        chain_data=chain_data
    )

    # Build Top Services
    services_list = []
    seen_services = set()
    for s in (detected_services or []):
        port_num = s.get("port") or s.get("portid") or "?"
        svc_name = s.get("service") or s.get("name") or "unknown"
        key = f"{port_num}:{svc_name}"
        if key not in seen_services:
            seen_services.add(key)
            matching_f = next((f for f in findings if str(f.get("port")) == str(port_num)), None)
            services_list.append({
                "port": str(port_num),
                "service": str(svc_name),
                "severity": matching_f.get("severity", "Info") if matching_f else "Info",
                "finding": matching_f.get("title", f"Service {svc_name} on port {port_num}") if matching_f else f"Port {port_num} active"
            })

    for f in findings:
        raw_p = f.get("raw_port") or {}
        port_num = f.get("port") or raw_p.get("port")
        if port_num:
            svc_name = f.get("service") or raw_p.get("service", "service")
            key = f"{port_num}:{svc_name}"
            if key not in seen_services:
                seen_services.add(key)
                services_list.append({
                    "port": str(port_num),
                    "service": str(svc_name),
                    "severity": f.get("severity", "Info"),
                    "finding": f.get("title", f"Vulnerability on port {port_num}")
                })

    services_list.sort(key=lambda s: sev_order.get(s.get("severity", "Info"), 0), reverse=True)
    sorted_findings = sorted(findings, key=lambda x: sev_order.get(x.get("severity", "Info"), 0), reverse=True)
    top_findings = sorted_findings[:3]

    most_dangerous = ""
    chain_nodes_count = 0
    if chain_data and isinstance(chain_data, dict) and chain_data.get("nodes"):
        labels = [n.get("label") or (n.get("data") or {}).get("label") or n.get("id") for n in chain_data["nodes"] if (n.get("label") or (n.get("data") or {}).get("label") or n.get("id"))]
        most_dangerous = " → ".join(labels)
        chain_nodes_count = len(chain_data["nodes"])
    elif sorted_findings:
        tf = sorted_findings[0]
        most_dangerous = f"Internet Exposure → {tf.get('service', 'Service').upper()} Port {tf.get('port', '80')} → {tf.get('title', 'Vulnerability')}"
        chain_nodes_count = 3

    return {
        "overallRisk": level,
        "overallScore": score,
        "counts": counts,
        "topFindings": top_findings,
        "topServices": services_list[:5],
        "mostDangerousPath": most_dangerous,
        "attackChainNodesCount": chain_nodes_count,
        "distribution": [
            {"name": "Critical", "value": counts["Critical"], "color": "#EF4444"},
            {"name": "High", "value": counts["High"], "color": "#F97316"},
            {"name": "Medium", "value": counts["Medium"], "color": "#EAB308"},
            {"name": "Low", "value": counts["Low"], "color": "#3B82F6"},
            {"name": "Info", "value": counts["Info"], "color": "#6B7280"},
        ]
    }