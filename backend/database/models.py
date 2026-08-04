import json
from typing import Dict, Any, List, Optional
from database.db import get_db_connection

def save_investigation(state: Dict[str, Any]):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    INSERT OR REPLACE INTO investigations 
    (id, user_goal, status, scan_data, discovered_hosts, vulnerabilities, selected_tools, decision_log, final_report, tool_results, explained_findings, remediation, risk_dashboard, investigation_graph, attack_chains, full_state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        state.get("investigation_id"),
        state.get("user_goal", ""),
        state.get("current_status", "Completed"),
        state.get("scan_data", ""),
        json.dumps(state.get("discovered_hosts", [])),
        json.dumps(state.get("vulnerabilities", [])),
        json.dumps(state.get("selected_tools", [])),
        json.dumps(state.get("decision_log", state.get("reasoning_steps", []))),
        json.dumps(state.get("final_report", {})),
        json.dumps(state.get("tool_results", {})),
        json.dumps(state.get("explained_findings", [])),
        json.dumps(state.get("remediation", [])),
        json.dumps(state.get("risk_dashboard", {})),
        json.dumps(state.get("investigation_graph", {})),
        json.dumps(state.get("attack_chains", [])),
        json.dumps(state)
    ))
    
    conn.commit()
    conn.close()


def save_deterministic_investigation(inv) -> None:
    """Persist a deterministic InvestigationState object to SQLite so data
    survives server restarts."""
    conn = get_db_connection()
    cursor = conn.cursor()

    attack_chains = getattr(inv, "attack_chains", {})
    if isinstance(attack_chains, dict):
        attack_chains = [attack_chains]

    findings = getattr(inv, "findings", [])
    risk_dashboard = getattr(inv, "risk_dashboard", {})
    remediation = getattr(inv, "remediation", [])
    investigation_graph = getattr(inv, "graph", {})
    decision_log = getattr(inv, "decision_log", [])
    report = getattr(inv, "report", {})
    detected_services = getattr(inv, "detected_services", [])

    full_state = {
        "investigation_id": inv.id,
        "inv_type": "deterministic",
        "scan_data": getattr(inv, "content", ""),
        "current_status": inv.status,
        "findings": findings,
        "detected_services": detected_services,
        "risk_dashboard": risk_dashboard,
        "remediation": remediation,
        "investigation_graph": investigation_graph,
        "attack_chains": attack_chains,
        "decision_log": decision_log,
        "report": report,
        "investigation_summary": getattr(inv, "investigation_summary", {}),
        "duration_seconds": getattr(inv, "duration_seconds", 0),
    }

    cursor.execute("""
    INSERT OR REPLACE INTO investigations
    (id, user_goal, status, scan_data, discovered_hosts, vulnerabilities, selected_tools,
     decision_log, final_report, tool_results, explained_findings,
     remediation, risk_dashboard, investigation_graph, attack_chains, full_state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        inv.id,
        "Deterministic Pipeline Investigation",
        inv.status,
        getattr(inv, "content", ""),
        json.dumps(detected_services),
        json.dumps(findings),
        json.dumps([]),
        json.dumps(decision_log),
        json.dumps(report),
        json.dumps({}),
        json.dumps(findings),
        json.dumps(remediation),
        json.dumps(risk_dashboard),
        json.dumps(investigation_graph),
        json.dumps(attack_chains),
        json.dumps(full_state),
    ))

    conn.commit()
    conn.close()

def get_investigation_by_id(inv_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM investigations WHERE id = ?", (inv_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None

    cols = row.keys()
    full_state = json.loads(row["full_state"]) if "full_state" in cols and row["full_state"] else {}
    
    state = {
        "investigation_id": row["id"],
        "user_goal": row["user_goal"],
        "current_status": row["status"],
        "inv_type": "deterministic",
        "scan_data": row["scan_data"],
        "discovered_hosts": json.loads(row["discovered_hosts"] or "[]"),
        "vulnerabilities": json.loads(row["vulnerabilities"] or "[]"),
        "findings": json.loads(row["vulnerabilities"] or "[]"),
        "selected_tools": json.loads(row["selected_tools"] or "[]"),
        "decision_log": json.loads(row["decision_log"] or "[]"),
        "reasoning_steps": json.loads(row["decision_log"] or "[]"),
        "final_report": json.loads(row["final_report"] or "{}"),
        "created_at": row["created_at"],
        "tool_results": json.loads(row["tool_results"]) if "tool_results" in cols and row["tool_results"] else {},
        "explained_findings": json.loads(row["explained_findings"]) if "explained_findings" in cols and row["explained_findings"] else [],
        "remediation": json.loads(row["remediation"]) if "remediation" in cols and row["remediation"] else [],
        "risk_dashboard": json.loads(row["risk_dashboard"]) if "risk_dashboard" in cols and row["risk_dashboard"] else {},
        "investigation_graph": json.loads(row["investigation_graph"]) if "investigation_graph" in cols and row["investigation_graph"] else {},
        "attack_chains": json.loads(row["attack_chains"]) if "attack_chains" in cols and row["attack_chains"] else [],
    }

    # Merge full_state on top — full_state may carry richer data (e.g. detected_services,
    # investigation_summary) not covered by the individual columns above.
    for k, v in full_state.items():
        if v and (k not in state or not state[k]):
            state[k] = v

    return state

def get_all_investigations() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM investigations ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        results.append({
            "investigation_id": r["id"],
            "user_goal": r["user_goal"],
            "current_status": r["status"],
            "vulnerabilities": json.loads(r["vulnerabilities"] or "[]"),
            "discovered_hosts": json.loads(r["discovered_hosts"] or "[]"),
            "created_at": r["created_at"]
        })
    return results
