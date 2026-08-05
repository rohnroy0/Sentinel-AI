from typing import Dict, Any, List, Optional
from database.models import get_all_investigations, get_investigation_by_id

def compare_investigations(current_inv_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Compares the current investigation against previous historical scans to detect:
    - Fixed/closed ports (Security Improvements)
    - New exposed ports (Security Regressions)
    Scoped strictly to the specified user_id for multi-tenant isolation.
    """
    if not user_id:
        return {
            "has_previous": False,
            "improvements": [],
            "regressions": [],
            "summary": "Baseline security profile created. User context required for memory comparison."
        }

    all_invs = get_all_investigations(user_id=user_id)
    if len(all_invs) < 2:
        return {
            "has_previous": False,
            "improvements": [],
            "regressions": [],
            "summary": "Baseline security profile created. No previous investigation available."
        }
        
    current = get_investigation_by_id(current_inv_id, user_id=user_id)
    # Find the most recent previous investigation (excluding current)
    prev = None
    if current:
        for inv in all_invs:
            if inv["investigation_id"] != current_inv_id:
                prev = get_investigation_by_id(inv["investigation_id"], user_id=user_id)
                if prev:
                    break
            
    if not current or not prev:
        return {
            "has_previous": False,
            "improvements": [],
            "regressions": [],
            "summary": "Baseline security profile created. No previous investigation available."
        }
        
    curr_hosts = current.get("discovered_hosts", [])
    prev_hosts = prev.get("discovered_hosts", [])
    
    curr_ports = set()
    for h in curr_hosts:
        ip = h.get("ip", h.get("host", "unknown"))
        for p in h.get("ports", []):
            curr_ports.add(f"{ip}:{p.get('port') or p.get('portid')} ({p.get('service')})")
            
    prev_ports = set()
    for h in prev_hosts:
        ip = h.get("ip", h.get("host", "unknown"))
        for p in h.get("ports", []):
            prev_ports.add(f"{ip}:{p.get('port') or p.get('portid')} ({p.get('service')})")
            
    closed_ports = prev_ports - curr_ports
    new_ports = curr_ports - prev_ports
    
    improvements = [f"Port exposure resolved: {cp}" for cp in closed_ports]
    regressions = [f"New service detected: {np}" for np in new_ports]
    
    if closed_ports and "3306" in "".join(closed_ports):
        improvements.append("Database exposure issue (Port 3306) has been resolved.")
        
    summary_parts = []
    if improvements:
        summary_parts.append(f"Resolved issues: {len(improvements)}.")
    if regressions:
        summary_parts.append(f"New exposures: {len(regressions)}.")
    if not summary_parts:
        summary_parts.append("No new exposures or resolved issues.")
        
    return {
        "has_previous": True,
        "previous_investigation_id": prev["investigation_id"],
        "improvements": improvements,
        "regressions": regressions,
        "summary": " ".join(summary_parts)
    }
