import asyncio
import gc
from agent.state import AgentState
from agent.tools import (
    nmap_analysis_tool,
    vulnerability_lookup_tool,
    risk_analysis_tool,
    attack_graph_tool,
    threat_intelligence_tool,
    report_generation_tool
)

def _run_single_tool(tool_name: str, state: AgentState, tool_results: dict):
    if tool_name == "risk_analyzer":
        res = risk_analysis_tool.run(state.get("discovered_hosts", []), state.get("vulnerabilities", []))
        return tool_name, res
    elif tool_name == "attack_graph_builder":
        res = attack_graph_tool.run(state.get("discovered_hosts", []), state.get("vulnerabilities", []))
        return tool_name, res
    elif tool_name == "threat_intelligence":
        res = threat_intelligence_tool.run(state.get("vulnerabilities", []))
        return tool_name, res
    return tool_name, {}

async def execute_tools(state: AgentState) -> AgentState:
    """
    LangGraph Tool Execution Node:
    Executes selected tools. Non-interdependent tools (risk_analyzer, attack_graph_builder, threat_intelligence)
    are executed concurrently via asyncio.gather.
    """
    selected_tools = state.get("selected_tools", [])
    tool_results = state.setdefault("tool_results", {})
    
    pending_tools = [t for t in selected_tools if t not in tool_results]
    if not pending_tools:
        return state

    # Identify parallelizable batch
    parallel_set = {"risk_analyzer", "attack_graph_builder", "threat_intelligence"}
    parallel_batch = [t for t in pending_tools if t in parallel_set]

    if len(parallel_batch) > 1:
        state["current_status"] = f"Executing parallel analysis: {', '.join(parallel_batch)}"
        loop = asyncio.get_running_loop()
        tasks = [
            loop.run_in_executor(None, _run_single_tool, tool_name, state, tool_results)
            for tool_name in parallel_batch
        ]
        results = await asyncio.gather(*tasks)
        for tool_name, res in results:
            tool_results[tool_name] = res
            state["reasoning_steps"].append({
                "stage": "Tool Execution",
                "tool": tool_name,
                "status": "Success",
                "output_summary": f"Completed parallel execution for {tool_name}"
            })
        gc.collect()
        pending_tools = [t for t in pending_tools if t not in parallel_batch]

    # Process remaining sequential tools
    for tool_name in pending_tools:
        state["current_status"] = f"Executing tool: {tool_name}"
        
        if tool_name == "nmap_analyzer":
            res = nmap_analysis_tool.run(state.get("scan_data", ""))
            tool_results["nmap_analyzer"] = res
            state["discovered_hosts"] = res.get("hosts", [])
            
        elif tool_name == "vulnerability_lookup":
            res = vulnerability_lookup_tool.run(state.get("discovered_hosts", []))
            tool_results["vulnerability_lookup"] = res
            state["vulnerabilities"] = res.get("vulnerabilities", [])

        elif tool_name in parallel_set:
            name, res = _run_single_tool(tool_name, state, tool_results)
            tool_results[name] = res
            
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
            gc.collect()
            
        state["reasoning_steps"].append({
            "stage": "Tool Execution",
            "tool": tool_name,
            "status": "Success",
            "output_summary": f"Completed execution for {tool_name}"
        })

    return state

