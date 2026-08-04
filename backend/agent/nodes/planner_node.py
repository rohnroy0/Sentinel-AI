from agent.state import AgentState

async def plan_investigation(state: AgentState) -> AgentState:
    """
    LangGraph Planner Node:
    Analyzes investigation goal and execution state to select required security tools dynamically.
    """
    state["current_status"] = "Planning investigation steps..."
    goal = state.get("user_goal", "Analyze network threats")
    scan_data = state.get("scan_data")
    selected = state.get("selected_tools", [])
    
    planned_action = ""
    next_tool = ""
    
    if scan_data and "nmap_analyzer" not in selected:
        next_tool = "nmap_analyzer"
        planned_action = "Parse scan output to discover active hosts and open ports."
    elif state.get("discovered_hosts") and "vulnerability_lookup" not in selected:
        next_tool = "vulnerability_lookup"
        planned_action = "Execute hybrid CVE lookup on discovered services and software versions."
    elif state.get("vulnerabilities") and "risk_analyzer" not in selected:
        next_tool = "risk_analyzer"
        planned_action = "Calculate network security risk score."
    elif state.get("vulnerabilities") and "attack_graph_builder" not in selected:
        next_tool = "attack_graph_builder"
        planned_action = "Build attack graph and correlate potential exploit paths."
    elif state.get("vulnerabilities") and "threat_intelligence" not in selected:
        next_tool = "threat_intelligence"
        planned_action = "Map findings to MITRE ATT&CK techniques and tactics."
    elif state.get("tool_results", {}).get("risk_analyzer") and "report_generator" not in selected:
        next_tool = "report_generator"
        planned_action = "Generate comprehensive final security intelligence report."

    if next_tool:
        state["selected_tools"].append(next_tool)
        state["reasoning_steps"].append({
            "stage": "Planner",
            "action": f"Selected Tool: {next_tool}",
            "reason": planned_action,
            "goal": goal
        })

    return state
