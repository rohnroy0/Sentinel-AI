import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import AgentTimeline from '../components/AgentTimeline';
import FindingCard from '../components/FindingCard';
import AIInvestigationSummary from '../components/AIInvestigationSummary';
import AttackPathViewer from '../components/AttackPathViewer';
import ReasoningPanel from '../components/ReasoningPanel';
import AskSentinelDrawer from '../components/AskSentinelDrawer';
import {
  Cpu,
  Play,
  Upload,
  Shield,
  RefreshCw,
  Sparkles,
  Terminal,
  FileText,
  Target,
  Network,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  Layers,
  Copy,
  Trash2
} from 'lucide-react';

const SAMPLE_SCANS = {
  multiservice: {
    name: 'Multi-Service Host (SSH, Apache, MySQL, FTP)',
    data: `Nmap scan report for 192.168.1.10
Host is up (0.0010s latency).
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu
80/tcp   open  http    Apache httpd 2.4.49
3306/tcp open  mysql   MySQL 8.0.32
21/tcp   open  ftp     vsftpd 2.3.4`,
  },
  enterprise: {
    name: 'Enterprise Infrastructure (SMB, RDP, Tomcat, Jenkins)',
    data: `Nmap scan report for 10.0.100.25
Host is up (0.0008s latency).
PORT     STATE SERVICE       VERSION
445/tcp  open  microsoft-ds  Windows Server 2016 SMBv1
3389/tcp open  ms-wbt-server Microsoft Terminal Services
8080/tcp open  http-proxy    Apache Tomcat 9.0.43 (Log4j 2.14.1)
8000/tcp open  http          Jenkins 2.289`,
  },
  webminimal: {
    name: 'Minimal Web Host (Nginx HTTP/HTTPS)',
    data: `Nmap scan report for 10.0.0.5
Host is up (0.0005s latency).
PORT     STATE SERVICE  VERSION
80/tcp   open  http     nginx 1.24.0
443/tcp  open  ssl/http nginx 1.24.0`,
  },
};

const SUGGESTED_GOALS = [
  'Full Threat Audit & CVE Correlation',
  'RCE & Critical Vulnerability Detection',
  'Web Service & Exposed Database Assessment',
  'Lateral Movement & MITRE Path Mapping',
  'Fast Perimeter Exposure Triage',
];

export default function AgentConsole() {
  const [goal, setGoal] = useState('Full Threat Audit & CVE Correlation');
  const [scanData, setScanData] = useState(SAMPLE_SCANS.multiservice.data);
  const [investigationId, setInvestigationId] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [copied, setCopied] = useState(false);

  const startInvestigation = async () => {
    if (!scanData.trim() || isInvestigating) return;

    setIsInvestigating(true);
    setStatusData(null);

    try {
      const response = await fetch('http://localhost:8000/api/agent/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, scan_data: scanData }),
      });
      const data = await response.json();
      setInvestigationId(data.investigation_id);
      localStorage.setItem('inv_id', data.investigation_id);
    } catch (err) {
      console.error('Failed to start investigation:', err);
      setIsInvestigating(false);
    }
  };

  useEffect(() => {
    if (!investigationId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/agent/status/${investigationId}`);
        const data = await res.json();
        setStatusData(data);

        if (data.is_complete) {
          setIsInvestigating(false);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [investigationId]);

  const handleCopyScan = () => {
    navigator.clipboard.writeText(scanData);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const lineCount = scanData.split('\n').length;
  const byteCount = new Blob([scanData]).size;

  // Calculate execution progress percentage based on completed tools
  const completedToolCount = statusData?.selected_tools?.length || 0;
  const progressPercent = Math.min(100, Math.round((completedToolCount / 5) * 100));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="AUTONOMOUS SECURITY OPERATIONS CENTER"
        title="AI SOC Agent Console"
        description="Autonomous cybersecurity investigation engine reasoning over network exposures, correlating vulnerabilities, and mapping attack paths."
      />

      {/* AI Investigation Workflow Guide Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-[var(--border)] pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--brand-accent)]" />
            <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
              Autonomous SOC Investigation Workflow
            </h3>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[var(--brand)]/10 border border-[var(--brand)]/30 text-[var(--brand)]">
            Deterministic + Agentic LangGraph
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg flex items-start gap-2.5">
            <Terminal className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[var(--text)]">1. Scan Ingestion</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                Parses Nmap port telemetry, banners, and service versions.
              </p>
            </div>
          </div>
          <div className="p-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[var(--text)]">2. Threat Correlation</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                Matches CVEs & CVSS scores using offline cache & NVD fallback.
              </p>
            </div>
          </div>
          <div className="p-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg flex items-start gap-2.5">
            <Network className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[var(--text)]">3. Attack Path Graph</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                Builds evidence-backed MITRE ATT&CK journey & risk vector.
              </p>
            </div>
          </div>
          <div className="p-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg flex items-start gap-2.5">
            <Wrench className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[var(--text)]">4. Explainable Fixes</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                Generates 5-point root cause analysis & hardening actions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Control / Launch Panel */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[var(--brand)]" />
            <h3 className="text-xs font-bold text-[var(--brand-accent)] uppercase tracking-wider">
              Investigation Parameters
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              {lineCount} lines · {byteCount} bytes
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Investigation Goal & Presets */}
          <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[var(--brand)]" />
                    Investigation Goal / Objective
                  </span>
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  disabled={isInvestigating}
                  placeholder="e.g. Full Threat Audit & CVE Correlation"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] disabled:opacity-60 transition-colors"
                />
              </div>

              {/* Suggested Goal Examples */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Suggested Goals (Click to Apply)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_GOALS.map((suggested, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isInvestigating}
                      onClick={() => setGoal(suggested)}
                      className={`text-[11px] px-2.5 py-1 rounded-md border text-left transition-all ${
                        goal === suggested
                          ? 'border-[var(--brand)] bg-[var(--brand)]/15 text-[var(--brand)] font-semibold'
                          : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)]'
                      } disabled:opacity-50`}
                    >
                      {suggested}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample Scan Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Sample Scan Profiles
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {Object.entries(SAMPLE_SCANS).map(([key, item]) => (
                    <button
                      key={key}
                      type="button"
                      disabled={isInvestigating}
                      onClick={() => setScanData(item.data)}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] flex items-center justify-between text-left transition-all disabled:opacity-50"
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="text-[10px] font-mono opacity-60 ml-2">Load</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch Action Button */}
            <div className="pt-2">
              <button
                onClick={startInvestigation}
                disabled={isInvestigating || !scanData.trim()}
                className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 ${
                  isInvestigating
                    ? 'bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed'
                    : 'bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white active:scale-[0.99]'
                }`}
              >
                {isInvestigating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[var(--brand)]" />
                    <span>Autonomous Investigation In Progress...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Autonomous Investigation</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Large Nmap Input Editor */}
          <div className="lg:col-span-7 space-y-1.5 flex flex-col">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text)]">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[var(--brand)]" />
                Network Scan Input (Nmap / Raw Telemetry)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isInvestigating}
                  onClick={handleCopyScan}
                  className="text-[10px] px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  type="button"
                  disabled={isInvestigating}
                  onClick={() => setScanData('')}
                  className="text-[10px] px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:text-red-400 flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>
            </div>

            <textarea
              rows={11}
              value={scanData}
              onChange={(e) => setScanData(e.target.value)}
              disabled={isInvestigating}
              placeholder="Paste Nmap output, masscan logs, or raw port banner data here..."
              className="w-full flex-1 min-h-[220px] bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--text)] font-mono leading-relaxed focus:outline-none focus:border-[var(--brand)] disabled:opacity-60 resize-y transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Live Investigation Progress Banner */}
      {isInvestigating && (
        <div className="bg-[var(--surface)] border border-[var(--brand)]/40 rounded-xl p-4 shadow-md animate-pulse">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--brand)]"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand)]">
                Autonomous Agent Executing Security Tools
              </span>
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {statusData?.current_status || 'Synthesizing investigation plan...'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[var(--bg)] rounded-full h-1.5 overflow-hidden border border-[var(--border)]">
            <div
              className="bg-[var(--brand)] h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent > 0 ? progressPercent : 25}%` }}
            />
          </div>
        </div>
      )}

      {/* Investigation Progress & Timeline */}
      {statusData && (
        <>
          <AgentTimeline
            selectedTools={statusData.selected_tools || []}
            currentStatus={statusData.current_status || ''}
          />

          {/* Memory Insights Banner if available */}
          {statusData.memory_insights?.summary && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-xs text-purple-300 font-mono mb-6">
              <span className="font-bold uppercase text-[10px] tracking-wider block mb-1">Memory Engine Delta</span>
              {statusData.memory_insights.summary}
            </div>
          )}
          
          <AIInvestigationSummary statusData={statusData} />

          {/* Grid Layout for Findings, Attack Paths, and Reasoning */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-bold text-[var(--brand-accent)] uppercase tracking-wider mb-4">
                Correlated Security Findings ({statusData.findings?.length || 0})
              </h3>
              {statusData.findings && statusData.findings.length > 0 ? (
                statusData.findings.map((f, idx) => <FindingCard key={idx} finding={f} />)
              ) : (
                <div className="text-xs text-gray-500 italic p-4">Analyzing findings...</div>
              )}
            </div>

            <div className="space-y-6">
              <AttackPathViewer attackChains={statusData.attack_chains || []} />
              <ReasoningPanel
                reasoningSteps={statusData.reasoning_steps || []}
                investigationId={investigationId}
              />
            </div>
          </div>
        </>
      )}

      {/* Floating Ask Sentinel AI Copilot Drawer */}
      <AskSentinelDrawer
        investigationId={investigationId}
        statusData={statusData}
      />
    </div>
  );
}
