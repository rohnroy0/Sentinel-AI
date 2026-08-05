import os
import re

main_path = "main.py"
with open(main_path, "r") as f:
    content = f.read()

# 1. Add imports
if "from auth import get_current_user" not in content:
    content = content.replace("from fastapi.middleware.cors import CORSMiddleware", 
                              "from fastapi.middleware.cors import CORSMiddleware\nfrom fastapi import Depends\nfrom auth import get_current_user")

# 2. Patch /api/upload
if "async def upload_scan(req: UploadRequest):" in content:
    content = content.replace(
        "async def upload_scan(req: UploadRequest):",
        "async def upload_scan(req: UploadRequest, user_id: str = Depends(get_current_user)):\n    req_content = req.content"
    )
    # Also add user_id to InvestigationState
    content = content.replace(
        "inv = InvestigationState(req.content)",
        "inv = InvestigationState(req_content)\n    inv.user_id = user_id"
    )

# 3. Patch start_investigation
if "async def start_investigation(inv_id: str, background_tasks: BackgroundTasks):" in content:
    content = content.replace(
        "async def start_investigation(inv_id: str, background_tasks: BackgroundTasks):",
        "async def start_investigation(inv_id: str, background_tasks: BackgroundTasks, user_id: str = Depends(get_current_user)):"
    )
    # Add check
    content = content.replace(
        "inv = investigations[inv_id]\n    background_tasks.add_task",
        "inv = investigations[inv_id]\n    if getattr(inv, 'user_id', None) and inv.user_id != user_id:\n        raise HTTPException(status_code=403, detail='Access denied')\n    background_tasks.add_task"
    )

# 4. Patch get_status
if "async def get_status(inv_id: str):" in content:
    content = content.replace(
        "async def get_status(inv_id: str):",
        "async def get_status(inv_id: str, user_id: str = Depends(get_current_user)):"
    )
    # DB check
    content = content.replace(
        "db_state = get_investigation_by_id(inv_id)\n        if db_state:",
        "db_state = get_investigation_by_id(inv_id)\n        if db_state:\n            if db_state.get('user_id') and db_state.get('user_id') != user_id:\n                raise HTTPException(status_code=403, detail='Access denied')"
    )
    # Mem check
    content = content.replace(
        "inv = investigations[inv_id]\n    return {",
        "inv = investigations[inv_id]\n    if getattr(inv, 'user_id', None) and inv.user_id != user_id:\n        raise HTTPException(status_code=403, detail='Access denied')\n    return {"
    )

# 5. Patch get_resource
if "async def get_resource(inv_id: str, resource: str):" in content:
    content = content.replace(
        "async def get_resource(inv_id: str, resource: str):",
        "async def get_resource(inv_id: str, resource: str, user_id: str = Depends(get_current_user)):"
    )
    content = content.replace(
        "agent_status = get_agent_status(inv_id)",
        "agent_status = get_agent_status(inv_id)\n    if agent_status and agent_status.get('user_id') and agent_status.get('user_id') != user_id:\n        raise HTTPException(status_code=403, detail='Access denied')"
    )
    content = content.replace(
        "db_state = get_investigation_by_id(inv_id)\n        if db_state:",
        "db_state = get_investigation_by_id(inv_id)\n        if db_state:\n            if db_state.get('user_id') and db_state.get('user_id') != user_id:\n                raise HTTPException(status_code=403, detail='Access denied')"
    )
    content = content.replace(
        "inv = investigations[inv_id]\n\n    # Build a live summary",
        "inv = investigations[inv_id]\n    if getattr(inv, 'user_id', None) and inv.user_id != user_id:\n        raise HTTPException(status_code=403, detail='Access denied')\n\n    # Build a live summary"
    )

# 6. Patch agent investigate
if "async def start_agent_investigation(req: AgentInvestigateRequest):" in content:
    content = content.replace(
        "async def start_agent_investigation(req: AgentInvestigateRequest):",
        "async def start_agent_investigation(req: AgentInvestigateRequest, user_id: str = Depends(get_current_user)):"
    )
    content = content.replace(
        "inv_id = await start_autonomous_investigation(req.goal, req.scan_data)",
        "inv_id = await start_autonomous_investigation(req.goal, req.scan_data, user_id=user_id)"
    )

# 7. Patch check_agent_status
if "async def check_agent_status(investigation_id: str):" in content:
    content = content.replace(
        "async def check_agent_status(investigation_id: str):",
        "async def check_agent_status(investigation_id: str, user_id: str = Depends(get_current_user)):"
    )
    content = content.replace(
        "status = get_agent_status(investigation_id)\n    if not status:",
        "status = get_agent_status(investigation_id)\n    if not status:\n        raise HTTPException(status_code=404, detail='Investigation not found')\n    if status.get('user_id') and status.get('user_id') != user_id:\n        raise HTTPException(status_code=403, detail='Access denied')"
    )

# 8. Patch ask_sentinel
if "async def ask_sentinel_endpoint(req: AskSentinelRequest):" in content:
    content = content.replace(
        "async def ask_sentinel_endpoint(req: AskSentinelRequest):",
        "async def ask_sentinel_endpoint(req: AskSentinelRequest, user_id: str = Depends(get_current_user)):"
    )

with open(main_path, "w") as f:
    f.write(content)
print("Patched main.py")
