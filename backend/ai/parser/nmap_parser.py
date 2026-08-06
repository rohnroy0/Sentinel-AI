import re

def parse_nmap_text(content: str):
    open_ports = []
    lines = content.splitlines()
    current_port = None
    current_host = "Unknown Host"
    
    for line in lines:
        host_match = re.match(r"\s*Nmap scan report for\s+(.+)", line)
        if host_match:
            host_str = host_match.group(1).strip()
            # Remove trailing parenthetical IPs if hostname is present
            host_str = re.sub(r"\s*\(.*\)\s*$", "", host_str)
            current_host = host_str or "Unknown Host"
            
        port_match = re.match(r'^(\d+)/tcp\s+(\S+)\s+(\S+)\s*(.*)', line)
        if port_match:
            port_state = port_match.group(2)
            if port_state == "open":
                current_port = {
                    "host": current_host,
                    "port": port_match.group(1),
                    "service": port_match.group(3),
                    "version": port_match.group(4).strip(),
                    "details": [],
                    "original_port_state": port_state,
                    "raw_service_banner": line.strip(),
                    "detected_script_output": "",
                    "source_scan_reference": f"Nmap scan report for {current_host}"
                }
                open_ports.append(current_port)
        elif current_port and (line.startswith('|') or line.startswith('|_')):
            current_port["details"].append(line.strip())
            current_port["detected_script_output"] = "\n".join(current_port["details"])
            
    discovered_hosts = [{"host": h} for h in list(set(p["host"] for p in open_ports))]
    
    return {
        "open_ports": open_ports,
        "discovered_hosts": discovered_hosts
    }
