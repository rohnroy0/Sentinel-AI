from typing import Dict, Any
from ai.parser.nmap_parser import parse_nmap_text

def run(scan_data: str) -> Dict[str, Any]:
    """
    Tool: Nmap Analysis Tool
    Wraps existing parser: ai.parser.nmap_parser
    """
    if not scan_data:
        return {"hosts": [], "raw_parsed": {}}
        
    parsed = parse_nmap_text(scan_data)
    
    hosts = []
    if isinstance(parsed, dict):
        if "hosts" in parsed and parsed["hosts"]:
            hosts = parsed["hosts"]
        elif "open_ports" in parsed:
            ip = "192.168.1.10"
            for line in scan_data.split("\n"):
                if "report for" in line:
                    ip = line.split("for")[-1].strip()
                    break
            hosts = [{"ip": ip, "ports": parsed["open_ports"]}]
    elif isinstance(parsed, list):
        hosts = parsed
        
    return {
        "status": "success",
        "hosts": hosts,
        "raw": parsed
    }
