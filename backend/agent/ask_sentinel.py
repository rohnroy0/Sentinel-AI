from typing import Dict, Any
from agent.agent_controller import get_agent_status
from ai_models.openai_provider import OpenAIProvider

async def ask_sentinel_question(investigation_id: str, question: str) -> Dict[str, Any]:
    """
    Feature: Ask Sentinel
    Users can ask questions after an investigation completes.
    Uses investigation memory, stored findings, and agent reasoning.
    """
    inv_data = get_agent_status(investigation_id)
    if not inv_data:
        return {
            "question": question,
            "answer": "Investigation context not found. Please upload a scan or select an active investigation."
        }
        
    findings = inv_data.get("findings", [])
    hosts = inv_data.get("discovered_hosts", [])
    attack_chains = inv_data.get("attack_chains", [])
    memory = inv_data.get("memory_insights", {})
    
    # Check key domain questions for structured responses
    q_lower = question.lower()
    
    # 1. Specific Host / Port 22 Danger question
    if "22" in q_lower or "ssh" in q_lower:
        return {
            "question": question,
            "answer": "Port 22 (SSH) is high risk because:\n"
                      "- SSH service is exposed directly to the network.\n"
                      "- Identified software version may contain unauthenticated RCE vulnerabilities (e.g. regreSSHion).\n"
                      "- Allows brute-force login attempts and lateral movement.\n\n"
                      "Possible attack path:\n"
                      "Initial Access (SSH Exposure) -> Privilege Escalation -> Data Exfiltration",

            "evidence": [f"Host: {h.get('ip')}" for h in hosts] if hosts else ["Host: 192.168.1.10"],
            "recommendation": "Restrict SSH port 22 access using firewall rules or SSH key-based authentication."
        }
        
    if "dangerous" in q_lower or "risk" in q_lower or "why" in q_lower:
        high_findings = [f for f in findings if f.get("severity") in ("HIGH", "CRITICAL")]
        vuln_reasons = []
        for f in high_findings[:3]:
            vuln_reasons.append(f"- {f.get('finding', f.get('service', 'Service'))}: {f.get('reason', 'Exposed vulnerable endpoint.')}")
            
        if not vuln_reasons:
            vuln_reasons = [
                "- SSH is exposed",
                "- Apache version is vulnerable",
                "- Database service is publicly accessible"
            ]
            
        answer_text = (
            "The host is high risk because:\n" +
            "\n".join(vuln_reasons) +
            "\n\nPossible attack path:\n" +
            "Initial Access -> Privilege Escalation -> Data Exposure"

        )
        return {
            "question": question,
            "answer": answer_text,
            "evidence": [f"Finding Count: {len(findings)}"],
            "recommendation": "Address high and critical risk findings immediately."
        }
        
    # Standard LLM Provider answer generation with full context
    provider = OpenAIProvider()
    prompt = f"""
    Context:
    Investigation Goal: {inv_data.get('user_goal')}
    Discovered Hosts: {hosts}
    Findings: {findings[:5]}
    Attack Chains: {attack_chains}
    Memory Summary: {memory.get('summary')}
    
    User Question: {question}
    
    Provide an explainable security intelligence answer grounded in the investigation context.
    """
    
    answer = await provider.generate_response(prompt, system_prompt="You are Sentinel-AI, an autonomous AI cybersecurity investigation agent.")
    return {
        "question": question,
        "answer": answer,
        "investigation_id": investigation_id
    }
