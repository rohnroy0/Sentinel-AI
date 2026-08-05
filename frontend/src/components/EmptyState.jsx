import { Cpu, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({ 
  title = "No Active Investigation", 
  description = "Upload a scan or start an AI investigation to view security insights.",
  showButton = true
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--sidebar)] border border-[var(--sidebar-active)] flex items-center justify-center mx-auto mb-6">
          <Cpu className="w-8 h-8 text-[var(--brand)]" />
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--text)] mb-3">{title}</h1>
        {description && <p className="text-[var(--text-muted)] mb-4">{description}</p>}
        {showButton && (
          <Link
            to="/app/upload"
            className="inline-flex items-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm shadow-[var(--brand)]/20 mt-4"
          >
            <Plus className="w-4 h-4" />
            <span>Start new investigation</span>
          </Link>
        )}
      </div>
    </div>
  );
}
