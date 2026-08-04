from agent.state import AgentState
from agent.tools import (
    nmap_analysis_tool,
    vulnerability_lookup_tool,
    risk_analysis_tool,
    attack_graph_tool,
    threat_intelligence_tool,
    report_generation_tool
)

async def execute_tools(state: AgentState) -> AgentState:
    """
    LangGraph Tool Execution Node:
    Executes selected tools sequentially and stores output in state.
    """
    selected_tools = state.get("selected_tools", [])
    tool_results = state.setdefault("tool_results", {})
    
    for tool_name in selected_tools:
        if tool_name in tool_results:
            continue  # Already executed
            
        state["current_status"] = f"Executing tool: {tool_name}"
        
        if tool_name == "nmap_analyzer":
            res = nmap_analysis_tool.run(state.get("scan_data", ""))
            tool_results["nmap_analyzer"] = res
            state["discovered_hosts"] = res.get("hosts", [])
            
        elif tool_name == "vulnerability_lookup":
            res = vulnerability_lookup_tool.run(state.get("discovered_hosts", []))
            tool_results["vulnerability_lookup"] = res
            state["vulnerabilities"] = res.get("vulnerabilities", [])
            
        elif tool_name == "risk_analyzer":
            res = risk_analysis_tool.run(state.get("discovered_hosts", []), state.get("vulnerabilities", []))
            tool_results["risk_analyzer"] = res
            
        elif tool_name == "attack_graph_builder":
            res = attack_graph_tool.run(state.get("discovered_hosts", []), state.get("vulnerabilities", []))
            tool_results["attack_graph_builder"] = res
            
        elif tool_name == "threat_intelligence":
            res = threat_intelligence_tool.run(state.get("vulnerabilities", []))
            tool_results["threat_intelligence"] = res
            
        elif tool_name == "report_generator":
            risk_data = tool_results.get("risk_analyzer", {})
            attack_data = tool_results.get("attack_graph_builder", {})
            res = report_generation_tool.run(
                discovered_hosts=state.get("discovered_hosts", []),
                vulnerabilities=state.get("vulnerabilities", []),
                risk_data=risk_data,
                attack_chains=attack_data.get("attack_chains", []),
                memory_summary=state.get("memory_insights")
            )
            tool_results["report_generator"] = res
            state["final_report"] = res.get("report", {})
            
        state["reasoning_steps"].append({
            "stage": "Tool Execution",
            "tool": tool_name,
            "status": "Success",
            "output_summary": f"Completed execution for {tool_name}"
        })

    return state
