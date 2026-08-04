import { useState, useEffect } from 'react';
import {
  CheckSquare, Square, ShieldAlert, AlertTriangle,
  Terminal, Search, Filter, Target, AlertCircle, Wrench,
} from 'lucide-react';
import { getRemediation, getInvestigationStatus } from '../api/investigationService';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import SeverityChip from '../components/SeverityChip';
import PillSearch from '../components/PillSearch';

// Severity tint backgrounds / borders — kept as CSS-var classes so they follow
// the theme. Inline text color is supplied by SeverityChip already.
const severityTint = {
  Critical: 'bg-[var(--danger-bg)] border-[var(--danger-border)]',
  High:     'bg-[var(--warning-bg)] border-[var(--warning-border)]',
  Medium:   'bg-[var(--warning-bg)] border-[var(--warning-border)]',
  Low:      'bg-[var(--info-bg)] border-[var(--info-border)]',
  Info:     'bg-[var(--surface-2)] border-[var(--border)]',
};

// Difficulty text colors via severity vars (Easy→success, Hard→danger).
const difficultyText = {
  Easy: 'text-[var(--success)]',
  Medium: 'text-[var(--sev-medium)]',
  Hard: 'text-[var(--danger)]',
};

export default function Remediation() {
  const [invId, setInvId] = useState(null);
  const [remediations, setRemediations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let id = localStorage.getItem('inv_id');
    if (id === 'undefined' || id === 'null') id = null;
    if (!id) { setLoading(false); return; }
    setInvId(id);

    let intervalId = null;

    const loadData = async () => {
      try {
        const data = await getRemediation(id);
        const arr = Array.isArray(data) ? data : (data?.actions || []);
        if (arr.length > 0) setRemediations(arr);
        setError(null);

        const statusData = await getInvestigationStatus(id).catch(() => null);
        if (statusData && statusData.isComplete) {
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
        setError('Failed to fetch remediation tasks');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    intervalId = setInterval(loadData, 2000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const toggleComplete = (id) => {
    setRemediations((prev) => prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r)));
  };

  let id = localStorage.getItem('inv_id');
  if (id === 'undefined' || id === 'null') id = null;
  if (!id) {
    return <EmptyState />;
  }

  if (loading) {
    return (
      <div className="p-8 text-[var(--text-muted)] flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin" />
        <span>Loading remediation actions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md text-center mx-auto mt-12 border-[var(--danger-border)]">
        <AlertCircle className="w-12 h-12 text-[var(--danger)] mx-auto mb-3" />
        <h2 className="text-xl font-extrabold text-[var(--text)] mb-2">Error loading remediation</h2>
        <p className="text-sm text-[var(--danger)]">{error}</p>
      </Card>
    );
  }

  const filteredRemediations = remediations.filter((r) => {
    const matchesSeverity = severityFilter === 'All' || r.severity === severityFilter;
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Pending' && !r.completed) ||
      (statusFilter === 'Completed' && r.completed);
    const matchesSearch =
      (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.why || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesStatus && matchesSearch;
  });

  const stats = {
    total: remediations.length,
    critical: remediations.filter((r) => r.severity === 'Critical').length,
    completed: remediations.filter((r) => r.completed).length,
    remaining: remediations.filter((r) => !r.completed).length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Remediation"
        title="Remediation center"
        description={`Investigation ${invId?.slice(0, 8)}…${invId?.slice(-6)} · Priority-ordered fixes.`}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} sub="Recommendations" icon={Wrench} accentBg="bg-[var(--sidebar)]" accentText="text-[var(--brand)]" />
        <StatCard label="Critical" value={stats.critical} sub="Top priority" icon={AlertTriangle} accentBg="bg-[var(--danger-bg)]" accentText="text-[var(--danger)]" />
        <StatCard label="Completed" value={stats.completed} sub="Done" icon={CheckSquare} accentBg="bg-[var(--success-bg)]" accentText="text-[var(--success)]" />
        <StatCard label="Remaining" value={stats.remaining} sub="Pending" icon={Target} accentBg="bg-[var(--warning-bg)]" accentText="text-[var(--warning)]" />
      </div>

      {/* Filters */}
      <Card padding="p-4">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-[var(--text-muted)] mr-1" />
            {['All', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  severityFilter === sev
                    ? 'bg-[var(--brand)] text-white'
                    : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--border)] hover:text-[var(--text)]'
                }`}
              >
                {sev}
              </button>
            ))}
            <div className="w-px h-5 bg-[var(--border)] mx-1 hidden sm:block" />
            {['All', 'Pending', 'Completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  statusFilter === status
                    ? 'bg-[var(--text)] text-[var(--surface)]'
                    : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--border)] hover:text-[var(--text)]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="w-full lg:w-64">
            <PillSearch value={searchQuery} onChange={setSearchQuery} placeholder="Search recommendations…" />
          </div>
        </div>
      </Card>

      {/* List */}
      <div className="space-y-3">
        {filteredRemediations.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-sm text-[var(--text-muted)]">No recommendations match your filters.</p>
          </Card>
        ) : (
          filteredRemediations.map((item) => (
            <Card
              key={item.id}
              padding="p-0"
              className={`overflow-hidden transition-all ${
                item.completed ? 'opacity-60 border-[var(--success-border)] bg-[var(--success-bg)]' : ''
              }`}
            >
              <div className="flex flex-col md:flex-row">
                {/* Priority */}
                <div className="bg-[var(--bg)] p-4 md:w-24 flex md:flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[var(--border)] gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {item.priority}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Priority</span>
                </div>

                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4 gap-2 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => toggleComplete(item.id)}
                        className="text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors shrink-0"
                        aria-label="Toggle complete"
                      >
                        {item.completed ? (
                          <CheckSquare className="w-5 h-5 text-[var(--success)]" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                      <h3 className={`text-base font-semibold ${
                        item.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'
                      }`}>
                        {item.title}
                      </h3>
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <SeverityChip severity={item.severity} />
                      <span className="text-xs font-semibold bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] px-2.5 py-0.5 rounded-full">
                        {item.confidence} confidence
                      </span>
                    </div>
                  </div>

                  <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 ${item.completed ? 'opacity-60' : ''}`}>
                    <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-4">
                      <p className="text-sm font-semibold text-[var(--text)] flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
                        Why it matters
                      </p>
                      <p className="text-sm text-[var(--text-muted)] leading-relaxed">{item.why}</p>
                    </div>
                    <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-4">
                      <p className="text-sm font-semibold text-[var(--text)] flex items-center gap-2 mb-2">
                        <Terminal className="w-4 h-4 text-[var(--brand)]" />
                        Recommended fix
                      </p>
                      <code className="text-sm text-[var(--code-text)] font-mono block whitespace-pre-wrap break-words bg-[var(--surface)] border border-[var(--border)] rounded p-2">
                        {item.fix}
                      </code>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--border)] flex flex-wrap gap-x-6 gap-y-2 items-center text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[var(--text-muted)]">MITRE</span>
                      <span className="text-[var(--text)] font-mono text-xs bg-[var(--surface-2)] px-2 py-0.5 rounded border border-[var(--border)]">
                        {item.mitre}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[var(--text-muted)]">CWE</span>
                      <span className="text-[var(--text)] font-mono text-xs bg-[var(--surface-2)] px-2 py-0.5 rounded border border-[var(--border)]">
                        {item.cwe}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[var(--text-muted)]">Difficulty</span>
                      <span className={`font-semibold ${difficultyText[item.difficulty] || 'text-[var(--text-muted)]'}`}>
                        {item.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Target className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="text-[var(--brand)] font-semibold">{item.improvement}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
