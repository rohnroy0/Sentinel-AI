import React from 'react';
import { ShieldAlert, Info, AlertTriangle, CheckSquare } from 'lucide-react';

export default function FindingCard({ finding }) {
  if (!finding) return null;

  const severityColor =
    finding.severity === 'CRITICAL' || finding.severity === 'HIGH'
      ? 'border-red-500/40 bg-red-500/5 text-red-400'
      : finding.severity === 'MEDIUM'
      ? 'border-amber-500/40 bg-amber-500/5 text-amber-400'
      : 'border-blue-500/40 bg-blue-500/5 text-blue-400';

  return (
    <div className={`border rounded-xl p-5 mb-4 shadow-sm bg-[var(--surface)] border-[var(--border)]`}>
      <div className="flex items-center justify-between mb-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-[var(--brand)]" />
          <h4 className="text-sm font-bold text-white">
            {finding.finding || finding.service || 'Exposed Security Vulnerability'}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border ${severityColor}`}>
            {finding.severity || 'HIGH'}
          </span>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wider block mb-1">
            Reason
          </span>
          <p className="text-gray-200">{finding.reason || finding.description || 'Publicly exposed service vulnerability.'}</p>
        </div>

        {finding.confidence_score !== undefined && (
          <div className="grid grid-cols-2 gap-3 bg-gray-800/30 p-3 rounded-lg border border-gray-700/50">
            <div>
              <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wider block mb-1">
                Confidence Score
              </span>
              <p className="text-gray-200 font-mono">{finding.confidence_score}%</p>
            </div>
            <div>
              <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wider block mb-1">
                Confidence Level
              </span>
              <p className="text-gray-200 font-mono">{finding.confidence_level}</p>
            </div>
            <div className="col-span-2">
              <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wider block mb-1">
                Match Reason
              </span>
              <p className="text-blue-300/90">{finding.confidence_reason}</p>
            </div>
          </div>
        )}

        {finding.evidence && (
          <div>
            <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wider block mb-1">
              Evidence
            </span>
            <ul className="list-disc list-inside space-y-1 text-gray-300 font-mono text-[11px]">
              {Array.isArray(finding.evidence)
                ? finding.evidence.map((ev, i) => <li key={i}>{ev}</li>)
                : <li>{String(finding.evidence)}</li>}
            </ul>
          </div>
        )}

        <div>
          <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wider block mb-1">
            Impact
          </span>
          <p className="text-red-300/90">{finding.impact || finding.exploit_risk || 'Potential remote compromise.'}</p>
        </div>

        <div>
          <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wider block mb-1">
            Recommendation
          </span>
          <p className="text-emerald-300/90 font-medium">{finding.recommendation || 'Upgrade service to latest release.'}</p>
        </div>
      </div>
    </div>
  );
}
