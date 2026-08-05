import { useState, useEffect } from 'react';
import { getFindings, getDetectedServices, getInvestigationStatus } from '../api/investigationService';
import EmptyState from '../components/EmptyState';
import {
  ShieldAlert, Info, AlertTriangle, CheckCircle, Server, Database, BookOpen, Cpu, ScanLine,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import SeverityChip from '../components/SeverityChip';
import PillSearch from '../components/PillSearch';
import { useTheme } from '../theme/useTheme';

import { useInvestigation } from '../context/InvestigationContext';

// Confidence chip tones — text/bg/border per High / Medium / Low.
// Pulled from the active theme so both modes stay readable.
const confidenceColors = {
  High:   { light: { text: 'var(--code-text)',  bg: 'var(--success-bg)', border: 'var(--success-border)' },
            dark:  { text: 'var(--code-text)',  bg: 'var(--success-bg)', border: 'var(--success-border)' } },
  Medium: { light: { text: '#92400E',           bg: 'var(--warning-bg)', border: 'var(--warning-border)' },
            dark:  { text: 'var(--sev-medium)', bg: 'var(--warning-bg)', border: 'var(--warning-border)' } },
  Low:    { light: { text: '#475569',           bg: 'var(--surface-2)', border: 'var(--border-strong)' },
            dark:  { text: 'var(--text-muted)', bg: 'var(--surface-2)', border: 'var(--border-strong)' } },
};

const COVERED_SERVICES = [
  'OpenSSH (Linux/Unix SSH)',
  'Apache HTTP Server',
  'FTP (vsftpd and similar)',
  'TLS 1.0 / 1.1 cipher exposure',
  'Windows Server / SMB / NetBIOS',
  'Active Directory LDAP / LDAPS',
  'Microsoft IIS',
  'Remote Desktop Protocol (RDP)',
  'Windows Remote Management (WinRM)',
  'Jenkins (CI/CD)',
  'Redis',
  'Docker Daemon',
  'Kubernetes API / Kubelet',
  'Elasticsearch',
  'MongoDB',
  'PostgreSQL',
  'MySQL',
];

export default function Findings() {
  const [findings, setFindings] = useState([]);
  const [detectedServices, setDetectedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const { resolved } = useTheme();
  const { investigationId: invId } = useInvestigation();
  const confMode = resolved === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    if (!invId) { setLoading(false); return; }

    let intervalId = null;

    const loadData = async () => {
      try {
        const [f, d] = await Promise.all([
          getFindings(invId),
          getDetectedServices(invId),
        ]);
        if (Array.isArray(f)) setFindings(f);
        if (Array.isArray(d)) setDetectedServices(d);
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

  if (!invId || error) {
    return <EmptyState title="No security findings yet" description="Upload a network scan to allow Sentinel-AI to analyze vulnerabilities and security risks." />;
  }

  if (loading) {
    return (
      <div className="p-8 text-[var(--text-muted)] flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin" />
        <span>Loading findings…</span>
      </div>
    );
  }



  const filtered = findings.filter((f) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      f.title?.toLowerCase().includes(term) ||
      (Array.isArray(f.evidence) ? f.evidence.join(' ') : String(f.evidence || '')).toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Investigation"
        title="Security findings"
        description="Deterministic analysis results evaluated by the Rule Engine."
      >
        <div className="w-full md:w-64">
          <PillSearch value={search} onChange={setSearch} placeholder="Search findings…" />
        </div>
      </PageHeader>

      <div className="space-y-4">
        {filtered.map((finding) => {
          const conf = confidenceColors[finding.confidence] || confidenceColors.Medium;
          const c = conf[confMode];
          return (
            <Card key={finding.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <SeverityChip severity={finding.severity} />
                  <h2 className="text-base font-semibold text-[var(--text)]">{finding.title}</h2>
                </div>
                <span
                  className="text-xs font-semibold border rounded-full px-2.5 py-1 inline-flex items-center gap-1"
                  style={{ color: c.text, backgroundColor: c.bg, borderColor: c.border }}
                >
                  <CheckCircle className="w-3 h-3" />
                  {finding.confidence} confidence
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                    <Info className="w-3 h-3" />
                    Evidence
                  </p>
                  <ul className="space-y-1.5 text-sm text-[var(--text)]">
                    {(Array.isArray(finding.evidence) ? finding.evidence : finding.evidence ? [String(finding.evidence)] : []).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-[var(--brand)] mt-2 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    Risk & remediation
                  </p>
                  <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">Risk level</p>
                      <p className="text-sm font-semibold text-[var(--text)]">{finding.riskLevel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">Recommended action</p>
                      <p className="text-sm text-[var(--brand)]">{finding.remediation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {findings.length === 0 && (
          <EmptyState title="No security findings yet" description="Upload a network scan to allow Sentinel-AI to analyze vulnerabilities and security risks." showButton={false} />
        )}
      </div>
    </div>
  );
}