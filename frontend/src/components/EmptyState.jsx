import { Cpu, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--sidebar)] border border-[var(--sidebar-active)] flex items-center justify-center mx-auto mb-6">
          <Cpu className="w-8 h-8 text-[var(--brand)]" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--brand)] mb-2">No Active Investigation</p>
        <h1 className="text-2xl font-extrabold text-[var(--text)] mb-3">Upload a scan or start an AI investigation to view security insights.</h1>
        <Link
          to="/app/upload"
          className="inline-flex items-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm shadow-[var(--brand)]/20 mt-4"
        >
          <Plus className="w-4 h-4" />
          <span>Start new investigation</span>
        </Link>
      </div>
    </div>
  );
}
