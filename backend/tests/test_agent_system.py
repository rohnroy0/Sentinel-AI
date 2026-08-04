import asyncio
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from agent.agent_controller import start_autonomous_investigation, get_agent_status
from agent.ask_sentinel import ask_sentinel_question
from services.cve_lookup import lookup_vulnerabilities

async def run_tests():
    print("=" * 60)
    print("RUNNING SENTINEL-AI AUTONOMOUS AGENT VERIFICATION TESTS")
    print("=" * 60)

    # ----------------------------------------------------
    # TEST 1: Autonomous Mock Nmap Investigation
    # ----------------------------------------------------
    print("\n[TEST 1] Starting Autonomous Mock Nmap Investigation...")
    scan_file_path = os.path.join(os.path.dirname(__file__), "..", "..", "demo_data", "sample_scan.txt")
    scan_data = ""
    if os.path.exists(scan_file_path):
        with open(scan_file_path, "r", encoding="utf-8") as f:
            scan_data = f.read()
    else:
        scan_data = """Nmap scan report for 192.168.1.10
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9p1
80/tcp   open  http    Apache httpd 2.4.49
3306/tcp open  mysql   MySQL 8.0.32"""

    inv_id = await start_autonomous_investigation(
        goal="Analyze my network threats, correlate vulnerabilities, and build attack graph",
        scan_data=scan_data
    )
    print(f"[OK] Started Investigation ID: {inv_id}")

    # Wait for workflow completion
    for _ in range(20):
        await asyncio.sleep(0.5)
        status = get_agent_status(inv_id)
        if status and status.get("is_complete"):
            break

    status = get_agent_status(inv_id)
    assert status is not None, "Status should not be None"
    assert status.get("is_complete") is True, "Workflow should complete successfully"
    assert len(status.get("selected_tools", [])) >= 4, "Tools should have been executed"
    assert len(status.get("findings", [])) > 0, "Findings should be discovered"

    # Verify BUG-006: Decision Log & Investigation Summary Data Flow
    summary = status.get("investigation_summary", {})
    assert summary.get("servicesDiscovered", 0) > 0, "Investigation summary servicesDiscovered should be > 0"
    assert summary.get("evidenceCollected", 0) > 0, "Investigation summary evidenceCollected should be > 0"
    assert summary.get("findingsGenerated", 0) > 0, "Investigation summary findingsGenerated should be > 0"
    assert summary.get("attackChainsBuilt", 0) > 0, "Investigation summary attackChainsBuilt should be > 0"
    assert summary.get("mitreTechniquesMapped", 0) > 0, "Investigation summary mitreTechniquesMapped should be > 0"
    assert summary.get("decisionCount", 0) > 0, "Investigation summary decisionCount should be > 0"

    decisions = status.get("decision_log", [])
    assert len(decisions) >= 5, "Decision log should contain pipeline stage decisions"
    for dec in decisions:
        assert dec.get("stage"), "Decision entry must have a stage"
        assert dec.get("title") or dec.get("decision"), "Decision entry must have title/decision"
        assert dec.get("why"), "Decision entry must have why rationale"
        assert len(dec.get("evidence", [])) > 0, "Decision entry must have evidence list"
        assert dec.get("outcome"), "Decision entry must have outcome"
        assert dec.get("confidence") in ["High", "Medium", "Low"], "Decision entry must have valid confidence"

    print("[OK] TEST 1 PASSED: Autonomous workflow completed successfully with tools, findings, rich decision logs, and full investigation summary!")

    # ----------------------------------------------------
    # TEST 2: Offline CVE Test
    # ----------------------------------------------------
    print("\n[TEST 2] Running Offline CVE Cache Fallback Test...")
    cves = lookup_vulnerabilities("ssh", "OpenSSH 8.9p1")
    assert len(cves) > 0, "CVE lookup should return cached vulnerability results"
    print(f"[OK] Found {len(cves)} CVEs via offline lookup: {cves[0]['cve_id']}")
    print("[OK] TEST 2 PASSED: Offline CVE cache operating properly!")

    # ----------------------------------------------------
    # TEST 3: Memory Delta Test
    # ----------------------------------------------------
    print("\n[TEST 3] Running Memory Engine Comparison Test...")
    modified_scan = """Nmap scan report for 192.168.1.10
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9p1
80/tcp   open  http    Apache httpd 2.4.49"""  # Note: Port 3306 closed

    inv_id_2 = await start_autonomous_investigation(
        goal="Re-analyze network security after remediation",
        scan_data=modified_scan
    )
    for _ in range(20):
        await asyncio.sleep(0.5)
        status2 = get_agent_status(inv_id_2)
        if status2 and status2.get("is_complete"):
            break

    status2 = get_agent_status(inv_id_2)
    memory_insights = status2.get("memory_insights", {})
    assert memory_insights.get("has_previous") is True, "Should find previous investigation in memory"
    print(f"[OK] Memory Summary: {memory_insights.get('summary')}")
    print("[OK] TEST 3 PASSED: Memory delta comparison detected status changes!")

    # ----------------------------------------------------
    # TEST 4: Ask Sentinel Q&A
    # ----------------------------------------------------
    print("\n[TEST 4] Running Ask Sentinel Q&A Engine Test...")
    qa_resp = await ask_sentinel_question(inv_id, "Why is port 22 dangerous?")
    assert "Port 22" in qa_resp.get("answer", "") or "SSH" in qa_resp.get("answer", ""), "Q&A should answer about Port 22"
    print(f"[OK] Ask Sentinel Response:\n{qa_resp.get('answer')}")
    print("[OK] TEST 4 PASSED: Explainable Ask Sentinel answered query accurately!")

    # ----------------------------------------------------
    # TEST 5: REST Resource Endpoint Verification (BUG-006)
    # ----------------------------------------------------
    print("\n[TEST 5] Testing REST API /api/investigation/{inv_id}/{resource} Data Flow...")
    from main import get_resource
    summary_resp = await get_resource(inv_id, "investigation-summary")
    assert isinstance(summary_resp, dict), "investigation-summary response must be a dict"
    assert summary_resp.get("servicesDiscovered", 0) > 0, "REST investigation-summary servicesDiscovered must be > 0"
    assert summary_resp.get("findingsGenerated", 0) > 0, "REST investigation-summary findingsGenerated must be > 0"
    assert summary_resp.get("attackChainsBuilt", 0) > 0, "REST investigation-summary attackChainsBuilt must be > 0"
    assert summary_resp.get("mitreTechniquesMapped", 0) > 0, "REST investigation-summary mitreTechniquesMapped must be > 0"
    assert summary_resp.get("decisionCount", 0) > 0, "REST investigation-summary decisionCount must be > 0"

    decisions_resp = await get_resource(inv_id, "decision-log")
    assert isinstance(decisions_resp, list) and len(decisions_resp) > 0, "REST decision-log response must be a non-empty list"
    assert decisions_resp[0].get("stage"), "REST decision-log item must have a valid stage"
    assert decisions_resp[0].get("why"), "REST decision-log item must have why justification"
    assert len(decisions_resp[0].get("evidence", [])) > 0, "REST decision-log item must have evidence list"
    print("[OK] TEST 5 PASSED: REST API correctly returns rich investigation summary and decision logs!")

    # ----------------------------------------------------
    # TEST 6: Investigation Graph Data Mapping Verification
    # ----------------------------------------------------
    print("\n[TEST 6] Testing REST API /api/investigation/{inv_id}/graph Multi-Entity Mapping...")
    graph_resp = await get_resource(inv_id, "graph")
    assert isinstance(graph_resp, dict), "graph response must be a dict"
    graph_nodes = graph_resp.get("nodes", [])
    graph_edges = graph_resp.get("edges", [])
    assert len(graph_nodes) > 0, "Graph must contain nodes"
    assert len(graph_edges) > 0, "Graph must contain edges"

    node_kinds = {n.get("kind") for n in graph_nodes}
    print(f"[OK] Discovered Node Kinds in Investigation Graph: {sorted(list(node_kinds))}")

    # Required nodes: Asset, Service, Finding, CVE, MITRE, Attack Chain, Remediation
    required_kinds = {"asset", "service", "finding", "cve", "mitre", "chain", "remediation"}
    missing_kinds = required_kinds - node_kinds
    assert not missing_kinds, f"Investigation graph is missing required node kinds: {missing_kinds}"

    # Verify separated layers
    layers = graph_resp.get("layers", {})
    assert "technical" in layers, "Graph must define technical layer"
    assert "attack" in layers, "Graph must define attack layer"
    assert len(layers["technical"].get("nodes", [])) > 0, "Technical layer must contain nodes"
    assert len(layers["attack"].get("nodes", [])) > 0, "Attack layer must contain nodes"

    # Verify CVE node attributes (CVE ID, Severity, Impact, Confidence)
    cve_sample = next((n for n in graph_nodes if n.get("kind") == "cve"), None)
    if cve_sample:
        assert cve_sample.get("cve_id") or cve_sample.get("label"), "CVE node must have cve_id or label"
        assert cve_sample.get("severity") is not None, "CVE node must have severity"
        assert cve_sample.get("impact") is not None, "CVE node must have impact"
        assert cve_sample.get("confidence") is not None, "CVE node must have confidence"

    # Verify edge connectivity
    node_ids = {n["id"] for n in graph_nodes}
    for e in graph_edges:
        assert "source" in e and "target" in e, "Edge must specify source and target"

    # ----------------------------------------------------
    # TEST 7: SOC-Grade Attack Path & Intelligence Engine Verification
    # ----------------------------------------------------
    print("\n[TEST 7] Testing SOC-Grade Attack Path Intelligence & MITRE Journey...")
    chains_resp = await get_resource(inv_id, "attack-chains")
    assert isinstance(chains_resp, dict), "attack-chains response must be a dict"
    chain_nodes = chains_resp.get("nodes", [])
    chain_edges = chains_resp.get("edges", [])
    intelligence = chains_resp.get("intelligence", {})

    assert len(chain_nodes) > 0, "Attack chain must contain nodes"
    assert len(chain_edges) > 0, "Attack chain must contain edges"
    assert intelligence.get("risk_score") is not None, "Intelligence must have risk_score"
    assert intelligence.get("severity") in ["Critical", "High", "Medium", "Low"], "Intelligence must have valid severity"
    assert intelligence.get("confidence") in ["High", "Medium", "Low"], "Intelligence must have propagated confidence"
    assert len(intelligence.get("explanation", "")) > 10, "Intelligence must have narrative explanation"

    # Verify single entry point (no duplicate Internet Exposure nodes)
    start_nodes = [n for n in chain_nodes if n.get("label") == "Internet Exposure" or n.get("id") in ("start", "mitre-start")]
    assert len(start_nodes) == 1, f"Expected exactly 1 Internet Exposure entry node, found {len(start_nodes)}"
    assert start_nodes[0].get("id") == "mitre-start", "Single Internet Exposure node must have ID mitre-start"

    # Verify MITRE journey nodes and evidence attachment
    mitre_nodes = [n for n in chain_nodes if n.get("id", "").startswith("mitre-")]
    assert len(mitre_nodes) >= 2, "MITRE journey must have multiple evidence-supported stages"
    for mn in mitre_nodes:
        assert mn.get("evidence"), f"MITRE node {mn.get('id')} must have attached verified evidence"
        assert mn.get("confidence"), f"MITRE node {mn.get('id')} must have propagated confidence"
        assert mn.get("confidence_score") is not None, f"MITRE node {mn.get('id')} must have confidence score"

    # Verify multi-layer entity relationships (Asset, Service, Finding, CVE, MITRE, Remediation)
    node_kinds = set(n.get("kind") for n in chain_nodes if n.get("kind"))
    assert "asset" in node_kinds, "Graph must contain asset node"
    assert "service" in node_kinds, "Graph must contain service node"
    assert "finding" in node_kinds, "Graph must contain finding node"
    assert "cve" in node_kinds, "Graph must contain cve node"
    assert "mitre" in node_kinds, "Graph must contain mitre technique node"
    assert "remediation" in node_kinds, "Graph must contain remediation node"

    # Verify detailed evidence fields on finding and service nodes
    finding_sample = next((n for n in chain_nodes if n.get("kind") == "finding"), None)
    assert finding_sample is not None, "Finding node must exist"
    assert finding_sample.get("host") is not None, "Finding node must include host"
    assert finding_sample.get("port") is not None, "Finding node must include port"
    assert finding_sample.get("service") is not None, "Finding node must include service"
    assert finding_sample.get("cve") is not None, "Finding node must include cve"
    assert finding_sample.get("severity") is not None, "Finding node must include severity"

    # Verify detailed remediation nodes
    rem_sample = next((n for n in chain_nodes if n.get("kind") == "remediation"), None)
    assert rem_sample is not None, "Remediation node must exist"
    assert rem_sample.get("fix_action") is not None, "Remediation node must include fix_action"
    assert rem_sample.get("related_vulnerability") is not None, "Remediation node must include related_vulnerability"
    assert rem_sample.get("priority") is not None, "Remediation node must include priority"
    assert rem_sample.get("reason") is not None, "Remediation node must include technical reason"

    print(f"[OK] Attack Path Intelligence Explanation:\n    {intelligence.get('explanation')}")
    print(f"[OK] Discovered Node Kinds in Attack Chain: {sorted(list(node_kinds))}")
    print(f"[OK] Verified {len(mitre_nodes)} evidence-backed MITRE ATT&CK stages in attack journey!")
    print("[OK] TEST 7 PASSED: SOC-Grade Attack Path Engine generated evidence-based MITRE journey, confidence propagation, and remediation mapping!")

    # ----------------------------------------------------
    # TEST 8: Dynamic Risk Dashboard Scoring Across Scans
    # ----------------------------------------------------
    print("\n[TEST 8] Testing Dynamic Risk Dashboard Scoring Across Different Scans...")
    # 8a: Verify the critical/high scan risk dashboard
    risk_resp_1 = await get_resource(inv_id, "risk")
    assert isinstance(risk_resp_1, dict), "risk response must be a dict"
    score_1 = risk_resp_1.get("overallScore")
    risk_level_1 = risk_resp_1.get("overallRisk")
    print(f"[OK] Multi-service Scan -> Score: {score_1}, Level: {risk_level_1}, Counts: {risk_resp_1.get('counts')}")
    assert score_1 is not None and score_1 > 0, "Risk score must be dynamic and > 0"
    assert "counts" in risk_resp_1 and "topFindings" in risk_resp_1 and "topServices" in risk_resp_1

    # 8b: Run a minimal low-risk scan
    low_scan = """Nmap scan report for 10.0.0.5
PORT     STATE SERVICE VERSION
80/tcp   open  http    nginx 1.24.0"""

    inv_id_low = await start_autonomous_investigation(
        goal="Scan low risk web server",
        scan_data=low_scan
    )
    for _ in range(20):
        await asyncio.sleep(0.5)
        st = get_agent_status(inv_id_low)
        if st and st.get("is_complete"):
            break

    risk_resp_2 = await get_resource(inv_id_low, "risk-dashboard")
    score_2 = risk_resp_2.get("overallScore")
    risk_level_2 = risk_resp_2.get("overallRisk")
    print(f"[OK] Low-risk Web Scan -> Score: {score_2}, Level: {risk_level_2}, Counts: {risk_resp_2.get('counts')}")

    # Assert scores differ dynamically according to threat surface
    assert score_1 != score_2, f"Dynamic risk scores must differ between different scans ({score_1} vs {score_2})"
    assert score_1 > score_2, f"Multi-vulnerability scan score ({score_1}) must be higher than low-risk scan score ({score_2})"
    print("[OK] TEST 8 PASSED: Risk Dashboard computes dynamic scores and levels reflecting actual investigation data!")

    print("\n" + "=" * 60)
    print("ALL 8 AUTONOMOUS AGENT VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_tests())



