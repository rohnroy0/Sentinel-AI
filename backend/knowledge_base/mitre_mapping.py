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
        "id": "T1078",
        "name": "Valid Accounts / Exposed Database Services",
        "tactic": "Initial Access / Persistence",
        "description": "Directly accessible database ports allow adversaries to launch brute-force or credential abuse attacks."
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
    }
}

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
        mitre = map_service_to_mitre(service)
        f_copy = dict(f)
        f_copy["mitre_technique"] = mitre["id"]
        f_copy["mitre_name"] = mitre["name"]
        f_copy["mitre_tactic"] = mitre["tactic"]
        enriched.append(f_copy)
    return enriched
