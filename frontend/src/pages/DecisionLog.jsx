import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useInvestigation } from '../context/InvestigationContext';
import {
  CheckSquare, Clock, ShieldAlert, FileText, Database, Activity, GitBranch,
  Terminal, Layers, Play, Filter, Network, Server,
  AlertTriangle, Hash, ChevronRight, Cpu, Loader2,
} from 'lucide-react';
import {
  getDecisionLog, getInvestigationSummary, getFindings, getInvestigationGraph,
  getInvestigationStatus,
} from '../api/investigationService';
import InvestigationSummary from '../components/InvestigationSummary';
import TimelineStrip from '../components/TimelineStrip';
import ReplayOverlay from '../components/ReplayOverlay';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import PillSearch from '../components/PillSearch';
import EmptyState from '../components/EmptyState';

// Module chip palette — bg/border/icon. Uses CSS-var theme tokens so the chips
// stay readable in both themes. Text is supplied per-tone below.
const MODULES = {
  'Parser':              { bg: 'bg-[var(--info-bg)]',     border: 'border-[var(--info-border)]',     Icon: FileText },
  'Rule Engine':         { bg: 'bg-[var(--warning-bg)]',  border: 'border-[var(--warning-border)]',  Icon: Cpu },
  'Knowledge Base':      { bg: 'bg-[var(--sidebar)]',     border: 'border-[var(--sidebar-active)]',  Icon: Database },
  'Risk Engine':         { bg: 'bg-[var(--warning-bg)]',  border: 'border-[var(--warning-border)]',  Icon: Activity },
  'Correlation Engine':  { bg: 'bg-[var(--sidebar)]',     border: 'border-[var(--sidebar-active)]',  Icon: Network },
  'Attack Chain Builder':{ bg: 'bg-[var(--sidebar)]',     border: 'border-[var(--sidebar-active)]',  Icon: GitBranch },
  'LLM':                 { bg: 'bg-[var(--sidebar)]',     border: 'border-[var(--sidebar-active)]',  Icon: Terminal },
  'Report Generator':    { bg: 'bg-[var(--success-bg)]',  border: 'border-[var(--success-border)]',  Icon: Layers },
};

// Text tones for module chips — CSS-var inline styles so both themes are sharp.
const moduleText = {
  'Parser':              'var(--info)',
  'Rule Engine':         'var(--warning)',
  'Knowledge Base':      'var(--brand-accent)',
  'Risk Engine':         'var(--warning)',
  'Correlation Engine':  'var(--brand-accent)',
  'Attack Chain Builder':'var(--brand-accent)',
  'LLM':                 'var(--brand)',
  'Report Generator':    'var(--success)',
};

const CONFIDENCE_TONES = {
  High:   { bg: 'bg-[var(--success-bg)]', text: 'text-[var(--success)]', border: 'border-[var(--success-border)]' },
  Medium: { bg: 'bg-[var(--warning-bg)]', text: 'text-[var(--warning)]', border: 'border-[var(--warning-border)]' },
  Low:    { bg: 'bg-[var(--surface-2)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border)]' },
};

const STATUS_TONES = {
  Completed:  { bg: 'bg-[var(--success-bg)]', text: 'text-[var(--success)]', border: 'border-[var(--success-border)]' },
  Processing: { bg: 'bg-[var(--sidebar)]',    text: 'text-[var(--brand)]',   border: 'border-[var(--sidebar-active)]' },
  Failed:     { bg: 'bg-[var(--danger-bg)]',  text: 'text-[var(--danger)]',  border: 'border-[var(--danger-border)]' },
};

function timeOfDay(iso) {
  if (!iso) return '--:--:--';
  try {
    const d = new Date(iso);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}`;
  } catch {
    return '--:--:--';
  }
}

function DecisionCard({ entry }) {
  const module = MODULES[entry.module] || MODULES[entry.stage] || MODULES.Parser;
  const moduleTextColor = moduleText[entry.module] || moduleText[entry.stage] || 'var(--text-muted)';
  const conf = CONFIDENCE_TONES[entry.confidence] || CONFIDENCE_TONES.Medium;
  const status = STATUS_TONES[entry.status] || STATUS_TONES.Completed;
  const Icon = module.Icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center flex-wrap gap-2">
          <div className={`w-9 h-9 rounded-lg ${module.bg} ${module.border} border flex items-center justify-center`}>
            <Icon className="w-4 h-4" style={{ color: moduleTextColor }} />
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${module.bg} ${module.border}`}
            style={{ color: moduleTextColor }}
          >
            {entry.stage}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${conf.bg} ${conf.text} ${conf.border}`}>
            {entry.confidence} Confidence
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${status.bg} ${status.text} ${status.border}`}>
            {entry.status}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-mono">
          <Clock className="w-3 h-3" />
          <span>{timeOfDay(entry.timestamp)}</span>
          <span className="text-[var(--border-strong)]">·</span>
          <span>{entry.processing_ms ?? 0} ms</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-[var(--text)] mb-3">{entry.title || entry.decision}</h3>

      {/* Why */}
      {entry.why && (
        <section className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" /> Why?
          </p>
          <p className="text-sm text-[var(--text)] leading-relaxed bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3">
            {entry.why}
          </p>
        </section>
      )}

      {/* Evidence */}
      {entry.evidence && entry.evidence.length > 0 && (
        <section className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
            <Hash className="w-3 h-3" /> Evidence Used
          </p>
          <ul className="space-y-1">
            {(Array.isArray(entry.evidence) ? entry.evidence : [String(entry.evidence)]).map((e, i) => {
              const uniqueKey = typeof e === 'string' ? e : `${i}`;
              return (
                <li key={uniqueKey} className="text-xs text-[var(--text)] bg-[var(--bg)] border border-[var(--border)] rounded px-2.5 py-1.5 font-mono break-words">
                  {e}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Outcome + Next step */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {entry.outcome && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
              <CheckSquare className="w-3 h-3" /> Outcome
            </p>
            <p className="text-sm text-[var(--success)] bg-[var(--success-bg)] border border-[var(--success-border)] rounded-lg p-2.5">
              {entry.outcome}
            </p>
          </section>
        )}
        {entry.next_step && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3" /> Next Step
            </p>
            <p className="text-sm text-[var(--brand)] bg-[var(--sidebar)] border border-[var(--sidebar-active)] rounded-lg p-2.5">
              {entry.next_step}
            </p>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-[var(--border)] flex items-center gap-3 text-[10px] text-[var(--text-muted)] font-mono">
        <Hash className="w-3 h-3" />
        <span>{entry.id?.slice(0, 8) || 'entry'}</span>
        <span className="text-[var(--border-strong)]">·</span>
        <span>{entry.timestamp ? (
          (() => {
            try { return new Date(entry.timestamp).toISOString(); }
            catch (e) { return String(entry.timestamp); }
          })()
        ) : '--:--'}</span>
      </div>
    </Card>
  );
}

export default function DecisionLog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const stageParam = searchParams.get('stage');

  const [decisions, setDecisions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [findings, setFindings] = useState([]);
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('All');
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayDecisions, setReplayDecisions] = useState([]);
  const { investigationId: invId } = useInvestigation();

  useEffect(() => {
    if (!invId) {
      setLoading(false);
      return;
    }

    let intervalId = null;

    const loadData = async () => {
      try {
        const [d, s, f, g] = await Promise.all([
          getDecisionLog(invId),
          getInvestigationSummary(invId),
          getFindings(invId),
          getInvestigationGraph(invId),
        ]);
        if (Array.isArray(d)) setDecisions(d);
        if (s) setSummary(s);
        if (Array.isArray(f)) setFindings(f);
        if (g) setGraph(g);
        setError(null);

        const statusData = await getInvestigationStatus(invId).catch(() => null);
        if (statusData && statusData.isComplete) {
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    intervalId = setInterval(loadData, 2000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [invId]);

  const handleStageSelect = useCallback(
    (stageId) => {
      const next = new URLSearchParams(searchParams);
      if (stageId) next.set('stage', stageId);
      else next.delete('stage');
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const handleReplayStart = useCallback(async () => {
    setReplayDecisions(decisions);
    setIsReplaying(true);
  }, [decisions]);

  const handleReplayStep = useCallback(() => {
    // Decision Log does not highlight graph nodes; replay shows progress only.
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return decisions.filter((d) => {
      if (stageParam && d.stage !== stageParam) return false;
      if (confidenceFilter !== 'All' && d.confidence !== confidenceFilter) return false;
      if (term) {
        const evText = Array.isArray(d.evidence) ? d.evidence.join(' ') : String(d.evidence || '');
        const hay = `${d.title || ''} ${d.decision || ''} ${d.outcome || ''} ${evText}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [decisions, stageParam, confidenceFilter, search]);

  if (loading) {
    return (
      <div className="p-8 text-[var(--text-muted)] flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--brand)]" />
          <span className="font-medium">Loading decision logs...</span>
        </div>
      </div>
    );
  }

  if (!invId || error) {
    return <EmptyState title="No investigation decisions available" description="Once an investigation starts, Sentinel-AI will record every reasoning step from parsing to final report." />;
  }



  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Audit"
        title="Decision log"
        description="Auditable record of every deterministic decision made by the Sentinel engines."
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/app/graph"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--bg)] text-[var(--text)] transition-colors"
          >
            <Network className="w-4 h-4 text-[var(--brand)]" />
            Open Investigation Graph
          </Link>
          <button
            type="button"
            onClick={handleReplayStart}
            disabled={decisions.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white shadow-sm shadow-[var(--brand)]/20 transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Replay Investigation
          </button>
        </div>
      </PageHeader>

      <InvestigationSummary summary={summary} />

      <div className="space-y-3">
        <TimelineStrip activeStage={stageParam} onSelect={handleStageSelect} />

        <Card padding="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[260px]">
              <PillSearch value={search} onChange={setSearch} placeholder="Search decisions, evidence, outcomes…" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              {['All', 'High', 'Medium', 'Low'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setConfidenceFilter(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    confidenceFilter === c
                      ? 'bg-[var(--brand)] text-white'
                      : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--border)] hover:text-[var(--text)]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="text-xs text-[var(--text-muted)] ml-auto">
              {filtered.length} / {decisions.length} decisions
              {stageParam && <span className="ml-2 text-[var(--brand)] font-semibold">· stage: {stageParam}</span>}
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        {decisions.length === 0 ? (
          <EmptyState title="No investigation decisions available" description="Once an investigation starts, Sentinel-AI will record every reasoning step from parsing to final report." showButton={false} />
        ) : filtered.length === 0 ? (
          <Card className="text-center py-12">
            <ShieldAlert className="w-12 h-12 text-[var(--text-subtle)] mx-auto mb-3" />
            <p className="text-[var(--text)] font-semibold">No decisions match the current filter</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">Adjust the search query or stage filter above.</p>
          </Card>
        ) : (
          filtered.map((entry, idx) => {
            const uniqueId = entry.id || entry.timestamp || `${entry.stage}-${idx}`;
            return <DecisionCard key={uniqueId} entry={entry} />;
          })
        )}
      </div>

      {isReplaying && (
        <ReplayOverlay
          decisions={replayDecisions}
          onStepChange={handleReplayStep}
          onClose={() => setIsReplaying(false)}
        />
      )}
    </div>
  );
}
