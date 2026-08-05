# Sentinel-AI Autonomous Agent 🛡️

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11%2B-blue.svg)
![React](https://img.shields.io/badge/react-19.0-61DAFB.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)
![LangGraph](https://img.shields.io/badge/LangGraph-Autonomous-purple.svg)

> **Autonomous AI cybersecurity investigation agent that analyzes network threats, correlates vulnerabilities, reasons over attack paths, and provides explainable security intelligence.**

---

## 📖 Table of Contents
- [Problem Statement](#-problem-statement)
- [Agent Workflow & Architecture](#-agent-workflow--architecture)
- [Tool System & Tool Calling](#-tool-system--tool-calling)
- [AI Reasoning & Explainability](#-ai-reasoning--explainability)
- [CVE Intelligence & MITRE Mapping](#-cve-intelligence--mitre-mapping)
- [SOC Dashboard](#-soc-dashboard)
- [Setup & Installation](#-setup--installation)
- [Limitations & Future Improvements](#-limitations--future-improvements)

---

## 🎯 Problem Statement

Traditional network security scanners produce voluminous text outputs that require manual correlation, CVE lookups, threat mapping, and manual report writing.

**Sentinel-AI** solves this by operating as an autonomous AI SOC analyst capable of:
1. Planning investigation steps autonomously using LangGraph.
2. Executing cybersecurity tools dynamically.
3. Conducting hybrid CVE lookups (local cache + NVD fallback).
4. Mapping findings to MITRE ATT&CK techniques.
5. Tracking attack surface changes via SQLite memory.
6. Answering follow-up security queries explainably via **Ask Sentinel**.

---

## 🔄 Agent Workflow & Architecture

```
User Goal
    |
    ↓
Agent Controller (agent_controller.py)
    |
    ↓
LangGraph Planner (planner_node.py)
    |
    ↓
Tool Execution Nodes (tool_node.py)
    ├── Nmap Analysis Tool
    ├── Vulnerability Lookup Tool
    ├── Risk Analysis Tool
    ├── Attack Graph Tool
    ├── Threat Intelligence Tool
    └── Report Generation Tool
    |
    ↓
Reasoning Engine (reasoning_node.py)
    |
    ↓
Memory System (memory_node.py -> investigations.db)
    |
    ↓
Final Security Report & Ask Sentinel Interface
```

---

## 🛠️ Tool System & Tool Calling

Existing modules are converted into callable AI agent tools:
- **`nmap_analysis_tool`**: Wraps Nmap text parser to extract active hosts and ports.
- **`vulnerability_lookup_tool`**: Queries hybrid CVE database for software versions.
- **`risk_analysis_tool`**: Calculates risk scores and categories.
- **`attack_graph_tool`**: Generates attacker movement paths and graph relationships.
- **`threat_intelligence_tool`**: Maps findings to MITRE ATT&CK techniques.
- **`report_generation_tool`**: Compiles executive intelligence reports.

---

## 🧠 AI Reasoning & Explainability

Every finding includes a mandatory 5-point explainable breakdown:
- **Finding**: Clear summary of the issue.
- **Reason**: Root cause explanation.
- **Evidence**: Verified IP, port, and service indicators.
- **Impact**: Potential exploitation consequences.
- **Recommendation**: Exact hardening instructions.

---

## 🔍 CVE Intelligence & MITRE Mapping

- **Hybrid CVE Lookup**: Queries local `backend/data/cve_cache.json` for offline reliability and fallbacks to NVD API. Low-confidence hits are smartly downgraded to Configuration Issues rather than assigning false CVSS scores.
- **MITRE ATT&CK Mapping**: Maps exposed services directly to adversary tactics using an evidence-based approach (e.g., T1190 for public exploits, T1078 for compromised accounts, T1213 for data exposure). 
- **Attack Chain Builder**: Synthesizes end-to-end exploit chains without duplicate or assumed nodes. Strictly governs Lateral Movement and Privilege Escalation paths based on explicit telemetry rules and network topology.

---

## 💻 SOC Dashboard

Sentinel-AI features a professional SOC Investigation Dashboard (`AgentConsole.jsx`):
- **Agent Timeline**: Real-time status tracker (`Parsing scan`, `Checking vulnerabilities`, `Building attack graph`, `Generating report`).
- **Finding Cards**: Visualizing findings with evidence and recommendations.
- **Attack Path Viewer**: Interactive display of multi-stage attack chains and MITRE technique badges.
- **Reasoning Panel & Ask Sentinel**: Step-by-step audit trail and interactive Q&A box.

---

## 🚀 Setup & Installation

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Verification Test Suite
```bash
python backend/tests/test_agent_system.py
```

---

## 🔮 Limitations & Future Improvements
- **Local LLM / Ollama Support**: Support for local open-weights security models.
- **Multi-Tenant Memory**: Advanced role-based investigation memory indexing.
