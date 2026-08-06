from agent.state import AgentState

async def plan_investigation(state: AgentState) -> AgentState:
    """
    LangGraph Planner Node:
    Analyzes investigation goal and execution state to select required security tools dynamically.
    Parallelizes independent security tool steps after vulnerability lookup.
    """
    state["current_status"] = "Planning investigation steps..."
    goal = state.get("user_goal", "Analyze network threats")
    scan_data = state.get("scan_data")
    selected = state.get("selected_tools", [])
    
    planned_tools = []
    
    if scan_data and "nmap_analyzer" not in selected:
        planned_tools.append(("nmap_analyzer", "Parse scan output to discover active hosts and open ports."))
        state["progress"] = 10
        state["stage"] = "Parsing Scan Data"
    elif "nmap_analyzer" in selected and "vulnerability_lookup" not in selected:
        planned_tools.append(("vulnerability_lookup", "Execute hybrid CVE lookup on discovered services and software versions."))
        state["progress"] = 35
        state["stage"] = "CVE Intelligence Lookup"
    elif "vulnerability_lookup" in selected and not any(t in selected for t in ["risk_analyzer", "attack_graph_builder", "threat_intelligence"]):
        # Parallelize independent analysis tools
        planned_tools.append(("risk_analyzer", "Calculate network security risk score."))
        planned_tools.append(("attack_graph_builder", "Build attack graph and correlate potential exploit paths."))
        planned_tools.append(("threat_intelligence", "Map findings to MITRE ATT&CK techniques and tactics."))
        state["progress"] = 75
        state["stage"] = "MITRE Mapping & Risk Analysis"
    elif all(t in selected for t in ["risk_analyzer", "attack_graph_builder", "threat_intelligence"]) and "report_generator" not in selected:
        planned_tools.append(("report_generator", "Generate comprehensive final security intelligence report."))
        state["progress"] = 90
        state["stage"] = "Executive Report Generation"

    for tool_name, planned_action in planned_tools:
        if tool_name not in selected:
            state["selected_tools"].append(tool_name)
            state["reasoning_steps"].append({
                "stage": "Planner",
                "action": f"Selected Tool: {tool_name}",
                "reason": planned_action,
                "goal": goal
            })

    return state

