# Sentinel-AI: Autonomous AI Security Investigation Agent 🛡️

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11%2B-blue.svg)
![React](https://img.shields.io/badge/react-19.0-61DAFB.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)
![LangGraph](https://img.shields.io/badge/LangGraph-Autonomous-purple.svg)
![Supabase](https://img.shields.io/badge/Supabase-Production-emerald.svg)

> **Sentinel-AI is an autonomous AI Security Operations Center (SOC) investigation agent that ingests network telemetry, checks vulnerability databases, synthesizes multi-stage attack paths, and delivers 5-point explainable security intelligence with prioritized remediation guidance.**

---

## 📖 Table of Contents
- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Proposed Solution](#-proposed-solution)
- [Key Features](#-key-features)
- [AI Agent Architecture](#-ai-agent-architecture)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [AI Models and Algorithms Used](#-ai-models-and-algorithms-used)
- [Workflow](#-workflow)
- [Project Structure](#-project-structure)
- [Installation and Setup](#-installation-and-setup)
- [Running the Application](#-running-the-application)
- [Usage Guide](#-usage-guide)
- [Screenshots / Demo](#-screenshots--demo)
- [Security Implementation](#-security-implementation)
- [Testing and Validation](#-testing-and-validation)
- [Assumptions](#-assumptions)
- [Limitations](#-limitations)
- [Future Enhancements](#-future-enhancements)
- [Research and Innovation](#-research-and-innovation)
- [Comparison With Existing Systems](#-comparison-with-existing-systems)
- [Contributors](#-contributors)
- [License](#-license)

---

## 📖 Overview

### What is Sentinel-AI?
**Sentinel-AI** is an autonomous AI SOC analyst agent designed to bridge the gap between raw, unformatted network security scans (e.g. Nmap output) and high-level, actionable security intelligence. Built on an autonomous **LangGraph** agent state machine, Sentinel-AI coordinates specialized security tools, conducts hybrid offline/online CVE enrichments, correlates findings with MITRE ATT&CK techniques, and builds multi-stage attack graphs.

### Main Objective
The primary objective of Sentinel-AI is to automate the time-consuming manual tasks involved in security triage: parsing scan outputs, looking up software version vulnerabilities, mapping techniques to attack frameworks, evaluating cross-host attack paths, and writing structured remediation reports.

### What Problem the AI Agent Solves
Security Operations Centers (SOCs) and security analysts suffer from severe alert fatigue and high mean-time-to-respond (MTTR). Scanning tools output thousands of lines of raw text containing service strings and port numbers. Analysts must manually cross-reference each version with vulnerability databases (NVD/CVE), figure out if services interact, evaluate potential movement across hosts, and construct a cohesive threat narrative. Sentinel-AI automates this entire lifecycle autonomously.

### Target Users
- **SOC Analysts & Incident Responders:** Accelerated initial triage and evidence correlation.
- **Penetration Testers & Red Teams:** Rapid identification of exploitable attack chains across network targets.
- **DevSecOps & System Administrators:** Actionable, prioritized remediation steps to patch vulnerable services quickly.
- **Security Researchers & Executives:** Clear 5-point explainable intelligence and print-optimized PDF reports.

### Why an AI Agent-Based Approach is Required
Traditional static rule engines are brittle—they fail when encountering novel output formats, compound version strings, or complex cross-service dependencies. Pure LLMs without tools hallucinate CVE scores, invent fake software vulnerabilities, or recommend impossible fixes. An **autonomous AI agent state machine** with deterministic tool access solves both problems: the agent uses LLM reasoning for context interpretation and task planning, while relying on deterministic algorithms and verified database tools for CVE lookups, risk math, and graph generation.

---

## 🎯 Problem Statement

### Existing Problems in Current Systems
1. **Voluminous Raw Outputs:** Network scanners like Nmap provide rich telemetry, but in unstructured text format that requires tedious manual inspection.
2. **Alert Fatigue & Disconnected Data:** Telemetry (ports/services), vulnerability records (CVE/CVSS), threat actor frameworks (MITRE ATT&CK), and fix scripts exist in completely separate silos.
3. **Manual CVE Correlation:** Analysts spend hours searching vulnerability databases for specific version strings (e.g. `OpenSSH 8.9p1`, `Apache httpd 2.4.49`), often missing critical CVEs or misinterpreting CVSS scores.
4. **Lack of Explainability:** Off-the-shelf automated security tools often generate black-box "Risk Scores" without explaining *why* a risk exists or *how* an attacker can exploit it.
5. **Slow Remediation Lifecycle:** Without prioritized, command-level hardening steps, IT teams delay patches due to uncertainty over operational impact.

---

## 💡 Proposed Solution

### How Sentinel-AI Solves the Problem
Sentinel-AI introduces an autonomous AI agent loop that receives network scan telemetry, formulates an execution plan, invokes specialized security tools, and performs structured evidence synthesis. 

### How the AI Agent Works
1. **Ingest & Parse:** The agent ingests raw text or XML scan data and uses deterministic tools (`nmap_analysis_tool`) to extract active IP hosts, open ports, service protocols, and version strings.
2. **Hybrid CVE Enrichment:** The agent queries a local offline signature database (`cve_cache.json`) for speed and reliability, falling back to the NIST NVD API for online lookups (`vulnerability_lookup_tool`).
3. **Threat Mapping:** Findings are correlated against MITRE ATT&CK techniques (`threat_intelligence_tool`).
4. **Attack Graph Synthesis:** The agent evaluates host topology to construct multi-stage attack paths (`Internet Exposure → Initial Access → Privilege Escalation → Lateral Movement → Sensitive Data Exposure`).
5. **5-Point Explainable Output:** Every finding is formatted into a 5-point explainable structure (Finding Title, Root Cause Why, Verified Evidence, Exploitation Impact, Hardening Recommendation).

---

## ✨ Key Features

### 1. Autonomous LangGraph Agent Engine
- **What it does:** Executes multi-node security workflows (Planner → Tools → Reasoning → Memory) without human intervention.
- **AI Involvement:** Uses LLM reasoning for task decomposition and next-step decisions.
- **Technical Implementation:** Implemented in `backend/agent/graph.py` using LangGraph compiled state graph.
- **User Benefit:** Replaces multi-tool manual workflows with single-click autonomous execution.

### 2. Hybrid CVE Lookup Engine
- **What it does:** Checks software version strings for known vulnerabilities.
- **AI Involvement:** Version string normalizers and low-confidence fallback downscaling.
- **Technical Implementation:** Offline lookup via `backend/data/cve_cache.json` with online NVD REST API fallback (`services/cve_lookup.py`).
- **User Benefit:** Works seamlessly in both online and air-gapped environments.

### 3. SOC-Grade Attack Path & MITRE Journey Builder
- **What it does:** Constructs multi-stage threat progression paths with confidence metrics.
- **AI Involvement:** Evaluates prerequisite rules and threat actor movement likelihood.
- **Technical Implementation:** Graph engine in `backend/ai/attack_chain_builder/builder.py` mapping MITRE techniques (T1190, T1078, T1021, T1040).
- **User Benefit:** Visualizes exact attacker movement routes rather than isolated alert lists.

### 4. Dual-Layer Investigation Graph Visualization
- **What it does:** Renders interactive network taxonomy split into **Technical Layer** and **Attack Layer**.
- **AI Involvement:** Maps node-link entity relationships dynamically.
- **Technical Implementation:** ReactFlow rendering engine in `frontend/src/pages/InvestigationGraph.jsx` with host-grouped hierarchical depth algorithms.
- **User Benefit:** Toggles between deep technical relationships and high-level threat journeys instantly.

### 5. Ask Sentinel AI Security Copilot
- **What it does:** Persistent side-drawer assistant for contextual follow-up questions.
- **AI Involvement:** Context-aware LLM Q&A engine (`agent/ask_sentinel.py`) bound to current scan findings.
- **Technical Implementation:** Sliding drawer UI (`AskSentinelDrawer.jsx`) rendering Markdown responses, evidence tags, and remediation callouts.
- **User Benefit:** Interrogates scan results interactively ("Why is SSH on port 22 high risk?").

### 6. Pluggable Database Repository Architecture
- **What it does:** Persists investigation state across server restarts and multi-tenant sessions.
- **AI Involvement:** Structured state serialization (`full_state`).
- **Technical Implementation:** Repository pattern in `backend/database/` supporting **Supabase** (Default Cloud Production via SDK) and **SQLite** (Offline Fallback).
- **User Benefit:** Enterprise-grade cloud production stability with offline capability.

---

## 🤖 AI Agent Architecture

### Architecture Layers
1. **User Input Layer:** Ingests raw Nmap scan output or natural language investigation goals.
2. **Agent Planning Layer (`planner_node.py`):** Formulates step-by-step execution plans and selects appropriate tools.
3. **Tool/API Integration Layer (`tool_node.py`):** Invokes deterministic security tools (Nmap Parser, CVE Database, MITRE Mapper, Risk Calculator, Graph Generator).
4. **Reasoning & Decision Layer (`reasoning_node.py`):** Synthesizes tool outputs, checks confidence bounds, and formats 5-point explainable intelligence.
5. **Knowledge & Data Layer (`memory_node.py` & `database/`):** Compares historical posture deltas and persists `full_state` in Supabase/SQLite.
6. **Output Generation Layer:** Delivers real-time timeline, interactive graphs, decision audit logs, and PDF security reports.

### Architecture Diagram

```
                             +-----------------------+
                             |       User Input      |
                             | (Raw Scan / AI Goal)  |
                             +-----------+-----------+
                                         |
                                         v
                             +-----------------------+
                             |   React SOC Console   |
                             |   (Frontend App)      |
                             +-----------+-----------+
                                         |  REST API
                                         v
                             +-----------------------+
                             |  FastAPI Endpoints    |
                             |    (main.py)          |
                             +-----------+-----------+
                                         |
                                         v
                             +-----------------------+
                             | InvestigationRepository|
                             | (database/repository) |
                             +-----+-----------+-----+
                                   |           |
               +-------------------+           +-------------------+
               |                                                   |
               v                                                   v
    +--------------------+                               +--------------------+
    |   SupabaseAdapter  |                               |   SQLiteAdapter    |
    | (Default Prod SDK) |                               | (Offline Fallback) |
    +--------------------+                               +--------------------+
               |                                                   |
               +-------------------+-----------+-------------------+
                                   |
                                   v
                             +-----------------------+
                             | LangGraph Agent Controller|
                             +-----------+-----------+
                                         |
            +----------------------------+----------------------------+
            |                            |                            |
            v                            v                            v
  +------------------+         +------------------+         +------------------+
  |  Planner Node    | ------> |   Tool Node      | ------> | Reasoning Node   |
  | (Task Scheduler) |         | (6 Security Tools)|        | (5-Point AI Expl)|
  +------------------+         +------------------+         +------------------+
                                         |                            |
                                         v                            v
                               +------------------+         +------------------+
                               | Hybrid CVE Database|       | Memory Node      |
                               | (Offline + NVD API)|       | (Posture Deltas) |
                               +------------------+         +------------------+
```

---

## 🏛️ System Architecture

### Frontend Architecture
- **Framework:** React 19.0 with Vite bundler.
- **Routing:** React Router v7 (`/app/agent-console`, `/app/overview`, `/app/findings`, `/app/attack-chains`, `/app/graph`, `/app/decision-log`, `/app/risk`, `/app/remediation`, `/app/reports`).
- **Styling:** Vanilla CSS design tokens with Tailwind CSS utility components.
- **Visualization:** ReactFlow graph rendering engine with dynamic layout math.

### Backend Architecture
- **Framework:** FastAPI 0.115 running on Python 3.11+.
- **Web Server:** Uvicorn ASGI production server.
- **Services Layer:** Modular service pattern (`services/cve_lookup.py`, `services/remediation.py`, `ai/risk_engine/risk_calculator.py`).

### AI Layer Architecture
- **Orchestration:** LangGraph state machine (`backend/agent/graph.py`).
- **LLM Engine:** OpenAI `gpt-4o-mini` (or configurable local model fallback).
- **Prompt Engineering:** Few-shot role-based system prompts enforcing strict evidence output constraints.
- **Safety Guards:** Cautious language formatting ("may permit" vs "will permit") and missing `user_id` execution rejection.

### Database Layer Architecture
- **Pattern:** Repository Pattern (`InvestigationRepository`).
- **Default Production Database:** **Supabase** via `supabase-py` SDK.
- **Offline Fallback Database:** SQLite (`backend/data/investigations.db`) with auto-migration.
- **Multi-Tenant Scoping:** All queries strictly scoped by authenticated `user_id`.

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend Framework** | React 19.0 | Single-page SOC application UI |
| **Build System** | Vite 6.0 | Fast frontend bundler and dev server |
| **Styling** | Vanilla CSS + Tailwind CSS | Custom cybersecurity design system |
| **Graph Visualization** | ReactFlow | Interactive node-link attack graph rendering |
| **Backend Framework** | FastAPI 0.115 | Asynchronous REST API server |
| **Language** | Python 3.11+ | Backend application logic |
| **Agent Orchestration**| LangGraph | Autonomous state graph engine |
| **LLM Model** | OpenAI gpt-4o-mini | Planning, reasoning, and Q&A copilot |
| **Primary DB Engine** | Supabase (PostgreSQL) | Cloud production persistence & auth |
| **Fallback DB Engine**| SQLite 3 | Offline local storage fallback |
| **Threat Intelligence**| NIST NVD API + MITRE ATT&CK | Vulnerability lookup and technique mapping |
| **Testing** | Custom Async Verification Suite | Automated 12-test validation suite |

---

## 🔬 AI Models and Algorithms Used

### 1. LangGraph State Machine
- **Why Selected:** Traditional chain-of-thought loops lack state persistence and explicit control flow. LangGraph provides cycles, state accumulation, and deterministic tool node dispatching.
- **How it Works:** Maintains an `AgentState` object containing `scan_data`, `discovered_hosts`, `vulnerabilities`, `selected_tools`, `decision_log`, and `final_report`. Cycles through `planner -> tool_node -> reasoning -> memory`.

### 2. Hybrid Version Matching Algorithm
- **Why Selected:** Software version strings in raw Nmap output contain noise (e.g. `OpenSSH 8.9p1 Ubuntu 3ubuntu0.1`).
- **How it Works:** Uses regular expressions to extract semantically meaningful version boundaries, normalizes compound ranges (`X to Y`, `< Z`), and performs exact/range comparisons against `cve_cache.json`.

### 3. Dynamic Multi-Factor Risk Algorithm
- **Why Selected:** Static risk scores do not reflect actual exploitability or network context.
- **How it Works:** `risk_calculator.py` computes an overall score based on:
  $$\text{Score} = f(\text{CVSS Max}, \text{Critical Count}, \text{Sensitive Ports Exposed}, \text{Attack Path Depth})$$

### 4. MITRE ATT&CK Evidence Correlation Engine
- **Why Selected:** Prevents ungrounded, hallucinated threat mappings.
- **How it Works:** Maps service/port telemetry directly to verified MITRE techniques (`T1190` for Exploit Public App, `T1078` for Valid Accounts, `T1021` for Remote Services, `T1040` for Data Exposure) only when backed by explicit telemetry findings.

---

## 🔄 Workflow

```
[Step 1: Ingestion]
  User uploads raw Nmap scan output or selects a sample target profile in AgentConsole.jsx.
        |
        v
[Step 2: Autonomous Planning]
  LangGraph Planner Node inspects goal and schedules nmap_analysis_tool and vulnerability_lookup_tool.
        |
        v
[Step 3: Tool Execution & Enrichment]
  nmap_analysis_tool parses IP/ports; vulnerability_lookup_tool checks cve_cache.json & NVD API.
        |
        v
[Step 4: Threat & Risk Synthesis]
  risk_analysis_tool calculates dynamic CVSS risk vectors; attack_graph_tool builds MITRE journeys.
        |
        v
[Step 5: Reasoning & Explainability]
  Reasoning Node formats findings into 5-point explainable structures with hardening steps.
        |
        v
[Step 6: State Persistence & Hydration]
  Memory Node compares posture deltas; InvestigationRepository persists full_state to Supabase/SQLite.
        |
        v
[Step 7: Dashboard Delivery]
  UI displays real-time timeline, interactive attack graphs, decision audit cards, and PDF report.
```

---

## 📁 Project Structure

```
Sentinel-AI/
├── backend/
│   ├── agent/                    # Autonomous LangGraph Agent System
│   │   ├── nodes/                # Planner, Tool, Reasoning, Memory Nodes
│   │   ├── tools/                # 6 Security Agent Tools
│   │   ├── agent_controller.py   # Autonomous Controller Entrypoint
│   │   ├── ask_sentinel.py       # Ask Sentinel Q&A Copilot Engine
│   │   └── graph.py              # LangGraph State Machine Definition
│   ├── ai/                       # Deterministic Cybersecurity Engines
│   │   ├── attack_chain_builder/ # SOC-Grade Attack Path & MITRE Engine
│   │   ├── investigation_graph/  # Dual-Layer Graph Taxonomy Builder
│   │   ├── knowledge_base/       # Consolidated MITRE Mappings
│   │   ├── nmap_parser/          # Raw Nmap Telemetry Parser
│   │   ├── risk_engine/          # Dynamic Risk Scoring Calculator
│   │   └── rule_engine/          # Vulnerability Correlation Rules
│   ├── database/                 # Pluggable Repository Pattern
│   │   ├── adapter.py            # Abstract Base Database Adapter
│   │   ├── repository.py         # InvestigationRepository Singleton
│   │   ├── sqlite_adapter.py     # SQLite Database Adapter
│   │   └── supabase_adapter.py   # Supabase SDK Database Adapter
│   ├── services/                 # Business Logic Services
│   │   ├── cve_lookup.py         # Hybrid CVE Engine
│   │   └── remediation.py        # Remediation Step Builder
│   ├── tests/                    # Integration Verification Suite
│   │   └── test_agent_system.py  # Automated 12-Test Suite
│   ├── utils/                    # Shared Utilities (Logger, Helpers)
│   ├── config.py                 # Configuration & Environment Handler
│   ├── auth.py                   # JWT & Demo Authentication Handler
│   └── main.py                   # FastAPI Application Entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/           # UI Components (Sidebar, TopNavbar, Graph)
│   │   ├── context/              # AuthContext & InvestigationContext
│   │   ├── pages/                # AgentConsole, Findings, AttackChains, etc.
│   │   ├── App.jsx               # React Router Root Component
│   │   └── main.jsx              # React Entrypoint
│   ├── package.json              # Frontend Dependencies
│   └── vite.config.js            # Vite Configuration
├── README.md                     # Technical Documentation
└── SECURITY.md                   # Security Policy & Isolation Rules
```

---

## ⚙️ Installation and Setup

### Prerequisites
- **Python:** 3.11 or higher
- **Node.js:** 18.0 or higher
- **Git:** Installed on system

### Clone Repository
```bash
git clone https://github.com/rohnroy0/Sentinel-AI.git
cd Sentinel-AI
```

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd ../frontend

# Install npm dependencies
npm install
```

### Environment Variables
Create `.env` file in `backend/`:
```env
# Default Production Configuration
DATABASE_ENGINE=supabase
AUTH_MODE=supabase

# Supabase Credentials
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Optional LLM & API Keys
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
NVD_API_KEY=your-nvd-api-key

# Offline Fallback Database Path
DATABASE_PATH=./data/investigations.db
```

---

## 🚀 Running the Application

### 1. Start Backend Server
```bash
cd backend
# Windows virtual environment:
venv\Scripts\activate
python main.py
```
- **API URL:** `http://localhost:8000`
- **Swagger Docs:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/health`

### 2. Start Frontend Server
```bash
cd frontend
npm run dev
```
- **Application URL:** `http://localhost:5173`

---

## 📖 Usage Guide

### Realistic Scenario Walkthrough
1. **Login:** Open `http://localhost:5173`. In Demo Mode, click **Enter Demo Console (Isolated Session)**.
2. **Launch Agent Investigation:** Navigate to **AI Agent Mode** (`/app/agent-console`). Select the **Multi-Service Enterprise Network** sample profile or paste a custom Nmap scan output.
3. **Execute:** Click **Run Autonomous Agent Investigation**.
4. **Monitor Timeline:** Watch real-time execution steps (`Parsing scan output`, `Checking CVE database`, `Building attack graph`, `Synthesizing report`).
5. **Inspect Findings:** Review 5-point explainable cards with verified evidence and hardening commands.
6. **Visualize Attack Graph:** Navigate to **Investigation Graph** (`/app/graph`) to toggle between **Technical Layer** and **Attack Layer**.
7. **Ask Sentinel:** Click the floating **Ask Sentinel** button in the bottom-right corner to ask contextual questions (*"Which vulnerability poses the highest lateral movement risk?"*).

---

## 🖼️ Screenshots / Demo

| View | Description |
|---|---|
| **Login Page** | Modern 2-column SOC authentication page with animated telemetry visualizer. |
| **Agent Console** | Autonomous timeline, interactive finding cards, and reasoning log audit cards. |
| **Investigation Graph** | Dual-layer visualization with host-grouped hierarchical tree rendering. |
| **Attack Chains** | SOC-grade multi-stage threat progression visualizer (`T1190 -> T1078 -> T1021`). |
| **Risk Dashboard** | Dynamic risk calculator metrics, severities distribution, and port exposure lists. |
| **Executive Reports** | Print-optimized security report generator with A4 page-break handling. |

---

## 🔒 Security Implementation

- **Multi-Tenant User Isolation:** Every investigation state is strictly bound to `user_id`. Queries missing `user_id` are rejected immediately.
- **Isolated Session Demo Identities:** In Demo Mode, temporary session IDs (`demo-user-{uuid}`) are generated per session to prevent data leakage between evaluators.
- **Secret Hygiene:** API keys and service tokens are managed exclusively via environment variables and loaded through `backend/config.py`. Zero static secrets in git repository.
- **Input Validation:** Raw inputs are parsed safely via regex boundaries and sanitized before processing.

---

## 🧪 Testing and Validation

Sentinel-AI includes an automated 12-test integration test suite in `backend/tests/test_agent_system.py`:

```bash
# Execute verification test suite
backend\venv\Scripts\python.exe backend/tests/test_agent_system.py
```

### Verification Test Summary
- ✅ **TEST 1:** Autonomous Mock Nmap Investigation & LangGraph workflow execution.
- ✅ **TEST 2:** Offline CVE Cache lookup & NVD API fallback.
- ✅ **TEST 3:** Memory Delta cross-investigation posture comparison.
- ✅ **TEST 4:** Ask Sentinel Q&A Assistant explainability verification.
- ✅ **TEST 5:** REST API Summary & Decision Log data flow validation.
- ✅ **TEST 6:** Investigation Graph Multi-Entity Mapping (`Asset -> Service -> CVE -> MITRE`).
- ✅ **TEST 7:** SOC-Grade Attack Path & MITRE Journey validation.
- ✅ **TEST 8:** Dynamic Risk Dashboard scoring across distinct target profiles.
- ✅ **TEST 9:** Database Adapter & Repository abstraction pattern execution.
- ✅ **TEST 10:** Multi-Tenant User Isolation & missing `user_id` rejection checks.
- ✅ **TEST 11:** Authentication Mode configuration & token parser checks.
- ✅ **TEST 12:** Attack Chain evidence bounds & MITRE stage rules validation.

---

## 📋 Assumptions

1. Ingested scan data adheres to standard Nmap text or XML formatting.
2. When operating online, the NIST NVD API is accessible for un-cached CVE signatures.
3. Users evaluate risks within their authorized network environment bounds.

---

## ⚠️ Limitations

1. **Scan Scope:** Designed primarily for network service discovery scans (Nmap) rather than web application dynamic scanning (DAST).
2. **LLM Dependency for Reasoning:** Narrative synthesis relies on LLM availability (OpenAI API or local Ollama endpoint).
3. **Passive Telemetry:** Analyses static scan telemetry without executing live active exploits against targets.

---

## 🔮 Future Enhancements

- **Local Air-Gapped LLMs:** Native integration with local open-weight models (DeepSeek-R1, Llama 3) via Ollama.
- **Direct Nmap Execution:** Trigger live authenticated network scans directly from the React UI.
- **SIEM Integrations:** Webhook connectors for Splunk, Elastic Security, and Microsoft Sentinel.
- **STIX 2.1 Threat Export:** Export generated attack graphs into standard STIX 2.1 threat intelligence bundles.

---

## 💡 Research and Innovation

Sentinel-AI introduces technical innovation at the intersection of AI agents and cybersecurity:
1. **Grounding AI in Telemetry:** Combines LLM planning with deterministic CVE & MITRE tools to eliminate hallucinated vulnerabilities.
2. **Dual-Layer Graph Visualizer:** Separates granular technical asset relationships from high-level threat journeys to prevent cognitive clutter.
3. **5-Point Explainability Framework:** Standardizes threat intelligence outputs into structured, verifiable evidence fields.

---

## 📊 Comparison With Existing Systems

| Feature / Capability | Traditional Scanners (Nmap, Nessus) | Generic LLM Chatbots | Sentinel-AI (Proposed System) |
|----------------------|------------------------------------|----------------------|-------------------------------|
| **Telemetry Parsing** | Ingests raw scan data | Unstructured text paste | Autonomous structured extraction |
| **CVE Lookup** | Manual database search | Prone to hallucinations | Hybrid offline cache + NVD API |
| **Threat Mapping** | Separate tool correlation | Generic descriptions | Evidence-backed MITRE ATT&CK mapping |
| **Attack Paths** | Isolated alert lists | Text descriptions | Interactive dual-layer visual attack graphs |
| **Explainability** | Hardcoded vulnerability text | Variable quality text | Mandatory 5-point structured reasoning |
| **Remediation** | Generic patch notes | High-level advice | Prioritized, command-level hardening steps |

---

## 👥 Contributors

- **Rohn Roy** — Lead AI & Security Architect ([GitHub](https://github.com/rohnroy0))

---

## 📄 License

Sentinel-AI is open-source software released under the [MIT License](LICENSE). For security policies and vulnerability reporting procedures, see [SECURITY.md](SECURITY.md).
