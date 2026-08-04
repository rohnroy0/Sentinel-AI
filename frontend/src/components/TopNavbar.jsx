import { Bell, ChevronDown, HelpCircle, PieChart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TopNavbar() {
  let invId = localStorage.getItem('inv_id');
  if (invId === 'undefined' || invId === 'null') invId = null;

  return (
    <header className="h-16 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-end px-6 shrink-0 z-10 gap-3">
      {/* Active investigation indicator */}
      {invId && (
        <Link
          to="/app/findings"
          className="hidden md:flex items-center gap-2 bg-[var(--sidebar)] border border-[var(--sidebar-active)] text-[var(--brand)] px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-[var(--sidebar-active)] transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] animate-pulse" />
          <span>Active Investigation</span>
        </Link>
      )}

      {/* Usage / plan */}
      <button
        type="button"
        className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] px-2.5 py-1.5 rounded-full hover:bg-[var(--surface-2)] transition-colors"
      >
        <PieChart className="w-3.5 h-3.5" />
        <span>Usage and plan</span>
      </button>

      {/* Help */}
      <button
        type="button"
        className="hidden md:flex items-center justify-center w-9 h-9 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* Notifications */}
      <button
        type="button"
        className="relative flex items-center justify-center w-9 h-9 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {invId && (
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-[var(--danger)] ring-2 ring-[var(--surface)]" />
        )}
      </button>

      {/* Workspace + avatar */}
      <div className="flex items-center gap-3 border-l border-[var(--border)] pl-4">
        <div className="hidden lg:flex flex-col text-right">
          <span className="text-xs font-semibold text-[var(--text)]">Security Admin</span>
          <span className="text-[10px] text-[var(--text-muted)]">Sentinel Workspace</span>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 hover:bg-[var(--surface-2)] rounded-full pl-1 pr-2 py-1 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white text-[11px] font-bold">
            SA
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        </button>
      </div>
    </header>
  );
}
