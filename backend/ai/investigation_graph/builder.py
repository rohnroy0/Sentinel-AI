"""Build a structured, layered investigation graph for Sentinel-AI.

Separates cybersecurity entities into two clearly defined layers:
1. Technical Layer:
   Asset (Host) → Service → Finding → CVE → MITRE → Remediation
2. Attack Layer:
   Internet Exposure → Initial Access → Privilege Escalation → Lateral Movement → Data Exposure

Features:
- Clear separation between technical infrastructure and adversary attack journeys.
- Compact node representations (Name, Severity, Confidence) with detailed telemetry in metadata.
- Grouping of services, vulnerabilities, and CVEs by host.
- Selective edge labeling (labels shown only for critical attack and remediation transitions).
- Enhanced CVE nodes displaying CVE ID, Severity, Impact, and Confidence.
"""

from typing import List, Dict, Any, Optional
import re

KIND_INDEX = {
    "asset": 0,
    "service": 1,
    "finding": 2,
    "cve": 3,
    "mitre": 4,
    "remediation": 5,
    "evidence": 6,
    "rule": 7,
    "risk": 8,
    "cwe": 9,
    "chain": 10,
}


def _slugify(value: Any) -> str:
    return re.sub(r"[^a-zA-Z0-9]+", "-", str(value)).strip("-").lower()


def _extract_all_hosts(parsed_data: Any, detected_services: Any = None, risk_findings: Any = None, raw_content: str = None) -> List[str]:
    """Extract all unique hosts mentioned in scan data, services, or findings."""
    hosts = set()

    source = ""
    if isinstance(parsed_data, dict) and parsed_data.get("_raw_text"):
        source = parsed_data["_raw_text"]
    elif raw_content:
        source = raw_content

    if source:
        for line in source.splitlines():
            m = re.match(r"\s*Nmap scan report for\s+(\S+)", line)
            if m:
                h = m.group(1).strip("()")
                if h:
                    hosts.add(h)

    if isinstance(parsed_data, dict):
        if parsed_data.get("host"):
            hosts.add(str(parsed_data["host"]))
        if parsed_data.get("ip"):
            hosts.add(str(parsed_data["ip"]))

    if detected_services and isinstance(detected_services, list):
        for s in detected_services:
            if isinstance(s, dict):
                if s.get("host"):
                    hosts.add(str(s["host"]))
                elif s.get("ip"):
                    hosts.add(str(s["ip"]))

    if risk_findings and isinstance(risk_findings, list):
        for f in risk_findings:
            if isinstance(f, dict) and f.get("host"):
                hosts.add(str(f["host"]))

    if not hosts:
        hosts.add("192.168.1.10")

    return sorted(list(hosts))


def _detect_asset_kind(detected_services: Any, rule_ids: set) -> str:
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


def _derive_cve_impact(cve_id: str, finding: Dict[str, Any]) -> str:
    """Derive a succinct, accurate impact description for a CVE."""
    if not isinstance(finding, dict):
        return "Unauthorized Access"

    impact = finding.get("impact") or ""
    title = finding.get("title") or ""
    ctx = finding.get("context") or {}
    cwe = ctx.get("cwe") or finding.get("cwe") or ""
    desc = finding.get("description") or ""

    combined = f"{impact} {title} {cwe} {cve_id} {desc}".lower()

    if "rce" in combined or "remote code execution" in combined or "command execution" in combined or "arbitrary code" in combined:
        return "Remote Code Execution"
    if "traversal" in combined or "cwe-22" in combined or "file read" in combined or "path traversal" in combined:
        return "Path Traversal / File Read"
    if "privilege" in combined or "root" in combined or "elevation" in combined or "cwe-284" in combined:
        return "Privilege Escalation"
    if "authentication" in combined or "bypass" in combined or "cwe-287" in combined or "cwe-306" in combined:
        return "Authentication Bypass"
    if "cleartext" in combined or "cwe-319" in combined or "sniffing" in combined or "unencrypted" in combined:
        return "Cleartext Data Exposure"
    if "injection" in combined or "sql" in combined or "cwe-89" in combined:
        return "SQL / Command Injection"
    if "denial" in combined or "dos" in combined or "cwe-400" in combined:
        return "Denial of Service"
    if "information" in combined or "disclosure" in combined or "cwe-200" in combined or "leak" in combined:
        return "Information Disclosure"

    if impact:
        return impact[:35]

    return "Remote Service Exploitation"


def _evidence_lines_for_port(port: Dict[str, Any]) -> List[str]:
    """Build a clean evidence list for a port based on what the parser captured."""
    lines = [f"Port {port.get('port', '?')} Open"]
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


def build_investigation_graph(
    parsed_data: Any,
    detected_services: Any,
    rule_findings: Any,
    risk_findings: Any,
    chain_data: Any = None,
    remediation: Any = None,
) -> Dict[str, Any]:
    """Build the structured investigation graph with separated Technical and Attack layers.

    Technical Layer:
      Asset (Host) → Service → Finding → CVE → MITRE → Remediation
    Attack Layer:
      Internet Exposure → Initial Access → Privilege Escalation → Lateral Movement → Data Exposure
    """
    nodes = []
    edges = []
    seen_ids = set()

    def add_node(node: Dict[str, Any]):
        if node["id"] in seen_ids:
            return
        seen_ids.add(node["id"])
        nodes.append(node)

    def add_edge(edge: Dict[str, Any]):
        edges.append(edge)

    # 1. Host Identification & Asset Nodes
    all_hosts = _extract_all_hosts(parsed_data, detected_services, risk_findings)
    primary_host = all_hosts[0] if all_hosts else "192.168.1.10"

    rule_ids = {f.get("rule_id") for f in (rule_findings or []) if isinstance(f, dict) and f.get("rule_id")}
    asset_kind = _detect_asset_kind(detected_services, rule_ids)

    # Flatten discovered services and associate each with its host
    flat_services = []
    if detected_services:
        for item in detected_services:
            if not isinstance(item, dict):
                continue
            if "ports" in item and isinstance(item["ports"], list):
                item_host = item.get("host") or item.get("ip") or primary_host
                for p in item["ports"]:
                    if isinstance(p, dict):
                        p_copy = dict(p)
                        p_copy["host"] = item_host
                        flat_services.append(p_copy)
            elif "port" in item:
                p_copy = dict(item)
                if not p_copy.get("host"):
                    p_copy["host"] = primary_host
                flat_services.append(p_copy)

    # Fallback to findings if no explicit detected_services
    if not flat_services and risk_findings:
        for f in risk_findings:
            if isinstance(f, dict) and (f.get("port") or f.get("service")):
                flat_services.append({
                    "host": f.get("host") or primary_host,
                    "port": f.get("port", "80"),
                    "service": f.get("service", "http"),
                    "version": f.get("version", ""),
                    "details": [f.get("title", "")],
                })

    # Create Asset Nodes for each Host (Technical Layer)
    host_to_asset_id = {}
    for h in all_hosts:
        aid = f"asset:{_slugify(h)}"
        host_to_asset_id[h] = aid
        add_node({
            "id": aid,
            "kind": "asset",
            "layer": "technical",
            "label": h,
            "subtitle": asset_kind,
            "host": h,
            "severity": "Info",
            "confidence": "High",
            "data": {
                "host": h,
                "asset_kind": asset_kind,
                "services_count": sum(1 for s in flat_services if s.get("host") == h),
            },
            "icon": "server",
        })

    # 2. Service Nodes (grouped under Host) (Technical Layer)
    # Host → Services
    service_key_to_id = {}
    for port in flat_services:
        svc_host = port.get("host") or primary_host
        port_num = str(port.get("port", "?"))
        service = port.get("service") or "service"
        version = port.get("version") or ""
        svc_key = f"{svc_host}:{port_num}:{service}"
        svc_id = f"service:{_slugify(svc_host)}:{port_num}:{_slugify(service)}"

        if svc_key not in service_key_to_id:
            service_key_to_id[svc_key] = svc_id
            asset_node_id = host_to_asset_id.get(svc_host, host_to_asset_id.get(primary_host))

            formatted_label = service.upper() if service in {"ssh", "ftp", "http", "smtp", "mysql", "redis", "mongodb"} else service.replace("-", " ").title()

            add_node({
                "id": svc_id,
                "kind": "service",
                "layer": "technical",
                "label": f"{formatted_label} (Port {port_num})",
                "subtitle": f"Port {port_num} · {version or 'active'}",
                "host": svc_host,
                "port": port_num,
                "service": service,
                "version": version,
                "severity": "Info",
                "confidence": "High",
                "data": {
                    "host": svc_host,
                    "port": port_num,
                    "service": service,
                    "version": version,
                    "evidence": _evidence_lines_for_port(port),
                },
                "icon": "activity",
            })

            if asset_node_id:
                # Structural edge: Host -> Service (no clutter label)
                add_edge({
                    "id": f"e:{asset_node_id}->{svc_id}",
                    "source": asset_node_id,
                    "target": svc_id,
                    "label": "",
                    "important": False,
                    "kind": "supports",
                    "layer": "technical",
                })

            # Supporting Evidence Node
            evidence_id = f"evidence:{_slugify(svc_host)}:{port_num}"
            add_node({
                "id": evidence_id,
                "kind": "evidence",
                "layer": "technical",
                "label": f"Port {port_num} Telemetry",
                "subtitle": f"{service} {version}".strip(),
                "host": svc_host,
                "port": port_num,
                "severity": "Info",
                "confidence": "High",
                "data": {
                    "host": svc_host,
                    "port": port_num,
                    "lines": _evidence_lines_for_port(port),
                },
                "icon": "file-search",
            })
            add_edge({
                "id": f"e:{svc_id}->{evidence_id}",
                "source": svc_id,
                "target": evidence_id,
                "label": "",
                "important": False,
                "kind": "supports",
                "layer": "technical",
            })

    # 3. Technical Findings & CVEs (grouped under Service)
    # Services → Findings → CVE → MITRE → Remediation
    finding_id_map = {}
    finding_cve_map = {}
    finding_nodes_list = []
    cve_nodes_list = []
    mitre_nodes_list = []
    seen_rules = set()

    for idx, finding in enumerate(risk_findings or []):
        if not isinstance(finding, dict):
            continue

        f_host = finding.get("host") or primary_host
        f_port = str(finding.get("port") or (finding.get("raw_port") or {}).get("port") or "80")
        f_service = finding.get("service") or "http"
        f_sev = str(finding.get("severity", "High")).capitalize()
        f_conf = finding.get("confidence", "High")
        f_title = finding.get("title") or f"Finding #{idx+1}"
        rule_id = finding.get("rule_id") or f"RULE_{idx+1:03d}"
        finding_raw_id = finding.get("id") or f"fnd-{idx+1}"
        finding_id = f"finding:{_slugify(f_host)}:{_slugify(finding_raw_id)}"
        finding_id_map[finding_raw_id] = finding_id

        # Rule node (Technical Layer)
        if rule_id not in seen_rules:
            rule_label = RULE_LABELS.get(rule_id, rule_id)
            add_node({
                "id": f"rule:{rule_id}",
                "kind": "rule",
                "layer": "technical",
                "label": rule_label,
                "subtitle": f"{rule_id} · Signature Rule",
                "severity": f_sev,
                "confidence": f_conf,
                "data": {
                    "rule_id": rule_id,
                    "status": "Matched",
                    "description": rule_label,
                },
                "icon": "gavel",
            })
            seen_rules.add(rule_id)

        # Connect evidence to rule
        ev_id = f"evidence:{_slugify(f_host)}:{f_port}"
        if ev_id in seen_ids:
            add_edge({
                "id": f"e:{ev_id}->rule:{rule_id}",
                "source": ev_id,
                "target": f"rule:{rule_id}",
                "label": "",
                "important": False,
                "kind": "depends-on",
                "layer": "technical",
            })

        # Finding Node (Technical Layer)
        add_node({
            "id": finding_id,
            "kind": "finding",
            "layer": "technical",
            "label": f_title,
            "subtitle": f"{f_sev} · Port {f_port} ({f_service})",
            "host": f_host,
            "port": f_port,
            "service": f_service,
            "severity": f_sev,
            "confidence": f_conf,
            "data": {
                "rule_id": rule_id,
                "severity": f_sev,
                "confidence": f_conf,
                "host": f_host,
                "port": f_port,
                "service": f_service,
                "evidence": finding.get("evidence", []),
                "riskLevel": finding.get("riskLevel", f"{f_sev} Exposure"),
                "cve": finding.get("cve_id") or finding.get("cve"),
            },
            "icon": "alert-triangle",
        })
        finding_nodes_list.append(finding_id)

        # Rule -> Finding edge
        add_edge({
            "id": f"e:rule:{rule_id}->{finding_id}",
            "source": f"rule:{rule_id}",
            "target": finding_id,
            "label": "",
            "important": False,
            "kind": "generated",
            "layer": "technical",
        })

        # Service -> Finding edge (Host -> Service -> Finding hierarchy)
        target_svc_key = f"{f_host}:{f_port}:{f_service}"
        matched_svc_id = service_key_to_id.get(target_svc_key)
        if not matched_svc_id:
            # Match by host & port
            matched_svc_id = next((sid for sk, sid in service_key_to_id.items() if sk.startswith(f"{f_host}:{f_port}:")), None)
        if not matched_svc_id:
            matched_svc_id = next((sid for sk, sid in service_key_to_id.items() if f":{f_port}:" in sid), None)

        if matched_svc_id:
            add_edge({
                "id": f"e:{matched_svc_id}->{finding_id}",
                "source": matched_svc_id,
                "target": finding_id,
                "label": "",
                "important": False,
                "kind": "supports",
                "layer": "technical",
            })

        # Risk Node (Technical Layer)
        risk_label = finding.get("riskLevel") or f"{f_sev} Risk Exposure"
        risk_id = f"risk:{_slugify(risk_label)}"
        add_node({
            "id": risk_id,
            "kind": "risk",
            "layer": "technical",
            "label": risk_label,
            "subtitle": f"{f_sev} · {f_conf} Confidence",
            "severity": f_sev,
            "confidence": f_conf,
            "data": {
                "severity": f_sev,
                "confidence": f_conf,
            },
            "icon": "trending-up",
        })
        add_edge({
            "id": f"e:{finding_id}->{risk_id}",
            "source": finding_id,
            "target": risk_id,
            "label": "",
            "important": False,
            "kind": "increases",
            "layer": "technical",
        })

        # CVE Node (Technical Layer) - Enhanced with CVE ID, Severity, Impact, Confidence
        ctx = finding.get("context", {}) or {}
        cve_val = finding.get("cve_id") or finding.get("cve") or ctx.get("cve") or ctx.get("cve_id")
        finding_cves = []
        if cve_val:
            cve_list = [c.strip() for c in cve_val.split(",") if c.strip()] if isinstance(cve_val, str) else ([cve_val] if isinstance(cve_val, str) else list(cve_val))
            for cve_item in cve_list:
                if not cve_item:
                    continue
                cve_node_id = f"cve:{_slugify(cve_item)}"
                finding_cves.append(cve_node_id)
                impact_summary = _derive_cve_impact(cve_item, finding)

                add_node({
                    "id": cve_node_id,
                    "kind": "cve",
                    "layer": "technical",
                    "label": cve_item,
                    "subtitle": f"Impact: {impact_summary}",
                    "cve_id": cve_item,
                    "severity": f_sev,
                    "impact": impact_summary,
                    "confidence": f_conf,
                    "host": f_host,
                    "port": f_port,
                    "service": f_service,
                    "data": {
                        "cve": cve_item,
                        "cve_id": cve_item,
                        "severity": f_sev,
                        "impact": impact_summary,
                        "confidence": f_conf,
                        "cvss": finding.get("cvss", 9.8 if f_sev == "Critical" else (7.5 if f_sev == "High" else 5.0)),
                        "host": f_host,
                        "port": f_port,
                        "service": f_service,
                        "title": f_title,
                    },
                    "icon": "shield-alert",
                })
                cve_nodes_list.append(cve_node_id)

                # Finding -> CVE edge (clean structural edge)
                add_edge({
                    "id": f"e:{finding_id}->{cve_node_id}",
                    "source": finding_id,
                    "target": cve_node_id,
                    "label": "",
                    "important": False,
                    "kind": "maps-to",
                    "layer": "technical",
                })
        finding_cve_map[finding_id] = finding_cves

        # MITRE Node (Technical Layer)
        mitre_val = finding.get("mitre") or finding.get("mitre_technique") or ctx.get("mitre_technique") or ctx.get("mitre")
        if mitre_val:
            mitre_id = f"mitre:{_slugify(mitre_val.split(' - ')[0])}"
            tech_code = mitre_val.split(" - ")[0].strip()
            add_node({
                "id": mitre_id,
                "kind": "mitre",
                "layer": "technical",
                "label": mitre_val,
                "subtitle": f"MITRE Technique {tech_code}",
                "severity": f_sev,
                "confidence": f_conf,
                "data": {
                    "mitre": mitre_val,
                    "technique": tech_code,
                    "severity": f_sev,
                },
                "icon": "crosshair",
            })
            mitre_nodes_list.append(mitre_id)

            # Finding -> MITRE
            add_edge({
                "id": f"e:{finding_id}->{mitre_id}",
                "source": finding_id,
                "target": mitre_id,
                "label": "",
                "important": False,
                "kind": "maps-to",
                "layer": "technical",
            })

            # CVE -> MITRE
            for cn_id in finding_cves:
                add_edge({
                    "id": f"e:{cn_id}->{mitre_id}",
                    "source": cn_id,
                    "target": mitre_id,
                    "label": "",
                    "important": False,
                    "kind": "maps-to",
                    "layer": "technical",
                })

        # CWE Node (Technical Layer)
        cwe_val = ctx.get("cwe") or finding.get("cwe")
        if cwe_val:
            cwe_id = f"cwe:{_slugify(cwe_val)}"
            add_node({
                "id": cwe_id,
                "kind": "cwe",
                "layer": "technical",
                "label": cwe_val,
                "subtitle": CWE_NAMES.get(cwe_val, "Common Weakness Enumeration"),
                "severity": f_sev,
                "confidence": f_conf,
                "data": {"cwe": cwe_val},
                "icon": "shield",
            })
            add_edge({
                "id": f"e:{finding_id}->{cwe_id}",
                "source": finding_id,
                "target": cwe_id,
                "label": "",
                "important": False,
                "kind": "maps-to",
                "layer": "technical",
            })

    # 4. Remediation Nodes (Technical Layer)
    remediation_nodes_list = []
    if remediation and isinstance(remediation, list):
        for idx, rem in enumerate(remediation):
            if not isinstance(rem, dict):
                continue
            rem_title = rem.get("title") or rem.get("action") or f"Remediation #{idx+1}"
            rem_rule_id = rem.get("rule_id", f"REM_{idx+1}")
            rem_id = f"remediation:{_slugify(rem_title[:35])}-{_slugify(rem_rule_id)}"
            diff = rem.get("difficulty") or rem.get("estimated_difficulty") or "Medium"
            prio = rem.get("priority", idx + 1)
            rem_sev = rem.get("severity", "High")

            add_node({
                "id": rem_id,
                "kind": "remediation",
                "layer": "technical",
                "label": rem_title,
                "subtitle": f"Priority {prio} · {diff} difficulty",
                "severity": rem_sev,
                "confidence": "High",
                "data": {
                    "fix": rem.get("action") or rem.get("fix", ""),
                    "improvement": rem.get("improvement", ""),
                    "why": rem.get("why", ""),
                    "priority": prio,
                    "difficulty": diff,
                },
                "icon": "wrench",
            })
            remediation_nodes_list.append(rem_id)

            # Connect finding to remediation
            matched_finding = None
            for f in (risk_findings or []):
                if not isinstance(f, dict):
                    continue
                if (rem.get("id") and f.get("id") == rem.get("id")) or \
                   (rem.get("rule_id") and f.get("rule_id") == rem.get("rule_id")) or \
                   (rem.get("service") and f.get("service") == rem.get("service")):
                    matched_finding = f
                    break

            if matched_finding:
                src_fid = finding_id_map.get(matched_finding.get("id") or matched_finding.get("title", "finding"))
                if not src_fid:
                    src_fid = f"finding:{_slugify(matched_finding.get('host') or primary_host)}:{_slugify(matched_finding.get('id') or matched_finding.get('title', 'finding'))}"
                if src_fid in seen_ids:
                    add_edge({
                        "id": f"e:{src_fid}->{rem_id}",
                        "source": src_fid,
                        "target": rem_id,
                        "label": "Mitigated By",
                        "important": True,
                        "kind": "mitigated-by",
                        "layer": "technical",
                    })
            elif finding_nodes_list:
                src_fid = finding_nodes_list[idx % len(finding_nodes_list)]
                add_edge({
                    "id": f"e:{src_fid}->{rem_id}",
                    "source": src_fid,
                    "target": rem_id,
                    "label": "Mitigated By",
                    "important": True,
                    "kind": "mitigated-by",
                    "layer": "technical",
                })

    # 5. Attack Layer Construction
    # Flow: Internet Exposure → Initial Access → Privilege Escalation → Lateral Movement → Data Exposure
    crit_findings = [f for f in (risk_findings or []) if str(f.get("severity", "")).capitalize() == "Critical"]
    high_findings = [f for f in (risk_findings or []) if str(f.get("severity", "")).capitalize() == "High"]
    all_f = (risk_findings or [])
    has_crit = len(crit_findings) > 0
    top_f = (crit_findings + high_findings + all_f + [{}])[0]

    target_svc = top_f.get("service", "HTTP/SSH")
    target_port = str(top_f.get("port", "80"))
    target_cve = top_f.get("cve_id") or top_f.get("cve") or "Identified CVE"

    # Stage 1: Internet Exposure
    add_node({
        "id": "attack:exposure",
        "kind": "chain",
        "layer": "attack",
        "label": "Internet Exposure",
        "subtitle": f"Public Perimeter · {primary_host}",
        "severity": "Critical" if has_crit else "High",
        "confidence": "High",
        "stage": "Internet Exposure",
        "host": primary_host,
        "data": {
            "stage": "Internet Exposure",
            "host": primary_host,
            "description": f"Target host {primary_host} is reachable via external network with {len(all_f)} identified security exposures.",
        },
        "icon": "globe",
    })

    # Stage 2: Initial Access
    add_node({
        "id": "attack:initial-access",
        "kind": "chain",
        "layer": "attack",
        "label": "Initial Access (T1190)",
        "subtitle": f"Exploit {target_svc.upper()} ({target_cve})",
        "severity": "Critical" if has_crit else "High",
        "confidence": "High",
        "stage": "Initial Access",
        "host": primary_host,
        "port": target_port,
        "service": target_svc,
        "cve": target_cve,
        "data": {
            "stage": "Initial Access",
            "technique": "T1190 - Exploit Public-Facing Application",
            "service": target_svc,
            "port": target_port,
            "cve": target_cve,
            "description": f"Unauthenticated exploitation of {target_svc} on port {target_port} grants initial perimeter access.",
        },
        "icon": "alert-triangle",
    })

    # Edge: Exposure -> Initial Access
    add_edge({
        "id": "e:attack:exposure->initial-access",
        "source": "attack:exposure",
        "target": "attack:initial-access",
        "label": "Exploits",
        "important": True,
        "kind": "generated",
        "layer": "attack",
    })

    # Stage 3: Privilege Escalation
    add_node({
        "id": "attack:privilege-escalation",
        "kind": "chain",
        "layer": "attack",
        "label": "Privilege Escalation (T1068)",
        "subtitle": "Elevation to Root / System Admin",
        "severity": "Critical",
        "confidence": "High",
        "stage": "Privilege Escalation",
        "host": primary_host,
        "data": {
            "stage": "Privilege Escalation",
            "technique": "T1068 - Exploitation for Privilege Escalation",
            "description": f"Attacker leverages daemon service privileges to escalate to root on {primary_host}.",
        },
        "icon": "shield-alert",
    })

    # Edge: Initial Access -> Privilege Escalation
    add_edge({
        "id": "e:attack:ia->pe",
        "source": "attack:initial-access",
        "target": "attack:privilege-escalation",
        "label": "Escalates",
        "important": True,
        "kind": "generated",
        "layer": "attack",
    })

    # Stage 4: Lateral Movement
    add_node({
        "id": "attack:lateral-movement",
        "kind": "chain",
        "layer": "attack",
        "label": "Lateral Movement (T1021)",
        "subtitle": "Internal Subnet Pivoting",
        "severity": "High",
        "confidence": "Medium",
        "stage": "Lateral Movement",
        "host": primary_host,
        "data": {
            "stage": "Lateral Movement",
            "technique": "T1021 - Remote Services",
            "description": "Session reuse and remote management pivoting across internal network services.",
        },
        "icon": "git-branch",
    })

    # Edge: Privilege Escalation -> Lateral Movement
    add_edge({
        "id": "e:attack:pe->lm",
        "source": "attack:privilege-escalation",
        "target": "attack:lateral-movement",
        "label": "Pivots",
        "important": True,
        "kind": "generated",
        "layer": "attack",
    })

    # Stage 5: Data Exposure
    add_node({
        "id": "attack:data-exposure",
        "kind": "chain",
        "layer": "attack",
        "label": "Data Exposure (T1040)",
        "subtitle": "Exfiltration of Databases & Records",
        "severity": "High",
        "confidence": "High",
        "stage": "Data Exposure",
        "host": primary_host,
        "data": {
            "stage": "Data Exposure",
            "technique": "T1040 - Network Sniffing / Sensitive Data Exposure",
            "description": "Direct extraction of database records, telemetry, and stored domain credentials.",
        },
        "icon": "shield-alert",
    })

    # Edge: Lateral Movement -> Data Exposure
    add_edge({
        "id": "e:attack:lm->sde",
        "source": "attack:lateral-movement",
        "target": "attack:data-exposure",
        "label": "Exfiltrates",
        "important": True,
        "kind": "generated",
        "layer": "attack",
    })

    # Cross-layer link: Technical Finding/CVE -> Initial Access
    if finding_nodes_list:
        add_edge({
            "id": f"e:{finding_nodes_list[0]}->attack:initial-access",
            "source": finding_nodes_list[0],
            "target": "attack:initial-access",
            "label": "Enables",
            "important": False,
            "kind": "leads-to",
            "layer": "cross-layer",
        })

    # Cross-layer link: Attack Stages -> Remediation
    if remediation_nodes_list:
        add_edge({
            "id": f"e:attack:initial-access->{remediation_nodes_list[0]}",
            "source": "attack:initial-access",
            "target": remediation_nodes_list[0],
            "label": "Mitigated By",
            "important": True,
            "kind": "mitigated-by",
            "layer": "cross-layer",
        })

    # Build layers partition for easy frontend filtering
    tech_nodes = [n for n in nodes if n.get("layer") == "technical"]
    tech_edges = [e for e in edges if e.get("layer") == "technical"]
    attack_nodes = [n for n in nodes if n.get("layer") == "attack"]
    attack_edges = [e for e in edges if e.get("layer") == "attack"]

    return {
        "nodes": nodes,
        "edges": edges,
        "layers": {
            "technical": {"nodes": tech_nodes, "edges": tech_edges},
            "attack": {"nodes": attack_nodes, "edges": attack_edges},
        },
    }


# Friendly rule labels used in rule-kind nodes.
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
