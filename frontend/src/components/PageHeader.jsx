// PageHeader — eyebrow + title + description + optional action slot.
export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--brand-accent)] mb-1">{eyebrow}</p>
        )}
        <h1 className="text-3xl font-serif font-normal text-[var(--text)] tracking-tight">{title}</h1>
        {description && <p className="text-sm text-[var(--text-muted)] mt-1.5 max-w-2xl">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}
