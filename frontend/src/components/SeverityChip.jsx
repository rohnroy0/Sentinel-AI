// SeverityChip — pill for Critical / High / Medium / Low / Info.
// Reads the active theme so right colors are picked per-light/dark.
import { SEVERITY } from '../design/colors';
import { useTheme } from '../theme/useTheme';

export default function SeverityChip({ severity = 'Info', size = 'sm', className = '' }) {
  const { resolved } = useTheme();
  const mode = resolved === 'dark' ? 'dark' : 'light';
  const entry = SEVERITY[severity] || SEVERITY.Info;
  const s = entry[mode];
  const sizeCls = size === 'lg' ? 'text-xs px-3 py-1' : 'text-[11px] px-2 py-0.5';
  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-wider rounded-full border ${sizeCls} ${className}`}
      style={{ color: s.text, backgroundColor: s.bg, borderColor: s.border }}
    >
      {severity}
    </span>
  );
}
