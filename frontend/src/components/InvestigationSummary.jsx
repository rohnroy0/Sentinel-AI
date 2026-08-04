// Investigation Summary — shared by /app/graph and /app/decision-log.
// Theme-aware: derives KIND_COLORS / EDGE_KIND_COLORS from the active palette.
import { useMemo } from 'react';
import {
  Server, GitBranch, AlertTriangle, ShieldAlert, Cpu, Activity,
  Clock, Hash, Crosshair, Shield, Network, Target, Boxes, FileSearch, Gavel,
  TrendingUp, Wrench, ListTree,
} from 'lucide-react';
import { NODE_KINDS, KIND_ORDER } from '../design/colors';
import { useTheme } from '../theme/useTheme';
import StatCard from './StatCard';

const KIND_ICONS = {
  asset: Server,
  service: Activity,
  evidence: FileSearch,
  rule: Gavel,
  finding: AlertTriangle,
  risk: TrendingUp,
  cve: ShieldAlert,
  mitre: Crosshair,
  cwe: Shield,
  chain: GitBranch,
  remediation: Wrench,
};

const STAT_ICONS = {
  services: Server,
  evidence: FileSearch,
  rulesEval: Hash,
  rulesMatched: ListTree,
  findings: AlertTriangle,
  critical: ShieldAlert,
  attackChains: GitBranch,
  mitre: Crosshair,
  remediations: Wrench,
  duration: Clock,
  confidence: Target,
  risk: Activity,
  graphNodes: Network,
  graphEdges: Boxes,
  decisions: AlertTriangle,
};

// Risk-tone text color — uses CSS severity vars so both themes render correctly.
const RISK_TONE = {
  Critical: 'text-[var(--sev-critical)]',
  High: 'text-[var(--sev-high)]',
  Medium: 'text-[var(--sev-medium)]',
  Low: 'text-[var(--sev-low)]',
  Info: 'text-[var(--sev-info)]',
};

// Build a theme-aware lookup table. Use this hook in any consumer that needs
// KIND_COLORS / EDGE_KIND_COLORS so they re-derive when the theme flips.
export function useKindColors() {
  const { resolved, palette } = useTheme();
  const kinds = useMemo(() => {
    const out = {};
    for (const k of KIND_ORDER) {
      const nk = NODE_KINDS[k];
      out[k] = {
        color: palette.NODE_KINDS[k].color,
        label: nk.label,
        bg: palette.NODE_KINDS[k].bg,
        border: palette.NODE_KINDS[k].border,
        Icon: KIND_ICONS[k],
      };
    }
    return out;
  }, [palette]);
  const edges = useMemo(() => ({ ...palette.EDGE_KINDS }), [palette]);
  return { kinds, edges, resolved };
}

export { KIND_ORDER };

export default function InvestigationSummary({ summary }) {
  const { resolved } = useTheme();
  if (!summary) return null;

  // Safe accessors — treat undefined/null as 0 or dash so nothing renders as "undefined"
  const n = (v) => (v !== undefined && v !== null ? v : 0);
  const s = (v) => (v !== undefined && v !== null ? String(v) : '—');

  const isDark = resolved === 'dark';

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
      {/* Header strip — gradient adapts to resolved theme. */}
      <div
        className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between gap-4 flex-wrap"
        style={{
          backgroundImage: isDark
            ? 'linear-gradient(90deg, var(--sidebar), var(--surface), var(--sidebar))'
            : 'linear-gradient(90deg, #EEF2FF, #FFFFFF, #F5F3FF)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[var(--sidebar)] border border-[var(--sidebar-active)] flex items-center justify-center">
            <Cpu className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Investigation Summary</p>
            <h2 className="text-lg font-bold text-[var(--text)] truncate">
              Host · <span className="font-mono text-[var(--brand)]">{summary.host || 'Target Host'}</span>
            </h2>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Overall Risk</p>
          <p className={`text-2xl font-extrabold ${RISK_TONE[summary.overallRisk] || 'text-[var(--text)]'}`}>
            {summary.overallRisk || 'Info'}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="p-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Services" value={n(summary.servicesDiscovered)} icon={STAT_ICONS.services} accentBg="bg-[var(--info-bg)]" accentText="text-[var(--info)]" />
        <StatCard label="Evidence" value={n(summary.evidenceCollected)} icon={STAT_ICONS.evidence} accentBg="bg-[var(--surface-2)]" accentText="text-[var(--text-muted)]" />
        <StatCard label="Rules Eval" value={n(summary.rulesEvaluated)} sub={`${n(summary.rulesMatched)} matched`} icon={STAT_ICONS.rulesEval} accentBg="bg-[var(--warning-bg)]" accentText="text-[var(--warning)]" />
        <StatCard label="Findings" value={n(summary.findingsGenerated)} sub={`${n(summary.criticalFindings)} Critical`} icon={STAT_ICONS.findings} accentBg="bg-[var(--danger-bg)]" accentText="text-[var(--danger)]" />
        <StatCard label="Attack Paths" value={n(summary.attackChainsBuilt)} icon={STAT_ICONS.attackChains} accentBg="bg-[var(--sidebar)]" accentText="text-[var(--sev-medium)]" />
        <StatCard label="MITRE Mapped" value={n(summary.mitreTechniquesMapped)} icon={STAT_ICONS.mitre} accentBg="bg-[var(--sidebar)]" accentText="text-[var(--brand)]" />
        <StatCard label="Remediations" value={n(summary.recommendedRemediations)} icon={STAT_ICONS.remediations} accentBg="bg-[var(--success-bg)]" accentText="text-[var(--success)]" />
        <StatCard label="Graph Nodes" value={n(summary.graphNodeCount)} sub={`${n(summary.graphEdgeCount)} edges`} icon={STAT_ICONS.graphNodes} accentBg="bg-[var(--sidebar)]" accentText="text-[var(--brand)]" />
        <StatCard label="Decisions" value={n(summary.decisionCount)} icon={STAT_ICONS.decisions} accentBg="bg-[var(--sidebar)]" accentText="text-[var(--brand)]" />
        <StatCard label="Duration" value={`${(+(summary.durationSeconds) || 0).toFixed(2)}s`} icon={STAT_ICONS.duration} accentBg="bg-[var(--surface-2)]" accentText="text-[var(--text-muted)]" />
        <StatCard label="Confidence" value={s(summary.assessmentConfidence)} icon={STAT_ICONS.confidence} accentBg="bg-[var(--success-bg)]" accentText="text-[var(--success)]" />
        <StatCard
          label="Risk Score"
          value={summary.overallRisk || 'Info'}
          sub={`${n(summary.criticalFindings)}C / ${n(summary.highFindings)}H / ${n(summary.mediumFindings)}M`}
          icon={STAT_ICONS.risk}
          accentBg="bg-[var(--warning-bg)]"
          accentText="text-[var(--sev-high)]"
        />
      </div>
    </div>
  );
}
