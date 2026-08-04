// PillSearch — rounded-full search input with a leading icon.
import { Search } from 'lucide-react';

export default function PillSearch({ value, onChange, placeholder = 'Search…', className = '', inputClassName = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-[var(--surface)] border border-[var(--border)] rounded-full pl-10 pr-4 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/15 transition ${inputClassName}`}
      />
    </div>
  );
}
