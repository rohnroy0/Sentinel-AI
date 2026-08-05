from agent.state import AgentState
from agent.memory import compare_investigations
from database.models import save_investigation

async def process_memory(state: AgentState) -> AgentState:
    """
    LangGraph Memory Node:
    - Stores current investigation state in SQLite.
    - Retrieves previous investigation context.
    - Compares historical findings to detect security improvements or regressions.
    """
    state["current_status"] = "Processing historical memory context..."
    inv_id = state["investigation_id"]
    
    # Save state to SQLite
    try:
        save_investigation(state)
    except Exception as e:
        pass
        
    # Compare with history
    user_id = state.get("user_id")
    memory_diff = compare_investigations(inv_id, user_id=user_id)
    state["memory_insights"] = memory_diff
    
    if memory_diff.get("has_previous"):
        state["reasoning_steps"].append({
            "stage": "Memory Engine",
            "action": "Historical Comparison",
            "summary": memory_diff.get("summary"),
            "improvements": memory_diff.get("improvements"),
            "regressions": memory_diff.get("regressions")
        })
    else:
        state["reasoning_steps"].append({
            "stage": "Memory Engine",
            "action": "Memory Benchmark Established",
            "summary": memory_diff.get("summary")
        })
        
    return state
