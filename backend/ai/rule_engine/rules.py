import uuid

def create_finding(rule_id, title, port, evidence_reasons, confidence_level="Medium", finding_type="Configuration Issue"):
    host = port.get("host", "Unknown Host")
    port_num = port.get("port", "Unknown")
    service = port.get("service", "Unknown")
    version = port.get("version", "")
    
    # Format evidence array to explicitly include exactly host/port/service
    evidence = [
        f"Host: {host} | Port: {port_num} | Service: {service} | Version: {version} | Reason: {reason} | Confidence: {confidence_level}"
        for reason in evidence_reasons
    ]

    return {
        "finding_id": str(uuid.uuid4()),
        "id": str(uuid.uuid4()), # For backwards compatibility
        "rule_id": rule_id,
        "title": title, # Backward compatibility
        "host": host,
        "port": port_num,
        "service": service,
        "version": version,
        "finding_type": finding_type,
        "description": title,
        "severity": "Unknown", # Will be assigned by risk engine
        "cve_id": "N/A", # Default, might be updated by CVE lookup
        "confidence_score": 50 if confidence_level == "Medium" else (95 if confidence_level == "High" else 20),
        "confidence_level": confidence_level,
        "confidence_reason": "Rule engine deterministic match",
        "evidence": evidence,
        "raw_scan_reference": port.get("source_scan_reference", ""),
        "raw_service_banner": port.get("raw_service_banner", ""),
        "detected_script_output": port.get("detected_script_output", ""),
        "original_port_state": port.get("original_port_state", ""),
        "raw_port": port
    }

def apply_rules(parsed_data):
    findings = []
    detected_services = list(parsed_data.get("open_ports", []))

    for port in detected_services:
        port_num = port.get("port", "")
        service = port.get("service", "")
        details = "\n".join(port.get("details", []))
        version = port.get("version", "").lower()

        # Rule 1: Root Login Enabled over SSH
        if port_num == "22" and "ssh" in service:
            if "Root login: yes" in details and "password" in details:
                findings.append(create_finding("RULE_001", "Root Login Enabled", port, ["Password Auth Enabled and Root Login: yes"], "High"))

        # Rule 2: Apache 2.4.49 (Path Traversal / RCE)
        if "apache" in version and "2.4.49" in version:
            findings.append(create_finding("RULE_002", "Apache 2.4.49 Vulnerability (CVE-2021-41773)", port, ["Detected vulnerable version Apache 2.4.49"], "High"))

        # Rule 3: TLS 1.0 Enabled
        if "TLSv1.0" in details:
            findings.append(create_finding("RULE_003", "TLS 1.0 Enabled", port, ["TLSv1.0 Cipher Suites Detected"], "Medium"))

        # Rule 4: FTP Anonymous Login
        if port_num == "21" and "ftp-anon" in details:
            findings.append(create_finding("RULE_004", "FTP Anonymous Login Enabled", port, ["Anonymous FTP login allowed (FTP code 230)"], "High"))

        # Rule 5: Windows Server exposure / SMB
        if port_num in ("139", "445") or "smb" in service or "netbios" in service or "microsoft-ds" in service or "windows server" in details.lower() or "windows" in version:
            findings.append(create_finding("RULE_005", "Windows Server / SMB Service Exposed", port, ["Direct exposure of Windows/SMB services on public port"], "High"))

        # Rule 6 & 9: LDAP / Active Directory
        if port_num in ("389", "636", "3268", "3269") or "ldap" in service:
            if "active directory" in details.lower() or "ad-ds" in details.lower():
                findings.append(create_finding("RULE_006", "Active Directory LDAP Service Exposed", port, ["Active Directory signal detected"], "High"))
            else:
                findings.append(create_finding("RULE_009", "LDAP Service Exposed", port, ["Plain LDAP service exposed"], "Medium"))

        # Rule 7: Microsoft IIS
        if service in ("http", "https", "ssl/http", "http-proxy") and ("iis" in version or "microsoft-iis" in version or "microsoft iis" in details.lower()):
            findings.append(create_finding("RULE_007", "Microsoft IIS Web Server Detected", port, ["Detected IIS Server"], "High"))

        # Rule 10: RDP
        if port_num == "3389" or "ms-wbt-server" in service or "rdp" in details.lower():
            findings.append(create_finding("RULE_010", "Remote Desktop Protocol (RDP) Exposed", port, ["RDP service listening publicly"], "High"))

        # Rule 11: WinRM
        if port_num in ("5985", "5986") or service == "wsman" or "winrm" in details.lower():
            findings.append(create_finding("RULE_011", "Windows Remote Management (WinRM) Exposed", port, ["WinRM listening publicly"], "High"))

        # Rule 12: Jenkins
        if port_num == "8080" and ("jenkins" in version or "jenkins" in service or "jenkins" in details.lower()):
            findings.append(create_finding("RULE_012", "Jenkins Continuous Integration Server Detected", port, ["Jenkins CI server listening"], "High"))

        # Rule 13: Redis
        if port_num == "6379" or "redis" in service:
            findings.append(create_finding("RULE_013", "Redis Key-Value Store Exposed", port, ["Redis server exposed"], "Medium"))

        # Rule 14: Docker
        if port_num in ("2375", "2376") or service in ("docker", "dockerd"):
            findings.append(create_finding("RULE_014", "Docker Daemon API Exposed", port, ["Docker API listening publicly"], "High"))

        # Rule 15: Kubernetes
        if port_num in ("6443", "10250", "10255") or service == "kubernetes" or "kubelet" in version:
            findings.append(create_finding("RULE_015", "Kubernetes API Server / Kubelet Exposed", port, ["Kubernetes endpoint exposed"], "High"))

        # Rule 16: Elasticsearch
        if port_num in ("9200", "9300") or service == "elasticsearch" or "elastic" in version:
            findings.append(create_finding("RULE_016", "Elasticsearch Cluster Exposed", port, ["Elasticsearch listening publicly"], "High"))

        # Rule 17: MongoDB
        if port_num == "27017" or "mongodb" in service:
            findings.append(create_finding("RULE_017", "MongoDB Database Exposed", port, ["MongoDB listening publicly"], "Medium"))

        # Rule 18: PostgreSQL
        if port_num == "5432" or "postgresql" in service or "postgres" in service:
            findings.append(create_finding("RULE_018", "PostgreSQL Database Exposed", port, ["PostgreSQL listening publicly"], "Medium"))

        # Rule 19: MySQL
        if port_num == "3306" or "mysql" in service:
            findings.append(create_finding("RULE_019", "MySQL Database Exposed", port, ["MySQL listening publicly"], "Medium"))



    return findings, detected_services