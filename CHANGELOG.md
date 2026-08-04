# Changelog

All notable changes to Sentinel-AI will be documented in this file.

---

## Current Version — v1.0.0 (Build 2026.08.01)

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
- **Dynamic Risk Engine & Score Calculation (BUG-008):** Replaced static hardcoded risk score calculation (92) with a dynamic risk algorithm in `backend/ai/risk_engine/risk_calculator.py`. Calculates scores and risk categories based on finding severities, CVSS vectors, sensitive port exposure, and attack path progression. Updated `risk_analysis_tool.py`, `agent_controller.py`, `main.py`, and `builder.py` to route all risk dashboard APIs through the dynamic engine. Added automated verification Test 8 in `backend/tests/test_agent_system.py`.
- **Attack Chain Visualization Quality &amp; Evidence Model (BUG-009):** Fixed duplicate entry nodes and enriched the attack path data model to a complete SOC-grade multi-layer relationship model (`Asset → Service → Finding → CVE → MITRE Technique → Attack Stage → Remediation`). Attached structured evidence telemetry (`Host`, `Port`, `Service`, `Version`, `CVE`, `Severity`), granular remediation metadata (`Fix action`, `Related vulnerability`, `Priority`, `Reason`), and confidence scoring/level indicators across `AttackChains.jsx` and `AttackPathViewer.jsx`.
- **Investigation Graph Clutter &amp; Layer Mixing (BUG-010):** Resolved cluttered nodes with excessive text, mixed technical/attack journeys, un-grouped host relationships, and edge label noise. Refactored `backend/ai/investigation_graph/builder.py` and `frontend/src/pages/InvestigationGraph.jsx` with separated layer partitions, compact cards, hierarchical host grouping, selective transition labels, and enriched CVE vulnerability nodes.
- **PDF Print Layout Cropping (BUG-011):** Fixed PDF/print export where the generated output was cropped and included the sidebar, navbar, and dashboard chrome. Applied `@page { size: A4 portrait; margin: 12mm 15mm; }` in `App.css`, added `no-print` wrapper divs in `DashboardLayout.jsx` to hide `<Sidebar>` and `<TopNavbar>`, added `overflow: visible` layout unwrap rules for `h-screen`/`flex-1` containers, added `break-inside: avoid` page-break prevention on report cards/finding cards, and annotated all six report sections in `Reports.jsx` (`report-section`, `report-card`, `finding-card`, `mitre-card`) with matching print CSS classes.


### Pending improvements:
- **Local LLM / Ollama Support:** Add native support for local open-weight security models (e.g., DeepSeek-R1, Llama 3) for fully air-gapped deployments.
- **Multi-Tenant Memory Isolation:** Implement user- and organization-scoped memory indexing in SQLite.
- **Direct Live Network Scanning:** Support direct authenticated Nmap execution from the UI in addition to text upload.
- **Export Formats:** Add direct PDF and STIX 2.1 threat intelligence export capabilities.
