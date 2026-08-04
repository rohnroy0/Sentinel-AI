import re

def parse_nmap_text(content: str):
    open_ports = []
    lines = content.split('\n')
    current_port = None
    
    for line in lines:
        port_match = re.match(r'^(\d+)/tcp\s+open\s+(\S+)\s+(.*)', line)
        if port_match:
            current_port = {
                "port": port_match.group(1),
                "service": port_match.group(2),
                "version": port_match.group(3).strip(),
                "details": []
            }
            open_ports.append(current_port)
        elif current_port and line.startswith('|'):
            current_port["details"].append(line.strip())
        elif current_port and line.startswith('|_'):
            current_port["details"].append(line.strip())
            
    return {"open_ports": open_ports}
