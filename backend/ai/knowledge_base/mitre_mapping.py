from typing import Dict, Any, List

MITRE_TECHNIQUE_MAP = {
    "ssh": {
        "id": "T1021.004",
        "name": "Remote Services: SSH",
        "tactic": "Lateral Movement / Initial Access",
        "description": "Adversaries may use SSH to log into remote machines and execute commands."
    },
    "rdp": {
        "id": "T1021.001",
        "name": "Remote Services: Remote Desktop Protocol",
        "tactic": "Lateral Movement",
        "description": "Adversaries may connect to Remote Desktop Protocol to interact with remote systems."
    },
    "ftp": {
        "id": "T1071.002",
        "name": "Application Layer Protocol: File Transfer Protocols",
        "tactic": "Command and Control / Exfiltration",
        "description": "Adversaries may communicate using FTP to transfer stolen data or malicious files."
    },
    "http": {
        "id": "T1190",
        "name": "Exploit Public-Facing Application",
        "tactic": "Initial Access",
        "description": "Adversaries may attempt to exploit vulnerabilities in web services accessible from the internet."
    },
    "https": {
        "id": "T1190",
        "name": "Exploit Public-Facing Application",
        "tactic": "Initial Access",
        "description": "Adversaries may exploit web application vulnerabilities accessible over TLS/SSL."
    },
    "mysql": {
        "id": "T1046",
        "name": "Network Service Discovery / Exposed Database",
        "tactic": "Discovery / Initial Access",
        "description": "Directly accessible database ports allow adversaries to launch network scanning or brute-force attacks."
    },
    "postgresql": {
        "id": "T1046",
        "name": "Network Service Discovery / Exposed PostgreSQL",
        "tactic": "Discovery / Initial Access",
        "description": "Exposed PostgreSQL service allows network service scanning and authentication attacks."
    },
    "mongodb": {
        "id": "T1046",
        "name": "Network Service Discovery / Exposed MongoDB",
        "tactic": "Discovery / Initial Access",
        "description": "Exposed MongoDB service endpoint permits network discovery and unauthorized query attempts."
    },
    "redis": {
        "id": "T1046",
        "name": "Network Service Discovery / Exposed Redis",
        "tactic": "Discovery / Initial Access",
        "description": "Publicly listening Redis in-memory cache allows remote service discovery and unauthenticated access."
    },
    "elasticsearch": {
        "id": "T1046",
        "name": "Network Service Discovery / Exposed Search Cluster",
        "tactic": "Discovery / Initial Access",
        "description": "Unauthenticated Elasticsearch cluster permits remote index enumeration and service discovery."
    },
    "telnet": {
        "id": "T1021.002",
        "name": "Remote Services: Unencrypted Telnet",
        "tactic": "Lateral Movement / Credential Access",
        "description": "Telnet communicates in plaintext, enabling unauthenticated sniffing and session hijacking."
    },
    "smb": {
        "id": "T1021.002",
        "name": "Remote Services: SMB/Windows Admin Shares",
        "tactic": "Lateral Movement",
        "description": "Adversaries may use SMB to execute commands or spread laterally across Windows network shares."
    },
    "winrm": {
        "id": "T1021.006",
        "name": "Remote Services: Windows Remote Management",
        "tactic": "Lateral Movement",
        "description": "Adversaries may use WinRM to execute remote management commands."
    }
}

def validate_mitre_mapping(service: str, vuln_type: str = "", cve: str = "", exposure_reason: str = "", candidate_technique: str = "") -> Dict[str, Any]:
    """
    Validates candidate MITRE technique against service type and evidence,
    preventing unrealistic mappings (e.g. database scan exposure mapped to T1213 exfiltration).
    """
    svc_lower = str(service or "").lower()
    candidate_id = str(candidate_technique or "").split(" ")[0].upper()

    # Rule 1: Databases exposed on public ports must NOT map to T1213 (exfiltration) unless explicit exfiltration proof exists
    is_db = any(db_kw in svc_lower for db_kw in ["mysql", "postgres", "mongodb", "redis", "elasticsearch"])
    if is_db and "T1213" in candidate_id and "exfiltration" not in str(exposure_reason).lower():
        return {
            "id": "T1046",
            "name": "Network Service Discovery / Exposed Database",
            "tactic": "Discovery / Initial Access",
            "description": "Directly accessible database ports allow network scanning and initial access attempts."
        }

    # Rule 2: Web / HTTP services with CVE -> T1190
    if ("http" in svc_lower or "web" in svc_lower or "apache" in svc_lower or "nginx" in svc_lower or "iis" in svc_lower) and cve and cve != "N/A":
        return {
            "id": "T1190",
            "name": "Exploit Public-Facing Application",
            "tactic": "Initial Access",
            "description": "Adversaries may exploit vulnerabilities in web services accessible from the internet."
        }

    # Rule 3: Direct service lookup fallback
    return map_service_to_mitre(service)

def map_service_to_mitre(service_name: str) -> Dict[str, Any]:
    key = service_name.lower()
    for s_key, mitre_data in MITRE_TECHNIQUE_MAP.items():
        if s_key in key:
            return mitre_data
    return {
        "id": "T1046",
        "name": "Network Service Discovery",
        "tactic": "Discovery",
        "description": "Adversaries may attempt to get a listing of services running on remote hosts."
    }

def map_findings_to_mitre(findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    enriched = []
    for f in findings:
        service = f.get("service", f.get("title", ""))
        cve = f.get("cve_id") or f.get("cve") or "N/A"
        cand = f.get("mitre") or f.get("mitre_technique") or ""
        
        mitre = validate_mitre_mapping(
            service=service,
            cve=cve,
            exposure_reason=str(f.get("evidence", "")),
            candidate_technique=cand
        )
        
        f_copy = dict(f)
        f_copy["mitre_technique"] = mitre["id"]
        f_copy["mitre_name"] = mitre["name"]
        f_copy["mitre_tactic"] = mitre["tactic"]
        f_copy["mitre"] = f"{mitre['id']} - {mitre['name']}"
        enriched.append(f_copy)
    return enriched
