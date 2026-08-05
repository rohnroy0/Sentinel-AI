from typing import List, Dict, Any

def build_remediation(risk_findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Build prioritized, enriched remediation steps for security findings."""
    sev_order = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1, "Info": 0}
    difficulty_map = {
        "RULE_001": "Easy",
        "RULE_002": "Medium",
        "RULE_003": "Easy",
        "RULE_004": "Easy",
        "RULE_005": "Medium",
        "RULE_006": "Medium",
        "RULE_007": "Medium",
        "RULE_008": "Easy",
        "RULE_009": "Easy",
        "RULE_010": "Easy",
        "RULE_011": "Medium",
        "RULE_012": "Easy",
        "RULE_013": "Easy",
        "RULE_014": "Medium",
        "RULE_015": "Hard",
        "RULE_016": "Medium",
        "RULE_017": "Easy",
        "RULE_018": "Easy",
        "RULE_019": "Easy",
    }
    why_map = {
        "RULE_001": "Allows any attacker with valid credentials to gain full root access to the system via the network, bypassing all privilege escalation steps.",
        "RULE_002": "CVE-2021-41773 permits unauthenticated remote path traversal and Remote Code Execution. This is a known and actively exploited vulnerability.",
        "RULE_003": "TLS 1.0 supports cipher suites with known weaknesses susceptible to BEAST and POODLE attacks, enabling traffic decryption.",
        "RULE_004": "FTP transmits all login credentials and transferred files in unencrypted cleartext, exposing them to network sniffing.",
        "RULE_005": "An open MySQL port directly exposed to the internet increases the surface for brute-force attacks, SQL injection, and data exfiltration.",
        "RULE_006": "SMB is frequently targeted by ransomware and lateral movement exploits (e.g. EternalBlue). Public exposure is high risk.",
        "RULE_007": "Exposed RDP ports are the single primary initial access vector for ransomware campaigns worldwide.",
        "RULE_008": "Telnet sends commands and credentials in plain text across the network.",
        "RULE_009": "SMTP relays can be abused for spamming, phishing campaign delivery, or internal network reconnaissance.",
        "RULE_010": "DNS zone transfers can leak the entire internal network topology and hostname dictionary.",
    }

    remediations = []
    seen = set()

    for idx, f in enumerate(risk_findings):
        rule_id = f.get("rule_id", f"RULE_{idx+1:03d}")
        title = f.get("title") or f.get("finding") or f.get("service") or "Security Misconfiguration"
        sev = (f.get("severity") or "High").capitalize()
        if sev not in sev_order:
            sev = "High"

        rec = f.get("recommendation") or f.get("remediation")
        if not rec:
            svc = (f.get("service") or "service").lower()
            if "ssh" in svc:
                rec = f"Upgrade {svc.upper()} to the latest secure release, disable root password login, and enforce SSH key authentication."
            elif "http" in svc or "apache" in svc or "nginx" in svc:
                rec = f"Apply latest security updates to {svc.upper()}, restrict administrative endpoints, and deploy a Web Application Firewall."
            elif "mysql" in svc or "db" in svc or "postgres" in svc:
                rec = f"Bind {svc.upper()} database exclusively to localhost/internal network interfaces and enforce strong password authentication."
            elif "ftp" in svc:
                rec = "Migrate from unencrypted FTP to SFTP/FTPS and enforce strict user access permissions."
            elif "rdp" in svc:
                rec = "Restrict RDP access behind a VPN, enable Network Level Authentication (NLA), and enforce MFA."
            elif "telnet" in svc:
                rec = "Decommission Telnet service immediately and replace with SSH."
            else:
                rec = f"Update {svc.upper()} to the latest version and restrict network access via firewall rules."

        why = why_map.get(rule_id, f.get("why") or f.get("impact") or "Public exposure increases the threat surface for unauthorized access.")
        diff = difficulty_map.get(rule_id, "Medium")
        cve = f.get("cve_id") or f.get("cve") or "N/A"
        port = f.get("port") or "N/A"
        host = f.get("host") or "192.168.1.10"

        key = f"{rule_id}:{cve}:{port}"
        if key in seen:
            continue
        seen.add(key)

        remediations.append({
            "id": f"REM-{idx+1:03d}",
            "finding_title": title,
            "rule_id": rule_id,
            "cve": cve,
            "port": port,
            "host": host,
            "severity": sev,
            "priority": "P1 - Immediate" if sev in ["Critical", "High"] else "P2 - Planned",
            "action": rec,
            "why_it_matters": why,
            "difficulty": diff,
            "estimated_time": "15-30 mins" if diff == "Easy" else ("1-2 hours" if diff == "Medium" else "3-5 hours"),
            "verification_step": f"Re-scan target host {host} port {port} to confirm access restriction and version update.",
            "impact_reduction": f"Reduces attack surface for host {host} on port {port} ({cve})."
        })

    remediations.sort(key=lambda r: sev_order.get(r["severity"], 0), reverse=True)
    return remediations
