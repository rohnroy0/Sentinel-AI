// Compact 8-stage pipeline strip shared by Graph / Log / Timeline pages.
import { Clock, Cpu, FileText, Database, Activity, GitBranch, Terminal, Network, Layers } from 'lucide-react';

const STAGES = [
  { id: 'Parser', label: 'Parser', icon: FileText },
  { id: 'Rule Engine', label: 'Rule Engine', icon: Cpu },
  { id: 'Knowledge Base', label: 'KB', icon: Database },
  { id: 'Risk Engine', label: 'Risk', icon: Activity },
  { id: 'Correlation Engine', label: 'Correlation', icon: Network },
  { id: 'Attack Chain Builder', label: 'Attack Chain', icon: GitBranch },
  { id: 'LLM', label: 'LLM', icon: Terminal },
  { id: 'Report Generator', label: 'Report', icon: Layers },
];

export default function TimelineStrip({ activeStage, onSelect }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 flex items-center overflow-x-auto shadow-sm">
      <div className="flex items-center mr-3 shrink-0">
        <Clock className="w-4 h-4 text-[var(--text-muted)] mr-2" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Pipeline</span>
      </div>
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const active = activeStage === stage.id;
          return (
            <div key={stage.id} className="flex items-center">
              <button
                type="button"
                onClick={() => onSelect && onSelect(active ? null : stage.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  active
                    ? 'bg-[var(--brand)] text-white shadow-sm'
                    : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--border)] hover:text-[var(--text)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{stage.label}</span>
              </button>
              {idx < STAGES.length - 1 && (
                <div className={`w-3 h-px mx-1 ${active ? 'bg-[var(--brand)]/30' : 'bg-[var(--border)]'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { STAGES };
