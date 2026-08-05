import { ChevronDown, HelpCircle, User } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useInvestigation } from '../context/InvestigationContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function TopNavbar() {
  const { investigationId: invId } = useInvestigation();
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

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

      {/* Help */}
      <button
        type="button"
        className="hidden md:flex items-center justify-center w-9 h-9 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* Workspace + avatar */}
      <div className="relative flex items-center gap-3 border-l border-[var(--border)] pl-4">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          type="button"
          className="flex items-center gap-2 hover:bg-[var(--surface-2)] rounded-full pl-1 pr-2 py-1 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--brand)] flex items-center justify-center text-white text-[11px] font-bold">
            <User className="w-4 h-4" />
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        </button>

        {showDropdown && (
          <div className="absolute top-12 right-0 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg py-1 z-50">
            <div className="px-4 py-2 border-b border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)] font-medium truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                setShowDropdown(false);
                signOut();
              }}
              className="w-full text-left px-4 py-2 text-sm text-[var(--danger)] hover:bg-[var(--surface-2)] transition-colors font-medium"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
