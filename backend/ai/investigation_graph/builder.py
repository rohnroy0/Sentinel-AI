"""Build a fully typed investigation graph for the Sentinel Investigation Graph page.

This module emits ten node kinds — Asset, Service, Evidence, Rule, Finding, Risk,
MITRE, CWE, Attack Chain, and Remediation — connected by edges that carry an
explicit relationship label.

The graph is layered by kind so the frontend can apply a deterministic
left-to-right auto-layout without depending on a graph-layout library.
"""

import re

# Stable, frontend-friendly identifiers per node kind so the graph layer can
# bucket nodes into columns.
KIND_INDEX = {
    "asset": 0,
    "service": 1,
    "evidence": 2,
    "rule": 3,
    "finding": 4,
    "risk": 5,
    "mitre": 6,
    "cwe": 7,
    "chain": 8,
    "remediation": 9,
}


def _slugify(value):
    return re.sub(r"[^a-zA-Z0-9]+", "-", str(value)).strip("-").lower()


def _derive_host(parsed_data, raw_content=None):
    """Pull the target host out of the parsed Nmap content if present."""
    # Try the parsed text first, fall back to raw content for safety.
    source = ""
    if isinstance(parsed_data, dict) and parsed_data.get("_raw_text"):
        source = parsed_data["_raw_text"]
    elif raw_content:
        source = raw_content

    if not source:
        return "Target Host"

    for line in source.splitlines():
        m = re.match(r"\s*Nmap scan report for\s+(\S+)", line)
        if m:
            host = m.group(1).strip("()")
            return host
    return "Target Host"


def _detect_asset_kind(detected_services, rule_ids):
    """Heuristic asset-kind classification for the asset node subtitle."""
    win_ids = {"RULE_005", "RULE_006", "RULE_007", "RULE_008", "RULE_010", "RULE_011"}
    db_ids = {"RULE_017", "RULE_018", "RULE_019"}
    devops_ids = {"RULE_012", "RULE_013", "RULE_014", "RULE_015", "RULE_016"}

    if rule_ids & win_ids:
        return "Windows Server" if "RULE_005" in rule_ids else "Windows Host"
    if rule_ids & db_ids:
        return "Database Server"
    if rule_ids & devops_ids:
        return "DevOps Host"
    if {"RULE_001", "RULE_002", "RULE_003", "RULE_004"} & rule_ids:
        return "Linux Server"
    return "Target Host"


def _evidence_lines_for_port(port):
    """Build a deterministic evidence list for a port based on what the parser captured."""
    lines = [f"Port {port['port']} Open"]
    service = port.get("service") or ""
    version = port.get("version") or ""
    if service:
        lines.append(f"Service: {service}")
    if version:
        lines.append(f"Version: {version}")
    for d in port.get("details", []):
        cleaned = d.lstrip("| ").rstrip()
        if cleaned:
            lines.append(cleaned)
    return lines


def _risk_subtitle(severity, confidence):
    likelihood = {
        "Critical": "Very High",
        "High": "High",
        "Medium": "Moderate",
        "Low": "Low",
        "Info": "Informational",
    }.get(severity, "Unknown")
    impact = {
        "Critical": "Severe",
        "High": "Significant",
        "Medium": "Moderate",
        "Low": "Limited",
        "Info": "None",
    }.get(severity, "Unknown")
    return f"Likelihood: {likelihood} · Impact: {impact} · Confidence: {confidence}"


def build_investigation_graph(parsed_data, detected_services, rule_findings,
                              risk_findings, chain_data, remediation):
    """Build the rich investigation graph.

    Returns a dict with `nodes` and `edges` lists. Each node has `kind`, `label`,
    `subtitle`, and `data`. Each edge has `source`, `target`, `label`, and `kind`.
    """

    nodes = []
    edges = []
    seen_ids = set()

    def add_node(node):
        if node["id"] in seen_ids:
            return
        seen_ids.add(node["id"])
        nodes.append(node)

    def add_edge(edge):
        edges.append(edge)

    host = _derive_host(parsed_data)
    rule_ids = {f.get("rule_id") for f in rule_findings if f.get("rule_id")}
    asset_kind = _detect_asset_kind(detected_services, rule_ids)

    # ─── Asset node ───────────────────────────────────────────────────────
    add_node({
        "id": f"asset:{_slugify(host)}",
        "kind": "asset",
        "label": host,
        "subtitle": asset_kind,
        "data": {
            "host": host,
            "services": len(detected_services),
        },
        "icon": "server",
    })

    asset_id = f"asset:{_slugify(host)}"

    # ─── Service + Evidence nodes ──────────────────────────────────────────
    seen_services = set()
    for port in detected_services:
        port_num = port.get("port", "?")
        service = port.get("service") or "unknown"
        version = port.get("version") or ""
        svc_id = f"service:{port_num}:{_slugify(service)}"

        if svc_id not in seen_services:
            add_node({
                "id": svc_id,
                "kind": "service",
                "label": service.upper() if service in {"ssh", "ftp", "http", "smtp", "mysql", "redis", "mongodb"}
                else service.replace("-", " ").title(),
                "subtitle": f"Port {port_num} · {version or 'unknown version'}",
                "data": {
                    "port": port_num,
                    "service": service,
                    "version": version,
                },
                "icon": "activity",
            })
            seen_services.add(svc_id)
            add_edge({
                "id": f"e:{asset_id}->{svc_id}",
                "source": asset_id,
                "target": svc_id,
                "label": "Hosts",
                "kind": "supports",
            })

        evidence_id = f"evidence:{port_num}"
        evidence_label = f"Port {port_num} Open"
        if service:
            evidence_label += f" — {service}"
        add_node({
            "id": evidence_id,
            "kind": "evidence",
            "label": evidence_label,
            "subtitle": "Raw parser output",
            "data": {
                "port": port_num,
                "lines": _evidence_lines_for_port(port),
            },
            "icon": "file-search",
        })
        add_edge({
            "id": f"e:{svc_id}->{evidence_id}",
            "source": svc_id,
            "target": evidence_id,
            "label": "Produces",
            "kind": "supports",
        })

    # ─── Rule nodes (one per matched rule) + Finding/Risk/MITRE/CWE ───────
    seen_rules = set()

    for finding in risk_findings:
        rule_id = finding.get("rule_id") or "RULE_000"
        finding_id = f"finding:{finding['id']}"

        # Rule node
        if rule_id not in seen_rules:
            rule_label = RULE_LABELS.get(rule_id, rule_id)
            add_node({
                "id": f"rule:{rule_id}",
                "kind": "rule",
                "label": rule_label,
                "subtitle": f"{rule_id} · Matched",
                "data": {
                    "rule_id": rule_id,
                    "status": "Matched",
                },
                "icon": "gavel",
            })
            seen_rules.add(rule_id)

        # Connect evidence nodes for this finding's port to the rule
        port_num = (finding.get("raw_port") or {}).get("port")
        if port_num:
            evidence_id = f"evidence:{port_num}"
            add_edge({
                "id": f"e:{evidence_id}->rule:{rule_id}",
                "source": evidence_id,
                "target": f"rule:{rule_id}",
                "label": "Evaluated By",
                "kind": "depends-on",
            })

        # Finding node
        add_node({
            "id": finding_id,
            "kind": "finding",
            "label": finding.get("title", "Finding"),
            "subtitle": f"{finding.get('severity', 'Info')} · {finding.get('confidence', 'Medium')} Confidence",
            "data": {
                "rule_id": rule_id,
                "severity": finding.get("severity", "Info"),
                "confidence": finding.get("confidence", "Medium"),
                "evidence": finding.get("evidence", []),
                "riskLevel": finding.get("riskLevel", ""),
            },
            "icon": "alert-triangle",
        })

        add_edge({
            "id": f"e:rule:{rule_id}->{finding_id}",
            "source": f"rule:{rule_id}",
            "target": finding_id,
            "label": "Generated",
            "kind": "generated",
        })

        # Risk node
        risk_id = f"risk:{_slugify(finding.get('riskLevel', '') or rule_id)}"
        add_node({
            "id": risk_id,
            "kind": "risk",
            "label": finding.get("riskLevel", "Risk Condition"),
            "subtitle": _risk_subtitle(finding.get("severity", "Info"), finding.get("confidence", "Medium")),
            "data": {
                "severity": finding.get("severity", "Info"),
                "confidence": finding.get("confidence", "Medium"),
            },
            "icon": "trending-up",
        })
        add_edge({
            "id": f"e:{finding_id}->{risk_id}",
            "source": finding_id,
            "target": risk_id,
            "label": "Increases",
            "kind": "increases",
        })

        # MITRE node
        ctx = finding.get("context", {}) or {}
        mitre = ctx.get("mitre_technique", "")
        if mitre:
            mitre_id = f"mitre:{_slugify(mitre.split(' - ')[0])}"
            add_node({
                "id": mitre_id,
                "kind": "mitre",
                "label": mitre,
                "subtitle": "MITRE ATT&CK Technique",
                "data": {"mitre": mitre},
                "icon": "crosshair",
            })
            add_edge({
                "id": f"e:{finding_id}->{mitre_id}",
                "source": finding_id,
                "target": mitre_id,
                "label": "Maps To",
                "kind": "maps-to",
            })

        # CWE node
        cwe = ctx.get("cwe", "")
        if cwe:
            cwe_id = f"cwe:{_slugify(cwe)}"
            add_node({
                "id": cwe_id,
                "kind": "cwe",
                "label": cwe,
                "subtitle": CWE_NAMES.get(cwe, "Common Weakness Enumeration"),
                "data": {"cwe": cwe},
                "icon": "shield",
            })
            add_edge({
                "id": f"e:{finding_id}->{cwe_id}",
                "source": finding_id,
                "target": cwe_id,
                "label": "Maps To",
                "kind": "maps-to",
            })

        # Remediation node (if a remediation exists for this finding)
        rem_match = next(
            (r for r in remediation if r.get("id") == finding.get("id")),
            None,
        )
        if rem_match:
            rem_id = f"remediation:{_slugify(rem_match.get('title', ''))}-{finding['id'][:8]}"
            add_node({
                "id": rem_id,
                "kind": "remediation",
                "label": rem_match.get("title", "Remediation"),
                "subtitle": f"Priority {rem_match.get('priority', '?')} · {rem_match.get('difficulty', 'Medium')} difficulty",
                "data": {
                    "fix": rem_match.get("fix", ""),
                    "improvement": rem_match.get("improvement", ""),
                    "why": rem_match.get("why", ""),
                },
                "icon": "wrench",
            })
            add_edge({
                "id": f"e:{finding_id}->{rem_id}",
                "source": finding_id,
                "target": rem_id,
                "label": "Mitigated By",
                "kind": "mitigated-by",
            })

    # ─── Attack Chain nodes (grafted from chain_data) ──────────────────────
    if chain_data and chain_data.get("nodes"):
        for cn in chain_data["nodes"]:
            cn_id = f"chain:{_slugify(cn.get('data', {}).get('label', ''))}"
            add_node({
                "id": cn_id,
                "kind": "chain",
                "label": cn.get("data", {}).get("label", "Attack Chain Step"),
                "subtitle": "Attack Path",
                "data": cn.get("data", {}),
                "icon": "git-branch",
            })

        for ce in chain_data.get("edges", []):
            src_label = ce.get("source", "")
            tgt_label = ce.get("target", "")
            src_id = f"chain:{_slugify(src_label)}"
            tgt_id = f"chain:{_slugify(tgt_label)}"
            if src_id in seen_ids and tgt_id in seen_ids:
                add_edge({
                    "id": f"e:{src_id}->{tgt_id}",
                    "source": src_id,
                    "target": tgt_id,
                    "label": "Compromise Path",
                    "kind": "generated",
                })

        # Wire the top finding into the chain entry so the graph shows the
        # correlation from detection → attack path.
        if risk_findings:
            top = max(
                risk_findings,
                key=lambda f: {"Critical": 4, "High": 3, "Medium": 2, "Low": 1, "Info": 0}.get(f.get("severity", "Info"), 0),
            )
            top_finding_id = f"finding:{top['id']}"
            chain_nodes = [n for n in nodes if n["kind"] == "chain"]
            if chain_nodes:
                add_edge({
                    "id": f"e:{top_finding_id}->{chain_nodes[0]['id']}",
                    "source": top_finding_id,
                    "target": chain_nodes[0]["id"],
                    "label": "Correlated",
                    "kind": "correlated",
                })

    return {"nodes": nodes, "edges": edges}


# Friendly rule labels used in the rule-kind nodes.
RULE_LABELS = {
    "RULE_001": "SSH Root Login Rule",
    "RULE_002": "Apache 2.4.49 Path Traversal Rule",
    "RULE_003": "TLS 1.0 Weak Cipher Rule",
    "RULE_004": "FTP Anonymous Access Rule",
    "RULE_005": "Windows Server Exposure Rule",
    "RULE_006": "Active Directory LDAP Exposure Rule",
    "RULE_007": "Microsoft IIS Detection Rule",
    "RULE_008": "SMB File Sharing Rule",
    "RULE_009": "LDAP Service Rule",
    "RULE_010": "RDP Exposure Rule",
    "RULE_011": "WinRM Exposure Rule",
    "RULE_012": "Jenkins Detection Rule",
    "RULE_013": "Redis Exposure Rule",
    "RULE_014": "Docker Daemon Exposure Rule",
    "RULE_015": "Kubernetes API Exposure Rule",
    "RULE_016": "Elasticsearch Exposure Rule",
    "RULE_017": "MongoDB Exposure Rule",
    "RULE_018": "PostgreSQL Exposure Rule",
    "RULE_019": "MySQL Exposure Rule",
}

CWE_NAMES = {
    "CWE-22": "Path Traversal",
    "CWE-200": "Information Exposure",
    "CWE-284": "Improper Access Control",
    "CWE-287": "Improper Authentication",
    "CWE-306": "Missing Authentication for Critical Function",
    "CWE-307": "Improper Restriction of Excessive Authentication Attempts",
    "CWE-319": "Cleartext Transmission of Sensitive Information",
    "CWE-326": "Inadequate Encryption Strength",
    "CWE-521": "Weak Password Requirements",
    "CWE-1188": "Insecure Default Initialization of Resource",
}
