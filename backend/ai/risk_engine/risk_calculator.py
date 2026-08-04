def calculate_risk(enriched_findings):
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
            finding["severity"] = "Info"
            finding["riskLevel"] = "Informational"

        # Format Remediation from context
        context = finding.get("context", {})
        if "remediation_template" in context:
            finding["remediation"] = context["remediation_template"]
        else:
            finding["remediation"] = "Review and apply standard hardening guidelines."

    return enriched_findings


def get_overall_risk(findings):
    severities = [f.get("severity") for f in findings]
    if "Critical" in severities:
        return "Critical"
    if "High" in severities:
        return "High"
    if "Medium" in severities:
        return "Medium"
    if "Low" in severities:
        return "Low"
    return "Info"