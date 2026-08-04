import { useState, useEffect } from 'react';
import { getFindings, getDetectedServices } from '../api/investigationService';
import {
  ShieldAlert, Info, AlertTriangle, CheckCircle, Server, Database, BookOpen, Cpu, ScanLine,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import SeverityChip from '../components/SeverityChip';
import PillSearch from '../components/PillSearch';
import { useTheme } from '../theme/useTheme';

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

function NoMatchingFindingsSummary({ detectedServices }) {
  return (
    <Card padding="p-0">
      <div className="p-8 border-b border-[var(--border)] bg-gradient-to-br from-[var(--warning-bg)] via-[var(--surface)] to-[var(--sidebar)]">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-[var(--surface)] border border-[var(--warning-border)] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-7 h-7 text-[var(--warning)]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--warning)] mb-1">No matching findings</p>
            <h2 className="text-xl font-extrabold text-[var(--text)] mb-2">No matching security findings</h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Investigation completed — the deterministic Rule Engine evaluated the scan but found
              no applicable rule for the services detected in this environment.
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Investigation summary</p>
          <p className="text-sm text-[var(--text)] leading-relaxed">
            The investigation pipeline parsed the uploaded scan in full and forwarded{' '}
            <span className="font-semibold text-[var(--brand)]">
              {detectedServices.length} detected service{detectedServices.length === 1 ? '' : 's'}
            </span>{' '}
            to the Rule Engine. The Knowledge Base was consulted for each candidate rule and the
            Risk Engine produced no severity-graded findings. The current deterministic rule set
            contains no applicable rules for the services detected in this scan.
          </p>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-3">
            Parsing of all services continues regardless of rule coverage, so future updates to the
            Knowledge Base will be evaluated retroactively against the services already captured in
            this investigation.
          </p>
        </section>

        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-[var(--brand)]" />
            Detected services ({detectedServices.length})
          </p>
          {detectedServices.length === 0 ? (
            <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6 text-center">
              <p className="text-sm text-[var(--text-muted)]">
                The parser extracted no open ports from the scan. The upload may have been empty or
                in an unsupported format.
              </p>
            </div>
          ) : (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--bg)] text-[var(--text-muted)]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Port</th>
                    <th className="px-5 py-3 font-semibold">Service</th>
                    <th className="px-5 py-3 font-semibold">Version</th>
                    <th className="px-5 py-3 font-semibold text-right">Rule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {detectedServices.map((svc, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg)] transition-colors">
                      <td className="px-5 py-3 font-mono text-[var(--text)]">{svc.port}</td>
                      <td className="px-5 py-3 text-[var(--text)]">{svc.service}</td>
                      <td className="px-5 py-3 text-[var(--text-muted)] font-mono text-xs">{svc.version || '—'}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-xs font-semibold bg-[var(--surface-2)] text-[var(--text-muted)] px-2 py-1 rounded-full border border-[var(--border)]">
                          No rule
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-[var(--sidebar)] border border-[var(--sidebar-active)] rounded-lg p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand)] mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Recommended — extend the knowledge base
          </p>
          <p className="text-sm text-[var(--text)] leading-relaxed mb-4">
            The Sentinel deterministic Rule Engine currently covers the following services. If the
            scan you uploaded contains services outside this list, extend the Knowledge Base by
            adding the corresponding detection logic to{' '}
            <code className="bg-[var(--surface)] px-1.5 py-0.5 rounded text-[var(--brand)] text-xs font-mono border border-[var(--border)]">
              backend/ai/rule_engine/rules.py
            </code>{' '}
            and the corresponding CWE / MITRE ATT&amp;CK context to{' '}
            <code className="bg-[var(--surface)] px-1.5 py-0.5 rounded text-[var(--brand)] text-xs font-mono border border-[var(--border)]">
              backend/ai/knowledge_base/kb.py
            </code>
            . Re-run the investigation after extending the rule set to evaluate the newly covered
            services.
          </p>
          <div className="flex flex-wrap gap-2">
            {COVERED_SERVICES.map((svc) => (
              <span
                key={svc}
                className="text-xs bg-[var(--surface)] border border-[var(--sidebar-active)] text-[var(--brand)] px-2.5 py-1 rounded-full font-semibold"
              >
                {svc}
              </span>
            ))}
          </div>
        </section>

        <section className="flex items-start gap-3 text-xs text-[var(--text-muted)]">
          <Database className="w-4 h-4 mt-0.5 shrink-0 text-[var(--text-subtle)]" />
          <p className="leading-relaxed">
            The investigation decision log retains every pipeline stage executed against this scan,
            so an empty Findings page is itself an auditable record — not a skipped analysis.
          </p>
        </section>
      </div>
    </Card>
  );
}

export default function Findings() {
  const [findings, setFindings] = useState([]);
  const [detectedServices, setDetectedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const { resolved } = useTheme();
  const confMode = resolved === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    const invId = localStorage.getItem('inv_id');
    if (!invId) {
      setError('No active investigation found. Please upload a scan first.');
      setLoading(false);
      return;
    }
    Promise.all([getFindings(invId), getDetectedServices(invId)])
      .then(([f, d]) => {
        setFindings(f || []);
        setDetectedServices(d || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-[var(--text-muted)] flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin" />
        <span>Loading findings…</span>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-[var(--danger)]">{error}</div>;
  }

  const filtered = findings.filter((f) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      f.title?.toLowerCase().includes(term) ||
      (f.evidence || []).join(' ').toLowerCase().includes(term)
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
                    {finding.evidence.map((item, idx) => (
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
          <NoMatchingFindingsSummary detectedServices={detectedServices} />
        )}
      </div>
    </div>
  );
}