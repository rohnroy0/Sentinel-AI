# Known Bugs & Issue Tracker

This document tracks known issues, bug reports, root cause analyses, and resolution histories for Sentinel-AI.

---

## Resolved Issues

### Bug ID: BUG-017
- **Issue:** Dashboard "Your Investigations" cards rendered "0 Findings" for completed investigations and displayed hardcoded title "Deterministic Pipeline Investigation".
- **Cause:**
  1. `get_all_investigations` in database adapters omitted `findings_count` in returned summary objects, causing `DashboardOverview.jsx` to fall back to `inv.vulnerabilities.length` (which was set to `[]` for lightweight history).
  2. `save_deterministic_investigation` in `repository.py` hardcoded `scan_name` and `user_goal` to `"Deterministic Pipeline Investigation"`.
- **Status:** `Fixed`
- **Fix:**
  1. Updated `get_all_investigations` in `sqlite_adapter.py` and `supabase_adapter.py` to calculate lightweight `findings_count` without parsing or loading `full_state` JSON.
  2. Implemented dynamic target parsing (e.g. `Nmap Audit: 192.168.1.10`) with fallback chain (`scan_name` -> `title` -> `user_goal` -> `"Security Investigation"`).
  3. Updated `DashboardOverview.jsx` history card rendering to use fallback chain `inv.findings_count ?? inv.vulnerabilities?.length ?? inv.findings?.length ?? 0`.
  4. Verified all 18 automated tests pass in `test_agent_system.py`.

---

### Bug ID: BUG-016
- **Issue:** Production Audit Pass: Remediation UI displayed empty fields; duplicate SMB findings were created on ports 139 & 445; executive summary printed raw finding lists; MySQL database exposures mapped falsely to T1213; Risk Dashboard lacked driver explanations; attack chain terminology was confusing.
- **Cause:**
  1. Remediation schema in `build_remediation` lacked normalized property keys (`why_it_matters`, `recommendation`, `mitre`, `cwe`, `priority`, `confidence`) expected by `Remediation.jsx`.
  2. Multi-port findings of the same service category were not deduplicated post rule application.
  3. `analyze_results` printed `1. Finding A, 2. Finding B` instead of a professional executive narrative.
  4. KB_STORE `RULE_016` mapped Elasticsearch to `T1213 Data from Information Repositories` and lacked MITRE mapping validation.
  5. `build_dynamic_risk_dashboard` omitted `riskDrivers` and `riskBreakdown` calculations.
  6. Graph node labels used generic terms instead of SOC-oriented hierarchy.
- **Status:** `Fixed`
- **Fix:**
  1. Standardized remediation schema in `build_remediation` with alias fallbacks and added `"Not available"` UI defaults in `Remediation.jsx`.
  2. Implemented `correlate_and_deduplicate_findings` in `correlator.py` merging multi-port exposures while preserving all evidence lines.
  3. Upgraded `analyze_results` to produce a 3-paragraph executive narrative.
  4. Corrected Elasticsearch mapping to `T1046` and implemented `validate_mitre_mapping` in `mitre_mapping.py`.
  5. Added `riskDrivers` and `riskBreakdown` calculation in `risk_calculator.py` and rendered them in `RiskDashboard.jsx`.
  6. Updated labels to `"Attack Graph Entities"` and `Attacker Entry Point` → `Exposed Service` → `Vulnerability` → `MITRE Technique` → `Attack Objective` → `Remediation`.
  7. Verified all 17 automated tests pass in `test_agent_system.py`.

---

### Bug ID: BUG-011
- **Issue:** Investigations disappear after page refresh or cache eviction; Supabase investigations table rows not returned on reload.
- **Cause:**
  1. `get_agent_status` in `backend/agent/agent_controller.py` called `get_investigation_by_id(inv_id)` without passing `user_id`. Because multi-tenant isolation requires `user_id`, database lookups returned `None` (404 Investigation Not Found) whenever an investigation was not in the 20-item in-memory cache.
  2. `get_agent_status` return payload omitted `"user_id"`.
  3. `SupabaseAdapter` and `SQLiteAdapter` lacked serialization fallback (`json.loads(json.dumps(state, default=str))`) for complex nested graph structures.
- **Status:** `Fixed`
- **Fix:**
  1. Updated `get_agent_status` signature and call sites in `backend/main.py` to accept and pass `user_id` to `get_investigation_by_id(inv_id, user_id=user_id)`.
  2. Included `"user_id"` in `get_agent_status` response dictionary.
  3. Added explicit standardized audit logs (`INVESTIGATION ID:`, `USER ID:`, `DATABASE ENGINE:`, `SAVE START:`, `SAVE SUCCESS:`, `SAVE FAILURE:`) across repository and database adapters.
  4. Added JSON serialization sanitization to ensure Supabase PostgREST API compliance.

---

### Bug ID: BUG-001
- **Issue:** Risk dashboard and findings show empty data after server restart or direct page reload.
- **Cause:** Investigation state was stored only in memory (`investigations` / `agent_investigations` dictionaries). On process restart, in-memory state was wiped.
- **Status:** `Fixed`
- **Fix:** Added SQLite database persistence (`investigations.db`) via `save_investigation()` and `save_deterministic_investigation()`. Implemented automatic schema migration in `db.py` to persist `tool_results`, `explained_findings`, `remediation`, `risk_dashboard`, `investigation_graph`, `attack_chains`, and `full_state`. Added full-state re-hydration on retrieval in `get_investigation_by_id()`.

---

### Bug ID: BUG-002
- **Issue:** Version comparison in CVE lookup failed on complex version specifiers (e.g. `2.4.49 to 2.4.50` or `8.0.32 and prior`).
- **Cause:** `cve_lookup.py` originally performed basic equality checks or substring comparisons which failed to parse ranged strings.
- **Status:** `Fixed`
- **Fix:** Implemented `parse_ver()` token parser and `is_vulnerable_version()` regex comparator handling range intervals (`to`), upper bounds (`<`), and prior clauses (`and prior`).

---

### Bug ID: BUG-003
- **Issue:** Agent Console timeline occasionally remained stuck on the initial step if an intermediate tool threw an unhandled exception.
- **Cause:** Exception in single tool execution broke the LangGraph execution loop before the reasoning and memory nodes could run.
- **Status:** `Fixed`
- **Fix:** Added per-tool `try/except` wrapping in `backend/agent/nodes/tool_node.py` ensuring failures are logged gracefully to `tool_results` with error state while allowing the agent graph to proceed to completion.

### Bug ID: BUG-006
- **Issue:** Decision Log always shows 0 values for services, evidence, findings, attack paths, and MITRE mappings, and decision cards showed missing or undefined properties.
- **Cause:** 
  1. In `backend/main.py`, the `get_resource` endpoint mapped `"investigation-summary"` to `agent_status.get("final_report", {})`, which lacked summary statistics (`servicesDiscovered`, `evidenceCollected`, `findingsGenerated`, `attackChainsBuilt`, `mitreTechniquesMapped`, `decisionCount`), causing summary cards to default to 0.
  2. `get_agent_status` in `backend/agent/agent_controller.py` did not compute `investigation_summary` or construct fully structured `decision_log` cards with required frontend audit fields (`id`, `stage`, `module`, `title`, `decision`, `why`, `evidence`, `outcome`, `next_step`, `confidence`, `status`, `processing_ms`).
- **Status:** `Fixed`
- **Fix:** Enhanced `get_agent_status` to compute a comprehensive `investigation_summary` payload and generate 6-stage structured `decision_log` entries. Fixed `backend/main.py` resource mapping so `"investigation-summary"` and `"decision-log"` return rich telemetry. Added regression test verification in `backend/tests/test_agent_system.py`.

---

### Bug ID: BUG-007
- **Issue:** Investigation Graph data mapping and filter counts showed 0 for Services, CVE, MITRE, and Remediation despite findings and investigation summary displaying valid data.
- **Cause:** 
  1. `backend/ai/investigation_graph/builder.py` lacked explicit node generation and edge wiring for `cve` nodes, and did not handle flat/nested service lists or fallback extraction from risk findings.
  2. `backend/agent/tools/attack_graph_tool.py` generated a simplified 2-node graph mock instead of invoking the full graph builder with remediation and discovered hosts.
  3. `backend/agent/agent_controller.py` built the graph prior to generating remediation objects and passed an empty list for remediations.
  4. `frontend/src/design/colors.js`, `InvestigationSummary.jsx`, and `InvestigationGraph.jsx` lacked definition and column ordering for the `cve` node kind.
- **Status:** `Fixed`
- **Fix:** 
  - Updated `backend/ai/investigation_graph/builder.py` to extract and construct nodes and edges for all cybersecurity entity kinds (`asset`, `service`, `evidence`, `rule`, `finding`, `risk`, `cve`, `mitre`, `cwe`, `chain`, `remediation`).
  - Updated `backend/agent/tools/attack_graph_tool.py` to run `build_investigation_graph` with all discovered hosts, formatted vulnerabilities, and remediations.
  - Re-ordered state hydration in `backend/agent/agent_controller.py` so remediation is populated before constructing the investigation graph.
  - Added `cve` theme colors, icon mapping, and column layout support in `colors.js`, `InvestigationSummary.jsx`, and `InvestigationGraph.jsx`.
  - Added Test 6 to `backend/tests/test_agent_system.py` verifying all 7 required entity node kinds and edges via `/api/investigation/{inv_id}/graph`.

---

### Bug ID: BUG-008
- **Issue:** Risk Dashboard showed a static hardcoded score (92) and fixed risk level for every investigation regardless of the scan content.
- **Cause:** 
  1. `RiskDashboard` data was relying on static/fallback templates or fixed score mappings in agent state and deterministic pipeline endpoints.
  2. `risk_calculator.py` lacked a comprehensive dynamic mathematical scoring algorithm that weights findings by severity, incorporates max CVSS scores, adds exposure bonuses for sensitive ports and attack surfaces, incorporates attack chain stage depths, and normalizes casing across CVE/rule finding inputs.
- **Status:** `Fixed`
- **Fix:** 
  - Implemented `calculate_dynamic_risk_score` and `build_dynamic_risk_dashboard` in `backend/ai/risk_engine/risk_calculator.py` with dynamic base scoring (Critical: 80+, High: 58-76, Medium: 34-54, Low: 16-32, Info: 0-14), CVSS delta weighting, exposure additives for sensitive ports (21, 22, 23, 25, 53, 80, 443, 3306, 3389, 5432, 6379, 8080, etc.), and attack chain depth propagation.
  - Connected `risk_analysis_tool.py`, `agent_controller.py`, and `main.py` to route all `/api/investigation/{inv_id}/risk` and `risk-dashboard` requests directly through the dynamic risk builder.
  - Added Test 8 to `backend/tests/test_agent_system.py` verifying dynamic risk scoring variation across different scan surfaces (e.g. multi-vulnerability scan scored 88 / Critical vs. low-risk web scan scored 8 / Info).

---

### Bug ID: BUG-009
- **Issue:** Attack Chain visualization quality issues: duplicate Internet Exposure entry nodes, missing CVE layer, weak/unstructured evidence, and generic remediation nodes.
- **Cause:** 
  1. `backend/ai/attack_chain_builder/builder.py` created disconnected or duplicate `start` nodes when iterating over multiple finding chains.
  2. Entity relationship mapping omitted intermediate CVE nodes and direct MITRE technique bindings.
  3. Remediation nodes lacked technical reasons, vulnerability bindings, and priority metadata.
- **Status:** `Fixed`
- **Fix:** 
  - Refactored `backend/ai/attack_chain_builder/builder.py` to produce a single unified MITRE attack journey (`mitre-start` -> `mitre-ia` -> `mitre-pe` -> `mitre-lm` -> `mitre-sde`) with strictly evidence-backed stages.
  - Built structured multi-layer graph model: `Asset → Service → Finding → CVE → MITRE Technique → Attack Stage → Remediation`.
  - Attached detailed verified evidence (`host`, `port`, `service`, `version`, `cve`, `severity`) to all finding and service nodes.
  - Enriched remediation nodes with `fix_action`, `related_vulnerability`, `priority`, and technical `reason`.
  - Implemented confidence scoring and level propagation (`High`, `Medium`, `Low`) displayed in `AttackChains.jsx` and `AttackPathViewer.jsx`.
  - Verified with Test 7 in `backend/tests/test_agent_system.py`.

### Bug ID: BUG-010
- **Issue:** Investigation Graph visualization issues: cluttered nodes containing excessive text/evidence, mixed technical infrastructure and adversarial attack journey concepts, unclear host relationships with disjointed service groupings, noisy edge label clutter, and under-specified CVE node displays.
- **Cause:** 
  1. `builder.py` combined all nodes into a single flat bucket without separating Technical taxonomy (`Asset → Service → Finding → CVE → MITRE → Remediation`) from Attack journeys (`Internet Exposure → Initial Access → Privilege Escalation → Lateral Movement → Data Exposure`).
  2. Node representations directly rendered full rule explanations, multiple sentences, and raw evidence on the graph face rather than keeping cards compact.
  3. Nodes from multiple hosts were arranged alphabetically by kind without grouping findings and services under their parent host.
  4. Every structural edge had text labels, creating visual noise.
  5. CVE nodes lacked explicit impact, severity, and confidence fields.
- **Status:** `Fixed`
- **Fix:** 
  - Refactored `backend/ai/investigation_graph/builder.py` to partition nodes and edges into explicit `layer: "technical"` and `layer: "attack"` collections.
  - Implemented compact node cards in `CustomNode` in `frontend/src/pages/InvestigationGraph.jsx` displaying only `Name`, `Severity`, and `Confidence` on the card face, moving all telemetry into `DetailPanel`.
  - Built hierarchical host-based layout in `layoutGraph` ensuring `Host → Services → Vulnerabilities` are visually grouped and vertically aligned.
  - Reduced edge clutter by selectively displaying labels only on critical transitions (`Exploits`, `Escalates`, `Pivots`, `Exfiltrates`, `Mitigated By`) and focused nodes.
  - Enriched CVE nodes to render `CVE ID`, `Severity`, concise `Impact` summary, and `Confidence` score.
  - Added automated layer and CVE node property assertions in `backend/tests/test_agent_system.py`.

### Bug ID: BUG-011
- **Issue:** PDF/print export of the Reports page was cropped and included the sidebar, top navbar, and dashboard chrome. Content was clipped at the visible viewport, scroll overflow was hidden, and fixed-height containers prevented multi-page expansion.
- **Cause:**
  1. `DashboardLayout.jsx` renders `<Sidebar>` and `<TopNavbar>` as siblings to the main outlet — both were included in the print DOM without any CSS rule hiding them.
  2. `App.css` only had three `@media print` rules (body color, `.no-print`, ReactFlow background) — no layout unwrap rules or `@page` size spec.
  3. The `div.h-screen`, `div.flex-1`, and `main` containers used `overflow: hidden` / fixed `height: 100vh` which clipped content and prevented print pagination.
  4. Finding cards and report section containers had no `break-inside: avoid` rules, causing pages to split through cards.
- **Status:** `Fixed`
- **Fix:**
  - Wrapped `<Sidebar>` and `<TopNavbar>` in `no-print` divs in `DashboardLayout.jsx` so they are hidden entirely during print.
  - Added `@page { size: A4 portrait; margin: 12mm 15mm 15mm 15mm; }` to `App.css`.
  - Added comprehensive `@media print` rules in `App.css` unwrapping all `h-screen`, `flex-1`, `overflow-hidden`, and `max-w-7xl` containers to `display: block; height: auto; overflow: visible;`.
  - Suppressed all dashboard chrome (`.fixed`, `.sticky`, `nav`, `aside`, `header`, `button`) via `display: none !important` selectors.
  - Added `break-inside: avoid; page-break-inside: avoid;` rules for `.report-section`, `.report-card`, `.finding-card`, `.mitre-card` classes.
  - Annotated all six report sections in `Reports.jsx` (Executive Summary, Risk Assessment, Findings, MITRE Journey, Remediation, Methodology) with corresponding CSS class names.
  - Added `-webkit-print-color-adjust: exact; print-color-adjust: exact;` to ensure the dark `#0F1B2D` cover header band prints faithfully.

### Bug ID: BUG-012
- **Issue:** AI Investigation Summary showed Risk: LOW and 0 findings despite Critical/High vulnerabilities being present. Finding names showed generic "Service-1, Service-2, Service-3". MITRE techniques defaulted to "T1190" regardless of service type. Privilege Escalation stage appeared without genuine escalation evidence. Remediation text was a generic "Upgrade service to latest release" for every finding.
- **Cause:**
  1. **Risk / 0 findings**: `AIInvestigationSummary.jsx` filtered `f.severity === 'CRITICAL'` (uppercase) but the backend normalizes severity to title-case (`"Critical"`). All severity counts evaluated to 0, causing risk to default to `LOW`.
  2. **Generic names**: `agent_controller.py` line 72 used `f.get("service") or f.get("title", f"Service-{i+1}")` — when `service` was empty and `title` was unset, it fell through to `"Service-N"`.
  3. **MITRE always T1190**: The `mitre` field was set with `f.get("mitre", "T1190 - Exploit Public-Facing Application")` as a hardcoded default instead of calling the MITRE knowledge base mapping per service.
  4. **Privilege Escalation without evidence**: `builder.py` Stage 2 triggered `if pe_finding or has_critical`, meaning any Critical-severity finding (e.g. SSH) automatically generated a PE stage even without RCE/root/escalation evidence.
  5. **Generic remediation**: The fallback `"Upgrade {service} and restrict public network exposure."` was one size for all services.
- **Status:** `Fixed`
- **Fix:**
  - **`frontend/src/components/AIInvestigationSummary.jsx`**: Normalized all severity comparisons to title-case using `normSev()` helper. Risk level now reads from `statusData.risk_dashboard.overallRisk` (most authoritative source) before falling back to finding-derived severity. `mostDangerous` now uses real finding `title` or `"{SERVICE} ({CVE})"` format. Top Remediation now pulls from `statusData.remediation[0].action`.
  - **`backend/agent/agent_controller.py`**: Replaced `"Service-{i+1}"` fallback with a descriptive `"Exposed {SERVICE} {version} ({CVE})"` title builder. Added import and call of `map_service_to_mitre(service)` from `knowledge_base.mitre_mapping` for accurate per-service MITRE technique assignment. Added `version` field to all findings. Replaced generic remediation fallback with 8 service-type-specific remediation strings (SSH, HTTP/Apache, MySQL/Postgres, FTP, RDP, Telnet, SMTP, generic). Added `context` field to each finding for downstream graph mapping.
  - **`backend/ai/attack_chain_builder/builder.py`**: Tightened Stage 2 (Privilege Escalation) to require genuine evidence — finding must have `"root"/"privilege"/"rce"/"escalat"/"remote code"/"code execution"` in title/description/exploit_risk, OR CVE CVSS score ≥ 9.0. Removed `has_critical` as a standalone trigger.
  - All 8 verification tests pass (`backend/tests/test_agent_system.py`).

### Bug ID: BUG-013
- **Issue:** AI Investigation Summary and Attack Journey had five remaining accuracy problems: (1) Hosts Analyzed could show 0 when discovered_hosts had no `ip`/`host` key match; (2) finding titles still showed generic "Service" when `service` field was empty in the reasoning_node output; (3) generic "Update {service} to the latest release" remediation in `reasoning_node.py`; (4) Lateral Movement stage generated from `len(findings) > 1` regardless of whether services were actually lateral-movement-capable; (5) Sensitive Data Exposure stage generated from `has_critical or len(findings) >= 2` without requiring a database/FTP/cleartext finding. Attack journey explanations used overconfident language: "can be exploited... escalate to root".
- **Cause:**
  1. `AIInvestigationSummary.jsx` host count logic did not handle the case where all discovered hosts had neither `ip` nor `host` keys — fell to 0.
  2. `reasoning_node.py` used `f"Exposed {service.upper()} Service on {host}:{port} ({cve})"` as title but did not pass service name into agent_controller's `explained_findings` → agent_controller couldn't build the title properly.
  3. `reasoning_node.py` used `f"Update {service} to the latest release and restrict network access."` as fallback recommendation — same generic text for every service type.
  4. `builder.py` Stage 3 (Lateral Movement): `if lm_finding or len(findings) > 1` — two HTTP findings on the same host triggered a lateral movement claim.
  5. `builder.py` Stage 4 (Sensitive Data Exposure): `if data_finding or has_critical or len(findings) >= 2` — any critical SSH finding triggered a data exposure stage even without a database finding.
  6. `builder.py` attack explanation: "can be exploited... An attacker can leverage elevated privileges to escalate to root, move laterally..." — asserted facts without qualification.
- **Status:** `Fixed`
- **Fix:**
  - **`frontend/src/components/AIInvestigationSummary.jsx`**: Added `h.address` as additional IP key fallback. Falls back to `discovered_hosts.length` if uniqueIPs set is empty. Ensures minimum `totalHosts = 1` when a scan was conducted.
  - **`backend/agent/nodes/reasoning_node.py`**: Full rewrite of reasoning engine. Generates descriptive CVE-based titles (`"Exposed SSH 7.4 (CVE-2023-38408)"`), calls `map_service_to_mitre(service)` for accurate MITRE mapping, writes cautious impact language ("may allow", "potential", "risk of"), and generates 7 service-type-specific recommendations (SSH, HTTP, DB, FTP, RDP, Telnet, SMTP). Also populates `service`, `version`, `port`, `mitre`, `score` fields for downstream normalization.
  - **`backend/ai/attack_chain_builder/builder.py`**: Stage 3 (Lateral Movement) now requires an actual lateral-movement-capable service (`_LM_SERVICES = {ssh, mysql, redis, mongodb, postgresql, smb, rdp, vnc, winrm}` or `_LM_PORTS`). Stage 4 (Sensitive Data Exposure) now requires a database/FTP/cleartext finding (`_SDE_SERVICES = {mysql, mongodb, redis, ftp, postgresql, elasticsearch, cassandra}`). Attack journey explanation language changed to cautious: "may be exploitable", "could potentially allow", "may be able to leverage", "depending on system configuration". PE node label changed to "Potential Privilege Escalation" with "requires investigation" disclaimer. LM/SDE node subLabels use "may enable" and "potential risk" phrasing.
  - All 8 verification tests pass.

### Bug ID: BUG-014
- **Issue:** Attack Chains Graph visualization issues: nodes overlapping, text clipped by fixed heights, evidence hidden by line-clamp, viewport compressed, and edges unreadable due to overlapping cross-connections.
- **Cause:**
  1. `AttackChains.jsx` used static depth calculation and fixed row heights (130px) that ignored actual node content heights, causing nodes to stack on top of each other.
  2. The frontend truncated titles and clamped evidence to 2 lines instead of expanding dynamically.
  3. No explicit strict stage ordering for `mitre-ia -> mitre-pe -> mitre-lm -> mitre-sde`, leading to messy vertical layouts.
  4. Missing `fitView` triggers caused the initial load to be zoomed out incorrectly.
- **Status:** `Fixed`
- **Fix:**
  - Refactored `layoutChains` in `frontend/src/pages/AttackChains.jsx` to map nodes strictly to 7 hierarchical ranks (`Asset → Service → Finding → CVE → MITRE → Attack Stage → Remediation`).
  - Added `estimateNodeHeight` logic to calculate dynamic pixel heights based on content (titles, evidence, remediation text).
  - Implemented automatic column height calculation with center-aligned vertical offset `(maxColHeight - colHeights.get(col)) / 2`.
  - Used HTML `<details>` and `<summary>` in `ChainNode` for compact default view and expandable full evidence/details.
  - Implemented `AutoFitBounds` hook triggering `fitView()` dynamically on layout updates.

### Bug ID: BUG-015
- **Issue:** Render Web Service "Sentinel-AI" exceeded its 512MB memory limit and automatically restarted during multi-scan investigations.
- **Cause:** 
  1. Gunicorn process configuration launched 4 worker processes (`-w 4`), quadrupling baseline Python/FastAPI memory usage on start.
  2. Unlimited in-memory dictionaries `investigations={}` in `main.py` and `agent_investigations={}` in `agent_controller.py` held full scan contents, graphs, decision logs, and reports in RAM indefinitely.
  3. `cve_lookup.py` re-read and JSON-parsed `cve_cache.json` from disk on every single CVE lookup call.
  4. `get_all_investigations` executed `SELECT * FROM investigations`, loading heavy `full_state`, graph, and scan text blobs into RAM for all historical investigations during simple dashboard list queries.
- **Status:** `Fixed`
- **Fix:**
  - Configured single worker mode (`--workers 1 --timeout 300`) across `Procfile`, `backend/Procfile`, `backend/Dockerfile`, and `HOSTING.md`.
  - Replaced unlimited dictionaries with custom 20-item `BoundedLRUCache` in `main.py` and `agent_controller.py`, delegating cache misses to SQLite/Supabase persistent DB storage via `get_investigation_by_id`.
  - Implemented memoized module cache (`_LOCAL_CVE_CACHE`) in `cve_lookup.py` for single-load CVE database access.
  - Refactored `get_all_investigations` in `sqlite_adapter.py` and `supabase_adapter.py` to query lightweight summary columns (`id, user_goal, status, vulnerabilities, discovered_hosts, created_at, user_id`).
  - Added explicit garbage collection (`gc.collect()`) after completing heavy investigation workflows and tool runs.
  - Created `GET /health/memory` monitoring endpoint.
  - Verified with 13 automated tests in `test_agent_system.py`.

## Active / Monitored Issues

### Bug ID: BUG-004
- **Issue:** Long Nmap scan outputs (> 5,000 lines) may cause increased latency during synchronous parsing.
- **Cause:** Regex pattern matching over large unstructured text files in single-threaded synchronous parse calls.
- **Status:** `Open / Workaround Available`
- **Workaround:** Recommend standard port scans (`top-ports 1000`) or filtering raw text before submission until streaming regex chunks are implemented.

---

### Bug ID: BUG-005
- **Issue:** Rate limiting when querying public NVD API without an API key configured.
- **Cause:** Public NIST NVD API enforces strict requests-per-minute limits for unauthenticated requests.
- **Status:** `Mitigated`
- **Mitigation:** System prioritizes the offline cache (`backend/data/cve_cache.json`) for known common services before making external calls, and gracefully handles HTTP 429 errors by returning cached signatures. Users can configure an `NVD_API_KEY` in `Settings.jsx` or `.env`.
