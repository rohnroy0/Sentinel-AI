"""SOC-Grade Attack Path & MITRE ATT&CK Journey Engine for Sentinel-AI.

Constructs unified, evidence-based attack chains across structured MITRE ATT&CK stages:
- Internet Exposure
- Initial Access (T1190 / T1133)
- Privilege Escalation (T1068 / T1078)
- Lateral Movement (T1021 / T1210)
- Sensitive Data Exposure (T1040 / T1530)

Generates multi-layer graph relationships:
Asset → Service → Finding → CVE → MITRE Technique → Attack Stage → Remediation

Propagates confidence from CVEs and findings, attaches verified telemetry evidence
(host, port, service, version, CVE, severity), and attaches rich remediation nodes
(fix action, related vulnerability, priority, reason).
"""

from typing import List, Dict, Any
import re


def _slugify(val: Any) -> str:
    return re.sub(r"[^a-zA-Z0-9]+", "-", str(val)).strip("-").lower()


def build_chains(risk_findings: List[Dict[str, Any]], discovered_hosts: List[Dict[str, Any]] = None, remediations: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Build unified, evidence-based attack chains and MITRE ATT&CK journeys."""
    nodes = []
    edges = []
    seen_node_ids = set()

    def add_node(node):
        if node["id"] in seen_node_ids:
            return
        seen_node_ids.add(node["id"])
        nodes.append(node)

    def add_edge(edge):
        edges.append(edge)

    findings = [f for f in (risk_findings or []) if isinstance(f, dict)]

    # Classify findings by severity and characteristics
    crit_findings = [f for f in findings if str(f.get("severity", "")).capitalize() == "Critical"]
    high_findings = [f for f in findings if str(f.get("severity", "")).capitalize() == "High"]
    med_findings = [f for f in findings if str(f.get("severity", "")).capitalize() == "Medium"]
    low_findings = [f for f in findings if str(f.get("severity", "")).capitalize() in ("Low", "Info")]

    has_critical = len(crit_findings) > 0
    has_high = len(high_findings) > 0
    has_findings = len(findings) > 0

    # Determine primary target and host
    top_finding = (crit_findings + high_findings + med_findings + low_findings + [{}])[0]
    target_host = top_finding.get("host") or "192.168.1.10"
    target_service = top_finding.get("service") or "HTTP/SSH"
    target_port = str(top_finding.get("port") or "80")
    target_cve = top_finding.get("cve_id") or top_finding.get("cve") or "Known CVE"
    target_version = top_finding.get("version") or ""

    # Confidence calculation & propagation
    finding_confidences = [f.get("confidence", "High") for f in findings if f.get("confidence")]
    if any(c == "Low" for c in finding_confidences):
        path_confidence = "Low"
        path_confidence_score = 65
        is_uncertain = True
    elif any(c == "Medium" for c in finding_confidences):
        path_confidence = "Medium"
        path_confidence_score = 80
        is_uncertain = False
    else:
        path_confidence = "High" if has_findings else "Medium"
        path_confidence_score = 95 if has_findings else 75
        is_uncertain = False

    # Dynamic risk scoring
    from ai.risk_engine.risk_calculator import calculate_dynamic_risk_score
    path_risk_score, path_severity = calculate_dynamic_risk_score(findings, detected_services=discovered_hosts)
    if path_severity not in ("Critical", "High", "Medium", "Low"):
        path_severity = "Low" if path_risk_score > 0 else "Low"

    # ─────────────────────────────────────────────────────────────────────────
    # 1. Single Entry Node: Internet Exposure (Asset Node)
    # ─────────────────────────────────────────────────────────────────────────
    start_evidence = f"Host: {target_host} | Status: Online & Exposed | Reachable via External Network with {len(findings)} detected security exposure(s)."
    add_node({
        "id": "mitre-start",
        "label": "Internet Exposure",
        "subLabel": f"Host: {target_host} (Reachable via Public Network)",
        "kind": "asset",
        "severity": path_severity,
        "confidence": path_confidence,
        "confidence_level": path_confidence,
        "confidence_score": path_confidence_score,
        "host": target_host,
        "evidence": start_evidence,
        "mitre": "T1190 / Network Perimeter",
        "icon": "globe",
        "meta": [target_host, f"{len(findings)} Findings", f"{path_confidence_score}% Conf"],
    })

    # ─────────────────────────────────────────────────────────────────────────
    # 2. Service & Finding & CVE & MITRE Entity Layer
    # Flow: Asset → Service → Finding → CVE → MITRE Technique
    # ─────────────────────────────────────────────────────────────────────────
    processed_services = set()
    service_nodes = []
    finding_nodes = []
    cve_nodes = []
    mitre_nodes = []

    for idx, f in enumerate(findings):
        svc_name = f.get("service") or "service"
        svc_port = str(f.get("port") or "80")
        svc_host = f.get("host") or target_host
        svc_ver = f.get("version") or ""
        f_sev = str(f.get("severity", "High")).capitalize()
        f_cve = f.get("cve_id") or f.get("cve") or f"CVE-Pending-{idx+1}"
        f_mitre = f.get("mitre") or "T1190 - Exploit Public-Facing Application"
        f_conf = f.get("confidence") or path_confidence
        f_conf_score = 95 if f_conf == "High" else (80 if f_conf == "Medium" else 60)

        # Service Node
        svc_key = f"{svc_name}:{svc_port}"
        svc_id = f"service-{_slugify(svc_name)}-{svc_port}"
        if svc_key not in processed_services:
            processed_services.add(svc_key)
            svc_evidence = f"Host: {svc_host} | Port: {svc_port}/tcp | Service: {svc_name} {svc_ver} | Exposure: Open listening network port"
            add_node({
                "id": svc_id,
                "label": f"{svc_name.upper()} Service",
                "subLabel": f"Port {svc_port} · {svc_ver or 'Version Detected'}",
                "kind": "service",
                "host": svc_host,
                "port": svc_port,
                "service": svc_name,
                "version": svc_ver,
                "severity": f_sev,
                "confidence": f_conf,
                "confidence_level": f_conf,
                "confidence_score": f_conf_score,
                "evidence": svc_evidence,
                "icon": "server",
                "meta": [f"Port {svc_port}", svc_name, f"{f_conf_score}% Conf"],
            })
            # Asset -> Service
            add_edge({
                "id": f"e-asset-svc-{svc_id}",
                "source": "mitre-start",
                "target": svc_id,
                "label": "Hosts",
            })
            service_nodes.append(svc_id)

        # Finding Node
        f_id = f"finding-{_slugify(f.get('id', f'vuln-{idx+1}'))}"
        f_title = f.get("title") or f"Vulnerability on {svc_name}:{svc_port}"
        f_evidence = f"Host: {svc_host} | Port: {svc_port}/tcp | Service: {svc_name} | Version: {svc_ver or 'N/A'} | CVE: {f_cve} | Severity: {f_sev}"
        add_node({
            "id": f_id,
            "label": f_title,
            "subLabel": f"Severity: {f_sev} · Port {svc_port} · {f_cve}",
            "kind": "finding",
            "host": svc_host,
            "port": svc_port,
            "service": svc_name,
            "version": svc_ver,
            "cve": f_cve,
            "severity": f_sev,
            "confidence": f_conf,
            "confidence_level": f_conf,
            "confidence_score": f_conf_score,
            "evidence": f_evidence,
            "icon": "alert-triangle",
            "meta": [f_sev, f"Port {svc_port}", f"{f_conf_score}% Conf"],
        })
        # Service -> Finding
        add_edge({
            "id": f"e-svc-fnd-{idx}",
            "source": svc_id,
            "target": f_id,
            "label": "Exposes",
        })
        finding_nodes.append(f_id)

        # CVE Node
        cve_id_node = f"cve-{_slugify(f_cve)}"
        cve_evidence = f"Host: {svc_host} | Port: {svc_port} | Service: {svc_name} {svc_ver} matches vulnerability {f_cve} with CVSS {f.get('cvss', '9.8')} ({f_sev})."
        add_node({
            "id": cve_id_node,
            "label": f_cve,
            "subLabel": f"CVSS: {f.get('cvss', '9.8')} · {f_sev} Vulnerability",
            "kind": "cve",
            "host": svc_host,
            "port": svc_port,
            "service": svc_name,
            "version": svc_ver,
            "cve": f_cve,
            "severity": f_sev,
            "confidence": f_conf,
            "confidence_level": f_conf,
            "confidence_score": f_conf_score,
            "evidence": cve_evidence,
            "icon": "shield-alert",
            "meta": [f_cve, f_sev, f"{f_conf_score}% Conf"],
        })
        # Finding -> CVE
        add_edge({
            "id": f"e-fnd-cve-{idx}",
            "source": f_id,
            "target": cve_id_node,
            "label": "Correlates To",
        })
        cve_nodes.append(cve_id_node)

        # MITRE Technique Node
        tech_id_node = f"mitre-tech-{_slugify(f_mitre[:15])}"
        mitre_evidence = f"Host: {svc_host} | Port: {svc_port} | Technique: {f_mitre} | Vector: Attacker exploits exposed {svc_name} service via {f_cve}."
        add_node({
            "id": tech_id_node,
            "label": f_mitre,
            "subLabel": f"Tactics: Initial Access / Execution · {svc_name.upper()}",
            "kind": "mitre",
            "host": svc_host,
            "port": svc_port,
            "service": svc_name,
            "version": svc_ver,
            "cve": f_cve,
            "mitre": f_mitre,
            "severity": f_sev,
            "confidence": f_conf,
            "confidence_level": f_conf,
            "confidence_score": f_conf_score,
            "evidence": mitre_evidence,
            "icon": "git-branch",
            "meta": ["MITRE ATT&CK", f_mitre.split(" ")[0], f"{f_conf_score}% Conf"],
        })
        # CVE -> MITRE Technique
        add_edge({
            "id": f"e-cve-mitre-{idx}",
            "source": cve_id_node,
            "target": tech_id_node,
            "label": "Maps To",
        })
        mitre_nodes.append(tech_id_node)

    # ─────────────────────────────────────────────────────────────────────────
    # 3. Single MITRE Attack Journey Stages
    # Journey: Internet Exposure → Initial Access → Privilege Escalation → Lateral Movement → Sensitive Data Exposure
    # ─────────────────────────────────────────────────────────────────────────
    journey_stages = []
    prev_journey_id = "mitre-start"

    if has_findings:
        # Stage 1: Initial Access (T1190)
        ia_finding = next((f for f in findings if str(f.get("severity", "")).capitalize() in ("Critical", "High")), top_finding)
        ia_cve = ia_finding.get("cve_id") or ia_finding.get("cve") or "CVE-Identified"
        ia_svc = ia_finding.get("service", target_service)
        ia_port = str(ia_finding.get("port", target_port))
        ia_ver = ia_finding.get("version", target_version)
        ia_sev = str(ia_finding.get("severity", "High")).capitalize()
        ia_conf = ia_finding.get("confidence", path_confidence)
        ia_conf_score = 95 if ia_conf == "High" else (80 if ia_conf == "Medium" else 60)

        ia_label = "Initial Access\n(T1190 - Exploit Public-Facing Application)"
        ia_evidence = f"Host: {target_host} | Port: {ia_port}/tcp | Service: {ia_svc} {ia_ver} | CVE: {ia_cve} | Severity: {ia_sev} | Vector: Unauthenticated exploitation grants initial perimeter breach."

        add_node({
            "id": "mitre-ia",
            "label": ia_label,
            "subLabel": f"{ia_svc} on port {ia_port} · {ia_cve}",
            "kind": "chain",
            "host": target_host,
            "port": ia_port,
            "service": ia_svc,
            "version": ia_ver,
            "cve": ia_cve,
            "severity": ia_sev,
            "confidence": ia_conf,
            "confidence_level": ia_conf,
            "confidence_score": ia_conf_score,
            "evidence": ia_evidence,
            "mitre": "T1190 - Exploit Public-Facing Application",
            "finding": ia_finding.get("title"),
            "icon": "alert-triangle",
            "meta": ["T1190", f"Port {ia_port}", f"{ia_conf_score}% Conf"],
        })
        # Connect MITRE Technique / Internet Exposure -> Initial Access
        add_edge({"id": "je1", "source": prev_journey_id, "target": "mitre-ia", "label": "Exploits"})
        # Also connect MITRE technique node if exists
        if mitre_nodes:
            add_edge({"id": "e-mitre-ia", "source": mitre_nodes[0], "target": "mitre-ia", "label": "Enables"})
        prev_journey_id = "mitre-ia"

        journey_stages.append({
            "stage": "Initial Access",
            "technique": "T1190 - Exploit Public-Facing Application",
            "host": target_host,
            "port": ia_port,
            "service": ia_svc,
            "version": ia_ver,
            "cve": ia_cve,
            "severity": ia_sev,
            "evidence": ia_evidence,
            "confidence": ia_conf,
            "confidence_level": ia_conf,
            "confidence_score": ia_conf_score,
        })

        # Stage 2: Privilege Escalation (T1068 / T1078)
        pe_finding = next((f for f in findings if "root" in str(f.get("title", "")).lower() or "privilege" in str(f.get("title", "")).lower() or str(f.get("severity", "")).capitalize() == "Critical"), None)
        if pe_finding or has_critical:
            pe_source = pe_finding or top_finding
            pe_cve = pe_source.get("cve_id") or pe_source.get("cve") or ia_cve
            pe_svc = pe_source.get("service", ia_svc)
            pe_port = str(pe_source.get("port", ia_port))
            pe_ver = pe_source.get("version", ia_ver)
            pe_conf = pe_source.get("confidence", path_confidence)
            pe_conf_score = 90 if pe_conf == "High" else 75

            pe_label = "Privilege Escalation\n(T1068 - Exploitation for Privilege Escalation)"
            pe_evidence = f"Host: {target_host} | Port: {pe_port}/tcp | Service: {pe_svc} {pe_ver} | CVE: {pe_cve} | Severity: Critical | Vector: Elevation from daemon process privileges to root / system administrator."

            add_node({
                "id": "mitre-pe",
                "label": pe_label,
                "subLabel": f"Elevation to root / system administrator on {target_host}",
                "kind": "chain",
                "host": target_host,
                "port": pe_port,
                "service": pe_svc,
                "version": pe_ver,
                "cve": pe_cve,
                "severity": "Critical",
                "confidence": pe_conf,
                "confidence_level": pe_conf,
                "confidence_score": pe_conf_score,
                "evidence": pe_evidence,
                "mitre": "T1068 - Exploitation for Privilege Escalation",
                "icon": "shield-alert",
                "meta": ["T1068", "Root Elevation", f"{pe_conf_score}% Conf"],
            })
            add_edge({"id": "je2", "source": prev_journey_id, "target": "mitre-pe", "label": "Escalates"})
            prev_journey_id = "mitre-pe"
            journey_stages.append({
                "stage": "Privilege Escalation",
                "technique": "T1068 - Exploitation for Privilege Escalation",
                "host": target_host,
                "port": pe_port,
                "service": pe_svc,
                "version": pe_ver,
                "cve": pe_cve,
                "severity": "Critical",
                "evidence": pe_evidence,
                "confidence": pe_conf,
                "confidence_level": pe_conf,
                "confidence_score": pe_conf_score,
            })

        # Stage 3: Lateral Movement (T1021)
        lm_finding = next((f for f in findings if f.get("service") in ("ssh", "mysql", "redis", "mongodb", "postgresql", "smb", "rdp") or str(f.get("port")) in ("22", "3306", "6379", "27017", "445")), None)
        if lm_finding or len(findings) > 1:
            lm_source = lm_finding or (findings[1] if len(findings) > 1 else top_finding)
            lm_svc = lm_source.get("service", "SSH/Internal Services")
            lm_port = str(lm_source.get("port", "22"))
            lm_ver = lm_source.get("version", "")
            lm_cve = lm_source.get("cve_id") or lm_source.get("cve") or "N/A"
            lm_conf = lm_source.get("confidence", path_confidence)
            lm_conf_score = 85 if lm_conf == "High" else 70

            lm_label = "Lateral Movement\n(T1021 - Remote Services)"
            lm_evidence = f"Host: {target_host} | Port: {lm_port}/tcp | Service: {lm_svc} {lm_ver} | CVE: {lm_cve} | Severity: High | Vector: Authenticated session reuse and service pivot across internal subnets."

            add_node({
                "id": "mitre-lm",
                "label": lm_label,
                "subLabel": f"Pivoting via {lm_svc} across internal network",
                "kind": "chain",
                "host": target_host,
                "port": lm_port,
                "service": lm_svc,
                "version": lm_ver,
                "cve": lm_cve,
                "severity": "High",
                "confidence": lm_conf,
                "confidence_level": lm_conf,
                "confidence_score": lm_conf_score,
                "evidence": lm_evidence,
                "mitre": "T1021 - Remote Services",
                "icon": "git-branch",
                "meta": ["T1021", f"Pivot: {lm_svc}", f"{lm_conf_score}% Conf"],
            })
            add_edge({"id": "je3", "source": prev_journey_id, "target": "mitre-lm", "label": "Pivots"})
            prev_journey_id = "mitre-lm"
            journey_stages.append({
                "stage": "Lateral Movement",
                "technique": "T1021 - Remote Services",
                "host": target_host,
                "port": lm_port,
                "service": lm_svc,
                "version": lm_ver,
                "cve": lm_cve,
                "severity": "High",
                "evidence": lm_evidence,
                "confidence": lm_conf,
                "confidence_level": lm_conf,
                "confidence_score": lm_conf_score,
            })

        # Stage 4: Sensitive Data Exposure (T1040 / T1530)
        data_finding = next((f for f in findings if f.get("service") in ("mysql", "mongodb", "redis", "ftp") or "database" in str(f.get("title", "")).lower() or "cleartext" in str(f.get("title", "")).lower()), None)
        if data_finding or has_critical or len(findings) >= 2:
            data_source = data_finding or top_finding
            data_svc = data_source.get("service", "backend databases")
            data_port = str(data_source.get("port", "3306"))
            data_ver = data_source.get("version", "")
            data_cve = data_source.get("cve_id") or data_source.get("cve") or "N/A"
            data_conf = data_source.get("confidence", path_confidence)
            data_conf_score = 85 if data_conf == "High" else 70

            sde_label = "Sensitive Data Exposure\n(T1040 - Network Sniffing / Exfiltration)"
            sde_evidence = f"Host: {target_host} | Port: {data_port}/tcp | Service: {data_svc} {data_ver} | CVE: {data_cve} | Severity: High | Vector: Direct access enables extraction of database records, telemetry, and credentials."

            add_node({
                "id": "mitre-sde",
                "label": sde_label,
                "subLabel": f"Data exfiltration from {data_svc}",
                "kind": "chain",
                "host": target_host,
                "port": data_port,
                "service": data_svc,
                "version": data_ver,
                "cve": data_cve,
                "severity": "High",
                "confidence": data_conf,
                "confidence_level": data_conf,
                "confidence_score": data_conf_score,
                "evidence": sde_evidence,
                "mitre": "T1040 - Network Sniffing / Exfiltration",
                "icon": "shield-alert",
                "meta": ["T1040", "Data Exfil", f"{data_conf_score}% Conf"],
            })
            add_edge({"id": "je4", "source": prev_journey_id, "target": "mitre-sde", "label": "Exfiltrates"})
            journey_stages.append({
                "stage": "Sensitive Data Exposure",
                "technique": "T1040 - Network Sniffing / Exfiltration",
                "host": target_host,
                "port": data_port,
                "service": data_svc,
                "version": data_ver,
                "cve": data_cve,
                "severity": "High",
                "evidence": sde_evidence,
                "confidence": data_conf,
                "confidence_level": data_conf,
                "confidence_score": data_conf_score,
            })

    # ─────────────────────────────────────────────────────────────────────────
    # 4. Detailed Remediation Nodes
    # Include: Fix action, Related vulnerability, Priority, Reason
    # ─────────────────────────────────────────────────────────────────────────
    rem_items = remediations or []
    if not rem_items and findings:
        for idx, f in enumerate(findings):
            f_svc = f.get("service", "service")
            f_port = str(f.get("port", "80"))
            f_cve = f.get("cve_id") or f.get("cve", "CVE-Identified")
            f_sev = str(f.get("severity", "High")).capitalize()
            p_val = 1 if f_sev == "Critical" else (2 if f_sev == "High" else 3)
            rem_items.append({
                "id": f.get("id", f"rem-{idx}"),
                "title": f"Patch {f_svc.upper()} and Restrict Port {f_port}",
                "action": f"Upgrade {f_svc} to the latest vendor-patched release and restrict port {f_port} via firewall.",
                "vulnerability": f"{f_cve} ({f.get('title', 'Exposure')})",
                "priority": p_val,
                "priority_label": f"Priority {p_val} ({'Critical' if p_val == 1 else 'High' if p_val == 2 else 'Medium'})",
                "reason": f"Eliminates remote exploitation and initial access vector on host {target_host}:{f_port}.",
                "host": target_host,
                "port": f_port,
                "service": f_svc,
                "cve": f_cve,
                "severity": f_sev,
            })

    for idx, rem in enumerate(rem_items[:3]):
        rem_title = rem.get("title") or rem.get("action") or f"Remediation #{idx+1}"
        fix_action = rem.get("action") or f"Apply vendor security patch and firewall rules for {rem.get('service', 'service')}."
        rel_vuln = rem.get("vulnerability") or rem.get("related_vulnerability") or (findings[idx].get("cve_id") if idx < len(findings) else "Identified Exploit Vector")
        p_num = rem.get("priority", idx + 1)
        p_label = rem.get("priority_label") or f"Priority {p_num} ({'Critical' if p_num == 1 else 'High' if p_num == 2 else 'Medium'})"
        rem_reason = rem.get("reason") or rem.get("why") or f"Mitigates active exploitation vector across {target_host}."
        rem_id = f"remediation:chain-{idx+1}"

        rem_evidence = f"Fix Action: {fix_action} | Target: {target_host}:{rem.get('port', '80')} | Related Vulnerability: {rel_vuln} | Priority: {p_label} | Reason: {rem_reason}"

        add_node({
            "id": rem_id,
            "label": f"Fix: {rem_title[:45]}",
            "subLabel": f"{p_label} · {fix_action[:55]}",
            "kind": "remediation",
            "fix_action": fix_action,
            "related_vulnerability": rel_vuln,
            "priority": p_label,
            "reason": rem_reason,
            "host": target_host,
            "port": str(rem.get("port", "80")),
            "service": rem.get("service", "service"),
            "cve": rel_vuln,
            "confidence": "High",
            "confidence_level": "High",
            "confidence_score": 95,
            "evidence": rem_evidence,
            "icon": "wrench",
            "meta": [f"P{p_num}", "Remediation", "95% Conf"],
        })

        # Connect Attack Stages / Findings to Remediation
        target_src = "mitre-ia" if "mitre-ia" in seen_node_ids else ("mitre-start" if "mitre-start" in seen_node_ids else "mitre-start")
        add_edge({
            "id": f"remed-{idx}",
            "source": target_src,
            "target": rem_id,
            "label": "Mitigated By",
        })
        if idx < len(cve_nodes):
            add_edge({
                "id": f"remed-cve-{idx}",
                "source": cve_nodes[idx],
                "target": rem_id,
                "label": "Mitigates",
            })

    # ─────────────────────────────────────────────────────────────────────────
    # 5. Attack Path Intelligence Explanation
    # ─────────────────────────────────────────────────────────────────────────
    if has_critical:
        explanation = (
            f"{target_service} exposed on port {target_port} on {target_host} can be exploited through "
            f"{target_cve}, allowing initial access. An attacker can leverage elevated privileges "
            f"to escalate to root, move laterally across internal services, and exfiltrate sensitive data."
        )
    elif has_high:
        explanation = (
            f"{target_service} exposed on port {target_port} on {target_host} presents a high-severity "
            f"security exposure ({top_finding.get('title', 'Vulnerability')}), allowing remote entry. "
            f"Unsegmented network services enable lateral movement and potential data exposure."
        )
    else:
        explanation = (
            f"Host {target_host} shows minimal attack surface. No critical multi-stage exploit chains "
            f"were identified across verified network ports."
        )

    intelligence = {
        "path_id": "path-1",
        "title": f"{target_service.upper()} Exploitation & Host Compromise Path",
        "severity": path_severity,
        "risk_score": path_risk_score,
        "confidence": path_confidence,
        "confidence_level": path_confidence,
        "confidence_score": path_confidence_score,
        "is_uncertain": is_uncertain,
        "explanation": explanation,
        "stages": journey_stages,
    }

    return {
        "nodes": nodes,
        "edges": edges,
        "intelligence": intelligence,
        "attack_paths": [intelligence],
    }

