# Sentinel-AI System Architecture

This document details the architectural layout, internal modules, execution pipelines, data lifecycle, and database schema for Sentinel-AI.

---

## 1. System Overview & Data Lifecycle

Sentinel-AI processes network security scan data through two coordinated execution tracks: a deterministic security analysis pipeline and an autonomous LangGraph AI agent workflow.

### Complete Data Lifecycle
```
                   ┌────────────────────────────────────────┐
                   │               User Input               │
                   │ (Nmap Scan Upload or Autonomous Goal)  │
                   └───────────────────┬────────────────────┘
                                       │
                                       ▼
                   ┌────────────────────────────────────────┐
                   │      Generate Investigation ID         │
                   │          (UUID v4 identifier)          │
                   └───────────────────┬────────────────────┘
                                       │
                                       ▼
                   ┌────────────────────────────────────────┐
                   │    Initial Store in SQLite Database    │
                   │      (backend/data/investigations.db)  │
                   └───────────────────┬────────────────────┘
                                       │
                                       ▼
                   ┌────────────────────────────────────────┐
                   │         Execute Core Analysis          │
                   │   ┌────────────────────────────────┐   │
                   │   │ Option A: Deterministic Engine │   │
                   │   │ Option B: Autonomous Agent     │   │
                   │   └────────────────────────────────┘   │
                   └───────────────────┬────────────────────┘
                                       │
                                       ▼
                   ┌────────────────────────────────────────┐
                   │   Persist Correlated Findings & State  │
                   │   (Findings, Graph, Risk, Audit Logs)  │
                   └───────────────────┬────────────────────┘
                                       │
                                       ▼
                   ┌────────────────────────────────────────┐
                   │  Real-Time UI & Dashboard Updates      │
                   │   (AgentConsole, Risk, Graph, Reports) │
                   └────────────────────────────────────────┘
```

---

## 2. Backend Architecture

```
backend/
├── main.py                     # FastAPI application root & API route definitions
├── config.py                   # Centralized configuration & environment loader
├── database/                   # SQLite database persistence layer
│   ├── db.py                   # Database connection pool & table initializers
│   └── models.py               # Serialization, schema mapping, and query models
├── services/                   # Core cybersecurity services
│   └── cve_lookup.py           # Hybrid CVE search engine (Local JSON cache + NVD API)
├── data/                       # Static & persistent data storage
│   ├── cve_cache.json          # Pre-cached vulnerability signatures
│   └── investigations.db       # SQLite database file
├── agent/                      # Autonomous LangGraph Agent System
│   ├── agent_controller.py     # Agent runtime controller & investigation orchestrator
│   ├── graph.py                # LangGraph StateGraph state machine definition
│   ├── state.py                # AgentState TypedDict definition
│   ├── ask_sentinel.py         # Explainable interactive Q&A assistant
│   ├── memory.py               # Cross-investigation delta & memory comparison engine
│   ├── nodes/                  # LangGraph Workflow Nodes
│   │   ├── planner_node.py     # Investigation step planning node
│   │   ├── tool_node.py        # Tool invocation & execution node
│   │   ├── reasoning_node.py   # 5-point explainability generation node
│   │   └── memory_node.py      # Historical state comparison node
│   └── tools/                  # Callable security tools for the agent
│       ├── nmap_analysis_tool.py       # Port & host extraction tool
│       ├── vulnerability_lookup_tool.py# Version CVE lookup tool
│       ├── risk_analysis_tool.py       # Severity calculation tool
│       ├── attack_graph_tool.py        # Topology & attack path tool
│       ├── threat_intelligence_tool.py # MITRE ATT&CK mapping tool
│       └── report_generation_tool.py   # Summary & executive report tool
├── ai/                         # Deterministic Security Analysis Pipeline
│   ├── parser/                 # Nmap raw text parser
│   ├── rule_engine/            # Security misconfiguration rules
│   ├── knowledge_base/         # Static vulnerability & port KB
│   ├── risk_engine/            # Risk scoring algorithms & metric aggregators
│   ├── correlation_engine/     # Finding correlation & host aggregation
│   ├── attack_chain_builder/   # Multi-stage attack chain synthesis
│   ├── investigation_graph/    # React Flow graph node & edge generator
│   ├── llm/                    # Generative analysis & contextual summaries
│   └── report_generator/       # Executive summary & mitigation compiler
└── tests/                      # Automated test suites
    └── test_agent_system.py    # Autonomous workflow & engine verification tests
```

---

## 3. Frontend Architecture

```
frontend/
├── package.json                # Dependencies (@xyflow/react, recharts, lucide-react, react-router-dom)
├── vite.config.js              # Vite configuration
├── src/
│   ├── main.jsx                # React root application entry point
│   ├── App.jsx                 # Route management and layout configuration
│   ├── index.css               # Global styling and Tailwind directives
│   ├── api/
│   │   └── apiClient.js        # Axios/Fetch API client wrapper for backend endpoints
│   ├── components/             # Reusable UI component library
│   │   ├── TopNavbar.jsx       # Header bar with investigation status & navigation
│   │   ├── Sidebar.jsx         # Main navigation sidebar
│   │   ├── DashboardLayout.jsx # Master page frame
│   │   ├── AgentTimeline.jsx   # Live step-by-step agent workflow progress
│   │   ├── FindingCard.jsx     # 5-point explainable finding card with severity badge
│   │   ├── AttackPathViewer.jsx# Attack chain visualizer
│   │   ├── ReasoningPanel.jsx  # Audit log & step-by-step reasoning panel
│   │   ├── AIInvestigationSummary.jsx # KPI card summary block
│   │   └── EmptyState.jsx      # Placeholder empty states
│   └── pages/                  # Top-level application views
│       ├── AgentConsole.jsx    # Primary Autonomous AI SOC Agent workspace
│       ├── DashboardOverview.jsx# Overview metrics, active investigations, and quick stats
│       ├── UploadScan.jsx      # Raw Nmap text upload interface
│       ├── RiskDashboard.jsx   # CVSS/Risk metric charts, severities, top services
│       ├── InvestigationGraph.jsx # Interactive node-link topology diagram
│       ├── AttackChains.jsx    # Visual multi-stage attack scenarios
│       ├── Findings.jsx        # Tabular and filtered vulnerability catalogue
│       ├── DecisionLog.jsx     # Explainable SOC reasoning audit trail
│       ├── Remediation.jsx     # Actionable fix commands and verification steps
│       ├── Reports.jsx         # Executive report generator & markdown exporter
│       ├── Timeline.jsx        # Investigation execution timeline
│       ├── Settings.jsx        # API keys, NVD settings, and agent configuration
│       └── LandingPage.jsx     # Product welcome and introduction page
```

---

## 4. Autonomous Agent Workflow (LangGraph)

The autonomous agent executes an iterative state machine defined in [backend/agent/graph.py](file:///c:/Users/lenovo/Documents/oblivion/backend/agent/graph.py):

```
                       ┌─────────────────────────┐
                       │  Start Autonomous Run   │
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │     Planner Node        │◄────────────┐
                       │ (Identify needed tools) │             │
                       └────────────┬────────────┘             │
                                    │                          │
                                    ▼                          │
                       ┌─────────────────────────┐             │ (Repeat until
                       │      Tool Node          │             │  all tools
                       │  (Execute tool queue)   │─────────────┘  complete)
                       └────────────┬────────────┘
                                    │ (All planned tools done)
                                    ▼
                       ┌─────────────────────────┐
                       │     Reasoning Node      │
                       │ (5-point explainability)│
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │      Memory Node        │
                       │ (Delta vs prior scans)  │
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │  Complete & Persist     │
                       └─────────────────────────┘
```

---

## 5. Database Schema & Persistence Model

The SQLite database is initialized via [backend/database/db.py](file:///c:/Users/lenovo/Documents/oblivion/backend/database/db.py) and mapped via [backend/database/models.py](file:///c:/Users/lenovo/Documents/oblivion/backend/database/models.py).

### Table: `investigations`

| Column | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | Unique Investigation UUID string |
| `user_goal` | `TEXT` | Prompt or goal provided for the investigation |
| `status` | `TEXT` | Current execution status (`Completed`, `In Progress`, etc.) |
| `scan_data` | `TEXT` | Raw Nmap scan text input |
| `discovered_hosts` | `TEXT` | JSON array of detected hosts and open ports |
| `vulnerabilities` | `TEXT` | JSON array of identified vulnerabilities & findings |
| `selected_tools` | `TEXT` | JSON array of agent-executed security tools |
| `decision_log` | `TEXT` | JSON array of structured audit reasoning entries |
| `final_report` | `TEXT` | JSON object containing executive report summary |
| `tool_results` | `TEXT` | JSON object of intermediate tool outputs |
| `explained_findings` | `TEXT` | JSON array of 5-point explainable finding structures |
| `remediation` | `TEXT` | JSON array of prioritized remediation instructions |
| `risk_dashboard` | `TEXT` | JSON object containing score metrics and distributions |
| `investigation_graph` | `TEXT` | JSON object with React Flow `nodes` and `edges` |
| `attack_chains` | `TEXT` | JSON array of multi-stage attack scenarios |
| `full_state` | `TEXT` | Complete serialized JSON state dictionary for full hydration |
| `created_at` | `TIMESTAMP` | Record creation timestamp (defaults to current UTC time) |

---

## 6. Key REST API Endpoints

| Method | Endpoint | Handler | Description |
|---|---|---|---|
| `GET` | `/api/health` | `health()` | API health check & version info |
| `GET` | `/api/info` | `info()` | System metadata & engine version |
| `POST` | `/api/upload` | `upload_scan()` | Ingests raw scan text for deterministic pipeline |
| `POST` | `/api/investigation/{id}/start` | `start_investigation()` | Triggers background deterministic analysis |
| `GET` | `/api/investigation/{id}/status` | `get_status()` | Polls deterministic pipeline progress & state |
| `GET` | `/api/investigation/{id}/{resource}` | `get_resource()` | Retrieves specific sub-resources (graph, findings, risk, report) |
| `POST` | `/api/agent/investigate` | `agent_investigate()` | Starts autonomous LangGraph agent workflow |
| `GET` | `/api/agent/status/{id}` | `agent_status()` | Fetches full hydrated state of autonomous agent run |
| `POST` | `/api/agent/ask` | `agent_ask()` | Submits interactive Q&A query to Ask Sentinel |
