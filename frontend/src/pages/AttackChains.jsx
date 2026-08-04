import { useState, useEffect, useMemo } from 'react';
import { getAttackChains } from '../api/investigationService';
import { ReactFlow, Controls, Background, Handle, Position, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitBranch, ShieldAlert, Server, Wrench, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useTheme } from '../theme/useTheme';

function readCssVar(name) {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function truncate(value, max = 40) {
  if (!value) return '';
  return value.length > max ? value.slice(0, max - 1) + '…' : value;
}

// Map a node's category (service, vulnerability, attack-chain, remediation) to a
// visual treatment. We don't know the exact backend schema, so we infer from
// common fields.
function classifyNode(node) {
  const t = (node.type || node.kind || node.category || '').toLowerCase();
  const id = (node.id || '').toLowerCase();
  const label = (node.label || node.name || node.title || '').toLowerCase();
  if (id.startsWith('remediation:') || t === 'remediation' || label.startsWith('fix ') || label.startsWith('patch ')) return 'remediation';
  if (id.startsWith('chain:') || t === 'attack-chain' || t === 'chain') return 'chain';
  if (id.startsWith('finding:') || t === 'finding' || t === 'vulnerability') return 'finding';
  if (id.startsWith('service:') || id.startsWith('asset:') || t === 'service' || t === 'asset') return 'service';
  // Heuristic: longer IDs / titles with "→" usually represent the chain itself.
  if (label.includes('attack chain')) return 'chain';
  if (label.includes('fix') || label.includes('remediat')) return 'remediation';
  return 'node';
}

const KIND_META = {
  service:     { Icon: Server,         tone: 'service' },
  finding:     { Icon: AlertTriangle,  tone: 'finding' },
  chain:       { Icon: GitBranch,      tone: 'chain' },
  remediation: { Icon: Wrench,         tone: 'remediation' },
  node:        { Icon: GitBranch,      tone: 'node' },
};

// Tailwind classes per tone; these resolve via CSS variables so the panel
// follows the theme.
const TONE_CLS = {
  service:     'bg-[var(--info-bg)] border-[var(--info-border)] text-[var(--info)]',
  finding:     'bg-[var(--danger-bg)] border-[var(--danger-border)] text-[var(--danger)]',
  chain:       'bg-[var(--sidebar)] border-[var(--sidebar-active)] text-[var(--brand-accent)]',
  remediation: 'bg-[var(--success-bg)] border-[var(--success-border)] text-[var(--success)]',
  node:        'bg-[var(--surface-2)] border-[var(--border-strong)] text-[var(--text-muted)]',
};

function ChainNode({ data }) {
  const tone = data._tone || 'node';
  const meta = KIND_META[tone] || KIND_META.node;
  const Icon = meta.Icon;
  return (
    <div
      className={`rounded-xl border shadow-sm min-w-[220px] max-w-[260px] bg-[var(--surface)] text-[var(--text)]`}
      style={{ borderColor: 'var(--border)' }}
    >
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-[var(--brand)] !border-[var(--surface)]" />
      <div className={`flex items-center gap-2 px-3 py-2 rounded-t-[11px] border-b ${TONE_CLS[tone]}`}
           style={{ borderBottomColor: 'var(--border)' }}>
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-widest">{data._kindLabel || tone}</span>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-sm font-semibold leading-tight">{truncate(data.label, 60)}</p>
        {data.subLabel && (
          <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-snug">{truncate(data.subLabel, 80)}</p>
        )}
        {data.meta && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {data.meta.slice(0, 3).map((m, i) => (
              <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)]">
                {truncate(m, 18)}
              </span>
            ))}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-[var(--brand)] !border-[var(--surface)]" />
    </div>
  );
}

const nodeTypes = { chain: ChainNode };

// Build a left-to-right layered layout: each node's x = depth from sources;
// siblings at the same depth get the same x but staggered y.
function layoutChains(nodes, edges) {
  if (!nodes.length) return { nodes: [], edges: [] };

  const byId = new Map(nodes.map((n) => [n.id, { ...n, _children: [], _parents: [] }]));
  for (const e of edges) {
    const src = byId.get(e.source);
    const tgt = byId.get(e.target);
    if (src && tgt) {
      src._children.push(tgt.id);
      tgt._parents.push(src.id);
    }
  }

  // Topological depth (longest path from a source node).
  const depth = new Map();
  const computeDepth = (id, stack = new Set()) => {
    if (depth.has(id)) return depth.get(id);
    if (stack.has(id)) return 0;
    stack.add(id);
    const n = byId.get(id);
    if (!n || n._parents.length === 0) { depth.set(id, 0); return 0; }
    const d = Math.max(...n._parents.map((p) => computeDepth(p, stack) + 1));
    depth.set(id, d);
    return d;
  };
  for (const n of nodes) computeDepth(n.id);

  // Group by depth.
  const byDepth = new Map();
  for (const n of nodes) {
    const d = depth.get(n.id) || 0;
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d).push(n.id);
  }

  const COL = 300;
  const ROW = 130;
  const PAD_X = 40;
  const PAD_Y = 40;
  const depthCount = byDepth.size;

  const positions = new Map();
  for (const [d, ids] of byDepth.entries()) {
    ids.forEach((id, idx) => {
      positions.set(id, {
        x: PAD_X + d * COL,
        y: PAD_Y + idx * ROW,
      });
    });
  }

  const fmtNodes = nodes.map((n) => {
    const tone = classifyNode(n);
    const meta = KIND_META[tone] || KIND_META.node;
    const labelText = n.label || n.name || n.title || n.id || 'Node';
    const subLabel =
      n.description ||
      n.riskLevel ||
      (Array.isArray(n.services) ? `${n.services.length} service(s)` : '');
    return {
      ...n,
      id: n.id,
      type: 'chain',
      position: positions.get(n.id) || { x: PAD_X, y: PAD_Y },
      data: {
        ...n,
        label: labelText,
        subLabel,
        meta: n.tags || n.evidence || (n.port ? [`port ${n.port}`] : []),
        _tone: tone,
        _kindLabel: meta.label || (KIND_META[n.type?.toLowerCase()]?.label) || tone.toUpperCase(),
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });

  const fmtEdges = edges.map((e) => ({
    id: e.id || `${e.source}→${e.target}`,
    source: e.source,
    target: e.target,
    type: 'smoothstep',
    animated: true,
    style: { stroke: 'var(--danger)', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--danger)' },
    label: e.label,
    labelStyle: { fill: 'var(--text)', fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: 'var(--surface)', stroke: 'var(--danger)', strokeWidth: 1 },
    labelBgPadding: [4, 4],
  }));

  // Inject a top-level summary node so the graph never feels empty for users
  // with shallow data. We render it as a dashed border if no real chain exists.
  return { nodes: fmtNodes, edges: fmtEdges, depthCount, byKind: { service: 0, finding: 0, chain: 0, remediation: 0, node: 0 } };
}

export default function AttackChains() {
  const [raw, setRaw] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { resolved } = useTheme();

  const [bgColor, setBgColor] = useState(() => readCssVar('--border') || '#E5E7EB');

  useEffect(() => {
    const fallback = resolved === 'dark' ? '#1F2937' : '#E5E7EB';
    setBgColor(readCssVar('--border') || fallback);
  }, [resolved]);

  useEffect(() => {
    const invId = localStorage.getItem('inv_id');
    if (!invId) {
      setError('No active investigation found.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getAttackChains(invId)
      .then((data) => {
        if (cancelled) return;
        setRaw(data || { nodes: [], edges: [] });
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const { nodes, edges, depthCount } = useMemo(
    () => layoutChains(raw.nodes || [], raw.edges || []),
    [raw]
  );

  // Compute summary stats from raw nodes (independent of layout).
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

  if (loading) {
    return (
      <div className="p-8 text-[var(--text-muted)] flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin" />
        <span>Loading attack chains…</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md text-center">
        <ShieldAlert className="w-12 h-12 text-[var(--danger)] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[var(--text)] mb-1">Couldn't load attack chains</h2>
        <p className="text-sm text-[var(--text-muted)]">{error}</p>
      </Card>
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
        <Card className="max-w-lg mx-auto text-center py-12">
          <div className="w-14 h-14 rounded-xl bg-[var(--sidebar)] border border-[var(--sidebar-active)] flex items-center justify-center mx-auto mb-4">
            <GitBranch className="w-7 h-7 text-[var(--brand)]" />
          </div>
          <h2 className="text-xl font-extrabold text-[var(--text)] mb-2">No attack chains yet</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4 max-w-sm mx-auto">
            The Correlation Engine found no multi-step paths across the current investigation.
            Run an investigation against a host with multiple vulnerable services to see chains.
          </p>
          <ul className="text-xs text-[var(--text-muted)] max-w-sm mx-auto text-left space-y-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg p-4">
            <li>• Services are detected and parsed first</li>
            <li>• The Rule Engine grades each service</li>
            <li>• The Correlation Engine chains findings by reachable path</li>
          </ul>
        </Card>
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

      <div className="flex-1 min-h-[560px] bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden relative shadow-sm">
        <div className="absolute top-4 right-4 z-10 bg-[var(--surface)] p-4 border border-[var(--border)] rounded-xl shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Legend</p>
          <div className="space-y-1.5 text-xs text-[var(--text)]">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--info)]" /> Service</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--danger)]" /> Finding</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--brand-accent)]" /> Attack chain</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[var(--success)]" /> Remediation</div>
            <div className="flex items-center gap-2 pt-1">
              <span className="w-6 h-0.5 bg-[var(--danger)] rounded-full" />
              Attack path
            </div>
          </div>
        </div>
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.1} maxZoom={2} proOptions={{ hideAttribution: true }}>
          <Background color={bgColor} gap={16} />
          <Controls className="!bg-[var(--surface)] !border !border-[var(--border)] [&>button]:!bg-[var(--surface)] [&>button]:!text-[var(--text)] [&>button]:!border-[var(--border)] [&>button:hover]:!bg-[var(--bg)]" />
        </ReactFlow>
      </div>
    </div>
  );
}
