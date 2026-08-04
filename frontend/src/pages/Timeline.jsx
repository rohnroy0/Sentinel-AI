import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2, Circle, Loader2, ArrowRight, Network, CheckSquare,
} from 'lucide-react';
import { getInvestigationStatus } from '../api/investigationService';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import Card from '../components/Card';

const PIPELINE_STAGES = [
  { id: 'Parser', label: 'Scan Uploaded', short: 'Parser' },
  { id: 'Rule Engine', label: 'Applying Rules', short: 'Rule Engine' },
  { id: 'Knowledge Base', label: 'Knowledge Base Lookup', short: 'Knowledge Base' },
  { id: 'Risk Engine', label: 'Calculating Risk', short: 'Risk Engine' },
  { id: 'Correlation Engine', label: 'Correlating Findings', short: 'Correlation Engine' },
  { id: 'Attack Chain Builder', label: 'Building Attack Chains', short: 'Attack Chain Builder' },
  { id: 'LLM', label: 'LLM Analysis & Reporting', short: 'LLM' },
  { id: 'Report Generator', label: 'Investigation Complete', short: 'Report Generator' },
];

export default function Timeline() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Scan Uploaded');
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let interval;
    const fetchStatus = async () => {
      try {
        let invId = localStorage.getItem('inv_id');
        if (invId === 'undefined' || invId === 'null') invId = null;
        const targetId = id || invId;
        if (!targetId) return;

        const data = await getInvestigationStatus(targetId);
        setStatus(data.status);
        setProgress(data.progress);
        if (data.isComplete) {
          setIsComplete(true);
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch investigation status.');
        clearInterval(interval);
      }
    };
    fetchStatus();
    interval = setInterval(fetchStatus, 1500);
    return () => clearInterval(interval);
  }, [id]);

  const getCurrentStageIndex = () => {
    if (isComplete) return PIPELINE_STAGES.length - 1;
    const idx = PIPELINE_STAGES.findIndex((s) => s.label === status || s.short === status);
    return idx >= 0 ? idx : Math.floor((progress / 100) * (PIPELINE_STAGES.length - 1));
  };

  const currentStageIdx = getCurrentStageIndex();

  let invId = localStorage.getItem('inv_id');
  if (invId === 'undefined' || invId === 'null') invId = null;
  if (!id && !invId) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={isComplete ? 'Status' : 'Running'}
        title={isComplete ? 'Investigation complete' : 'AI investigation in progress'}
        description={
          isComplete
            ? "The Sentinel pipeline finished. Use the buttons below to inspect the audit trail and the graph."
            : "Sentinel's deterministic engines and LLM are analyzing the scan data."
        }
      />

      <Card padding="p-0">
        <div className="h-1 bg-[var(--surface-2)] rounded-t-xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6">
          {error ? (
            <div className="text-[var(--danger)] p-4 border border-[var(--danger-border)] rounded-lg bg-[var(--danger-bg)]">
              {error}
            </div>
          ) : (
            <div className="space-y-5 relative">
              {PIPELINE_STAGES.map((stage, idx) => {
                const isPast = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx && !isComplete;
                const isLastAndComplete = idx === PIPELINE_STAGES.length - 1 && isComplete;
                const isDone = isPast || isLastAndComplete;

                return (
                  <div
                    key={stage.id}
                    className={`relative flex items-center gap-4 transition-opacity ${
                      isDone ? 'opacity-100' : isCurrent ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    <div
                      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        isDone
                          ? 'bg-[var(--success-bg)] border-[var(--success-border)]'
                          : isCurrent
                          ? 'bg-[var(--sidebar)] border-[var(--brand)]'
                          : 'bg-[var(--surface)] border-[var(--border)]'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 text-[var(--brand)] animate-spin" />
                      ) : (
                        <Circle className="w-5 h-5 text-[var(--text-subtle)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`text-sm font-semibold ${
                          isDone ? 'text-[var(--text)]' : isCurrent ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'
                        }`}>
                          {stage.label}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                          {stage.short}
                        </span>
                      </div>
                      {isCurrent && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Processing…</p>
                      )}
                      {isDone && (
                        <Link
                          to={`/app/decision-log?stage=${encodeURIComponent(stage.id)}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--brand)] hover:text-[var(--brand-700)] mt-1"
                        >
                          View decisions from this stage
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {isComplete && (
          <div className="px-6 py-5 border-t border-[var(--border)] flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => navigate('/app/findings')}
              className="inline-flex items-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm shadow-[var(--brand)]/20"
            >
              <span>View findings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/app/graph"
              className="inline-flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--bg)] text-[var(--text)] px-5 py-2.5 rounded-xl font-semibold transition-colors"
            >
              <Network className="w-4 h-4 text-[var(--brand)]" />
              <span>Investigation graph</span>
            </Link>
            <Link
              to="/app/decision-log"
              className="inline-flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--bg)] text-[var(--text)] px-5 py-2.5 rounded-xl font-semibold transition-colors"
            >
              <CheckSquare className="w-4 h-4 text-[var(--brand)]" />
              <span>Decision log</span>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}