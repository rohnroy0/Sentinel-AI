import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends
from auth import get_current_user
from pydantic import BaseModel
import uuid
import asyncio
import re
import time
from datetime import datetime

from config import config
from utils.logger import logger
from models.schemas import (
    HealthResponse, InfoResponse, UploadRequest, UploadResponse,
    AgentInvestigateRequest, AgentInvestigateResponse,
    AskSentinelRequest, AskSentinelResponse
)

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
from agent.agent_controller import start_autonomous_investigation, get_agent_status
from database.models import save_deterministic_investigation, get_investigation_by_id, get_all_investigations

SENTINEL_VERSION = "1.0.0"
BUILD_VERSION = "2026.08.01"

app = FastAPI(title="Sentinel Investigation API", version=SENTINEL_VERSION)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
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

@app.get("/health", response_model=HealthResponse)
@app.get("/api/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        version=SENTINEL_VERSION,
        db_engine=config.DB_ENGINE,
        auth_mode=config.AUTH_MODE
    )

@app.get("/api/info", response_model=InfoResponse)
async def info():
    return InfoResponse(
        name="Sentinel Investigation API",
        version=SENTINEL_VERSION,
        build=BUILD_VERSION,
        description="Autonomous AI security misconfiguration investigation engine."
    )


# ─── Upload ────────────────────────────────────────────────────────────────

@app.post("/api/upload", response_model=UploadResponse)
async def upload_scan(req: UploadRequest, user_id: str = Depends(get_current_user)):
    req_content = req.content
    inv = InvestigationState(req_content)
    inv.user_id = user_id
    investigations[inv.id] = inv
    try:
        save_deterministic_investigation(inv)
    except Exception as e:
        logger.warning(f"Initial save failed for investigation {inv.id}: {e}")
    return UploadResponse(investigationId=inv.id)


# ─── Pipeline ─────────────────────────────────────────────────────────────

def build_risk_dashboard(risk_findings, chain_data, detected_services=None):
    """Build a rich risk dashboard payload dynamically from the findings, services, and attack path."""
    from ai.risk_engine.risk_calculator import build_dynamic_risk_dashboard
    return build_dynamic_risk_dashboard(
        findings=risk_findings,
        detected_services=detected_services,
        chain_data=chain_data
    )


from services.remediation import build_remediation


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
        inv.detected_services = detected_services
        try:
            save_deterministic_investigation(inv)
        except Exception:
            pass
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
        try:
            save_deterministic_investigation(inv)
        except Exception:
            pass
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
        inv.findings = risk_findings
        inv.risk_dashboard = build_risk_dashboard(risk_findings, {}, detected_services=detected_services)
        inv.remediation = build_remediation(risk_findings)
        # Build a partial investigation graph early (no chain_data yet) so the
        # frontend graph page has something to display before the pipeline ends.
        try:
            partial_graph = build_investigation_graph(
                parsed_data=parsed_data,
                detected_services=detected_services,
                rule_findings=rule_findings,
                risk_findings=risk_findings,
                chain_data={"nodes": [], "edges": []},
                remediation=inv.remediation,
            )
            if partial_graph and partial_graph.get("nodes"):
                inv.graph = partial_graph
        except Exception:
            pass
        try:
            save_deterministic_investigation(inv)
        except Exception:
            pass
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
        inv.risk_dashboard = build_risk_dashboard(risk_findings, chain_data, detected_services=detected_services)
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
        # Persist to SQLite so data survives server restarts
        try:
            save_deterministic_investigation(inv)
        except Exception as persist_err:
            logger.warning(f"Failed to persist investigation {inv.id}: {persist_err}")

    except Exception as e:
        inv.status = f"Error: {str(e)}"
        inv.is_complete = True
        try:
            save_deterministic_investigation(inv)
        except Exception:
            pass


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
async def start_investigation(inv_id: str, background_tasks: BackgroundTasks, user_id: str = Depends(get_current_user)):
    if inv_id not in investigations:
        raise HTTPException(status_code=404, detail="Investigation not found")
    inv = investigations[inv_id]
    if getattr(inv, 'user_id', None) and inv.user_id != user_id:
        raise HTTPException(status_code=403, detail='Access denied')
    background_tasks.add_task(run_investigation_pipeline, inv)
    return {"status": "started"}


@app.get("/api/investigation/{inv_id}/status")
async def get_status(inv_id: str, user_id: str = Depends(get_current_user)):
    if inv_id not in investigations:
        # Try DB restoration
        db_state = get_investigation_by_id(inv_id, user_id)
        if db_state:
            if db_state.get('user_id') and db_state.get('user_id') != user_id:
                raise HTTPException(status_code=403, detail='Access denied')
            if db_state.get('user_id') and db_state.get('user_id') != user_id:
                raise HTTPException(status_code=403, detail='Access denied')
            status = db_state.get("current_status", "Unknown")
            return {
                "status": status,
                "progress": 100 if status == "Investigation Complete" else 0,
                "isComplete": status in ("Investigation Complete", "Error")
            }
        raise HTTPException(status_code=404, detail="Investigation not found")
    inv = investigations[inv_id]
    if getattr(inv, 'user_id', None) and inv.user_id != user_id:
        raise HTTPException(status_code=403, detail='Access denied')
    return {
        "status": inv.status,
        "progress": inv.progress,
        "isComplete": inv.is_complete
    }


@app.get("/api/investigation/{inv_id}/{resource}")
async def get_resource(inv_id: str, resource: str, user_id: str = Depends(get_current_user)):
    # 1. Check if this is an autonomous agent investigation
    agent_status = get_agent_status(inv_id)
    if agent_status and agent_status.get('user_id') and agent_status.get('user_id') != user_id:
        raise HTTPException(status_code=403, detail='Access denied')
    if agent_status:
        # Some resources need to be mapped or adapted
        attack_chains_data = agent_status.get("attack_chains", [])
        # If it's a list with at least one chain, return the first chain for the frontend
        chain = attack_chains_data[0] if attack_chains_data and isinstance(attack_chains_data, list) else (attack_chains_data if isinstance(attack_chains_data, dict) else {"nodes": [], "edges": []})

        agent_risk = agent_status.get("risk_dashboard", {})
        if not agent_risk or not isinstance(agent_risk, dict) or not agent_risk.get("overallRisk") or not agent_risk.get("overallScore"):
            agent_risk = build_risk_dashboard(
                agent_status.get("findings", []),
                chain,
                detected_services=agent_status.get("discovered_hosts", [])
            )

        resource_map = {
            "findings": agent_status.get("findings", []),
            "detected-services": agent_status.get("discovered_hosts", []),
            "graph": agent_status.get("investigation_graph", {}),
            "attack-chain": chain,
            "attack-chains": chain,
            "decisions": agent_status.get("decision_log", agent_status.get("reasoning_steps", [])),
            "decision-log": agent_status.get("decision_log", agent_status.get("reasoning_steps", [])),
            "report": agent_status.get("final_report", {}),
            "risk": agent_risk,
            "risk-dashboard": agent_risk,
            "remediation": agent_status.get("remediation", []),
            "investigation-summary": agent_status.get("investigation_summary", {}),
        }
        if resource in resource_map:
            return resource_map[resource]
        raise HTTPException(status_code=404, detail="Resource not found in agent state")

    # 2. Check if this is an old deterministic pipeline investigation
    if inv_id not in investigations:
        # Try to restore from SQLite (survives restarts)
        db_state = get_investigation_by_id(inv_id, user_id)
        if db_state:
            if db_state.get('user_id') and db_state.get('user_id') != user_id:
                raise HTTPException(status_code=403, detail='Access denied')
            if db_state.get('user_id') and db_state.get('user_id') != user_id:
                raise HTTPException(status_code=403, detail='Access denied')
            class _RestoredInv:
                pass
            inv = _RestoredInv()
            inv.findings = db_state.get("findings", db_state.get("vulnerabilities", []))
            inv.detected_services = db_state.get("detected_services", db_state.get("discovered_hosts", []))
            inv.graph = db_state.get("investigation_graph", {"nodes": [], "edges": []})
            raw_ac = db_state.get("attack_chains", [])
            inv.attack_chains = raw_ac[0] if isinstance(raw_ac, list) and raw_ac else (raw_ac if isinstance(raw_ac, dict) else {"nodes": [], "edges": []})
            inv.decision_log = db_state.get("decision_log", db_state.get("reasoning_steps", []))
            inv.report = db_state.get("final_report", {})
            inv.risk_dashboard = db_state.get("risk_dashboard", {})
            inv.remediation = db_state.get("remediation", [])
            inv.investigation_summary = db_state.get("investigation_summary", {})
            investigations[inv_id] = inv  # cache back in memory
        else:
            return {"status": "empty", "message": "No active investigation", "data": None}

    inv = investigations[inv_id]
    if getattr(inv, 'user_id', None) and inv.user_id != user_id:
        raise HTTPException(status_code=403, detail='Access denied')

    # Build a live summary from whatever data the inv object currently has.
    # This means the summary card is populated as early as possible during polling.
    _findings = getattr(inv, "findings", [])
    _services = getattr(inv, "detected_services", [])
    _graph = getattr(inv, "graph", {"nodes": [], "edges": []})
    _chains = getattr(inv, "attack_chains", {})
    _decision_log = getattr(inv, "decision_log", [])
    _remediation = getattr(inv, "remediation", [])

    _sev = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Info": 0}
    for _f in _findings:
        _k = _f.get("severity", "Info")
        _sev[_k] = _sev.get(_k, 0) + 1

    _mitre = set()
    for _f in _findings:
        _m = (_f.get("context") or {}).get("mitre_technique")
        if _m:
            _mitre.add(_m.split(" - ")[0].strip())

    _chain_nodes = _chains.get("nodes", []) if isinstance(_chains, dict) else []
    _chain_stages = len([n for n in _chain_nodes if n.get("id") != "start"])

    _inv_summary = getattr(inv, "investigation_summary", {})
    if not _inv_summary:
        _content = getattr(inv, "content", "")
        _host = "Target Host"
        import re as _re
        for _line in (_content or "").splitlines():
            _match = _re.match(r"\s*Nmap scan report for\s+(.+)", _line)
            if _match:
                _host = _re.sub(r"\s*\(.*\)\s*$", "", _match.group(1).strip()) or "Target Host"
                break
        _overall_risk = "Info"
        _severity_order = ["Critical", "High", "Medium", "Low", "Info"]
        for _sev_level in _severity_order:
            if _sev.get(_sev_level, 0) > 0:
                _overall_risk = _sev_level
                break
        _inv_summary = {
            "host": _host,
            "servicesDiscovered": len(_services),
            "evidenceCollected": sum(len(_f.get("evidence", [])) for _f in _findings) + len(_services),
            "rulesEvaluated": len(_decision_log),
            "rulesMatched": len(_findings),
            "findingsGenerated": len(_findings),
            "criticalFindings": _sev["Critical"],
            "highFindings": _sev["High"],
            "mediumFindings": _sev["Medium"],
            "lowFindings": _sev["Low"],
            "infoFindings": _sev["Info"],
            "attackChainsBuilt": max(_chain_stages, 1 if _chain_nodes else 0),
            "mitreTechniquesMapped": len(_mitre),
            "recommendedRemediations": len(_remediation),
            "overallRisk": _overall_risk,
            "durationSeconds": getattr(inv, "duration_seconds", 0),
            "assessmentConfidence": "High" if _findings else "Medium",
            "graphNodeCount": len(_graph.get("nodes", [])),
            "graphEdgeCount": len(_graph.get("edges", [])),
            "decisionCount": len(_decision_log),
        }

    _risk_dashboard = getattr(inv, "risk_dashboard", {})
    if not _risk_dashboard or not isinstance(_risk_dashboard, dict) or not _risk_dashboard.get("overallRisk") or not _risk_dashboard.get("overallScore"):
        _risk_dashboard = build_risk_dashboard(_findings, _chains, detected_services=_services)

    resource_map = {
        "findings": _findings,
        "detected-services": _services,
        "graph": _graph,
        "attack-chain": getattr(inv, "attack_chains", {"nodes": [], "edges": []}),
        "attack-chains": getattr(inv, "attack_chains", {"nodes": [], "edges": []}),
        "decisions": _decision_log,
        "decision-log": _decision_log,
        "report": getattr(inv, "report", {}),
        "risk": _risk_dashboard,
        "risk-dashboard": _risk_dashboard,
        "remediation": _remediation,
        "investigation-summary": _inv_summary,
    }

    if resource in resource_map:
        return resource_map[resource]
    raise HTTPException(status_code=404, detail="Resource not found")


# ─── Autonomous Agent Routes ───────────────────────────────────────────────

class AgentInvestigateRequest(BaseModel):
    goal: str
    scan_data: str = None

@app.post("/api/agent/investigate")
async def start_agent_investigation(req: AgentInvestigateRequest, user_id: str = Depends(get_current_user)):
    """Starts a new autonomous investigation."""
    inv_id = await start_autonomous_investigation(req.goal, req.scan_data, user_id=user_id)
    return {"investigation_id": inv_id, "status": "started"}


@app.get("/api/agent/investigations")
async def list_agent_investigations(user_id: str = Depends(get_current_user)):
    """Lists all investigations for the user."""
    logger.info(f"Listing investigations for user: {user_id}")
    results = get_all_investigations(user_id)
    return {"investigations": results}


@app.get("/api/agent/status/{investigation_id}")
async def check_agent_status(investigation_id: str, user_id: str = Depends(get_current_user)):
    """Returns the current agent step, findings, and final report status."""
    status = get_agent_status(investigation_id)
    if not status:
        raise HTTPException(status_code=404, detail='Investigation not found')
    if status.get('user_id') and status.get('user_id') != user_id:
        raise HTTPException(status_code=403, detail='Access denied')
        raise HTTPException(status_code=404, detail="Investigation not found")
    return status


class AskSentinelRequest(BaseModel):
    investigation_id: str
    question: str

@app.post("/api/agent/ask")
async def ask_sentinel_endpoint(req: AskSentinelRequest, user_id: str = Depends(get_current_user)):
    """Ask Sentinel Q&A endpoint for reasoning over investigation findings."""
    from agent.ask_sentinel import ask_sentinel_question
    ans = await ask_sentinel_question(req.investigation_id, req.question)
    return ans

