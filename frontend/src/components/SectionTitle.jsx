// SectionTitle — overline label + section title + optional right-aligned sub copy.
export default function SectionTitle({ eyebrow, title, sub, children, className = '' }) {
  return (
    <div className={`flex items-end justify-between gap-3 mb-3 ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">{eyebrow}</p>
        )}
        <h2 className="text-base font-semibold text-[var(--text)]">{title}</h2>
      </div>
      {sub && <p className="text-xs text-[var(--text-muted)] shrink-0">{sub}</p>}
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}
