# Active Tasks

This document tracks active development tasks, priority queues, and completed milestones for Sentinel-AI.

---

## High Priority:
- [ ] **Local LLM / Ollama Backend Provider:** Add support for running offline inference using Ollama or local HuggingFace/vLLM endpoints for air-gapped environments.
- [ ] **Direct Scanner Execution:** Enable authorized live Nmap scan execution directly through backend job queues (with strict target validation and authorization checks).
- [ ] **WebSocket / SSE Stream for Agent Events:** Replace HTTP polling in `AgentConsole.jsx` with Server-Sent Events (SSE) or WebSockets for instant sub-second step updates.

---

## Medium Priority:
- [ ] **Export to PDF & STIX 2.1:** Enable one-click export of executive security summaries and MITRE ATT&CK mappings into industry-standard STIX/TAXII formats and formatted PDF documents.
- [ ] **Multi-Tenant Investigation Indexing:** Add project/workspace separation in SQLite database to allow organizing scans by client or network segment.
- [ ] **Automated Remediation Script Generation:** Provide downloadable Ansible playbooks, Bash scripts, or Terraform hardening snippets directly in the Remediation tab.
- [ ] **Custom Rule Editor:** Allow SOC analysts to define custom security rules and CVE threshold alerts through the UI Settings page.

---

## Low Priority / Backlog:
- [ ] **Dark/Light Theme Toggle:** Add user preference persistence for dashboard themes.
- [ ] **Historical Trend Analytics:** Add multi-scan security score trajectory charts over weeks/months.
- [ ] **Integration with SIEMs:** Webhook integrations for Splunk, Elastic Security, and Microsoft Sentinel.

---

## Completed:
- [x] **Autonomous LangGraph Agent Engine:** Built autonomous state machine with Planner, Tool, Reasoning, and Memory nodes.
- [x] **Autonomous Agent Security Tools:** Implemented tools for Nmap parsing, CVE lookup, risk scoring, attack graph construction, threat intelligence, and reporting.
- [x] **Hybrid CVE Lookup Service:** Implemented offline JSON cache with online NVD fallback.
- [x] **MITRE ATT&CK Mapping:** Automated technique correlation for exposed services and vulnerabilities.
- [x] **Explainable 5-Point AI Reasoning:** Formatted findings with Finding, Root Cause, Evidence, Impact, and Remediation.
- [x] **Interactive SOC Agent Console UI:** Created dedicated React console with timeline, finding cards, attack path viewer, and reasoning logs.
- [x] **SQLite State Persistence:** Added database models and schema migration for full investigation state persistence across restarts.
- [x] **Ask Sentinel Interactive Q&A:** Implemented conversational security assistant for contextual follow-up questions.
- [x] **Automated Verification Test Suite:** Added end-to-end integration tests in `backend/tests/test_agent_system.py`.
- [x] **Decision Log & Summary Data Flow (BUG-006):** Fixed 0-value display in Decision Log by calculating rich summary statistics (`servicesDiscovered`, `evidenceCollected`, `findingsGenerated`, `attackChainsBuilt`, `mitreTechniquesMapped`, `decisionCount`) and generating structured 6-stage decision cards in agent status and REST endpoint.
- [x] **Investigation Graph Multi-Entity Mapping (BUG-007):** Resolved 0-count graph filters by adding complete node and edge generation for Asset, Service, Finding, CVE, MITRE, Attack Chain, and Remediation entities across `builder.py`, `attack_graph_tool.py`, `agent_controller.py`, and frontend graph components.
- [x] **SOC-Grade Attack Path & Intelligence Engine:** Upgraded attack chain engine (`attack_chain_builder/builder.py`, `investigation_graph/builder.py`, `agent_controller.py`, `AttackChains.jsx`, `AttackPathViewer.jsx`) with evidence-based MITRE ATT&CK journeys (`Internet Exposure → Initial Access → Privilege Escalation → Lateral Movement → Sensitive Data Exposure`), dynamic confidence propagation, attack path risk scoring, actionable narrative explanations, and full `Asset → Service → Vulnerability → CVE → MITRE → Attack Path → Remediation` graph relationship mapping.
- [x] **Dynamic Risk Engine & Score Calculation (BUG-008):** Implemented dynamic multi-factor risk scoring in `risk_calculator.py` integrating finding severity distribution, CVSS vectors, sensitive port exposure, and attack path depth. Removed all hardcoded static scores (e.g. 92) and verified dynamic scoring with automated Test 8 in `backend/tests/test_agent_system.py`.
- [x] **Attack Chain Visualization Quality & Single Journey Mapping (BUG-009):** Eliminated duplicate Internet Exposure nodes, integrated structured evidence fields (`Host`, `Port`, `Service`, `Version`, `CVE`, `Severity`), attached technical remediations (`Fix action`, `Related vulnerability`, `Priority`, `Reason`), propagated confidence metrics, and refreshed UI node badges and legend in `AttackChains.jsx` and `AttackPathViewer.jsx`.
- [x] **Investigation Graph Visualization & Layer Separation (BUG-010):** Separated Technical Layer (`Asset → Service → Finding → CVE → MITRE → Remediation`) and Attack Layer (`Internet Exposure → Initial Access → Privilege Escalation → Lateral Movement → Data Exposure`), implemented compact node cards (`Name`, `Severity`, `Confidence`), host-grouped hierarchy layout, selective edge transition labeling, and enriched CVE nodes (`CVE ID`, `Severity`, `Impact`, `Confidence`).
- [x] **AI SOC Agent Console UX Polish:** Upgraded `AgentConsole.jsx` with enlarged scan editor (`min-h-[220px]`), compact SOC layout, 4-step autonomous workflow explanation cards, suggested goal chips, sample scan loader profiles, and dynamic progress bar with disabled execution states.
- [x] **Floating Ask Sentinel AI Copilot Drawer:** Implemented persistent floating trigger button and sliding side panel (`AskSentinelDrawer.jsx`) in `AgentConsole.jsx` featuring real-time active investigation context indicators, conversation history, verified evidence tags, remediation callouts, and 1-click suggested inquiry chips without cluttering or removing the autonomous agent reasoning audit log.
