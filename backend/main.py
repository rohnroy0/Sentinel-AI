from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import asyncio
import re
import time
from datetime import datetime

# Import AI pipeline modules
from ai.parser.nmap_parser import parse_nmap_text
from ai.rule_engine.rules import apply_rules
from ai.knowledge_base.kb import enrich_findings, KB_STORE
from ai.risk_engine.risk_calculator import calculate_risk, get_overall_risk
from ai.correlation_engine.correlator import correlate_findings
from ai.attack_chain_builder.builder import build_chains
from ai.llm.analyzer import analyze_results
from ai.report_generator.generator import generate_report
from ai.investigation_graph.builder import build_investigation_graph

SENTINEL_VERSION = "1.0.0"
BUILD_VERSION = "2026.08.01"

app = FastAPI(title="Sentinel Investigation API", version=SENTINEL_VERSION)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

investigations = {}

class UploadRequest(BaseModel):
    content: str


class InvestigationState:
    def __init__(self, content):
        self.id = str(uuid.uuid4())
        self.content = content
        self.status = "Scan Uploaded"
        self.progress = 0
        self.is_complete = False
        self.started_at = time.perf_counter()
        self.duration_seconds = 0.0

        # Results
        self.findings = []
        self.detected_services = []
        self.graph = {"nodes": [], "edges": []}
        self.attack_chains = {"nodes": [], "edges": []}
        self.decision_log = []
        self.report = {}
        self.risk_dashboard = {}
        self.remediation = []
        self.investigation_summary = {}

    def log_decision(self, *, stage, decision, why, evidence, outcome,
                     next_step, confidence="Medium", status="Completed",
                     processing_ms=0, title=None, module=None):
        """Append a structured decision entry to the audit trail."""
        self.decision_log.append({
            "id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
            "stage": stage,
            "module": module or stage,
            "title": title or decision,
            "decision": decision,
            "why": why,
            "evidence": evidence if isinstance(evidence, list) else [evidence],
            "confidence": confidence,
            "outcome": outcome,
            "next_step": next_step,
            "status": status,
            "processing_ms": round(processing_ms, 2),
        })


# ─── Static Endpoints ──────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": SENTINEL_VERSION}

@app.get("/api/info")
async def info():
    return {
        "name": "Sentinel Investigation API",
        "version": SENTINEL_VERSION,
        "build": BUILD_VERSION,
        "description": "Autonomous AI security misconfiguration investigation engine."
    }


# ─── Upload ────────────────────────────────────────────────────────────────

@app.post("/api/upload")
async def upload_scan(req: UploadRequest):
    inv = InvestigationState(req.content)
    investigations[inv.id] = inv
    return {"investigationId": inv.id}


# ─── Pipeline ─────────────────────────────────────────────────────────────

def build_risk_dashboard(risk_findings, chain_data):
    """Build a rich risk dashboard payload from the deterministic findings."""
    sev_order = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1, "Info": 0}

    counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Info": 0}
    for f in risk_findings:
        sev = f.get("severity", "Info")
        counts[sev] = counts.get(sev, 0) + 1

    overall = get_overall_risk(risk_findings)

    # Overall numeric score (0-100)
    score_map = {"Critical": 92, "High": 74, "Medium": 50, "Low": 28, "Info": 10}
    score = score_map.get(overall, 10)

    # Top exposed services
    services = []
    for f in risk_findings:
        port = f.get("raw_port", {})
        if port:
            services.append({
                "port": port.get("port", "?"),
                "service": port.get("service", "unknown"),
                "severity": f.get("severity", "Info"),
                "finding": f.get("title", "")
            })

    # Sort findings by severity descending
    sorted_findings = sorted(risk_findings, key=lambda x: sev_order.get(x.get("severity", "Info"), 0), reverse=True)
    top_findings = sorted_findings[:3]

    # Most dangerous attack path label
    most_dangerous = ""
    if chain_data.get("nodes"):
        labels = [n["data"]["label"] for n in chain_data["nodes"]]
        most_dangerous = " → ".join(labels)

    return {
        "overallRisk": overall,
        "overallScore": score,
        "counts": counts,
        "topFindings": top_findings,
        "topServices": services[:5],
        "mostDangerousPath": most_dangerous,
        "distribution": [
            {"name": "Critical", "value": counts["Critical"], "color": "#EF4444"},
            {"name": "High", "value": counts["High"], "color": "#F97316"},
            {"name": "Medium", "value": counts["Medium"], "color": "#EAB308"},
            {"name": "Low", "value": counts["Low"], "color": "#3B82F6"},
            {"name": "Info", "value": counts["Info"], "color": "#6B7280"},
        ]
    }


def build_remediation(risk_findings):
    """Build prioritized, enriched remediation steps."""
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
        "RULE_004": "Anonymous FTP access allows any unauthenticated user to read and potentially write files on the server.",
        "RULE_005": "Direct exposure of Windows Server services (RDP, SMB, WinRM, RPC) on the public internet is a frequent initial-access vector for ransomware operators.",
        "RULE_006": "An exposed Active Directory LDAP endpoint allows password-spraying, AS-REP roasting, and credential enumeration against an entire domain.",
        "RULE_007": "Microsoft IIS web servers run ASP.NET applications that are frequently targeted by deserialization and authentication bypass exploits.",
        "RULE_008": "Publicly reachable SMB is a top ransomware initial-access vector. EternalBlue (MS17-010) and similar exploits are still seen in the wild.",
        "RULE_009": "LDAP endpoints without TLS transmit bind credentials in clear text and are vulnerable to relay and downgrade attacks.",
        "RULE_010": "Exposed RDP without Network Level Authentication is one of the highest-volume brute-force and ransomware staging targets on the internet.",
        "RULE_011": "Unencrypted or publicly reachable WinRM allows lateral movement and full remote command execution on the Windows host.",
        "RULE_012": "An unauthenticated Jenkins instance can leak credentials, source code, and provide script-console access leading to remote code execution.",
        "RULE_013": "Redis without a password is trivially writable. Attackers pivot from public Redis instances to full host takeover via SSH key injection.",
        "RULE_014": "An unauthenticated Docker daemon TCP socket (port 2375) gives anyone on the network full container control — equivalent to root on the host.",
        "RULE_015": "An exposed Kubernetes API server or kubelet can be used to deploy malicious containers, exfiltrate secrets, or pivot to the underlying node.",
        "RULE_016": "Publicly reachable Elasticsearch without authentication has been the source of multi-billion-record data leaks in recent years.",
        "RULE_017": "MongoDB instances without authentication have historically been wiped or held for ransom by automated internet scanners.",
        "RULE_018": "Public PostgreSQL exposes unencrypted credentials and grants read/write access to application databases.",
        "RULE_019": "Public MySQL allows credential brute force and, with weak passwords, full read/write access to application data.",
    }
    improvement_map = {
        "RULE_001": "Eliminates the most direct path to full server compromise via remote login.",
        "RULE_002": "Patches a critical zero-day class vulnerability and prevents remote code execution.",
        "RULE_003": "Enforces modern encryption standards and removes susceptibility to known TLS attacks.",
        "RULE_004": "Closes an open door for data exfiltration or unauthorized file uploads.",
        "RULE_005": "Removes a primary ransomware initial-access vector by isolating Windows management surfaces.",
        "RULE_006": "Reduces domain credential attack surface and enforces encrypted LDAP binds.",
        "RULE_007": "Limits exposure to publicly known IIS CVEs and enforces request filtering.",
        "RULE_008": "Blocks a primary lateral-movement and ransomware-staging vector.",
        "RULE_009": "Prevents cleartext credential disclosure and LDAP relay attacks.",
        "RULE_010": "Reduces the largest single source of remote brute-force compromises.",
        "RULE_011": "Removes an unencrypted remote command-execution path into the Windows host.",
        "RULE_012": "Prevents unauthenticated access to the CI/CD control plane and build secrets.",
        "RULE_013": "Eliminates the SSH-key pivot vector commonly used to take over Redis hosts.",
        "RULE_014": "Removes a single-step path from the network to root on the container host.",
        "RULE_015": "Prevents cluster takeover and secret exfiltration from the API server.",
        "RULE_016": "Closes the largest single category of mass-data leaks from search clusters.",
        "RULE_017": "Removes the unauthenticated-data-loss vector used by ransomware crews.",
        "RULE_018": "Forces authenticated, encrypted database access and shrinks the attack surface.",
        "RULE_019": "Removes anonymous database brute force from the public internet.",
    }

    sorted_findings = sorted(risk_findings, key=lambda x: sev_order.get(x.get("severity", "Info"), 0), reverse=True)

    remediation = []
    for idx, f in enumerate(sorted_findings):
        rule_id = f.get("rule_id", "")
        context = f.get("context", {})
        remediation.append({
            "id": f.get("id", str(uuid.uuid4())),
            "priority": idx + 1,
            "title": f.get("title", ""),
            "severity": f.get("severity", "Info"),
            "confidence": f.get("confidence", "Medium"),
            "why": why_map.get(rule_id, "This misconfiguration increases the attack surface of the system."),
            "fix": f.get("remediation", "Apply security hardening guidelines."),
            "improvement": improvement_map.get(rule_id, "Reduces overall risk exposure."),
            "mitre": context.get("mitre_technique", "N/A"),
            "cwe": context.get("cwe", "N/A"),
            "difficulty": difficulty_map.get(rule_id, "Medium"),
            "completed": False,
        })

    return remediation


async def run_investigation_pipeline(inv: InvestigationState):
    try:
        # ─── Parser ──────────────────────────────────────────────────────
        inv.status = "Parsing Scan"
        inv.progress = 10
        t0 = time.perf_counter()
        parsed_data = parse_nmap_text(inv.content)
        detected_services = list(parsed_data.get("open_ports", []))
        port_count = len(detected_services)
        parser_ms = (time.perf_counter() - t0) * 1000

        evidence_lines = []
        for p in detected_services:
            evidence_lines.append(f"Port {p['port']} Open — {p.get('service', '')} {p.get('version', '')}".strip())

        inv.log_decision(
            stage="Parser",
            decision="Scan parsed into structured assets",
            why=f"Tokenizer identified {port_count} open port records in the submitted Nmap text.",
            evidence=evidence_lines or ["No open ports detected"],
            outcome=f"Extracted {port_count} open ports and services for downstream analysis.",
            next_step="Forward to Rule Engine for deterministic evaluation",
            confidence="High",
            processing_ms=parser_ms,
        )
        await asyncio.sleep(1)

        # ─── Rule Engine ─────────────────────────────────────────────────
        inv.status = "Applying Rules"
        inv.progress = 22
        t0 = time.perf_counter()
        rule_findings, _ = apply_rules(parsed_data)
        rule_ms = (time.perf_counter() - t0) * 1000
        inv.detected_services = detected_services

        inv.log_decision(
            stage="Rule Engine",
            decision=f"Evaluated {len(KB_STORE)} deterministic rules",
            why="Each parsed service was tested against the canonical rule library in KB_STORE.",
            evidence=[f"Detected services: {port_count}", f"Rules in library: {len(KB_STORE)}"],
            outcome=f"{len(rule_findings)} rule(s) matched and produced candidate findings.",
            next_step="Forward matches to Knowledge Base for context enrichment",
            confidence="High",
            processing_ms=rule_ms,
        )

        # Per-finding rule-engine decision entries — one per matched rule.
        for finding in rule_findings:
            inv.log_decision(
                stage="Rule Engine",
                module="Rule Engine",
                title=f"{finding.get('rule_id')} Triggered",
                decision=f"{finding.get('rule_id')} matched and emitted a candidate finding",
                why=finding.get("evidence", [""])[0] if finding.get("evidence") else "Service matched rule criteria.",
                evidence=finding.get("evidence", []),
                outcome=f"Generated finding: {finding.get('title', 'Unknown')}",
                next_step="Forward to Knowledge Base for MITRE / CWE enrichment",
                confidence=finding.get("confidence", "Medium"),
                processing_ms=round(rule_ms / max(len(rule_findings), 1), 2),
            )
        await asyncio.sleep(1)

        # ─── Knowledge Base ──────────────────────────────────────────────
        inv.status = "Knowledge Base Lookup"
        inv.progress = 38
        t0 = time.perf_counter()
        enriched_findings = enrich_findings(rule_findings)
        kb_ms = (time.perf_counter() - t0) * 1000

        inv.log_decision(
            stage="Knowledge Base",
            decision="Enriched candidate findings with threat intelligence",
            why="Each rule_id was resolved against the curated KB_STORE to attach CWE, MITRE ATT&CK, and remediation context.",
            evidence=[f"KB_STORE size: {len(KB_STORE)}", f"Candidates: {len(rule_findings)}"],
            outcome=f"{len(enriched_findings)} finding(s) now carry CWE + MITRE + remediation template.",
            next_step="Forward to Risk Engine for severity scoring",
            confidence="High",
            processing_ms=kb_ms,
        )
        for finding in enriched_findings:
            ctx = finding.get("context", {}) or {}
            inv.log_decision(
                stage="Knowledge Base",
                module="Knowledge Base",
                title=f"Context loaded for {finding.get('rule_id')}",
                decision=f"Loaded MITRE technique and CWE for {finding.get('rule_id')}",
                why=f"Rule {finding.get('rule_id')} maps to {ctx.get('mitre_technique', 'N/A')} and {ctx.get('cwe', 'N/A')}.",
                evidence=[f"MITRE: {ctx.get('mitre_technique', 'N/A')}", f"CWE: {ctx.get('cwe', 'N/A')}"],
                outcome="Context attached to finding",
                next_step="Forward to Risk Engine",
                confidence="High",
                processing_ms=round(kb_ms / max(len(enriched_findings), 1), 2),
            )
        await asyncio.sleep(1)

        # ─── Risk Engine ─────────────────────────────────────────────────
        inv.status = "Calculating Risk"
        inv.progress = 52
        t0 = time.perf_counter()
        risk_findings = calculate_risk(enriched_findings)
        risk_ms = (time.perf_counter() - t0) * 1000

        inv.log_decision(
            stage="Risk Engine",
            decision="Applied deterministic risk scoring",
            why="Each finding was graded by rule_id against the risk taxonomy in risk_calculator.",
            evidence=[f"Severity rubric: {len({'Critical','High','Medium','Low','Info'})} levels"],
            outcome=f"Calculated severity for {len(risk_findings)} finding(s). Overall risk: {get_overall_risk(risk_findings)}.",
            next_step="Forward to Correlation Engine",
            confidence="High",
            processing_ms=risk_ms,
        )
        for finding in risk_findings:
            inv.log_decision(
                stage="Risk Engine",
                module="Risk Engine",
                title=f"Severity assigned to {finding.get('rule_id')}",
                decision=f"Risk level: {finding.get('severity', 'Info')}",
                why=f"Severity selected from rule-specific deterministic table for {finding.get('rule_id')}.",
                evidence=[f"Severity: {finding.get('severity', 'Info')}", f"Confidence: {finding.get('confidence', 'Medium')}"],
                outcome=f"Risk level: {finding.get('riskLevel', '')}",
                next_step="Forward to Correlation Engine",
                confidence=finding.get("confidence", "Medium"),
                processing_ms=round(risk_ms / max(len(risk_findings), 1), 2),
            )
        await asyncio.sleep(1)

        # ─── Correlation Engine ──────────────────────────────────────────
        inv.status = "Correlating Findings"
        inv.progress = 66
        t0 = time.perf_counter()
        graph_data = correlate_findings(risk_findings)
        correlation_ms = (time.perf_counter() - t0) * 1000
        inv.log_decision(
            stage="Correlation Engine",
            decision="Linked findings to risks and MITRE techniques",
            why="Each finding was paired with its risk condition and MITRE technique to form the correlation graph.",
            evidence=[f"Findings: {len(risk_findings)}", f"Graph nodes: {len(graph_data.get('nodes', []))}"],
            outcome=f"Investigation graph contains {len(graph_data.get('nodes', []))} nodes and {len(graph_data.get('edges', []))} edges.",
            next_step="Forward to Attack Chain Builder",
            confidence="High",
            processing_ms=correlation_ms,
        )
        await asyncio.sleep(1)

        # ─── Attack Chain Builder ────────────────────────────────────────
        inv.status = "Building Attack Chains"
        inv.progress = 80
        t0 = time.perf_counter()
        chain_data = build_chains(risk_findings)
        chain_ms = (time.perf_counter() - t0) * 1000
        inv.log_decision(
            stage="Attack Chain Builder",
            decision="Linked entry points to high-impact targets",
            why="Severity-ranked findings were sequenced into the most plausible attacker path.",
            evidence=[f"Critical: {sum(1 for f in risk_findings if f.get('severity') == 'Critical')}",
                      f"High: {sum(1 for f in risk_findings if f.get('severity') == 'High')}"],
            outcome=f"Attack chain assembled with {len(chain_data.get('nodes', []))} stages.",
            next_step="Forward to LLM Analysis",
            confidence="High",
            processing_ms=chain_ms,
        )
        await asyncio.sleep(1)

        # ─── LLM + Report ────────────────────────────────────────────────
        inv.status = "LLM Analysis & Reporting"
        inv.progress = 93
        t0 = time.perf_counter()
        llm_summary = analyze_results(risk_findings, chain_data)
        report_data = generate_report(risk_findings, chain_data, llm_summary)
        llm_ms = (time.perf_counter() - t0) * 1000
        inv.log_decision(
            stage="LLM",
            decision="Generated executive narrative from deterministic findings",
            why="Structured risk and chain data was condensed into an executive summary without invoking a network LLM.",
            evidence=[f"Findings: {len(risk_findings)}", f"Overall risk: {report_data.get('overallRisk', 'Info')}"],
            outcome="Executive summary produced.",
            next_step="Aggregate into report payload",
            confidence="High",
            processing_ms=llm_ms,
        )

        # ─── Build the rich investigation graph + remediation + summary ──
        remediation = build_remediation(risk_findings)
        inv.graph = build_investigation_graph(
            parsed_data=parsed_data,
            detected_services=detected_services,
            rule_findings=rule_findings,
            risk_findings=risk_findings,
            chain_data=chain_data,
            remediation=remediation,
        )

        inv.findings = risk_findings
        inv.attack_chains = chain_data
        inv.report = report_data
        inv.risk_dashboard = build_risk_dashboard(risk_findings, chain_data)
        inv.remediation = remediation

        inv.duration_seconds = round(time.perf_counter() - inv.started_at, 3)
        inv.investigation_summary = build_investigation_summary(
            inv=inv,
            detected_services=detected_services,
            rule_findings=rule_findings,
            risk_findings=risk_findings,
            chain_data=chain_data,
            remediation=remediation,
            parsed_data=parsed_data,
        )

        inv.log_decision(
            stage="Report Generator",
            decision="Aggregated all pipeline output into final payload",
            why="Investigation graph, remediation, risk dashboard, and summary block composed from upstream modules.",
            evidence=[
                f"Graph nodes: {len(inv.graph.get('nodes', []))}",
                f"Remediations: {len(remediation)}",
                f"Decision entries: {len(inv.decision_log)}",
            ],
            outcome="Investigation complete and ready for review.",
            next_step="Hand off to frontend Investigation Graph and Decision Log pages",
            confidence="High",
            processing_ms=0,
        )

        inv.status = "Investigation Complete"
        inv.progress = 100
        inv.is_complete = True

    except Exception as e:
        inv.status = f"Error: {str(e)}"
        inv.is_complete = True


# ─── Investigation Summary ─────────────────────────────────────────────────

def _extract_host(content):
    for line in (content or "").splitlines():
        m = re.match(r"\s*Nmap scan report for\s+(.+)", line)
        if m:
            host = m.group(1).strip()
            host = re.sub(r"\s*\(.*\)\s*$", "", host)
            return host or "Target Host"
    return "Target Host"


def build_investigation_summary(*, inv, detected_services, rule_findings,
                                risk_findings, chain_data, remediation, parsed_data):
    """Build the Investigation Summary card payload."""
    sev_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Info": 0}
    for f in risk_findings:
        sev_counts[f.get("severity", "Info")] = sev_counts.get(f.get("severity", "Info"), 0) + 1

    evidence_collected = sum(len(f.get("evidence", [])) for f in risk_findings)
    evidence_collected += len(detected_services)

    mitre_set = set()
    for f in risk_findings:
        mitre = (f.get("context") or {}).get("mitre_technique")
        if mitre:
            mitre_set.add(mitre.split(" - ")[0].strip())

    chain_stages = 0
    if chain_data and chain_data.get("nodes"):
        chain_stages = len([n for n in chain_data["nodes"] if n.get("id") != "start"])

    confidence_order = {"High": 3, "Medium": 2, "Low": 1}
    overall_confidence = "Medium"
    if risk_findings:
        # Confidence is the maximum across all findings — i.e. as good as the
        # strongest signal we have.
        overall_confidence = max(
            (f.get("confidence", "Medium") for f in risk_findings),
            key=lambda c: confidence_order.get(c, 0),
        )

    return {
        "host": _extract_host(inv.content),
        "servicesDiscovered": len(detected_services),
        "evidenceCollected": evidence_collected,
        "rulesEvaluated": len(KB_STORE),
        "rulesMatched": len(rule_findings),
        "findingsGenerated": len(risk_findings),
        "criticalFindings": sev_counts["Critical"],
        "highFindings": sev_counts["High"],
        "mediumFindings": sev_counts["Medium"],
        "lowFindings": sev_counts["Low"],
        "infoFindings": sev_counts["Info"],
        "attackChainsBuilt": max(chain_stages, 1 if chain_data and chain_data.get("nodes") else 0),
        "mitreTechniquesMapped": len(mitre_set),
        "recommendedRemediations": len(remediation),
        "overallRisk": get_overall_risk(risk_findings),
        "durationSeconds": inv.duration_seconds,
        "assessmentConfidence": overall_confidence,
        "pipelineStages": [
            "Parser", "Rule Engine", "Knowledge Base", "Risk Engine",
            "Correlation Engine", "Attack Chain Builder", "LLM", "Report Generator",
        ],
        "graphNodeCount": len(inv.graph.get("nodes", [])),
        "graphEdgeCount": len(inv.graph.get("edges", [])),
        "decisionCount": len(inv.decision_log),
        "graphNodeKinds": sorted({n.get("kind") for n in inv.graph.get("nodes", []) if n.get("kind")}),
    }


# ─── API Routes ────────────────────────────────────────────────────────────

@app.post("/api/investigation/{inv_id}/start")
async def start_investigation(inv_id: str, background_tasks: BackgroundTasks):
    if inv_id not in investigations:
        raise HTTPException(status_code=404, detail="Investigation not found")
    inv = investigations[inv_id]
    background_tasks.add_task(run_investigation_pipeline, inv)
    return {"status": "started"}


@app.get("/api/investigation/{inv_id}/status")
async def get_status(inv_id: str):
    if inv_id not in investigations:
        raise HTTPException(status_code=404, detail="Investigation not found")
    inv = investigations[inv_id]
    return {
        "status": inv.status,
        "progress": inv.progress,
        "isComplete": inv.is_complete
    }


@app.get("/api/investigation/{inv_id}/{resource}")
async def get_resource(inv_id: str, resource: str):
    if inv_id not in investigations:
        raise HTTPException(status_code=404, detail="Investigation not found")

    inv = investigations[inv_id]

    resource_map = {
        "findings": inv.findings,
        "detected-services": inv.detected_services,
        "graph": inv.graph,
        "attack-chain": inv.attack_chains,
        "decision-log": inv.decision_log,
        "report": inv.report,
        "risk-dashboard": inv.risk_dashboard,
        "remediation": inv.remediation,
        "investigation-summary": inv.investigation_summary,
    }

    if resource in resource_map:
        return resource_map[resource]
    raise HTTPException(status_code=404, detail="Resource not found")
