# Changelog

All notable changes to Sentinel-AI will be documented in this file.

---

## Current Version — v1.2.1 (Build 2026.08.06)

### Investigation Persistence & Supabase Restoration Fix:
- **Database Restoration User Context Forwarding:** Resolved regression in `agent_controller.py` where `get_agent_status` failed to forward `user_id` to `get_investigation_by_id`, causing database restoration calls after cache eviction or page refresh to return `None` (404 Investigation Not Found).
- **Audit Logging Standards:** Added standardized explicit audit logging across `repository.py`, `supabase_adapter.py`, and `sqlite_adapter.py` matching: `INVESTIGATION ID:`, `USER ID:`, `DATABASE ENGINE:`, `SAVE START:`, `SAVE SUCCESS:`, `SAVE FAILURE:`.
- **JSON Serialization & Schema Compliance:** Added `json.loads(json.dumps(state, default=str))` sanitization in `SupabaseAdapter` and `SQLiteAdapter` to ensure PostgREST / SQLite API serialization compliance across complex nested graph structures. Included `"user_id"` in `get_agent_status` return payload.

---

## Version — v1.2.0 (Build 2026.08.06)


### Performance Optimization & Asynchronous Pipeline Acceleration:
- **Asynchronous Non-Blocking Investigation Pipeline:** Updated `POST /api/upload` to return `investigation_id` immediately. Executed analysis in background tasks with real-time status, stage, and progress metrics (10% Parsing -> 35% CVE Intel -> 55% Risk Analysis -> 75% MITRE Mapping -> 90% Attack Graph -> 100% Executive Report). Removed 5-second artificial sleep delays in `main.py`.
- **Lightweight Status Endpoint Optimization:** Refactored `GET /api/investigation/{inv_id}/status` to return strictly lightweight status JSON `{ investigation_id, status, progress, stage, isComplete }`. Eliminated graph/risk/report reconstruction during polling. Status polling speed increased by **44.5x** (0.071ms avg).
- **Single-Pass Computed Result Caching:** Pre-computed `investigation_graph`, `risk_dashboard`, `attack_chains`, and `investigation_summary` once at pipeline completion and cached them in `AgentState` / DB, preventing repetitive graph layout calculations during polling or tab switching.
- **Parallelized LangGraph Agent Tools:** Updated `planner_node.py` and `tool_node.py` to plan and execute non-interdependent tools (`risk_analyzer`, `attack_graph_builder`, `threat_intelligence`) concurrently via `asyncio.gather` after vulnerability lookup.
- **Frontend Route-Based Code-Splitting (`React.lazy` & `Suspense`):** Refactored `App.jsx` to lazily import heavy visualizer pages (`AgentConsole`, `InvestigationGraph`, `AttackChains`, `RiskDashboard`, `Reports`) with a custom SOC fallback loader (`PageFallbackLoader`), reducing initial bundle load times.
- **Client-Side Resource Caching & Deduplication:** Added in-memory resource caching (`RESOURCE_CACHE`) and inflight request deduplication in `investigationService.js`, enabling instant tab switching without repetitive HTTP fetches.
- **SOC Progress Timeline & Component Memoization:** Updated `Timeline.jsx` and `AgentTimeline.jsx` with the 6-stage SOC timeline progression. Applied `React.memo()` to `CustomNode`, `FindingCard`, and `AgentTimeline` to prevent re-renders.

---

## Version — v1.1.1 (Build 2026.08.06)


### Render Memory Limit Optimization & Resource Controls:
- **Single Worker Process Configuration:** Updated Gunicorn/Uvicorn start commands in root `Procfile`, `backend/Procfile`, `backend/Dockerfile`, and `HOSTING.md` to run `--workers 1` with `--timeout 300`, preventing process RAM duplication under Render's 512MB RAM cap.
- **Bounded LRU Session Caches:** Replaced unlimited in-memory global dictionaries (`investigations`, `agent_investigations`) with custom 20-item Bounded LRU caches, preventing memory growth over time.
- **Database Fallback & Persistence:** Ensured cache eviction delegates seamlessly to persistent database storage (`sqlite_adapter.py` / `supabase_adapter.py`) via `get_investigation_by_id`.
- **Memoized Local CVE Database:** Added module-level memoized caching (`_LOCAL_CVE_CACHE`) in `cve_lookup.py` to eliminate repeated disk reads and JSON parsing on every CVE lookup.
- **Optimized Summary Queries:** Replaced `SELECT *` in `get_all_investigations` with lightweight summary column selection, avoiding loading heavy `full_state`, graph, and scan text blobs into RAM during history list queries.
- **Explicit Pipeline Garbage Collection:** Added `gc.collect()` at key execution boundaries (`run_investigation_pipeline`, `_run_agent_workflow`, and heavy graph/report tools) to immediately free unreferenced memory objects.
- **Memory Monitoring Endpoints:** Created `GET /health/memory` and `GET /api/health/memory` returning live RAM RSS metrics, cache utilization counts, database engine, and status.
- **13-Point Automated Test Suite:** Expanded `backend/tests/test_agent_system.py` with Test 13 to verify memory monitoring endpoints and cache boundary constraints.

---

## Version — v1.1.0 (Build 2026.08.05)

### Features & Architecture Improvements added:
- **Pluggable Database Adapter Architecture (`database/`):** Implemented an abstract repository pattern (`adapter.py`, `sqlite_adapter.py`, `supabase_adapter.py`, `repository.py`) supporting both SQLite (Development/Local) and Supabase Python SDK (Production/Cloud). Business logic is completely decoupled from specific database engines.
- **Strict Multi-Tenant User Isolation:** Enforced mandatory `user_id` validation across `InvestigationRepository` and database adapters. Rejects unauthenticated requests safely without writing to `"default_user"`.
- **Explicit Auth Mode (`AUTH_MODE`):** Configurable `AUTH_MODE=supabase` vs `AUTH_MODE=demo`. In Demo Mode, generates isolated session-scoped temporary identities (`demo-user-{uuid}`) per browser session.
- **FastAPI Health & Pydantic Schemas:** Added `GET /health` and `GET /api/health` returning system status, database engine, and auth mode. Added Pydantic schemas in `models/schemas.py`.
- **Production Audit & Legacy Archiving:** Archived legacy setup/migration scripts into `backend/archive/` and cleaned unused frontend components.
- **12-Point Automated Test Suite:** Expanded verification test suite in `test_agent_system.py` covering database repository abstraction, user isolation, auth modes, and attack chain evidence bounds.

---

## Version — v1.0.0 (Build 2026.08.01)

### Features added:
- **Autonomous LangGraph Agent Engine:** Implemented full autonomous workflow (`agent/graph.py`, `agent_controller.py`) with Planner Node, Tool Node, Reasoning Node, and Memory Node.
- **AI Agent Toolset:** Added callable agent security tools:
  - `nmap_analysis_tool` — extracts host and port inventory.
  - `vulnerability_lookup_tool` — queries CVE databases.
  - `risk_analysis_tool` — computes CVSS risk vectors and distributions.
  - `attack_graph_tool` — builds interactive node-link relationships.
  - `threat_intelligence_tool` — maps findings to MITRE ATT&CK techniques.
  - `report_generation_tool` — generates executive security summaries.
- **Hybrid CVE Lookup Service:** Implemented offline pre-cached CVE database (`cve_cache.json`) with automated NVD API online fallback.
- **5-Point Explainable AI Reasoning:** Added structured finding explainability (Finding, Root Cause Why, Verified Evidence, Exploitation Impact, Hardening Recommendation).
- **Interactive SOC Agent Console (`AgentConsole.jsx`):** Created dedicated real-time workspace with live execution timeline, interactive finding cards, attack path viewer, and reasoning logs.
- **Floating Ask Sentinel AI Assistant (`AskSentinelDrawer.jsx`):** Added a persistent floating AI assistant button in the bottom-right corner of the AI SOC Agent Console. Clicking launches a sliding side drawer offering real-time investigation context indicators (active investigation ID, host count, finding count), full conversation history with Markdown rendering, verified evidence pills, remediation callouts, quick suggested inquiry chips, and expandable view width.
- **Ask Sentinel Q&A Assistant:** Integrated context-aware interactive Q&A assistant (`ask_sentinel.py`) for on-demand security queries.
- **Memory Delta Engine:** Added historical cross-investigation comparison tracking network posture changes over time.
- **SQLite Investigation State Persistence:** Full database storage model (`database/models.py`, `db.py`) persisting complete investigation state across server restarts.
- **SOC-Grade Attack Path & Intelligence Engine:**
  - Implemented evidence-based MITRE ATT&CK journey stages (`Internet Exposure → Initial Access (T1190) → Privilege Escalation (T1068) → Lateral Movement (T1021) → Sensitive Data Exposure (T1040)`), generated only when backed by discovered findings and verified CVE telemetry.
  - Added attack path risk scoring, severity ratings, narrative threat explanations, and uncertainty detection.
  - Implemented dynamic confidence propagation from CVE and service findings to attack path steps.
  - Linked each attack path step directly to concrete remediation actions.
  - Upgraded graph relationship mapping to support the full data model: `Asset → Service → Vulnerability → CVE → MITRE → Attack Path → Remediation`.
- **Investigation Graph Visualization & Layer Separation (BUG-010):**
  - Separated the Investigation Graph into two distinct, dedicated layers:
    - **Technical Layer:** `Asset (Host) → Service → Finding → CVE → MITRE → Remediation` (with supporting telemetry).
    - **Attack Layer:** `Internet Exposure → Initial Access → Privilege Escalation → Lateral Movement → Data Exposure`.
  - Added interactive layer switcher (`Technical Layer`, `Attack Layer`, `All Layers`) in the toolbar of `InvestigationGraph.jsx`.
  - Implemented hierarchical Host grouping in `layoutGraph` ensuring clear `Host → Services → Vulnerabilities` grouping and visual alignment.
  - Reduced node clutter with compact card geometry displaying only critical metrics (`Name`, `Severity`, `Confidence`) on the face, moving detailed telemetry/evidence into the slide-out `DetailPanel`.
  - Reduced edge clutter by selectively displaying relationship labels only for critical transitions (`Exploits`, `Escalates`, `Pivots`, `Exfiltrates`, `Mitigated By`) and focused nodes.
  - Upgraded CVE nodes to display `CVE ID`, `Severity`, concise `Impact` summary, and `Confidence` score.

### Fixes:
- **Investigation State Persistence & Hydration:** Resolved data loss issue across server restarts by implementing SQLite schema columns (`tool_results`, `explained_findings`, `remediation`, `risk_dashboard`, `investigation_graph`, `attack_chains`, `full_state`) and full-state hydration in `get_investigation_by_id`.
- **Frontend Dashboard Sync:** Fixed empty dashboard data states when navigating between Agent Console and deterministic pipeline views by consolidating data structures.
- **Version Compatibility Matching:** Enhanced regex parser in `cve_lookup.py` to support compound version ranges (e.g. `X to Y`, `< Z`, `and prior`).
- **Decision Log & Summary Data Flow (BUG-006):** Resolved 0-value display across Decision Log summary metrics and empty decision cards. Fixed REST endpoint routing in `main.py` for `"investigation-summary"` and enriched `get_agent_status` in `agent_controller.py` with multi-stage structured decision audit cards (`stage`, `module`, `decision`, `why`, `evidence`, `outcome`, `next_step`, `confidence`, `status`, `processing_ms`). Added automated REST endpoint and status verification tests in `backend/tests/test_agent_system.py`.
- **Investigation Graph Multi-Entity Mapping (BUG-007):** Fixed 0-count graph filters and missing nodes for Services, CVE, MITRE, and Remediation. Updated `backend/ai/investigation_graph/builder.py`, `backend/agent/tools/attack_graph_tool.py`, and `backend/agent/agent_controller.py` to construct all required entity nodes (`Asset`, `Service`, `Finding`, `CVE`, `MITRE`, `Attack Chain`, `Remediation`) and edge relationships. Updated `colors.js`, `InvestigationSummary.jsx`, and `InvestigationGraph.jsx` with `CVE` palette definitions, icons, detail panel support, and layout columns. Added automated verification test in `test_agent_system.py`.
- **BUG-013:** Enhanced attack journey logic to enforce strict prerequisites for lateral movement and data exposure stages. Phrasing updated to be more cautious ("may exploit" vs "will exploit").
- **BUG-014:** Fixed Attack Chains ReactFlow graph layout. Replaced static constraints with content-aware dynamic node sizing and hierarchical depth ranking (`Asset → Service → Finding → CVE → MITRE → Attack Stage → Remediation`). Added UI `<details>` block for evidence and recommendation fields.
- **Dynamic Risk Engine & Score Calculation (BUG-008):** Replaced static hardcoded risk score calculation (92) with a dynamic risk algorithm in `backend/ai/risk_engine/risk_calculator.py`. Calculates scores and risk categories based on finding severities, CVSS vectors, sensitive port exposure, and attack path progression. Updated `risk_analysis_tool.py`, `agent_controller.py`, `main.py`, and `builder.py` to route all risk dashboard APIs through the dynamic engine. Added automated verification Test 8 in `backend/tests/test_agent_system.py`.
- **Attack Chain Visualization Quality &amp; Evidence Model (BUG-009):** Fixed duplicate entry nodes and enriched the attack path data model to a complete SOC-grade multi-layer relationship model (`Asset → Service → Finding → CVE → MITRE Technique → Attack Stage → Remediation`). Attached structured evidence telemetry (`Host`, `Port`, `Service`, `Version`, `CVE`, `Severity`), granular remediation metadata (`Fix action`, `Related vulnerability`, `Priority`, `Reason`), and confidence scoring/level indicators across `AttackChains.jsx` and `AttackPathViewer.jsx`.
- **Investigation Graph Clutter & Layer Mixing (BUG-010):** Resolved cluttered nodes with excessive text, mixed technical/attack journeys, un-grouped host relationships, and edge label noise. Refactored `backend/ai/investigation_graph/builder.py` and `frontend/src/pages/InvestigationGraph.jsx` with separated layer partitions, compact cards, hierarchical host grouping, selective transition labels, and enriched CVE vulnerability nodes.
- **PDF Print Layout Cropping (BUG-011):** Fixed PDF/print export where the generated output was cropped and included the sidebar, navbar, and dashboard chrome. Applied `@page { size: A4 portrait; margin: 12mm 15mm; }` in `App.css`, added `no-print` wrapper divs in `DashboardLayout.jsx` to hide `<Sidebar>` and `<TopNavbar>`, added `overflow: visible` layout unwrap rules for `h-screen`/`flex-1` containers, added `break-inside: avoid` page-break prevention on report cards/finding cards, and annotated all six report sections in `Reports.jsx` (`report-section`, `report-card`, `finding-card`, `mitre-card`) with matching print CSS classes.


### Pending improvements:
- **Local LLM / Ollama Support:** Add native support for local open-weight security models (e.g., DeepSeek-R1, Llama 3) for fully air-gapped deployments.
- **Multi-Tenant Memory Isolation:** Implement user- and organization-scoped memory indexing in SQLite.
- **Direct Live Network Scanning:** Support direct authenticated Nmap execution from the UI in addition to text upload.
- **Export Formats:** Add direct PDF and STIX 2.1 threat intelligence export capabilities.
