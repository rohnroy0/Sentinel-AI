import React, { memo } from 'react';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';

const STEPS = [
  { id: 'parsing', label: 'Parsing (10%)', matchTool: 'nmap_analyzer' },
  { id: 'vulns', label: 'CVE Intel (35%)', matchTool: 'vulnerability_lookup' },
  { id: 'risk', label: 'Risk Analysis (55%)', matchTool: 'risk_analyzer' },
  { id: 'mitre', label: 'MITRE ATT&CK (75%)', matchTool: 'threat_intelligence' },
  { id: 'graph', label: 'Attack Graph (90%)', matchTool: 'attack_graph_builder' },
  { id: 'report', label: 'Report Synthesis (100%)', matchTool: 'report_generator' },
];

function AgentTimeline({ selectedTools = [], currentStatus = '' }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-xs font-bold text-[var(--brand-accent)] uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-ping" />
          Autonomous Agent Execution Pipeline
        </h3>
        {currentStatus && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--text-muted)]">
            Status: {currentStatus}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {STEPS.map((step) => {
          const isDone = selectedTools.includes(step.matchTool);
          const isCurrent = !isDone && currentStatus.toLowerCase().includes(step.label.toLowerCase().slice(0, 4));

          return (
            <div
              key={step.id}
              className={`flex items-center p-2.5 rounded-lg border transition-all ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isCurrent
                  ? 'bg-sky-500/10 border-sky-500/40 text-sky-400 animate-pulse ring-1 ring-sky-500/20'
                  : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-muted)]'
              }`}
            >
              <div className="mr-2.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{step.label}</p>
                <p className="text-[10px] opacity-75 font-mono">
                  {isDone ? 'Completed' : isCurrent ? 'Running...' : 'Queued'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(AgentTimeline);

