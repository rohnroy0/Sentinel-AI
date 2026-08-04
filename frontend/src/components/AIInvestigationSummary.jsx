import React from 'react';
import { Activity, ShieldAlert, Server, Target, CheckCircle } from 'lucide-react';

export default function AIInvestigationSummary({ statusData }) {
  if (!statusData || !statusData.final_report) return null;

  const { final_report, findings = [], discovered_hosts = [] } = statusData;

  let totalHosts = 0;
  
  if (discovered_hosts.length > 0) {
    const uniqueIPs = new Set();
    discovered_hosts.forEach(h => {
      if (h.ip) uniqueIPs.add(h.ip);
      if (h.host) uniqueIPs.add(h.host);
    });
    totalHosts = uniqueIPs.size;
  }
  
  if (!totalHosts && final_report.total_hosts) {
    totalHosts = final_report.total_hosts;
  }
  
  if (!totalHosts && findings.length > 0) {
    const uniqueHosts = new Set(findings.map(f => f.host).filter(Boolean));
    totalHosts = uniqueHosts.size;
  }

  const critical = findings.filter(f => f.severity === 'CRITICAL').length;
  const high = findings.filter(f => f.severity === 'HIGH').length;
  const medium = findings.filter(f => f.severity === 'MEDIUM').length;

  let riskLevel = final_report.overall_category || final_report.risk_level;
  if (!riskLevel || riskLevel === 'UNKNOWN') {
    if (critical > 0) riskLevel = 'CRITICAL';
    else if (high > 0) riskLevel = 'HIGH';
    else if (medium > 0) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';
  }

  const criticalFindings = findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');
  const mostDangerous = criticalFindings.length > 0 
    ? criticalFindings[0].finding || criticalFindings[0].service || 'Multiple entry points detected'
    : 'No critical entry points detected';

  const riskColor = 
    riskLevel === 'CRITICAL' ? 'text-red-500' :
    riskLevel === 'HIGH' ? 'text-orange-500' :
    riskLevel === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500';

  return (
    <div className="bg-[var(--surface-dark)] border border-[var(--border)] rounded-xl p-5 mb-6 shadow-sm">
      <h3 className="text-xs font-bold text-[var(--brand-accent)] uppercase tracking-wider mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        AI Investigation Summary
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-center">
          <span className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Overall Risk</span>
          <span className={`text-lg font-black tracking-tight ${riskColor}`}>{riskLevel}</span>
        </div>
        <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-center">
          <span className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Hosts Analyzed</span>
          <span className="text-lg font-black tracking-tight text-white flex items-center justify-center gap-1">
            <Server className="w-4 h-4 text-gray-500" /> {totalHosts}
          </span>
        </div>
        <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-center col-span-2">
          <span className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Vulnerability Severity</span>
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm font-bold text-red-400">{critical} Critical</span>
            <span className="text-sm font-bold text-orange-400">{high} High</span>
            <span className="text-sm font-bold text-amber-400">{medium} Med</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <span className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-wider mb-2">
            <Target className="w-3.5 h-3.5 text-red-400" /> Most Dangerous Entry Point
          </span>
          <span className="text-sm font-semibold text-white">{mostDangerous}</span>
        </div>
        <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <span className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-wider mb-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Top Remediation Priority
          </span>
          <span className="text-sm font-semibold text-white">
            {final_report.remediation_priorities && final_report.remediation_priorities.length > 0
              ? final_report.remediation_priorities[0]
              : 'Review critical findings immediately.'}
          </span>
        </div>
      </div>
    </div>
  );
}
