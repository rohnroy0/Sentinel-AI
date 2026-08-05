import asyncio
from agent.state import AgentState
from agent.nodes.planner_node import plan_investigation
from agent.nodes.tool_node import execute_tools
from agent.nodes.reasoning_node import generate_reasoning
from agent.nodes.memory_node import process_memory

class InvestigationGraph:
    """
    LangGraph Workflow Architecture State Machine:
    User Goal -> Planner Node -> Tool Execution Nodes -> Reasoning Engine -> Memory System -> Final Security Report
    """
    async def run(self, initial_state: AgentState) -> AgentState:
        state = initial_state
        
        # 1. Loop Planner & Tools until all required steps complete
        max_iterations = 6
        for _ in range(max_iterations):
            state = await plan_investigation(state)
            prev_tools_len = len(state.get("tool_results", {}))
            
            state = await execute_tools(state)
            new_tools_len = len(state.get("tool_results", {}))
            
            # If no new tools were executed in this pass, planning is complete
            if new_tools_len == prev_tools_len and "report_generator" in state.get("tool_results", {}):
                break
                
        # 2. Execute Reasoning Node
        state = await generate_reasoning(state)
        
        # 3. Execute Memory Node
        state = await process_memory(state)
        
        state["current_status"] = "Investigation Complete"
        return state

def create_investigation_graph() -> InvestigationGraph:
    return InvestigationGraph()
