from typing import List, Dict, Any

def analyze_results(findings: List[Dict[str, Any]], attack_chains: Any = None) -> str:
    """
    Generates a professional SOC executive summary narrative suitable for security analysts
    and executive management.
    """
    if not findings:
        return "The Sentinel investigation completed with no actionable security findings detected across the target infrastructure."

    sev_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Info": 0}
    unique_hosts = set()
    services_seen = set()

    critical_findings = []
    high_findings = []

    for f in findings:
        sev = str(f.get("severity", "Info")).capitalize()
        if sev not in sev_counts:
            sev = "Info"
        sev_counts[sev] += 1

        host = f.get("host")
        if host:
            unique_hosts.add(host)
        svc = f.get("service") or f.get("title", "")
        if svc:
            services_seen.add(str(svc).upper())

        if sev == "Critical":
            critical_findings.append(f)
        elif sev == "High":
            high_findings.append(f)

    total_findings = len(findings)
    host_count = len(unique_hosts) if unique_hosts else 1

    # Determine overall risk
    if sev_counts["Critical"] > 0:
        overall_risk = "CRITICAL"
    elif sev_counts["High"] > 0:
        overall_risk = "HIGH"
    elif sev_counts["Medium"] > 0:
        overall_risk = "MEDIUM"
    else:
        overall_risk = "LOW"

    # Identify most dangerous finding
    top_finding = critical_findings[0] if critical_findings else (high_findings[0] if high_findings else findings[0])
    top_title = top_finding.get("title") or top_finding.get("finding") or "Security Misconfiguration"
    top_cve = top_finding.get("cve_id") or top_finding.get("cve")
    cve_clause = f" ({top_cve})" if top_cve and top_cve != "N/A" else ""

    # Identify primary attack vector
    services_str = ", ".join(list(services_seen)[:4]) if services_seen else "network services"
    if any("apache" in str(f.get("title", "")).lower() or "http" in str(f.get("service", "")).lower() for f in findings):
        primary_vector = "Exploitation of Public-Facing Application"
    elif any(s in services_str.lower() for s in ["ssh", "rdp", "smb", "winrm"]):
        primary_vector = "Exposed Remote Services"
    elif any(s in services_str.lower() for s in ["mysql", "postgres", "redis", "mongodb", "elasticsearch"]):
        primary_vector = "Publicly Accessible Database Services"
    else:
        primary_vector = "Exposed Network Services & Misconfigurations"

    summary_paragraphs = [
        f"The Sentinel AI investigation identified a {overall_risk} external attack surface risk across {host_count} target asset(s). "
        f"A total of {total_findings} security finding(s) were isolated, including {sev_counts['Critical']} Critical and {sev_counts['High']} High severity issue(s).",
        
        f"The primary attack vector is {primary_vector}. The most severe threat identified is {top_title}{cve_clause}, "
        f"which presents an immediate risk of unauthorized access or exploitation. Additional exposed services include {services_str}.",
        
        "Recommended Priority Actions: (1) Immediately isolate and patch identified Critical/High vulnerabilities; "
        "(2) Enforce Network Level Authentication (NLA), SSH public key controls, and IP whitelist boundaries for remote management; "
        "(3) Restrict database and internal service ports behind VPN boundaries and perimeter firewalls."
    ]

    return "\n\n".join(summary_paragraphs)
