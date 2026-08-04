// Sentinel theme tokens — JS source of truth (mirrors design/theme.css).
// Each entry exposes { light, dark } so inline-style consumers (SeverityChip,
// InvestigationGraph nodes/edges, AttackChains styles, MiniMap nodeColor) can
// pick the active branch via useTheme(). Components that use Tailwind classes
// already get theme reactivity for free from CSS variables.

export const MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

export const colors = {
  bg: { light: '#F8F9FB', dark: '#0B1220' },
  surface: { light: '#FFFFFF', dark: '#111827' },
  surface2: { light: '#F1F3F7', dark: '#1F2937' },
  sidebar: { light: '#EEF2FF', dark: '#0F172A' },
  sidebarActive: { light: '#E0E7FF', dark: '#1E293B' },
  brand: { light: '#4F46E5', dark: '#818CF8' },
  brand700: { light: '#3730A3', dark: '#A5B4FC' },
  brandAccent: { light: '#6366F1', dark: '#A5B4FC' },
  border: { light: '#E5E7EB', dark: '#1F2937' },
  borderStrong: { light: '#CBD5E1', dark: '#374151' },
  text: { light: '#0F1B2D', dark: '#F1F5F9' },
  textMuted: { light: '#5B6B7D', dark: '#94A3B8' },
  textSubtle: { light: '#94A3B8', dark: '#64748B' },
  success: { light: '#16A34A', dark: '#22C55E' },
  successBg: { light: '#DCFCE7', dark: '#052E16' },
  warning: { light: '#D97706', dark: '#F59E0B' },
  warningBg: { light: '#FEF3C7', dark: '#3B2A05' },
  danger: { light: '#DC2626', dark: '#F87171' },
  dangerBg: { light: '#FEE2E2', dark: '#3F0F12' },
  info: { light: '#2563EB', dark: '#60A5FA' },
  infoBg: { light: '#DBEAFE', dark: '#0C2447' },
};

// Severity palette — text/bg/border/accent per Critical/High/Medium/Low/Info.
// Each branch ships a flat { text, bg, border, accent } so consumers can read
// either the active mode or both modes.
export const SEVERITY = {
  Critical: {
    light: { text: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5', accent: '#DC2626' },
    dark:  { text: '#FCA5A5', bg: '#3F0F12', border: '#7F1D1D', accent: '#F87171' },
  },
  High: {
    light: { text: '#9A3412', bg: '#FFEDD5', border: '#FDBA74', accent: '#EA580C' },
    dark:  { text: '#FDBA74', bg: '#3B1F08', border: '#7C2D12', accent: '#FB923C' },
  },
  Medium: {
    light: { text: '#92400E', bg: '#FEF3C7', border: '#FCD34D', accent: '#D97706' },
    dark:  { text: '#FCD34D', bg: '#3B2A05', border: '#78350F', accent: '#FBBF24' },
  },
  Low: {
    light: { text: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD', accent: '#2563EB' },
    dark:  { text: '#93C5FD', bg: '#0C2447', border: '#1E3A8A', accent: '#60A5FA' },
  },
  Info: {
    light: { text: '#475569', bg: '#F1F5F9', border: '#CBD5E1', accent: '#64748B' },
    dark:  { text: '#CBD5E1', bg: '#1E293B', border: '#334155', accent: '#94A3B8' },
  },
};

// 10 node kinds used by the Investigation Graph.
export const NODE_KINDS = {
  asset: {
    light: { color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' },
    dark:  { color: '#818CF8', bg: '#1E1B4B', border: '#312E81' },
    label: 'Asset',
  },
  service: {
    light: { color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
    dark:  { color: '#22D3EE', bg: '#083344', border: '#155E75' },
    label: 'Service',
  },
  evidence: {
    light: { color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' },
    dark:  { color: '#94A3B8', bg: '#1E293B', border: '#334155' },
    label: 'Evidence',
  },
  rule: {
    light: { color: '#D97706', bg: '#FFF7ED', border: '#FED7AA' },
    dark:  { color: '#FBBF24', bg: '#3B2A05', border: '#78350F' },
    label: 'Rule',
  },
  finding: {
    light: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    dark:  { color: '#F87171', bg: '#3F0F12', border: '#7F1D1D' },
    label: 'Finding',
  },
  risk: {
    light: { color: '#EA580C', bg: '#FFF7ED', border: '#FDBA74' },
    dark:  { color: '#FB923C', bg: '#3B1F08', border: '#7C2D12' },
    label: 'Risk',
  },
  mitre: {
    light: { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
    dark:  { color: '#A78BFA', bg: '#2E1065', border: '#4C1D95' },
    label: 'MITRE',
  },
  cwe: {
    light: { color: '#DB2777', bg: '#FDF2F8', border: '#FBCFE8' },
    dark:  { color: '#F472B6', bg: '#500724', border: '#831843' },
    label: 'CWE',
  },
  chain: {
    light: { color: '#6D28D9', bg: '#F5F3FF', border: '#C4B5FD' },
    dark:  { color: '#A78BFA', bg: '#2E1065', border: '#4C1D95' },
    label: 'Attack Chain',
  },
  remediation: {
    light: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
    dark:  { color: '#34D399', bg: '#022C22', border: '#064E3B' },
    label: 'Remediation',
  },
};

export const KIND_ORDER = Object.keys(NODE_KINDS);

export const EDGE_KINDS = {
  supports:       { light: '#94A3B8', dark: '#64748B' },
  'depends-on':   { light: '#64748B', dark: '#94A3B8' },
  generated:      { light: '#D97706', dark: '#FBBF24' },
  increases:      { light: '#EA580C', dark: '#FB923C' },
  'maps-to':      { light: '#7C3AED', dark: '#A78BFA' },
  correlated:     { light: '#6D28D9', dark: '#A78BFA' },
  'mitigated-by': { light: '#059669', dark: '#34D399' },
};

// Flatten a {light, dark} table into a single-mode lookup.
//   paletteFor('light') => { Primary: '#0F1B2D', ... }
//   paletteFor('dark')  => { Primary: '#F1F5F9', ... }
export function paletteFor(mode) {
  const m = mode === 'dark' ? 'dark' : 'light';
  const out = {};
  for (const [k, v] of Object.entries(colors)) {
    if (v && typeof v === 'object' && 'light' in v && 'dark' in v) out[k] = v[m];
  }
  out.SEVERITY = {};
  for (const [k, v] of Object.entries(SEVERITY)) {
    out.SEVERITY[k] = v[m];
  }
  out.NODE_KINDS = {};
  for (const [k, v] of Object.entries(NODE_KINDS)) {
    out.NODE_KINDS[k] = { color: v[m].color, bg: v[m].bg, border: v[m].border, label: v.label };
  }
  out.EDGE_KINDS = {};
  for (const [k, v] of Object.entries(EDGE_KINDS)) {
    out.EDGE_KINDS[k] = v[m];
  }
  return out;
}
