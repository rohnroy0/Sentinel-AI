import os

frontend_pages = [
    "LandingPage", "DashboardOverview", "UploadScan", "Timeline", 
    "Findings", "InvestigationGraph", "AttackChains", "RiskDashboard", 
    "Remediation", "Reports", "DecisionLog", "Settings"
]

frontend_components = ["DashboardLayout", "Sidebar", "TopNavbar", "Card", "Badge", "Button"]

backend_dirs = [
    "backend/api", "backend/models", "backend/services", 
    "backend/ai/parser", "backend/ai/rule_engine", "backend/ai/knowledge_base", 
    "backend/ai/risk_engine", "backend/ai/correlation_engine", 
    "backend/ai/attack_chain_builder", "backend/ai/llm", "backend/ai/report_generator",
    "demo_data", "frontend/src/api", "frontend/src/pages", "frontend/src/components"
]

def scaffold():
    for d in backend_dirs:
        os.makedirs(d, exist_ok=True)

    for p in frontend_pages:
        path = f"frontend/src/pages/{p}.jsx"
        if not os.path.exists(path):
            with open(path, "w") as f:
                f.write(f"export default function {p}() {{\n  return <div className='p-6'><h1>{p}</h1></div>;\n}}\n")

    for c in frontend_components:
        path = f"frontend/src/components/{c}.jsx"
        if not os.path.exists(path):
            with open(path, "w") as f:
                f.write(f"export default function {c}() {{\n  return <div>{c}</div>;\n}}\n")

    main_py = "backend/main.py"
    if not os.path.exists(main_py):
        with open(main_py, "w") as f:
            f.write("from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get('/')\ndef read_root():\n    return {'Hello': 'World'}\n")

if __name__ == "__main__":
    scaffold()
