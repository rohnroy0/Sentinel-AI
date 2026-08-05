import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRiskDashboard, getFindings, getInvestigationStatus, getAllInvestigations } from '../api/investigationService';
import EmptyState from '../components/EmptyState';
import {
  ShieldAlert, Activity, ArrowRight, FileText, GitBranch,
  Download, Plus, Target, Cpu, AlertTriangle, LayoutDashboard,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import SeverityChip from '../components/SeverityChip';
import SectionTitle from '../components/SectionTitle';

import { useInvestigation } from '../context/InvestigationContext';
import { useAuth } from '../context/AuthContext';

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
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { investigationId: invId, setInvestigationId } = useInvestigation();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
          const res = await getAllInvestigations();
          if (res && res.investigations) {
            setHistory(res.investigations);
          }
        } catch (err) {
          console.error("Failed to fetch investigation history", err);
        } finally {
          setHistoryLoading(false);
        }
      };
      fetchHistory();
    }

    if (!invId) {
      setLoading(false);
      return;
    }

    let intervalId = null;

    const loadData = async () => {
      try {
        const [r, f] = await Promise.all([getRiskDashboard(invId), getFindings(invId)]);
        if (r && typeof r === 'object') setRisk(r);
        if (Array.isArray(f)) setFindings(f);
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
  }, [invId, user]);

  if (!invId || error) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="w-16 h-16 rounded-2xl bg-[var(--sidebar)] border border-[var(--sidebar-active)] flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-[var(--brand)]" />
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--text)] mb-4">Welcome to Sentinel-AI</h1>
          <p className="text-[var(--text-muted)] text-lg">
            An autonomous AI-powered security investigation platform that analyzes network scans, identifies vulnerabilities, maps attack paths, and provides remediation guidance.
          </p>
          <div className="mt-8">
            <Link
              to="/app/upload"
              className="inline-flex items-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm shadow-[var(--brand)]/20"
            >
              <Plus className="w-5 h-5" />
              <span>Start new investigation</span>
            </Link>
          </div>
        </div>

        <div className="mt-12 mb-6 flex items-center justify-between border-b border-[var(--border)] pb-2">
          <h2 className="text-xl font-bold text-[var(--text)]">Your Investigations</h2>
        </div>

        {historyLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <Card className="text-center py-12">
            <LayoutDashboard className="w-12 h-12 text-[var(--text-subtle)] mx-auto mb-3" />
            <p className="text-[var(--text)] font-semibold">No previous investigations found</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">Start a new investigation to see it here.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {history.map((inv) => (
              <Card key={inv.investigation_id} padding="p-0" className="overflow-hidden hover:border-[var(--brand-accent)] transition-colors cursor-pointer group" onClick={() => setInvestigationId(inv.investigation_id)}>
                <div className="p-4 border-b border-[var(--border)] group-hover:bg-[var(--sidebar)] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-[var(--text)] text-sm line-clamp-1 flex-1 pr-2" title={inv.user_goal || inv.scan_name || 'Investigation'}>
                      {inv.user_goal || inv.scan_name || 'Autonomous Investigation'}
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${inv.current_status === 'Error' ? 'bg-[var(--danger)]' : inv.current_status === 'Completed' || inv.current_status === 'Investigation Complete' ? 'bg-[var(--success)]' : 'bg-[var(--warning)] animate-pulse'}`} />
                    <span className="text-xs text-[var(--text-muted)] font-mono">{inv.current_status || 'Unknown'}</span>
                  </div>
                </div>
                <div className="px-4 py-3 bg-[var(--sidebar)]/50 flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>{Array.isArray(inv.vulnerabilities) ? inv.vulnerabilities.length : 0} Findings</span>
                  <div className="flex items-center gap-1 font-semibold text-[var(--brand)] group-hover:translate-x-1 transition-transform">
                    View <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--sidebar)] flex items-center justify-center shrink-0">
                <Activity className="w-6 h-6 text-[var(--info)]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)] mb-1.5">Network Analysis</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Upload Nmap scan results to discover hosts, services, and exposed attack surfaces.
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--sidebar)] flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-[var(--danger)]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)] mb-1.5">Vulnerability Intelligence</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Correlate detected services with CVEs using product and version-based matching.
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--sidebar)] flex items-center justify-center shrink-0">
                <GitBranch className="w-6 h-6 text-[var(--warning)]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)] mb-1.5">MITRE Attack Mapping</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Generate evidence-based attacker journeys using MITRE ATT&CK techniques.
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--sidebar)] flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-[var(--success)]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)] mb-1.5">Security Recommendations</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Receive prioritized remediation actions based on detected risks.
                </p>
              </div>
            </div>
          </Card>
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setInvestigationId(null)}
            className="inline-flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--bg)] text-[var(--text)] px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>All Investigations</span>
          </button>
          <Link
            to="/app/upload"
            className="inline-flex items-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New investigation</span>
          </Link>
        </div>
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
            <p className="text-sm text-[var(--text-muted)] text-center py-4">No security findings detected.</p>
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
