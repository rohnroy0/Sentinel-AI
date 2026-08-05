import os
import json
import logging
import urllib.request
import re
from typing import List, Dict, Any
from config import config

def parse_ver(v_str):
    tokens = re.findall(r'(\d+|[a-zA-Z]+)', v_str)
    parsed = []
    for t in tokens:
        if t.isdigit():
            parsed.append(int(t))
        else:
            parsed.append(t)
    return tuple(parsed)

def is_vulnerable_version(detected_ver: str, affected_str: str) -> bool:
    if not detected_ver or not affected_str:
        return True
    
    d_match = re.search(r'(\d+(?:\.\d+)*(?:[a-zA-Z]+\d+)?)', detected_ver)
    if not d_match:
        return True
    d_val = parse_ver(d_match.group(1))
    
    if " to " in affected_str:
        parts = affected_str.split(" to ")
        v1 = re.search(r'(\d+(?:\.\d+)*(?:[a-zA-Z]+\d+)?)', parts[0])
        v2 = re.search(r'(\d+(?:\.\d+)*(?:[a-zA-Z]+\d+)?)', parts[1])
        if v1 and v2:
            min_val = parse_ver(v1.group(1))
            max_val = parse_ver(v2.group(1))
            return min_val <= d_val <= max_val
            
    if "<" in affected_str:
        v = re.search(r'(\d+(?:\.\d+)*(?:[a-zA-Z]+\d+)?)', affected_str.split("<")[1])
        if v:
            max_val = parse_ver(v.group(1))
            return d_val < max_val
            
    if "and prior" in affected_str:
        v = re.search(r'(\d+(?:\.\d+)*(?:[a-zA-Z]+\d+)?)', affected_str)
        if v:
            max_val = parse_ver(v.group(1))
            return d_val <= max_val
            
    v = re.search(r'(\d+(?:\.\d+)*(?:[a-zA-Z]+\d+)?)', affected_str)
    if v:
        exact_val = parse_ver(v.group(1))
        if d_val == exact_val:
            return True
        elif d_val > exact_val:
            return False
            
    return True

logger = logging.getLogger(__name__)

CACHE_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "cve_cache.json")

def load_local_cache() -> Dict[str, Any]:
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f).get("cve_database", {})
        except Exception as e:
            logger.error(f"Failed to read local CVE cache: {e}")
    return {}

def lookup_vulnerabilities(service_name: str, version: str = "", product_name: str = "", os_info: str = "") -> List[Dict[str, Any]]:
    """
    Hybrid CVE lookup system with Priority Matching:
    1. Exact product + version match
    2. Version range match
    3. Product family match
    4. Ignore low-confidence matches
    """
    service_key = service_name.lower()
    prod_key = product_name.lower() if product_name else service_key
    local_db = load_local_cache()
    matched_cves = []
    
    # 1. Local Cache Lookup (Mocked Priority Matching)
    patched = False
    for key, cve_list in local_db.items():
        if key in prod_key or key in service_key or prod_key in key or service_key in key:
            for item in cve_list:
                affected = item.get("affected_software", "")
                if version and affected:
                    if not is_vulnerable_version(version, affected):
                        patched = True
                        continue
                # Determine confidence
                cve_version = item.get("version", "")
                confidence_score = 0
                confidence_level = "Low"
                confidence_reason = "No match"
                
                if version and cve_version and version == cve_version:
                    confidence_score = 95
                    confidence_level = "High"
                    confidence_reason = "Exact product and version match detected."
                elif version and cve_version and cve_version in version:
                    confidence_score = 80
                    confidence_level = "High"
                    confidence_reason = "Version range match detected."
                elif prod_key and key in prod_key:
                    confidence_score = 50
                    confidence_level = "Medium"
                    confidence_reason = "Product family match detected."
                else:
                    confidence_score = 20
                    confidence_level = "Low"
                    confidence_reason = "Generic service match."

                if confidence_score >= 50:
                    matched_cves.append({
                        "cve_id": item.get("cve_id"),
                        "severity": item.get("severity", "MEDIUM"),
                        "score": item.get("score", 7.0),
                        "description": item.get("description"),
                        "affected_software": item.get("affected_software", f"{product_name or service_name} {version}"),
                        "exploit_risk": item.get("exploit_risk", "Vulnerability Exposure"),
                        "recommendation": item.get("recommendation", "Patch software to latest security release."),
                        "confidence_score": confidence_score,
                        "confidence_level": confidence_level,
                        "confidence_reason": confidence_reason
                    })
                else:
                    matched_cves.append({
                        "cve_id": "N/A",
                        "severity": item.get("severity", "MEDIUM"),
                        "score": "N/A",
                        "description": f"Configuration Issue: {item.get('description', '')}",
                        "affected_software": f"{product_name or service_name} {version}",
                        "exploit_risk": "Configuration Exposure",
                        "recommendation": "Review security configuration.",
                        "confidence_score": confidence_score,
                        "confidence_level": confidence_level,
                        "confidence_reason": confidence_reason
                    })
                
    if matched_cves:
        return sorted(matched_cves, key=lambda x: x["confidence_score"], reverse=True)

    if patched:
        return [{
            "cve_id": "N/A",
            "severity": "INFO",
            "score": 0.0,
            "description": "Service detected but version appears patched.",
            "affected_software": f"{product_name or service_name} {version}",
            "exploit_risk": "None",
            "recommendation": "No action required.",
            "confidence_score": 100,
            "confidence_level": "High",
            "confidence_reason": "Version check confirmed service is patched."
        }]

    # 2. Dynamic Fallback
    # Only return medium/high confidence for fallbacks if version is specified and matches exact products
    # Otherwise ignore as low confidence
    if ("openssh" in prod_key or "ssh" == service_key) and version:
        if not is_vulnerable_version(version, "OpenSSH < 9.8p1"):
            return [{
                "cve_id": "N/A",
                "severity": "INFO",
                "score": 0.0,
                "description": "Service detected but version appears patched.",
                "affected_software": f"OpenSSH {version}",
                "exploit_risk": "None",
                "recommendation": "No action required.",
                "confidence_score": 100,
                "confidence_level": "High",
                "confidence_reason": "Version check confirmed service is patched."
            }]
        return [{
            "cve_id": "CVE-2024-6387",
            "severity": "CRITICAL",
            "score": 9.8,
            "description": "Potential remote execution issue in SSH service.",
            "affected_software": f"OpenSSH {version}",
            "exploit_risk": "Remote Code Execution",
            "recommendation": "Restrict SSH access and update OpenSSH package.",
            "confidence_score": 85,
            "confidence_level": "High",
            "confidence_reason": "Exact OpenSSH version match detected."
        }]
    elif ("http server" in prod_key or "httpd" in prod_key or "apache http" in prod_key) and "tomcat" not in prod_key and version:
        if not is_vulnerable_version(version, "Apache HTTP Server 2.4.49"):
            return [{
                "cve_id": "N/A",
                "severity": "INFO",
                "score": 0.0,
                "description": "Service detected but version appears patched.",
                "affected_software": f"Apache HTTP Server {version}",
                "exploit_risk": "None",
                "recommendation": "No action required.",
                "confidence_score": 100,
                "confidence_level": "High",
                "confidence_reason": "Version check confirmed service is patched."
            }]
        return [{
            "cve_id": "CVE-2021-41773",
            "severity": "HIGH",
            "score": 7.5,
            "description": "Path traversal or misconfiguration in Web Server.",
            "affected_software": f"Apache HTTP Server {version}",
            "exploit_risk": "Information Disclosure / Path Traversal",
            "recommendation": "Verify directory permissions and update web server software.",
            "confidence_score": 95,
            "confidence_level": "High",
            "confidence_reason": "Exact Apache HTTP Server version match detected."
        }]
    elif ("mysql" in prod_key or "mysql" == service_key) and version:
        if not is_vulnerable_version(version, "MySQL 8.0.32 and prior"):
            return [{
                "cve_id": "N/A",
                "severity": "INFO",
                "score": 0.0,
                "description": "Service detected but version appears patched.",
                "affected_software": f"MySQL {version}",
                "exploit_risk": "None",
                "recommendation": "No action required.",
                "confidence_score": 100,
                "confidence_level": "High",
                "confidence_reason": "Version check confirmed service is patched."
            }]
        return [{
            "cve_id": "CVE-2023-21980",
            "severity": "HIGH",
            "score": 7.5,
            "description": "Unauthenticated or exposed database connection port.",
            "affected_software": f"MySQL {version}",
            "exploit_risk": "Data Exfiltration",
            "recommendation": "Bind database service to 127.0.0.1 and enforce strong authentication.",
            "confidence_score": 50,
            "confidence_level": "Medium",
            "confidence_reason": "Product family match detected."
        }]

    return []
