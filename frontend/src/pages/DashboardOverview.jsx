import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRiskDashboard, getFindings } from '../api/investigationService';
import {
  ShieldAlert, Activity, ArrowRight, FileText, GitBranch,
  Download, Plus, Target, Cpu, AlertTriangle, LayoutDashboard,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import SeverityChip from '../components/SeverityChip';
import SectionTitle from '../components/SectionTitle';

// Severity bar colors — reference CSS severity vars so the bars flip with theme.
const severityColor = {
  Critical: { bar: 'var(--sev-critical)' },
  High:     { bar: 'var(--sev-high)' },
  Medium:   { bar: 'var(--sev-medium)' },
  Low:      { bar: 'var(--sev-low)' },
};

export default function DashboardOverview() {
  const [risk, setRisk] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const invId = localStorage.getItem('inv_id');

  useEffect(() => {
    if (!invId) { setLoading(false); return; }
    Promise.all([getRiskDashboard(invId), getFindings(invId)])
      .then(([r, f]) => { setRisk(r); setFindings(f); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [invId]);

  // No investigation yet — empty state
  if (!invId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--sidebar)] border border-[var(--sidebar-active)] flex items-center justify-center mx-auto mb-6">
            <Cpu className="w-8 h-8 text-[var(--brand)]" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--brand)] mb-2">No active investigation</p>
          <h1 className="text-3xl font-extrabold text-[var(--text)] mb-3">Start a Sentinel investigation</h1>
          <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
            Upload an Nmap scan and Sentinel will parse, correlate, and score all findings
            automatically across the 8-stage pipeline.
          </p>
          <Link
            to="/app/upload"
            className="inline-flex items-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm shadow-[var(--brand)]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Start new investigation</span>
          </Link>
        </div>
      </div>
    );
  }

  const totalFindings = findings.length;
  const criticalCount = risk?.counts?.Critical ?? 0;
  const highCount = risk?.counts?.High ?? 0;
  const totalCount = Object.values(risk?.counts ?? {}).reduce((a, b) => a + b, 0);
  const severities = ['Critical', 'High', 'Medium', 'Low'];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Security overview"
        description={`Investigation ${invId?.slice(0, 8)}…${invId?.slice(-6)} · Pipeline complete.`}
      >
        <Link
          to="/app/upload"
          className="inline-flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--bg)] text-[var(--text)] px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New investigation</span>
        </Link>
      </PageHeader>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          loading={loading}
          label="Overall Risk"
          value={risk?.overallRisk ?? '—'}
          sub={`Score: ${risk?.overallScore ?? '—'}/100`}
          icon={ShieldAlert}
          accentBg="bg-[var(--danger-bg)]"
          accentText="text-[var(--danger)]"
        />
        <StatCard
          loading={loading}
          label="Critical findings"
          value={criticalCount}
          sub="Require immediate action"
          icon={AlertTriangle}
          accentBg="bg-[var(--danger-bg)]"
          accentText="text-[var(--danger)]"
        />
        <StatCard
          loading={loading}
          label="Total findings"
          value={totalFindings}
          sub={`${highCount} High severity`}
          icon={Activity}
          accentBg="bg-[var(--warning-bg)]"
          accentText="text-[var(--warning)]"
        />
        <StatCard
          loading={loading}
          label="AI agent status"
          value="Complete"
          sub="All pipeline stages done"
          icon={Cpu}
          accentBg="bg-[var(--success-bg)]"
          accentText="text-[var(--success)]"
        />
      </div>

      {/* Risk + Top findings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle eyebrow="Distribution" title="Risk breakdown" />
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-9 bg-[var(--surface-2)] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {severities.map((sev) => {
                const count = risk?.counts?.[sev] ?? 0;
                const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                const c = severityColor[sev];
                return (
                  <div key={sev}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.bar }} />
                        <span className="text-sm text-[var(--text)]">{sev}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[var(--text)]">{count}</span>
                        <span className="text-xs text-[var(--text-muted)] w-10 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: c.bar }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-end justify-between mb-3">
            <SectionTitle eyebrow="Top" title="Findings" />
            {findings.length > 3 && (
              <Link to="/app/findings" className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-700)] flex items-center gap-1">
                View all {findings.length}
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-[var(--surface-2)] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : findings.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No findings detected.</p>
          ) : (
            <div className="space-y-2">
              {findings.slice(0, 3).map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--bg)] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SeverityChip severity={f.severity} />
                    <span className="text-sm text-[var(--text)] truncate">{f.title}</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] shrink-0 ml-2">{f.riskLevel}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <SectionTitle eyebrow="Explore" title="Quick actions" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Full report', desc: 'Executive summary', to: '/app/reports', icon: FileText, accent: 'var(--brand)', bg: 'var(--sidebar)' },
            { label: 'Attack chains', desc: 'Visual attack paths', to: '/app/attack-chains', icon: GitBranch, accent: 'var(--danger)', bg: 'var(--danger-bg)' },
            { label: 'Risk dashboard', desc: 'Risk distribution', to: '/app/risk', icon: Activity, accent: 'var(--warning)', bg: 'var(--warning-bg)' },
            { label: 'Remediation', desc: 'Prioritized fixes', to: '/app/remediation', icon: Target, accent: 'var(--success)', bg: 'var(--success-bg)' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.to}
                className="bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] rounded-xl p-4 hover:shadow-sm transition-all flex flex-col group"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: action.bg }}
                >
                  <Icon className="w-5 h-5" style={{ color: action.accent }} />
                </div>
                <p className="text-sm font-semibold text-[var(--text)]">{action.label}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{action.desc}</p>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
