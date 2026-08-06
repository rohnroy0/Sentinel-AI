import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldAlert, GitBranch, AlertTriangle, Server, ArrowRight, Shield } from 'lucide-react';
import { getRiskDashboard, getInvestigationStatus } from '../api/investigationService';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import SeverityChip from '../components/SeverityChip';
import SectionTitle from '../components/SectionTitle';

// Severity bar colors via CSS severity vars — flip with the theme.
const SEVERITY_COLORS = {
  Critical: 'var(--sev-critical)',
  High: 'var(--sev-high)',
  Medium: 'var(--sev-medium)',
  Low: 'var(--sev-low)',
  Info: 'var(--sev-info)',
};

import { useInvestigation } from '../context/InvestigationContext';

export default function RiskDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { investigationId: invId } = useInvestigation();

  useEffect(() => {
    if (!invId) { setLoading(false); return; }

    let intervalId = null;

    const loadData = async () => {
      try {
        const dashboardData = await getRiskDashboard(invId);
        if (dashboardData && typeof dashboardData === 'object') {
          setData(dashboardData);
        }
        setError(null);

        const statusData = await getInvestigationStatus(invId).catch(() => null);
        if (statusData && statusData.isComplete) {
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
        setError('Failed to load risk dashboard data. Please try again.');
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

  if (!invId || error) {
    return <EmptyState title="No risk data available" description="Upload a scan to calculate risk scores and evaluate overall security posture." />;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-[var(--surface-2)] rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[var(--bg)] border border-[var(--border)] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md text-center mx-auto mt-12 border-[var(--danger-border)]">
        <AlertTriangle className="w-12 h-12 text-[var(--danger)] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[var(--text)] mb-1">Error loading data</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)] rounded-lg text-sm font-semibold transition-colors"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (!data) return null;

  const totalFindings = Object.values(data.counts || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Risk"
        title="Risk dashboard"
        description="Comprehensive overview of identified security risks and attack paths."
      />

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Overall Risk Score"
          value={data.overallScore ?? 0}
          sub={data.overallRisk || 'Unknown'}
          icon={Activity}
          accentBg="bg-[var(--sidebar)]"
          accentText="text-[var(--brand)]"
        />
        <StatCard
          label="Critical findings"
          value={data.counts?.Critical || 0}
          icon={ShieldAlert}
          accentBg="bg-[var(--danger-bg)]"
          accentText="text-[var(--danger)]"
        />
        <StatCard
          label="High findings"
          value={data.counts?.High || 0}
          icon={AlertTriangle}
          accentBg="bg-[var(--warning-bg)]"
          accentText="text-[var(--warning)]"
        />
        <StatCard
          label="Attack Graph Entities"
          value={data.graphNodesCount || data.attackChainNodesCount || (data.mostDangerousPath ? data.mostDangerousPath.split('→').length : 0)}
          icon={GitBranch}
          accentBg="bg-[var(--sidebar)]"
          accentText="text-[var(--brand-accent)]"
        />
      </div>

      {/* Risk Drivers & Score Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle eyebrow="Drivers" title="Key Risk Drivers" sub="Primary contributors to overall posture score" />
          <div className="space-y-2.5">
            {(data.riskDrivers || []).map((driver, idx) => (
              <div
                key={idx}
                className="bg-[var(--bg)] border border-[var(--border)] p-3 rounded-lg flex items-center gap-3 text-sm font-medium text-[var(--text)]"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--danger)] shrink-0" />
                <span>{driver}</span>
              </div>
            ))}
            {(!data.riskDrivers || data.riskDrivers.length === 0) && (
              <div className="text-sm text-[var(--text-muted)] text-center py-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                No specific high-risk drivers detected.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle eyebrow="Calculation" title="Risk Score Breakdown" sub="Weighted severity and surface additive" />
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center bg-[var(--bg)] p-3 rounded-lg border border-[var(--border)]">
              <span className="text-[var(--text)] font-medium">Critical Findings</span>
              <span className="font-mono text-xs text-[var(--danger)] font-bold">
                {data.counts?.Critical || 0} × 25.0 pts
              </span>
            </div>
            <div className="flex justify-between items-center bg-[var(--bg)] p-3 rounded-lg border border-[var(--border)]">
              <span className="text-[var(--text)] font-medium">High Findings</span>
              <span className="font-mono text-xs text-[var(--warning)] font-bold">
                {data.counts?.High || 0} × 14.0 pts
              </span>
            </div>
            <div className="flex justify-between items-center bg-[var(--bg)] p-3 rounded-lg border border-[var(--border)]">
              <span className="text-[var(--text)] font-medium">Exposure Factors</span>
              <span className="font-mono text-xs text-[var(--brand)] font-bold">
                {data.topServices?.length || 0} external services
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Distribution + Top findings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle eyebrow="Distribution" title="Risk by severity" />
          <div className="space-y-5">
            {data.distribution?.map((item) => {
              const percentage = totalFindings > 0 ? (item.value / totalFindings) * 100 : 0;
              const color = item.color || SEVERITY_COLORS[item.name] || SEVERITY_COLORS.Info;
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold text-[var(--text)]">{item.name}</span>
                    <span className="text-[var(--text-muted)]">
                      {item.value} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${percentage}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
            {(!data.distribution || data.distribution.length === 0) && (
              <div className="text-sm text-[var(--text-muted)] text-center py-6">No distribution data available.</div>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle eyebrow="Top" title="Top findings" />
          <div className="space-y-2">
            {data.topFindings?.map((finding, idx) => (
              <div
                key={idx}
                className="bg-[var(--bg)] border border-[var(--border)] p-4 rounded-lg flex items-start gap-3 hover:border-[var(--border-strong)] hover:bg-[var(--surface)] transition-colors"
              >
                <SeverityChip severity={finding.severity} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--text)] truncate">{finding.title}</p>
                  {finding.riskLevel && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">Risk: {finding.riskLevel}</p>
                  )}
                </div>
              </div>
            ))}
            {(!data.topFindings || data.topFindings.length === 0) && (
              <div className="text-sm text-[var(--text-muted)] text-center py-6 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                No critical findings detected.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Exposed services */}
      <Card padding="p-0">
        <div className="p-5 border-b border-[var(--border)]">
          <SectionTitle eyebrow="Network" title="Top exposed services" sub={`${data.topServices?.length || 0} service(s)`} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg)] text-[var(--text-muted)]">
              <tr>
                <th className="px-5 py-3 font-semibold">Port</th>
                <th className="px-5 py-3 font-semibold">Service</th>
                <th className="px-5 py-3 font-semibold">Severity</th>
                <th className="px-5 py-3 font-semibold">Finding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data.topServices?.map((svc, idx) => (
                <tr key={idx} className="hover:bg-[var(--bg)] transition-colors">
                  <td className="px-5 py-3 font-mono text-[var(--text)]">{svc.port}</td>
                  <td className="px-5 py-3 text-[var(--text)]">{svc.service}</td>
                  <td className="px-5 py-3"><SeverityChip severity={svc.severity} /></td>
                  <td className="px-5 py-3 text-[var(--text-muted)] truncate max-w-md" title={svc.finding}>{svc.finding}</td>
                </tr>
              ))}
              {(!data.topServices || data.topServices.length === 0) && (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
                    No exposed services detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Most dangerous path */}
      {data.mostDangerousPath && (
        <Card>
          <SectionTitle
            eyebrow="Path"
            title={`Most Dangerous Attack Path: ${data.mostDangerousPath.split('→').length} stages`}
          />
          <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-3 overflow-x-auto">
            {data.mostDangerousPath.split('→').map((node, idx, arr) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="bg-[var(--surface)] border border-[var(--border)] px-3 py-2 rounded-lg text-sm font-semibold text-[var(--text)] shadow-sm whitespace-nowrap">
                  {node.trim()}
                </div>
                {idx < arr.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-[var(--brand)] shrink-0" />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
