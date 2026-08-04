// StatCard — overline label, big bold number, accent icon top-right, optional sub copy.
import { ArrowDown, ArrowUp } from 'lucide-react';

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accentBg = 'bg-[var(--sidebar)]',
  accentText = 'text-[var(--brand)]',
  trend,
  trendColor = 'text-[var(--success)]',
  loading = false,
}) {
  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg ${accentBg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${accentText}`} />
          </div>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-20 rounded bg-[var(--surface-2)] animate-pulse" />
          <div className="h-3 w-28 rounded bg-[var(--surface-2)] animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-3xl font-bold tabular-nums text-[var(--text)] leading-tight">{value}</p>
          {(sub || trend) && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
              {trend && (
                <span className={`inline-flex items-center gap-0.5 ${trendColor} font-medium`}>
                  {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                </span>
              )}
              {sub && <span className="text-[var(--text-muted)]">{sub}</span>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
