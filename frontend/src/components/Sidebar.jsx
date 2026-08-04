import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  ShieldAlert,
  GitBranch,
  Network,
  CheckSquare,
  Activity,
  Wrench,
  FileText,
  Settings as SettingsIcon,
  Menu,
  X,
  Cpu,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const navSections = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', path: '/app/overview', icon: LayoutDashboard },
      { name: 'Upload Scan', path: '/app/upload', icon: UploadCloud },
    ],
  },
  {
    label: 'Investigation',
    items: [
      { name: 'Findings', path: '/app/findings', icon: ShieldAlert },
      { name: 'Attack Chains', path: '/app/attack-chains', icon: GitBranch },
      { name: 'Investigation Graph', path: '/app/graph', icon: Network },
      { name: 'Decision Log', path: '/app/decision-log', icon: CheckSquare },
    ],
  },
  {
    label: 'Risk & Remediation',
    items: [
      { name: 'Risk Dashboard', path: '/app/risk', icon: Activity },
      { name: 'Remediation', path: '/app/remediation', icon: Wrench },
    ],
  },
  {
    label: 'Reports',
    items: [
      { name: 'Reports', path: '/app/reports', icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Settings', path: '/app/settings', icon: SettingsIcon },
    ],
  },
];

export default function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed bottom-4 right-4 p-3 bg-[var(--brand)] hover:bg-[var(--brand-700)] rounded-full z-50 shadow-lg transition-colors"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
      </button>

      {/* Sidebar container */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 bg-[var(--sidebar)] border-r border-[var(--border)] transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand block */}
        <div className="flex items-center h-20 px-5 border-b border-[var(--sidebar-active)] shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mr-3 shadow-sm">
            <Cpu className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-extrabold tracking-widest text-[var(--text)]">SENTINEL</div>
            <p className="text-[10px] text-[var(--brand-accent)] uppercase tracking-widest font-semibold -mt-0.5">AI Investigation</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-bold text-[var(--brand-accent)] uppercase tracking-widest px-3 mb-2">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center px-3 py-2.5 rounded-r-lg transition-all text-sm font-medium group border-l-4',
                          isActive
                            ? 'bg-[var(--sidebar-active)] text-[var(--brand)] border-[var(--brand)]'
                            : 'text-[var(--text-muted)] border-transparent hover:bg-[var(--surface)] hover:text-[var(--text)]'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className={clsx('w-4 h-4 mr-3 shrink-0', isActive ? 'text-[var(--brand)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text)]')} />
                          <span className="flex-1 truncate">{item.name}</span>
                          {isActive && <ChevronRight className="w-3.5 h-3.5 text-[var(--brand)] shrink-0" />}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer user card */}
        <div className="p-4 border-t border-[var(--sidebar-active)] shrink-0">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white text-xs font-bold shrink-0">
              SA
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[var(--text)] truncate">Security Admin</p>
              <p className="text-[10px] text-[var(--text-muted)] truncate">Workspace Owner</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-[var(--success)] shrink-0 ring-2 ring-[var(--success-bg)]" />
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-[var(--text)]/30 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
