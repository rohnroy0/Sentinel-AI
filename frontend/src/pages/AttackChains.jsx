import { useState, useEffect, useMemo } from 'react';
import { getAttackChains, getInvestigationStatus } from '../api/investigationService';
import { ReactFlow, Controls, Background, Handle, Position, MarkerType, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitBranch, ShieldAlert, Server, Wrench, AlertTriangle, Sparkles, ChevronDown } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useTheme } from '../theme/useTheme';

function readCssVar(name) {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function classifyNode(node) {
  const t = (node.type || node.kind || node.category || '').toLowerCase();
  const id = (node.id || '').toLowerCase();
  const label = (node.label || node.name || node.title || '').toLowerCase();
  if (id.startsWith('remediation:') || t === 'remediation' || label.startsWith('fix ') || label.startsWith('patch ')) return 'remediation';
  if (t === 'cve' || id.startsWith('cve-') || id.startsWith('cve:')) return 'cve';
  if (t === 'mitre' || id.startsWith('mitre-tech') || id.startsWith('mitre:')) return 'mitre';
  if (t === 'asset' || id === 'mitre-start' || id.startsWith('asset:')) return 'asset';
  if (t === 'service' || id.startsWith('service:') || id.startsWith('service-')) return 'service';
  if (t === 'finding' || id.startsWith('finding:') || id.startsWith('finding-') || t === 'vulnerability') return 'finding';
  if (id.startsWith('mitre-') || id.startsWith('chain:') || t === 'attack-chain' || t === 'chain') return 'chain';
  if (label.includes('attack chain') || label.includes('initial access') || label.includes('privilege escalation')) return 'chain';
  if (label.includes('fix') || label.includes('remediat')) return 'remediation';
  return 'node';
}

const KIND_META = {
  asset:       { Icon: Server,         tone: 'asset',       label: 'ASSET' },
  service:     { Icon: Server,         tone: 'service',     label: 'SERVICE' },
  finding:     { Icon: AlertTriangle,  tone: 'finding',     label: 'FINDING' },
  cve:         { Icon: ShieldAlert,    tone: 'cve',         label: 'CVE' },
  mitre:       { Icon: GitBranch,      tone: 'mitre',       label: 'MITRE' },
  chain:       { Icon: GitBranch,      tone: 'chain',       label: 'ATTACK STAGE' },
  remediation: { Icon: Wrench,         tone: 'remediation', label: 'REMEDIATION' },
  node:        { Icon: GitBranch,      tone: 'node',        label: 'NODE' },
};

const TONE_CLS = {
  asset:       'bg-[var(--sidebar)] border-[var(--sidebar-active)] text-[var(--brand)]',
  service:     'bg-[var(--info-bg)] border-[var(--info-border)] text-[var(--info)]',
  finding:     'bg-[var(--danger-bg)] border-[var(--danger-border)] text-[var(--danger)]',
  cve:         'bg-rose-500/10 border-rose-500/30 text-rose-400',
  mitre:       'bg-purple-500/10 border-purple-500/30 text-purple-400',
  chain:       'bg-[var(--sidebar)] border-[var(--sidebar-active)] text-[var(--brand-accent)]',
  remediation: 'bg-[var(--success-bg)] border-[var(--success-border)] text-[var(--success)]',
  node:        'bg-[var(--surface-2)] border-[var(--border-strong)] text-[var(--text-muted)]',
};

function ChainNode({ data }) {
  const tone = data._tone || 'node';
  const meta = KIND_META[tone] || KIND_META.node;
  const Icon = meta.Icon;
  const confText = data.confidence_score ? `${data.confidence_score}% Conf` : (data.confidence ? `${data.confidence} Conf` : null);
  const severity = data.severity || 'Info';

  return (
    <div
      className="rounded-xl border shadow-sm w-[320px] bg-[var(--surface)] text-[var(--text)] transition-all hover:shadow-md relative"
      style={{ borderColor: 'var(--border)' }}
    >
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-[var(--brand)] !border-[var(--surface)]" />
      <div className={`flex items-center justify-between px-3.5 py-2 rounded-t-[11px] border-b ${TONE_CLS[tone]}`}
           style={{ borderBottomColor: 'var(--border)' }}>
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest truncate">{data._kindLabel || tone}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {severity && severity !== 'Info' && (
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--surface)] text-inherit border border-current/30">
              {severity}
            </span>
          )}
          {confText && (
            <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--text-muted)]">
              {confText}
            </span>
          )}
        </div>
      </div>
      <div className="px-3.5 py-3">
        <p className="text-sm font-semibold leading-snug break-words">{data.label}</p>
        
        {data.meta && Array.isArray(data.meta) && data.meta.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {data.meta.map((m, i) => (
              <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] break-words">
                {m}
              </span>
            ))}
          </div>
        )}

        <details className="mt-3 group border-t border-[var(--border)] pt-2 relative">
          <summary className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] cursor-pointer hover:text-[var(--text)] list-none flex items-center justify-between">
            <span>Detailed Evidence & Info</span>
            <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform text-[var(--text-subtle)]" />
          </summary>
          <div className="mt-2.5 space-y-2 text-xs">
            {data.host && (
              <div className="flex items-center justify-between border-b border-[var(--border)]/50 pb-1">
                <span className="text-[var(--text-muted)]">Host</span>
                <span className="font-mono text-[var(--brand)]">{data.host}</span>
              </div>
            )}
            {data.port && (
              <div className="flex items-center justify-between border-b border-[var(--border)]/50 pb-1">
                <span className="text-[var(--text-muted)]">Port</span>
                <span className="font-mono">{data.port}</span>
              </div>
            )}
            {data.service && (
              <div className="flex items-center justify-between border-b border-[var(--border)]/50 pb-1">
                <span className="text-[var(--text-muted)]">Service</span>
                <span className="font-mono">{data.service} {data.version || ''}</span>
              </div>
            )}
            {data.cve && (
              <div className="flex items-center justify-between border-b border-[var(--border)]/50 pb-1">
                <span className="text-[var(--text-muted)]">CVE</span>
                <span className="font-mono text-[var(--danger)]">{data.cve}</span>
              </div>
            )}
            {data.impact && (
              <div className="pt-1">
                <span className="block text-[10px] uppercase text-[var(--text-muted)] mb-0.5">Impact</span>
                <span className="block text-[var(--text)] leading-relaxed break-words">{data.impact}</span>
              </div>
            )}
            {data.evidence && typeof data.evidence === 'string' && (
              <div className="pt-1">
                <span className="block text-[10px] uppercase text-[var(--text-muted)] mb-1">Evidence</span>
                <div className="bg-[var(--bg)] p-2 rounded-lg border border-[var(--border)] font-mono text-[10px] leading-relaxed break-words whitespace-pre-wrap text-[var(--text-muted)]">
                  {data.evidence.replace(/^Evidence:\s*/i, '')}
                </div>
              </div>
            )}
            {tone === 'remediation' && data.fix_action && (
              <div className="pt-1">
                <span className="block text-[10px] uppercase text-[var(--success)] mb-1 font-bold">Recommendation</span>
                <div className="bg-[var(--success-bg)]/30 text-[var(--success)] p-2 rounded-lg border border-[var(--success-border)] break-words leading-relaxed">
                  {data.fix_action}
                </div>
                {data.reason && (
                  <p className="mt-1.5 text-[10px] text-[var(--text-muted)] italic break-words">
                    <span className="font-semibold not-italic">Why: </span>{data.reason}
                  </p>
                )}
              </div>
            )}
          </div>
        </details>
      </div>
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-[var(--brand)] !border-[var(--surface)]" />
    </div>
  );
}

const nodeTypes = { chain: ChainNode };

function estimateNodeHeight(node) {
  let h = 45; // Header
  const label = node.label || node.name || node.title || '';
  h += Math.max(1, Math.ceil(label.length / 38)) * 20;

  if (node.meta && Array.isArray(node.meta) && node.meta.length > 0) {
    h += 34; // Meta tags row
  }
  
  h += 48; // Padding and <details> summary row buffer
  
  return Math.max(h + 20, 110);
}

function layoutChains(nodes, edges) {
  if (!nodes.length) return { nodes: [], edges: [], depthCount: 0 };

  const getRank = (n) => {
    const t = classifyNode(n);
    if (t === 'asset') return 0;
    if (t === 'service') return 1;
    if (t === 'finding') return 2;
    if (t === 'cve') return 3;
    if (t === 'mitre') return 4;
    if (t === 'chain') {
      const stage = (n.stage || n.label || '').toLowerCase();
      if (stage.includes('initial access')) return 5.0;
      if (stage.includes('privilege escalation')) return 5.1;
      if (stage.includes('lateral movement')) return 5.2;
      if (stage.includes('data exposure')) return 5.3;
      return 5.9;
    }
    if (t === 'remediation') return 6.0;
    return 7;
  };

  nodes.forEach(n => {
    n._rank = getRank(n);
    n._estimatedHeight = estimateNodeHeight(n);
  });

  const uniqueRanks = Array.from(new Set(nodes.map(n => n._rank))).sort((a, b) => a - b);
  const rankToCol = new Map(uniqueRanks.map((r, i) => [r, i]));

  const nodesByCol = new Map();
  uniqueRanks.forEach((_, i) => nodesByCol.set(i, []));

  nodes.forEach(n => {
    const col = rankToCol.get(n._rank);
    nodesByCol.get(col).push(n);
  });

  const COLUMN_WIDTH = 320;
  const GAP_X = 90;
  const GAP_Y = 32;
  const PAD_X = 40;
  const PAD_Y = 40;

  const colHeights = new Map();
  let maxColHeight = 0;
  for (const [col, colNodes] of nodesByCol.entries()) {
    const h = colNodes.reduce((sum, n) => sum + n._estimatedHeight + GAP_Y, 0) - GAP_Y;
    colHeights.set(col, h);
    if (h > maxColHeight) maxColHeight = h;
  }

  const positions = new Map();
  for (const [col, colNodes] of nodesByCol.entries()) {
    let currentY = PAD_Y + Math.max(0, (maxColHeight - colHeights.get(col)) / 2);
    for (const n of colNodes) {
      positions.set(n.id, {
        x: PAD_X + col * (COLUMN_WIDTH + GAP_X),
        y: currentY
      });
      currentY += n._estimatedHeight + GAP_Y;
    }
  }

  const fmtNodes = nodes.map((n) => {
    const tone = classifyNode(n);
    const meta = KIND_META[tone] || KIND_META.node;
    const labelText = n.label || n.name || n.title || n.id || 'Node';
    return {
      ...n,
      id: n.id,
      type: 'chain',
      position: positions.get(n.id) || { x: PAD_X, y: PAD_Y },
      data: {
        ...n,
        label: labelText,
        meta: n.tags || n.evidence ? (Array.isArray(n.meta) ? n.meta : n.port ? [`port ${n.port}`] : []) : [],
        _tone: tone,
        _kindLabel: meta.label || (KIND_META[n.type?.toLowerCase()]?.label) || tone.toUpperCase(),
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });

  const fmtEdges = edges.map((e, idx) => {
    const isImportant = e.label && ['exploits', 'escalates', 'pivots', 'exfiltrates', 'mitigated by'].includes(e.label.toLowerCase());
    return {
      id: (e.id || `${e.source}→${e.target}`) + `-${idx}`,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      animated: true,
      style: { stroke: 'var(--danger)', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--danger)' },
      label: isImportant ? e.label : undefined,
      labelStyle: { fill: 'var(--text)', fontSize: 10, fontWeight: 600 },
      labelBgStyle: { fill: 'var(--surface)', stroke: 'var(--danger)', strokeWidth: 1, rx: 4, ry: 4 },
      labelBgPadding: [6, 4],
    };
  });

  return { nodes: fmtNodes, edges: fmtEdges, depthCount: uniqueRanks.length };
}

function AutoFitBounds({ nodes }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.15, duration: 400 });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [nodes, fitView]);
  return null;
}

import { useInvestigation } from '../context/InvestigationContext';

export default function AttackChains() {
  const [raw, setRaw] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { resolved } = useTheme();
  const { investigationId: invId } = useInvestigation();

  const [bgColor, setBgColor] = useState(() => readCssVar('--border') || '#E5E7EB');

  useEffect(() => {
    const fallback = resolved === 'dark' ? '#1F2937' : '#E5E7EB';
    setBgColor(readCssVar('--border') || fallback);
  }, [resolved]);

  useEffect(() => {
    if (!invId) { setLoading(false); return; }

    let intervalId = null;

    const loadData = async () => {
      try {
        const data = await getAttackChains(invId);
        if (data && (Array.isArray(data.nodes) || Array.isArray(data.edges))) {
          setRaw(data);
        }
        setError(null);

        const statusData = await getInvestigationStatus(invId).catch(() => null);
        if (statusData && statusData.isComplete) {
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
        setError(err?.message || 'Failed to load');
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

  const { nodes, edges, depthCount } = useMemo(
    () => layoutChains(raw.nodes || [], raw.edges || []),
    [raw]
  );

  const stats = useMemo(() => {
    const counts = { service: 0, finding: 0, chain: 0, remediation: 0, node: 0 };
    for (const n of raw.nodes || []) counts[classifyNode(n)] += 1;
    return {
      total: (raw.nodes || []).length,
      steps: depthCount || 0,
      paths: (raw.edges || []).length,
      ...counts,
    };
  }, [raw, depthCount]);

  if (!invId || error) {
    return <EmptyState title="No attack path generated" description="Attack journeys are created after vulnerabilities and security weaknesses are identified from a scan." />;
  }

  if (loading) {
    return (
      <div className="p-8 text-[var(--text-muted)] flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin" />
        <span>Loading attack chains…</span>
      </div>
    );
  }


  if (!stats.total) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Investigation"
          title="Attack chains"
          description="Visualizes the likely paths an attacker could take to compromise the system."
        />
        <EmptyState title="No attack path generated" description="Attack journeys are created after vulnerabilities and security weaknesses are identified from a scan." showButton={false} />
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <PageHeader
        eyebrow="Investigation"
        title="Attack chains"
        description="Visualizes the likely paths an attacker could take to compromise the system."
      >
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] flex-wrap">
          <span className="inline-flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--border)] px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />
            <span><b className="text-[var(--text)]">{stats.total}</b> nodes</span>
          </span>
          <span className="inline-flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--border)] px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)]" />
            <span><b className="text-[var(--text)]">{stats.paths}</b> paths</span>
          </span>
          <span className="inline-flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--border)] px-2.5 py-1 rounded-full">
            <span><b className="text-[var(--text)]">{stats.steps}</b> layers deep</span>
          </span>
        </div>
      </PageHeader>

      {raw.intelligence && (
        <Card className="p-4 bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--brand)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                {raw.intelligence.title || 'Attack Path Intelligence'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger)]">
                Risk: {raw.intelligence.risk_score}/100 ({raw.intelligence.severity})
              </span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                raw.intelligence.confidence === 'High'
                  ? 'border-[var(--brand)]/30 bg-[var(--brand)]/10 text-[var(--brand)]'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
              }`}>
                {raw.intelligence.is_uncertain ? 'Uncertain / Low Confidence' : `${raw.intelligence.confidence} Confidence`}
              </span>
            </div>
          </div>
          {raw.intelligence.explanation && (
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {raw.intelligence.explanation}
            </p>
          )}
        </Card>
      )}

      <div className="w-full h-[600px] bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden relative shadow-sm">
        <div className="absolute top-4 right-4 z-10 bg-[var(--surface)] p-4 border border-[var(--border)] rounded-xl shadow-sm pointer-events-none opacity-90">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Legend</p>
          <div className="space-y-1.5 text-xs text-[var(--text)]">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--brand)]" /> Asset / Perimeter</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--info)]" /> Service</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--danger)]" /> Finding</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-rose-500" /> CVE</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-purple-500" /> MITRE</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--brand-accent)]" /> Attack Stage</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--success)]" /> Remediation</div>
            <div className="flex items-center gap-2 pt-1">
              <span className="w-6 h-0.5 bg-[var(--danger)] rounded-full" />
              Attack path
            </div>
          </div>
        </div>
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          nodeTypes={nodeTypes} 
          minZoom={0.05} 
          maxZoom={2.5} 
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
          nodesDraggable={true}
        >
          <AutoFitBounds nodes={nodes} />
          <Background color={bgColor} gap={16} />
          <Controls className="!bg-[var(--surface)] !border !border-[var(--border)] [&>button]:!bg-[var(--surface)] [&>button]:!text-[var(--text)] [&>button]:!border-[var(--border)] [&>button:hover]:!bg-[var(--bg)]" />
        </ReactFlow>
      </div>
    </div>
  );
}
