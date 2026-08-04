# Sentinel-AI Project Memory & Development Context

## Project Name
**Sentinel-AI**

---

## Project Description
Sentinel-AI is an autonomous AI cybersecurity investigation agent that analyzes network scans, identifies vulnerabilities, correlates security findings, builds multi-stage attack paths, and provides explainable SOC intelligence with actionable remediation guidance.

The system features dual execution modes:
1. **Deterministic Cybersecurity Pipeline:** Structured multi-stage scan analysis engine (Parsing → Rules → Risk → Correlation → Attack Chains → Graph → Report).
2. **Autonomous LangGraph AI Agent:** Goal-driven autonomous investigation engine capable of dynamic tool calling, offline/online CVE correlation, MITRE ATT&CK mapping, memory delta tracking, and interactive Q&A via *Ask Sentinel*.

---

## Current Technology Stack

### Frontend
- **Framework:** React 19 (`react`, `react-dom`)
- **Build Tool:** Vite 8
- **Routing:** React Router DOM v7
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`, `postcss`, `autoprefixer`, `tailwind-merge`, `clsx`)
- **Graph Visualization:** React Flow (`@xyflow/react`)
- **Charts & Metrics:** Recharts
- **Icons:** Lucide React

### Backend
- **Runtime:** Python 3.11+
- **API Framework:** FastAPI 0.115+ with ASGI Uvicorn
- **Database:** SQLite (`backend/data/investigations.db` / `investigations` table)
- **Data Validation & Serialization:** Pydantic & Python standard libraries

### AI System
- **Agent Workflow:** LangGraph autonomous state machine (`agent/graph.py`)
- **Agent Controller:** Async task orchestrator & state manager (`agent/agent_controller.py`)
- **AI Planner:** Dynamic investigation task scheduler (`agent/nodes/planner_node.py`)
- **Tool Execution System:** Security tool invocations (`agent/nodes/tool_node.py` & `agent/tools/`)
- **Reasoning Engine:** 5-point explainability generator (`agent/nodes/reasoning_node.py`)
- **Memory Engine:** SQLite investigation comparison & delta tracking (`agent/nodes/memory_node.py` & `agent/memory.py`)
- **Q&A Engine:** Context-aware explanation assistant (`agent/ask_sentinel.py`)

---

## Current Architecture

### 1. Upload Scan Pipeline (Deterministic)
```
Raw Nmap Upload
       ↓
Nmap Parser (ai/parser/nmap_parser.py)
       ↓
Rule Engine (ai/rule_engine/rules.py)
       ↓
Knowledge Base & CVE Enricher (ai/knowledge_base/kb.py)
       ↓
Risk Engine (ai/risk_engine/risk_calculator.py)
       ↓
Correlation Engine (ai/correlation_engine/correlator.py)
       ↓
Attack Chain & Graph Builder (ai/attack_chain_builder/builder.py & ai/investigation_graph/builder.py)
       ↓
LLM Analyzer & Report Generator (ai/llm/analyzer.py & ai/report_generator/generator.py)
       ↓
SQLite Storage (database/models.py)
```

### 2. AI SOC Agent Pipeline (Autonomous)
```
User Goal & Scan Data
       ↓
Agent Controller (agent/agent_controller.py)
       ↓
LangGraph Planner (agent/nodes/planner_node.py)
       ↓
Security Tools Execution (agent/nodes/tool_node.py)
  ├── Nmap Analysis Tool (agent/tools/nmap_analysis_tool.py)
  ├── Vulnerability Lookup Tool (agent/tools/vulnerability_lookup_tool.py)
  ├── Risk Analysis Tool (agent/tools/risk_analysis_tool.py)
  ├── Attack Graph Tool (agent/tools/attack_graph_tool.py)
  ├── Threat Intelligence Tool (agent/tools/threat_intelligence_tool.py)
  └── Report Generation Tool (agent/tools/report_generation_tool.py)
       ↓
Reasoning Engine (agent/nodes/reasoning_node.py)
  └── Produces 5-point breakdown: Finding, Reason, Evidence, Impact, Recommendation
       ↓
Memory Engine (agent/nodes/memory_node.py & agent/memory.py)
  └── Compares historical scans, identifies deltas, detects opened/closed ports
       ↓
Final SOC Report & Interactive Ask Sentinel Interface
```

---

## Current Features

### Completed Features:
- ✅ **Nmap Parsing:** Robust parsing of ports, protocols, services, versions, and active hosts.
- ✅ **Risk Calculation:** Dynamic severity scoring (Critical, High, Medium, Low, Info) and overall risk assessment.
- ✅ **Attack Graph Generation:** Visual interactive attack paths and node relationships using `@xyflow/react`.
- ✅ **Attack Chains Analysis:** Multi-stage threat progression (Reconnaissance → Initial Access → Exploitation → Lateral Movement).
- ✅ **AI SOC Agent Console:** Real-time timeline tracker, tool invocation status, finding cards, and interactive interface.
- ✅ **Hybrid CVE Lookup System:** Local fast lookup cache (`backend/data/cve_cache.json`) with automated NVD API fallback.
- ✅ **MITRE ATT&CK Mapping:** Automatic correlation of exposed ports and services to MITRE ATT&CK techniques.
- ✅ **5-Point Explainable AI Reasoning:** Structured findings with Finding, Root Cause Why, Evidence, Impact, and Remediation.
- ✅ **Investigation Summary & Metrics:** High-level executive KPI cards and SOC risk distribution.
- ✅ **Audit Decision Logs:** Transparent step-by-step reasoning logs with confidence metrics and processing times.
- ✅ **Remediation Dashboard:** Prioritized fix recommendations with actionable commands and validation guidance.
- ✅ **SQLite Investigation Persistence:** Complete investigation storage ensuring state survives backend restarts.
- ✅ **Ask Sentinel Assistant:** Contextual interactive security Q&A for deep dive investigation queries.

---

## Important Development Rules

### Never:
- ❌ Replace the current architecture.
- ❌ Remove or break the existing deterministic cybersecurity pipeline.
- ❌ Break working frontend pages or UI component contracts.
- ❌ Alter or remove existing REST APIs unnecessarily.
- ❌ Delete working features or test coverage.

### Always:
- ✅ Make minimal, clean, and incremental changes.
- ✅ Maintain complete backward compatibility with existing endpoints and data schemas.
- ✅ Test backend and frontend changes before declaring tasks complete (`python backend/tests/test_agent_system.py`).
- ✅ Keep documentation ([CHANGELOG.md](file:///c:/Users/lenovo/Documents/oblivion/CHANGELOG.md), [TASKS.md](file:///c:/Users/lenovo/Documents/oblivion/TASKS.md), [BUGS.md](file:///c:/Users/lenovo/Documents/oblivion/BUGS.md)) updated.
