// Node kind filter chips — used by the Investigation Graph toolbar.
import { KIND_ORDER } from '../design/colors';
import { useKindColors } from './InvestigationSummary';

export default function NodeKindFilter({ selected, onToggle, onSelectAll, onClearAll, counts }) {
  const { kinds } = useKindColors();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onSelectAll}
        className="text-[11px] font-bold uppercase tracking-widest text-[var(--brand)] hover:text-[var(--brand-700)] px-2 py-1 rounded-md"
      >
        Show all
      </button>
      <span className="text-[var(--border-strong)]">|</span>
      <button
        type="button"
        onClick={onClearAll}
        className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text)] px-2 py-1 rounded-md"
      >
        Hide all
      </button>
      <span className="text-[var(--border)] mx-1">·</span>
      {KIND_ORDER.map((kind) => {
        const { color, label, Icon } = kinds[kind];
        const isActive = selected.has(kind);
        const count = counts?.[kind] || 0;
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onToggle(kind)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              isActive
                ? 'bg-[var(--surface)] border-[var(--border)] text-[var(--text)] shadow-sm'
                : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-strong)]'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: isActive ? color : 'var(--border-strong)' }}
            />
            <Icon className="w-3.5 h-3.5" style={{ color: isActive ? color : 'var(--text-subtle)' }} />
            <span>{label}</span>
            <span className="text-[10px] text-[var(--text-muted)] ml-0.5">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
