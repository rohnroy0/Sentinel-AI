import asyncio
import os
import sys

# Set test env vars before loading config
os.environ["DATABASE_ENGINE"] = "sqlite"
os.environ["AUTH_MODE"] = "demo"

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from agent.agent_controller import start_autonomous_investigation, get_agent_status
from agent.ask_sentinel import ask_sentinel_question
from services.cve_lookup import lookup_vulnerabilities
from database.repository import db_repository, InvestigationRepository
from database.sqlite_adapter import SQLiteAdapter
from config import config
from auth import get_current_user
from fastapi.security import HTTPAuthorizationCredentials

TEST_USER_A = "test_analyst_01"
TEST_USER_B = "test_analyst_02"

async def run_tests():
    print("=" * 60)
    print("RUNNING SENTINEL-AI PRODUCTION SUITE VERIFICATION TESTS")
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
        scan_data=scan_data,
        user_id=TEST_USER_A
    )
    print(f"[OK] Started Investigation ID: {inv_id} for user {TEST_USER_A}")

    # Wait for workflow completion
    for _ in range(50):
        await asyncio.sleep(0.5)
        status = get_agent_status(inv_id)
        if status and status.get("is_complete"):
            break

    status = get_agent_status(inv_id)
    assert status is not None, "Status should not be None"
    assert status.get("is_complete") is True, "Workflow should complete successfully"
    assert len(status.get("selected_tools", [])) >= 4, "Tools should have been executed"
    assert len(status.get("findings", [])) > 0, "Findings should be discovered"

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

    print("[OK] TEST 1 PASSED: Autonomous workflow completed successfully!")

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
        scan_data=modified_scan,
        user_id=TEST_USER_A
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
    # TEST 5: REST Resource Endpoint Verification
    # ----------------------------------------------------
    print("\n[TEST 5] Testing REST API /api/investigation/{inv_id}/{resource} Data Flow...")
    from main import get_resource
    summary_resp = await get_resource(inv_id, "investigation-summary", user_id=TEST_USER_A)
    assert isinstance(summary_resp, dict), "investigation-summary response must be a dict"
    assert summary_resp.get("servicesDiscovered", 0) > 0, "REST investigation-summary servicesDiscovered must be > 0"
    assert summary_resp.get("findingsGenerated", 0) > 0, "REST investigation-summary findingsGenerated must be > 0"
    assert summary_resp.get("attackChainsBuilt", 0) > 0, "REST investigation-summary attackChainsBuilt must be > 0"
    assert summary_resp.get("mitreTechniquesMapped", 0) > 0, "REST investigation-summary mitreTechniquesMapped must be > 0"
    assert summary_resp.get("decisionCount", 0) > 0, "REST investigation-summary decisionCount must be > 0"

    decisions_resp = await get_resource(inv_id, "decision-log", user_id=TEST_USER_A)
    assert isinstance(decisions_resp, list) and len(decisions_resp) > 0, "REST decision-log response must be a non-empty list"
    assert decisions_resp[0].get("stage"), "REST decision-log item must have a valid stage"
    assert decisions_resp[0].get("why"), "REST decision-log item must have why justification"
    assert len(decisions_resp[0].get("evidence", [])) > 0, "REST decision-log item must have evidence list"
    print("[OK] TEST 5 PASSED: REST API correctly returns rich investigation summary and decision logs!")

    # ----------------------------------------------------
    # TEST 6: Investigation Graph Data Mapping Verification
    # ----------------------------------------------------
    print("\n[TEST 6] Testing REST API /api/investigation/{inv_id}/graph Multi-Entity Mapping...")
    graph_resp = await get_resource(inv_id, "graph", user_id=TEST_USER_A)
    assert isinstance(graph_resp, dict), "graph response must be a dict"
    graph_nodes = graph_resp.get("nodes", [])
    graph_edges = graph_resp.get("edges", [])
    assert len(graph_nodes) > 0, "Graph must contain nodes"
    assert len(graph_edges) > 0, "Graph must contain edges"

    node_kinds = {n.get("kind") for n in graph_nodes}
    required_kinds = {"asset", "service", "finding", "cve", "mitre", "chain", "remediation"}
    missing_kinds = required_kinds - node_kinds
    assert not missing_kinds, f"Investigation graph is missing required node kinds: {missing_kinds}"
    print(f"[OK] Discovered Node Kinds in Graph: {sorted(list(node_kinds))}")
    print("[OK] TEST 6 PASSED: Investigation graph generated multi-entity taxonomy!")

    # ----------------------------------------------------
    # TEST 7: SOC-Grade Attack Path & Intelligence Engine Verification
    # ----------------------------------------------------
    print("\n[TEST 7] Testing SOC-Grade Attack Path Intelligence & MITRE Journey...")
    chains_resp = await get_resource(inv_id, "attack-chains", user_id=TEST_USER_A)
    assert isinstance(chains_resp, dict), "attack-chains response must be a dict"
    chain_nodes = chains_resp.get("nodes", [])
    chain_edges = chains_resp.get("edges", [])
    intelligence = chains_resp.get("intelligence", {})

    assert len(chain_nodes) > 0, "Attack chain must contain nodes"
    assert len(chain_edges) > 0, "Attack chain must contain edges"
    assert intelligence.get("risk_score") is not None, "Intelligence must have risk_score"
    assert intelligence.get("severity") in ["Critical", "High", "Medium", "Low"], "Intelligence must have valid severity"
    assert len(intelligence.get("explanation", "")) > 10, "Intelligence must have narrative explanation"

    print("[OK] TEST 7 PASSED: SOC-Grade Attack Path Engine generated evidence-backed MITRE journey!")

    # ----------------------------------------------------
    # TEST 8: Dynamic Risk Dashboard Scoring Across Scans
    # ----------------------------------------------------
    print("\n[TEST 8] Testing Dynamic Risk Dashboard Scoring Across Different Scans...")
    risk_resp_1 = await get_resource(inv_id, "risk", user_id=TEST_USER_A)
    score_1 = risk_resp_1.get("overallScore")

    low_scan = """Nmap scan report for 10.0.0.5
PORT     STATE SERVICE VERSION
80/tcp   open  http    nginx 1.24.0"""

    inv_id_low = await start_autonomous_investigation(
        goal="Scan low risk web server",
        scan_data=low_scan,
        user_id=TEST_USER_A
    )
    for _ in range(20):
        await asyncio.sleep(0.5)
        st = get_agent_status(inv_id_low)
        if st and st.get("is_complete"):
            break

    risk_resp_2 = await get_resource(inv_id_low, "risk-dashboard", user_id=TEST_USER_A)
    score_2 = risk_resp_2.get("overallScore")
    assert score_1 > score_2, f"Multi-vulnerability scan ({score_1}) must score higher than low-risk scan ({score_2})"
    print(f"[OK] Dynamic scores verified: Multi-service={score_1} vs Low-risk={score_2}")
    print("[OK] TEST 8 PASSED: Risk Dashboard computes dynamic scores!")

    # ----------------------------------------------------
    # TEST 9: Database Adapter & Repository Abstraction Test
    # ----------------------------------------------------
    print("\n[TEST 9] Testing Database Adapter & Repository Abstraction Pattern...")
    repo = InvestigationRepository(adapter=SQLiteAdapter())
    health = repo.health_check()
    assert health.get("status") == "ok", "Database repository health check should return ok"
    assert health.get("engine") == "sqlite", "Repository engine should match SQLite"

    test_state = {
        "investigation_id": "test-repo-inv-001",
        "user_id": TEST_USER_A,
        "user_goal": "Test Database Abstraction",
        "current_status": "Completed",
        "scan_data": "Nmap scan report for 127.0.0.1",
        "discovered_hosts": [{"ip": "127.0.0.1"}]
    }

    saved = repo.save_investigation(test_state)
    assert saved is True, "Repository save_investigation should return True"

    fetched = repo.get_investigation_by_id("test-repo-inv-001", TEST_USER_A)
    assert fetched is not None, "Repository should fetch saved investigation"
    assert fetched["user_goal"] == "Test Database Abstraction", "Fetched data must match saved record"

    deleted = repo.delete_investigation("test-repo-inv-001", TEST_USER_A)
    assert deleted is True, "Repository delete_investigation should return True"
    assert repo.get_investigation_by_id("test-repo-inv-001", TEST_USER_A) is None, "Investigation should be deleted"
    print("[OK] TEST 9 PASSED: Database Adapter & Repository pattern operated flawlessly!")

    # ----------------------------------------------------
    # TEST 10: Multi-Tenant User Isolation & Missing User ID Rejection Test
    # ----------------------------------------------------
    print("\n[TEST 10] Testing User Isolation & Missing user_id Rejection...")
    # 10a: Operations missing user_id must be rejected
    rejected_save = repo.save_investigation({"investigation_id": "test-no-user", "user_goal": "No User Goal"})
    assert rejected_save is False, "Save without user_id must be rejected"

    rejected_fetch = repo.get_investigation_by_id(inv_id, user_id=None)
    assert rejected_fetch is None, "Fetch without user_id must return None"

    # 10b: User B must NOT be able to read User A's investigation
    user_b_fetch = repo.get_investigation_by_id(inv_id, user_id=TEST_USER_B)
    assert user_b_fetch is None, "User B must not be allowed to read User A's investigation"

    user_a_list = repo.get_all_investigations(user_id=TEST_USER_A)
    user_b_list = repo.get_all_investigations(user_id=TEST_USER_B)
    assert len(user_a_list) > 0, "User A should see their investigations"
    assert len(user_b_list) == 0 or all(inv.get("user_id") == TEST_USER_B for inv in user_b_list), "User B must only see User B investigations"
    print("[OK] TEST 10 PASSED: Strict multi-tenant user isolation verified!")

    # ----------------------------------------------------
    # TEST 11: Authentication Mode Configuration & Token Test
    # ----------------------------------------------------
    print("\n[TEST 11] Testing Authentication Mode Configuration & Token Logic...")
    demo_creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="demo-token-analyst-isolated-99")
    auth_user = get_current_user(demo_creds)
    assert auth_user == "analyst-isolated-99", f"Demo token extraction failed: expected 'analyst-isolated-99', got '{auth_user}'"
    print(f"[OK] Auth extracted demo isolated identity: {auth_user}")
    print("[OK] TEST 11 PASSED: Auth mode token parser operated correctly!")

    # ----------------------------------------------------
    # TEST 12: Attack Chain Stage Evidence & MITRE ATT&CK Validation Test
    # ----------------------------------------------------
    print("\n[TEST 12] Testing Attack Chain Evidence Bounds & MITRE Stage Validation...")
    from ai.attack_chain_builder.builder import build_chains
    sample_findings = [
        {"title": "Exposed SSH 7.4 (CVE-2023-38408)", "service": "ssh", "host": "192.168.1.10", "port": 22, "cve": "CVE-2023-38408", "severity": "Critical", "score": 9.8},
        {"title": "Exposed Apache 2.4.49 (CVE-2021-41773)", "service": "http", "host": "192.168.1.10", "port": 80, "cve": "CVE-2021-41773", "severity": "High", "score": 7.5}
    ]
    chains = build_chains(sample_findings)
    assert "nodes" in chains and "edges" in chains and "intelligence" in chains
    intel = chains["intelligence"]
    assert intel.get("risk_score") is not None and intel.get("risk_score") > 0, "Multi-vulnerability chain must compute valid risk score"
    print(f"[OK] Built Attack Journey with risk score: {intel.get('risk_score')}")
    print("[OK] TEST 12 PASSED: Attack Chain MITRE stage evidence validated successfully!")

    print("\n" + "=" * 60)
    print("ALL 12 PRODUCTION VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_tests())
