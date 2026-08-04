import uuid

def apply_rules(parsed_data):
    findings = []

    # Always expose the full list of parsed services — the Findings page uses this
    # to render an investigation summary even when no rule fires.
    detected_services = list(parsed_data.get("open_ports", []))

    for port in detected_services:
        port_num = port["port"]
        service = port["service"]
        details = "\n".join(port["details"])
        version = port["version"].lower()

        # ─── Existing rules ───────────────────────────────────────────────
        # Rule 1: Root Login Enabled over SSH
        if port_num == "22" and "ssh" in service:
            if "Root login: yes" in details and "password" in details:
                findings.append({
                    "id": str(uuid.uuid4()),
                    "rule_id": "RULE_001",
                    "title": "Root Login Enabled",
                    "evidence": [f"SSH Port 22 Open", "Password Auth Enabled", "Root Login: yes"],
                    "confidence": "High",
                    "raw_port": port
                })

        # Rule 2: Apache 2.4.49 (Path Traversal / RCE)
        if "apache" in version and "2.4.49" in version:
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_002",
                "title": "Apache 2.4.49 Vulnerability (CVE-2021-41773)",
                "evidence": [f"Port {port_num} Open", f"Service Version: {port['version']}"],
                "confidence": "High",
                "raw_port": port
            })

        # Rule 3: TLS 1.0 Enabled
        if "TLSv1.0" in details:
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_003",
                "title": "TLS 1.0 Enabled",
                "evidence": [f"Port {port_num} Open", "TLSv1.0 Cipher Suites Detected"],
                "confidence": "Medium",
                "raw_port": port
            })

        # Rule 4: FTP Anonymous Login
        if port_num == "21" and "ftp-anon" in details:
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_004",
                "title": "FTP Anonymous Login Enabled",
                "evidence": [f"FTP Port 21 Open", "Anonymous FTP login allowed (FTP code 230)"],
                "confidence": "High",
                "raw_port": port
            })

        # ─── Windows & Active Directory ──────────────────────────────────

        # Rule 5: Windows Server exposure
        if (
            "microsoft-ds" in service
            or "windows" in version
            or "windows server" in details.lower()
        ):
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_005",
                "title": "Windows Server Service Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}", f"Version: {port['version']}"],
                "confidence": "High",
                "raw_port": port
            })

        # Rule 6: Active Directory (LDAP/LDAPS with AD context)
        if port_num in ("389", "636") and (
            service == "ldap"
            or "active directory" in details.lower()
            or "ad-ds" in details.lower()
        ):
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_006",
                "title": "Active Directory LDAP Service Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}", "Active Directory signal detected"],
                "confidence": "High",
                "raw_port": port
            })
        # Rule 9: Plain LDAP (non-AD)
        elif port_num in ("389", "636") and service == "ldap":
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_009",
                "title": "LDAP Service Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}", f"Version: {port['version']}"],
                "confidence": "Medium",
                "raw_port": port
            })

        # Rule 7: Microsoft IIS
        if (
            service in ("http", "https", "ssl/http", "http-proxy")
            and ("iis" in version or "microsoft-iis" in version or "microsoft iis" in details.lower())
        ):
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_007",
                "title": "Microsoft IIS Web Server Detected",
                "evidence": [f"Port {port_num} Open", f"Version: {port['version']}"],
                "confidence": "High",
                "raw_port": port
            })

        # Rule 8: SMB (445/139)
        if port_num in ("445", "139") and service in ("microsoft-ds", "netbios-ssn"):
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_008",
                "title": "SMB File Sharing Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}"],
                "confidence": "High",
                "raw_port": port
            })

        # Rule 10: RDP (3389)
        if port_num == "3389" or "ms-wbt-server" in service or "rdp" in details.lower():
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_010",
                "title": "Remote Desktop Protocol (RDP) Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}"],
                "confidence": "High",
                "raw_port": port
            })

        # Rule 11: WinRM (5985/5986)
        if port_num in ("5985", "5986") or service == "wsman" or "winrm" in details.lower():
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_011",
                "title": "Windows Remote Management (WinRM) Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}"],
                "confidence": "High",
                "raw_port": port
            })

        # ─── DevOps / Data tier ──────────────────────────────────────────

        # Rule 12: Jenkins (8080 / service==jenkins)
        if port_num == "8080" or service == "jenkins" or "jenkins" in version:
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_012",
                "title": "Jenkins Continuous Integration Server Detected",
                "evidence": [f"Port {port_num} Open", f"Service: {service}", f"Version: {port['version']}"],
                "confidence": "High",
                "raw_port": port
            })

        # Rule 13: Redis (6379)
        if port_num == "6379" or service == "redis":
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_013",
                "title": "Redis Key-Value Store Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}", f"Version: {port['version']}"],
                "confidence": "Medium",
                "raw_port": port
            })

        # Rule 14: Docker (2375/2376)
        if port_num in ("2375", "2376") or service in ("docker", "dockerd"):
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_014",
                "title": "Docker Daemon API Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}", f"Version: {port['version']}"],
                "confidence": "High",
                "raw_port": port
            })

        # Rule 15: Kubernetes API/kubelet
        if port_num in ("6443", "10250", "10255") or service == "kubernetes" or "kubelet" in version:
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_015",
                "title": "Kubernetes API Server / Kubelet Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}", f"Version: {port['version']}"],
                "confidence": "High",
                "raw_port": port
            })

        # Rule 16: Elasticsearch (9200/9300)
        if port_num in ("9200", "9300") or service == "elasticsearch" or "elasticsearch" in version:
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_016",
                "title": "Elasticsearch Cluster Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}", f"Version: {port['version']}"],
                "confidence": "High",
                "raw_port": port
            })

        # Rule 17: MongoDB (27017)
        if port_num == "27017" or service == "mongodb":
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_017",
                "title": "MongoDB Database Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}", f"Version: {port['version']}"],
                "confidence": "Medium",
                "raw_port": port
            })

        # Rule 18: PostgreSQL (5432)
        if port_num == "5432" or service == "postgresql":
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_018",
                "title": "PostgreSQL Database Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}", f"Version: {port['version']}"],
                "confidence": "Medium",
                "raw_port": port
            })

        # Rule 19: MySQL (3306)
        if port_num == "3306" or service == "mysql":
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_019",
                "title": "MySQL Database Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}", f"Version: {port['version']}"],
                "confidence": "Medium",
                "raw_port": port
            })

        # Rule 5: SMB exposed
        if port_num in ["139", "445"] or "smb" in service or "netbios" in service:
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_005",
                "title": "SMB Service Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}"],
                "confidence": "High",
                "raw_port": port
            })
            
        # Rule 6: RDP exposed
        if port_num == "3389" or "ms-wbt-server" in service or "rdp" in service:
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_006",
                "title": "Remote Desktop Protocol (RDP) Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}"],
                "confidence": "High",
                "raw_port": port
            })
            
        # Rule 7: WinRM
        if port_num in ["5985", "5986"] or "wsman" in service or "winrm" in service:
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_007",
                "title": "WinRM Service Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}"],
                "confidence": "High",
                "raw_port": port
            })
            
        # Rule 8: LDAP / Active Directory
        if port_num in ["389", "636", "3268", "3269"] or "ldap" in service:
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_008",
                "title": "LDAP / Active Directory Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}"],
                "confidence": "High",
                "raw_port": port
            })
            
        # Rule 9: IIS
        if "iis" in version or "microsoft-iis" in service or "iis" in details.lower():
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_009",
                "title": "Microsoft IIS Server Exposed",
                "evidence": [f"Port {port_num} Open", f"Version: {port['version']}"],
                "confidence": "Medium",
                "raw_port": port
            })

        # Rule 10: Jenkins
        if port_num == "8080" and ("jenkins" in version or "jenkins" in service or "jenkins" in details.lower()):
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_010",
                "title": "Jenkins Automation Server Exposed",
                "evidence": [f"Port {port_num} Open", f"Details: {port['version']}"],
                "confidence": "High",
                "raw_port": port
            })
            
        # Rule 11: Redis
        if port_num == "6379" or "redis" in service:
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_011",
                "title": "Redis Database Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}"],
                "confidence": "High",
                "raw_port": port
            })
            
        # Rule 12: Docker
        if port_num in ["2375", "2376"] or "docker" in service:
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_012",
                "title": "Docker API Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}"],
                "confidence": "High",
                "raw_port": port
            })
            
        # Rule 13: Kubernetes
        if port_num in ["6443", "10250"] or "kubernetes" in service or "kubelet" in service:
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_013",
                "title": "Kubernetes API/Kubelet Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}"],
                "confidence": "High",
                "raw_port": port
            })
            
        # Rule 14: Elasticsearch
        if port_num == "9200" or "elasticsearch" in service or "elastic" in version:
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_014",
                "title": "Elasticsearch Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}"],
                "confidence": "High",
                "raw_port": port
            })
            
        # Rule 15: MongoDB
        if port_num == "27017" or "mongodb" in service:
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_015",
                "title": "MongoDB Database Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}"],
                "confidence": "High",
                "raw_port": port
            })
            
        # Rule 16: PostgreSQL
        if port_num == "5432" or "postgresql" in service or "postgres" in service:
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_016",
                "title": "PostgreSQL Database Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}"],
                "confidence": "High",
                "raw_port": port
            })
            
        # Rule 17: MySQL
        if port_num == "3306" or "mysql" in service:
            findings.append({
                "id": str(uuid.uuid4()),
                "rule_id": "RULE_017",
                "title": "MySQL Database Exposed",
                "evidence": [f"Port {port_num} Open", f"Service: {service}"],
                "confidence": "High",
                "raw_port": port
            })

    if not findings:
        detected_services = [f"{p.get('service', 'unknown')} on port {p.get('port', 'unknown')}" for p in parsed_data.get("open_ports", [])]
        findings.append({
            "id": str(uuid.uuid4()),
            "rule_id": "RULE_NO_MATCH",
            "title": "No Matching Security Findings",
            "evidence": ["Detected services:"] + detected_services,
            "confidence": "High",
            "raw_port": {}
        })

    return findings, detected_services