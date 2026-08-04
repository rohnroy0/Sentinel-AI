# Sentinel-AI Developer & AI Agent Guidelines

> **CRITICAL INSTRUCTION FOR ALL AI CODING SESSIONS:**  
> Before formulating plans or making any code changes in this repository, you **MUST** read and understand the project memory and architecture documentation.

---

## 1. Mandatory Pre-Flight Checklist

Before reading or editing any application code, execute the following sequence:

1. 📖 **Read [AI_CONTEXT.md](file:///c:/Users/lenovo/Documents/oblivion/AI_CONTEXT.md)** — Core project overview, technology stack, pipelines, and operating constraints.
2. 🏛️ **Read [ARCHITECTURE.md](file:///c:/Users/lenovo/Documents/oblivion/ARCHITECTURE.md)** — Architectural blueprint for frontend, backend, agent engine, and database models.
3. 📝 **Read [CHANGELOG.md](file:///c:/Users/lenovo/Documents/oblivion/CHANGELOG.md)** — Recent version changes, added features, bug fixes, and upgrade notes.
4. ✅ **Read [TASKS.md](file:///c:/Users/lenovo/Documents/oblivion/TASKS.md)** — Active priority roadmap, pending backlog, and completed items.
5. 🐛 **Read [BUGS.md](file:///c:/Users/lenovo/Documents/oblivion/BUGS.md)** — Active and resolved issues, root causes, and regression test cases.

---

## 2. Core AI Coding Rules

Adhere strictly to these principles during all development tasks:

* **No Architectural Rewrites:** Never rewrite or replace the existing architecture without explicit user approval.
* **Incremental Evolution:** Prefer small, atomic, and incremental changes over sweeping refactors.
* **API Stability:** Preserve all existing REST endpoints, request/response models, and contract schemas.
* **Zero Feature Regressions:** Never delete or degrade working features or UI pages to satisfy new requirements.
* **Inspect Before Authoring:** Always inspect the existing implementation across backend and frontend before adding new code.
* **Change Explanation:** Clearly document and explain modified files and rationales after completing edits.
* **Documentation Synchronization:**
  * Update [CHANGELOG.md](file:///c:/Users/lenovo/Documents/oblivion/CHANGELOG.md) whenever a feature or notable modification is completed.
  * Update [TASKS.md](file:///c:/Users/lenovo/Documents/oblivion/TASKS.md) to reflect progress against active or backlog tasks.
  * Update [BUGS.md](file:///c:/Users/lenovo/Documents/oblivion/BUGS.md) whenever diagnosing, discovering, or resolving an issue.

---

## 3. Operational Quick Reference

### Backend Execution
```bash
cd backend
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
* **Default Port:** `http://localhost:8000`
* **API Docs (Swagger):** `http://localhost:8000/docs`

### Frontend Execution
```bash
cd frontend
npm install
npm run dev
```
* **Default URL:** `http://localhost:5173`

### Verification Test Suite
```bash
python backend/tests/test_agent_system.py
```

---

## 4. Key Directory Map

* `backend/agent/` — Autonomous LangGraph controller, planner node, reasoning node, memory node, and tool execution system.
* `backend/ai/` — Deterministic cybersecurity pipeline (Nmap parser, rule engine, risk engine, correlation, attack chain builder, graph builder, report generator).
* `backend/services/` — Hybrid CVE lookup engine (offline cache + NVD API fallback).
* `backend/database/` — SQLite storage engine (`investigations.db`), persistence models, and query handlers.
* `frontend/src/pages/` — React UI pages (AgentConsole, RiskDashboard, InvestigationGraph, AttackChains, Findings, Remediation, DecisionLog, Reports, UploadScan).
* `frontend/src/components/` — UI building blocks, visual nodes, timeline cards, and navigation.
