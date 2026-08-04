KB_STORE = {
    "RULE_001": {
        "cwe": "CWE-287",
        "mitre_technique": "T1078 - Valid Accounts",
        "best_practice": "Disable remote root login and enforce public key authentication.",
        "remediation_template": "Modify /etc/ssh/sshd_config to set PermitRootLogin no and PasswordAuthentication no."
    },
    "RULE_002": {
        "cwe": "CWE-22",
        "mitre_technique": "T1190 - Exploit Public-Facing Application",
        "best_practice": "Keep web servers updated to the latest stable versions.",
        "remediation_template": "Upgrade Apache HTTP Server to version 2.4.51 or later."
    },
    "RULE_003": {
        "cwe": "CWE-326",
        "mitre_technique": "T1573 - Encrypted Channel",
        "best_practice": "Disable deprecated TLS versions (1.0 and 1.1) to prevent protocol downgrade attacks.",
        "remediation_template": "Configure web server to support only TLS 1.2 and TLS 1.3."
    },
    "RULE_004": {
        "cwe": "CWE-284",
        "mitre_technique": "T1078 - Valid Accounts",
        "best_practice": "Disable anonymous access unless absolutely required for public file sharing.",
        "remediation_template": "Configure the FTP server (e.g. vsftpd.conf) to set anonymous_enable=NO."
    },

    # ─── Windows & Active Directory ──────────────────────────────────────────
    "RULE_005": {
        "cwe": "CWE-200",
        "mitre_technique": "T1018 - Remote System Discovery",
        "best_practice": "Restrict direct exposure of Windows Server services to the public internet.",
        "remediation_template": "Place the Windows Server behind a VPN, jump host, or RDP gateway and enforce Windows Defender Credential Guard and SMB signing."
    },
    "RULE_006": {
        "cwe": "CWE-287",
        "mitre_technique": "T1078.002 - Valid Accounts: Domain Accounts",
        "best_practice": "Do not expose Active Directory LDAP to the public internet; require LDAPS and strong ACLs.",
        "remediation_template": "Bind LDAP to internal interfaces only, enforce LDAP channel binding and signing (NTLM/LDAPS), and rotate the krbtgt password twice."
    },
    "RULE_007": {
        "cwe": "CWE-307",
        "mitre_technique": "T1190 - Exploit Public-Facing Application",
        "best_practice": "Harden IIS with request filtering, URLScan, and frequent patching of the .NET runtime.",
        "remediation_template": "Apply latest Windows updates, enable IIS Request Filtering, set the .NET trust level to Full (or High with explicit allow-lists), and disable directory browsing."
    },
    "RULE_008": {
        "cwe": "CWE-319",
        "mitre_technique": "T1021.002 - Remote Services: SMB/Windows Admin Shares",
        "best_practice": "Disable SMBv1 and require SMB signing; never expose SMB directly to the internet.",
        "remediation_template": "Disable SMBv1 via Set-SmbServerConfiguration -EnableSMB1Protocol $false, enable SMB signing, and block inbound 445/tcp at the perimeter firewall."
    },
    "RULE_009": {
        "cwe": "CWE-287",
        "mitre_technique": "T1078 - Valid Accounts",
        "best_practice": "Avoid exposing LDAP to untrusted networks; prefer LDAPS and bind authentication.",
        "remediation_template": "Restrict LDAP to internal interfaces, require TLS via slapd.conf olcSecurity tls=1, and enforce ACLs on cn=config."
    },
    "RULE_010": {
        "cwe": "CWE-287",
        "mitre_technique": "T1021.001 - Remote Services: Remote Desktop Protocol",
        "best_practice": "Require Network Level Authentication (NLA) and place RDP behind a VPN or RD Gateway.",
        "remediation_template": "Set HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\fUserAuthentication to 1 (NLA) and restrict RDP via Windows Firewall rules."
    },
    "RULE_011": {
        "cwe": "CWE-287",
        "mitre_technique": "T1021.006 - Remote Services: Windows Remote Management",
        "best_practice": "Encrypt WinRM with HTTPS and restrict source IPs; require Kerberos authentication.",
        "remediation_template": "Enable HTTPS listener (5986), disable HTTP listener (5985), and configure winrm with AllowUnencrypted=false, CertificateThumbprint=<thumbprint>."
    },

    # ─── DevOps / Data tier ─────────────────────────────────────────────────
    "RULE_012": {
        "cwe": "CWE-306",
        "mitre_technique": "T1078 - Valid Accounts",
        "best_practice": "Disable anonymous Jenkins access and enforce authentication for the /script console.",
        "remediation_template": "Enable Jenkins global security, set 'Anyone can do anything' to No, configure Matrix-based authorization, and gate /script and /configure behind admin role."
    },
    "RULE_013": {
        "cwe": "CWE-521",
        "mitre_technique": "T1078 - Valid Accounts",
        "best_practice": "Require authentication on Redis and bind to localhost or a private interface.",
        "remediation_template": "Edit redis.conf: requirepass <strong-password>, bind 127.0.0.1, rename-command CONFIG '' and restart redis-server."
    },
    "RULE_014": {
        "cwe": "CWE-1188",
        "mitre_technique": "T1528 - Steal Application Access Token",
        "best_practice": "Never expose the Docker daemon TCP socket without TLS; use the Docker socket over SSH or a Unix socket.",
        "remediation_template": "Disable tcp://0.0.0.0:2375 in daemon.json, enable 'hosts': ['unix:///var/run/docker.sock'], and if remote access is required use 'tlsverify' with client certs."
    },
    "RULE_015": {
        "cwe": "CWE-306",
        "mitre_technique": "T1078 - Valid Accounts",
        "best_practice": "Restrict the Kubernetes API server to authenticated and authorized requests; enable RBAC and admission controllers.",
        "remediation_template": "Set kube-apiserver --anonymous-auth=false --authorization-mode=Node,RBAC, --enable-admission-plugins=NodeRestriction, and bind --bind-address to a private interface."
    },
    "RULE_016": {
        "cwe": "CWE-306",
        "mitre_technique": "T1213 - Data from Information Repositories",
        "best_practice": "Enable Elasticsearch security (xpack security) and disable anonymous access.",
        "remediation_template": "Set xpack.security.enabled: true in elasticsearch.yml, run bin/elasticsearch-setup-passwords interactive, and add an authentication realm."
    },
    "RULE_017": {
        "cwe": "CWE-306",
        "mitre_technique": "T1078 - Valid Accounts",
        "best_practice": "Always enable MongoDB authentication and bind to a private network interface.",
        "remediation_template": "Edit mongod.conf: security.authorization: 'enabled', net.bindIp: 127.0.0.1, and create a least-privilege user via db.createUser()."
    },
    "RULE_018": {
        "cwe": "CWE-307",
        "mitre_technique": "T1078 - Valid Accounts",
        "best_practice": "Require password or md5/scram-sha-256 client authentication and bind PostgreSQL to a private interface.",
        "remediation_template": "Edit postgresql.conf: listen_addresses = '127.0.0.1', and in pg_hba.conf require 'scram-sha-256' for all host entries."
    },
    "RULE_019": {
        "cwe": "CWE-307",
        "mitre_technique": "T1078 - Valid Accounts",
        "best_practice": "Require authentication on MySQL and never expose port 3306 to the public internet.",
        "remediation_template": "Run mysql_secure_installation, set bind-address = 127.0.0.1 in my.cnf, and create application users with restricted host patterns."
    }
}

def enrich_findings(findings):
    enriched = []
    for finding in findings:
        rule_id = finding.get("rule_id")
        context = KB_STORE.get(rule_id, {})

        finding["context"] = context
        enriched.append(finding)

    return enriched