import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Search, X, Play, ChevronRight, ListTree,
  AlertTriangle, FileSearch, Gavel,
  TrendingUp, Wrench, Server,
} from 'lucide-react';
import { getInvestigationGraph, getFindings, getInvestigationSummary } from '../api/investigationService';
import InvestigationSummary, { useKindColors } from '../components/InvestigationSummary';
import NodeKindFilter from '../components/NodeKindFilter';
import TimelineStrip from '../components/TimelineStrip';
import ReplayOverlay from '../components/ReplayOverlay';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useTheme } from '../theme/useTheme';

const COLUMN_WIDTH = 320;
const ROW_HEIGHT = 110;
const PADDING_X = 40;
const PADDING_Y = 40;

const KIND_COLUMN_ORDER = [
  'asset', 'service', 'evidence', 'rule', 'finding',
  'risk', 'mitre', 'cwe', 'chain', 'remediation',
];

function layoutGraph(nodes) {
  const byKind = {};
  for (const n of nodes) {
    if (!byKind[n.kind]) byKind[n.kind] = [];
    byKind[n.kind].push(n);
  }
  const positioned = [];
  KIND_COLUMN_ORDER.forEach((kind, colIdx) => {
    const list = (byKind[kind] || []).slice().sort((a, b) => a.id.localeCompare(b.id));
    list.forEach((node, rowIdx) => {
      positioned.push({
        ...node,
        position: {
          x: PADDING_X + colIdx * COLUMN_WIDTH,
          y: PADDING_Y + rowIdx * ROW_HEIGHT,
        },
      });
    });
  });
  return positioned;
}

function CustomNode({ data, selected }) {
  const { kinds } = useKindColors();
  const palette = kinds[data.kind || 'evidence'] || kinds.evidence;
  const Icon = palette.Icon;

  return (
    <div
      className={`relative bg-[var(--surface)] rounded-xl border transition-all min-w-[200px] max-w-[260px] ${
        selected
          ? 'shadow-xl scale-[1.03]'
          : 'border-[var(--border)] hover:border-[var(--border-strong)]'
      }`}
      style={{
        borderColor: selected ? palette.color : undefined,
        boxShadow: selected ? `0 0 0 2px ${palette.color}55` : '0 1px 2px var(--shadow)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: palette.color, border: '2px solid var(--surface)', width: 10, height: 10 }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-[11px]"
        style={{
          backgroundColor: `${palette.color}1A`,
          borderBottom: `1px solid ${palette.color}40`,
        }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: palette.color }} />
        <span
          className="text-[9px] font-bold uppercase tracking-widest"
          style={{ color: palette.color }}
        >
          {palette.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-sm font-semibold text-[var(--text)] leading-tight truncate">{data.label}</p>
        {data.subtitle && (
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{data.subtitle}</p>
        )}
        {data.kind === 'finding' && (
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
              style={{
                color: palette.color,
                borderColor: `${palette.color}80`,
                backgroundColor: `${palette.color}15`,
              }}
            >
              {data.data?.severity || 'Info'}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">{data.data?.confidence} Confidence</span>
          </div>
        )}
        {data.kind === 'rule' && (
          <span className="inline-block mt-1.5 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg)] px-1.5 py-0.5 rounded border border-[var(--border)]">
            {data.data?.rule_id}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: palette.color, border: '2px solid var(--surface)', width: 10, height: 10 }}
      />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

function DetailPanel({ node, findings, remediation, onClose }) {
  const { kinds } = useKindColors();
  if (!node) return null;
  const data = node.data || {};
  const kind = node.kind;
  const palette = kinds[kind] || kinds.evidence;
  const Icon = palette.Icon;

  const relatedFinding = findings?.find((f) => `finding:${f.id}` === node.id);
  const relatedRem = remediation?.find((r) => `remediation:${r.title.replace(/\s+/g, '-').toLowerCase()}-${r.id.slice(0, 8)}` === node.id);

  return (
    <div className="absolute top-0 right-0 h-full w-[380px] bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl z-20 overflow-y-auto">
      <div className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] p-4 z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${palette.color}1A`, border: `1px solid ${palette.color}80` }}
            >
              <Icon className="w-5 h-5" style={{ color: palette.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: palette.color }}>
                {palette.label}
              </p>
              <h3 className="text-base font-bold text-[var(--text)] truncate">{node.label}</h3>
              {node.subtitle && <p className="text-xs text-[var(--text-muted)] truncate">{node.subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-subtle)] hover:text-[var(--text)] shrink-0"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Description</p>
          <p className="text-sm text-[var(--text)] leading-relaxed">{describeKind(kind, data)}</p>
        </section>

        {data.evidence && data.evidence.length > 0 && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
              <FileSearch className="w-3 h-3" /> Evidence
            </p>
            <ul className="space-y-1">
              {data.evidence.map((e, i) => (
                <li key={i} className="text-xs text-[var(--text)] bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1.5 font-mono break-words">
                  {e}
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.lines && data.lines.length > 0 && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
              <FileSearch className="w-3 h-3" /> Raw Evidence
            </p>
            <ul className="space-y-1">
              {data.lines.map((line, i) => (
                <li key={i} className="text-xs text-[var(--text)] bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1.5 font-mono">
                  {line}
                </li>
              ))}
            </ul>
          </section>
        )}

        {kind === 'finding' && relatedFinding && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" /> Risk Assessment
            </p>
            <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">Severity</span>
                <span className="text-xs font-bold uppercase" style={{ color: palette.color }}>
                  {data.data?.severity || 'Info'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">Confidence</span>
                <span className="text-xs text-[var(--text)]">{data.data?.confidence}</span>
              </div>
              <div className="text-xs text-[var(--text)]">{data.data?.riskLevel}</div>
            </div>
          </section>
        )}

        {(kind === 'mitre' || kind === 'cwe') && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Mapping</p>
            <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--text)]">
              {kind === 'mitre' && (
                <p>MITRE ATT&CK technique — referenced from the Knowledge Base during enrichment.</p>
              )}
              {kind === 'cwe' && (
                <p>CWE — referenced from the Knowledge Base during enrichment.</p>
              )}
            </div>
          </section>
        )}

        {relatedRem && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
              <Wrench className="w-3 h-3" /> Recommended Fix
            </p>
            <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 space-y-2">
              <code className="block text-xs text-[var(--code-text)] font-mono whitespace-pre-wrap break-words">
                {relatedRem.fix}
              </code>
              <p className="text-xs text-[var(--brand)]">{relatedRem.improvement}</p>
            </div>
            <Link
              to="/app/remediation"
              className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--brand)] hover:text-[var(--brand-700)] font-semibold"
            >
              View all remediations <ChevronRight className="w-3 h-3" />
            </Link>
          </section>
        )}

        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Raw Data</p>
          <pre className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 text-[10px] text-[var(--text)] overflow-x-auto font-mono">
{JSON.stringify(data, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  );
}

function describeKind(kind, data) {
  switch (kind) {
    case 'asset': return `The target host being investigated. ${data?.services || 0} service(s) were discovered on this host.`;
    case 'service': return `A network service discovered on port ${data?.port || '?'}. Version: ${data?.version || 'unknown'}.`;
    case 'evidence': return 'Raw evidence extracted from the scan by the Parser module.';
    case 'rule': return `Deterministic rule ${data?.rule_id || ''} executed against the evidence. Status: ${data?.status || 'Unknown'}.`;
    case 'finding': return `A candidate misconfiguration generated by ${data?.rule_id || ''}. Forwarded to the Risk Engine for severity scoring.`;
    case 'risk': return `Calculated risk condition produced by the Risk Engine for the upstream finding.`;
    case 'mitre': return 'A MITRE ATT&CK technique mapped to the upstream finding via the Knowledge Base.';
    case 'cwe': return 'A Common Weakness Enumeration reference mapped to the upstream finding via the Knowledge Base.';
    case 'chain': return 'A node in the attack chain built by the Attack Chain Builder from severity-ranked findings.';
    case 'remediation': return 'A recommended remediation action. See the Remediation Center for the full prioritized list.';
    default: return 'Graph node';
  }
}

function isConnectedTo(nodeId, otherId, edges) {
  if (nodeId === otherId) return true;
  for (const e of edges) {
    if (e.source === nodeId && e.target === otherId) return true;
    if (e.target === nodeId && e.source === otherId) return true;
  }
  return false;
}

function readCssVar(name) {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export default function InvestigationGraph() {
  const [searchParams, setSearchParams] = useSearchParams();
  const stageParam = searchParams.get('stage');
  const { resolved } = useTheme();
  const { kinds, edges: edgePalette } = useKindColors();

  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [findings, setFindings] = useState([]);
  const [remediation, setRemediation] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [selectedKinds, setSelectedKinds] = useState(() => new Set(KIND_COLUMN_ORDER));
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState(new Set());
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayDecisions, setReplayDecisions] = useState([]);

  // Background, label text, mask color depend on theme — recompute on flip.
  const [chrome, setChrome] = useState(() => ({
    bg: readCssVar('--border') || '#E5E7EB',
    labelFill: readCssVar('--text') || '#0F1B2D',
    labelBgFill: readCssVar('--surface') || '#FFFFFF',
    maskColor: `rgba(248, 249, 251, 0.85)`,
  }));
  useEffect(() => {
    const isDark = resolved === 'dark';
    const bg = readCssVar('--border') || (isDark ? '#1F2937' : '#E5E7EB');
    const labelFill = readCssVar('--text') || (isDark ? '#F1F5F9' : '#0F1B2D');
    const labelBgFill = readCssVar('--surface') || (isDark ? '#111827' : '#FFFFFF');
    const maskBg = readCssVar('--bg') || (isDark ? '#0B1220' : '#F8F9FB');
    // Convert hex mask to rgba so the overlay stays translucent.
    const r = parseInt(maskBg.slice(1, 3), 16);
    const g = parseInt(maskBg.slice(3, 5), 16);
    const b = parseInt(maskBg.slice(5, 7), 16);
    setChrome({ bg, labelFill, labelBgFill, maskColor: `rgba(${r}, ${g}, ${b}, 0.85)` });
  }, [resolved]);

  useEffect(() => {
    const invId = localStorage.getItem('inv_id');
    if (!invId) {
      setError('No active investigation found.');
      setLoading(false);
      return;
    }
    Promise.all([
      getInvestigationGraph(invId),
      getFindings(invId),
      getInvestigationSummary(invId),
    ])
      .then(([g, f, s]) => {
        setGraph(g);
        setFindings(f);
        setSummary(s);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    fetch(`http://localhost:8000/api/investigation/${invId}/remediation`)
      .then((r) => r.json())
      .then(setRemediation)
      .catch(() => {});
  }, []);

  const positionedNodes = useMemo(() => layoutGraph(graph.nodes), [graph]);
  const counts = useMemo(() => {
    const c = {};
    for (const n of graph.nodes) c[n.kind] = (c[n.kind] || 0) + 1;
    return c;
  }, [graph]);

  const filteredIds = useMemo(() => {
    const visible = new Set();
    const term = search.trim().toLowerCase();
    for (const n of positionedNodes) {
      if (!selectedKinds.has(n.kind)) continue;
      if (term) {
        const hay = `${n.label} ${n.subtitle || ''}`.toLowerCase();
        if (!hay.includes(term)) continue;
      }
      visible.add(n.id);
    }
    return visible;
  }, [positionedNodes, selectedKinds, search]);

  const styledNodes = useMemo(() => {
    return positionedNodes.map((n) => {
      const visible = filteredIds.has(n.id);
      const highlighted = highlightedNodeIds.size === 0 || highlightedNodeIds.has(n.id);
      const dimmed = !visible || (selectedNodeId && !isConnectedTo(n.id, selectedNodeId, graph.edges) && n.id !== selectedNodeId);
      const isHighlight = highlightedNodeIds.has(n.id);
      const nodeColor = kinds[n.kind]?.color || 'var(--brand)';
      return {
        ...n,
        type: 'custom',
        data: { ...n, kind: n.kind },
        style: {
          opacity: dimmed ? 0.18 : 1,
          transition: 'opacity 220ms ease, transform 220ms ease',
          outline: isHighlight ? `2px solid ${nodeColor}` : undefined,
          outlineOffset: isHighlight ? 3 : undefined,
        },
      };
    });
  }, [positionedNodes, filteredIds, highlightedNodeIds, selectedNodeId, graph.edges, kinds]);

  const styledEdges = useMemo(() => {
    return graph.edges.map((e) => {
      const srcVisible = filteredIds.has(e.source);
      const tgtVisible = filteredIds.has(e.target);
      const visible = srcVisible && tgtVisible;
      const focused = selectedNodeId && (e.source === selectedNodeId || e.target === selectedNodeId);
      const color = edgePalette[e.kind] || edgePalette.supports || 'var(--text-subtle)';
      return {
        ...e,
        source: e.source,
        target: e.target,
        label: e.label,
        type: 'smoothstep',
        animated: e.kind === 'generated' || e.kind === 'correlated' || focused,
        style: {
          stroke: color,
          strokeWidth: focused ? 3 : 1.6,
          opacity: visible ? (focused ? 1 : 0.7) : 0.08,
        },
        labelStyle: {
          fill: chrome.labelFill,
          fontSize: 10,
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: chrome.labelBgFill,
          stroke: color,
          strokeWidth: 1,
        },
        labelBgPadding: [4, 4],
      };
    });
  }, [graph.edges, filteredIds, selectedNodeId, edgePalette, chrome.labelFill, chrome.labelBgFill]);

  useEffect(() => {
    if (!stageParam) {
      setHighlightedNodeIds(new Set());
      return;
    }
    const stageToKind = {
      'Parser': new Set(['asset', 'service', 'evidence']),
      'Rule Engine': new Set(['rule']),
      'Knowledge Base': new Set(['mitre', 'cwe']),
      'Risk Engine': new Set(['risk']),
      'Correlation Engine': new Set(['finding']),
      'Attack Chain Builder': new Set(['chain']),
      'LLM': new Set([]),
      'Report Generator': new Set(['remediation']),
    };
    const kset = stageToKind[stageParam] || new Set();
    const ids = new Set(positionedNodes.filter((n) => kset.has(n.kind)).map((n) => n.id));
    setHighlightedNodeIds(ids);
  }, [stageParam, positionedNodes]);

  const handleStageSelect = useCallback(
    (stageId) => {
      const next = new URLSearchParams(searchParams);
      if (stageId) next.set('stage', stageId);
      else next.delete('stage');
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const handleNodeClick = useCallback((_evt, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => setSelectedNodeId(null), []);

  const handleReplayStart = useCallback(async () => {
    const invId = localStorage.getItem('inv_id');
    if (!invId) return;
    const decisions = await fetch(`http://localhost:8000/api/investigation/${invId}/decision-log`).then((r) => r.json());
    setReplayDecisions(decisions);
    setIsReplaying(true);
  }, []);

  const handleReplayStep = useCallback((decision) => {
    const stageToKind = {
      'Parser': new Set(['asset', 'service', 'evidence']),
      'Rule Engine': new Set(['rule']),
      'Knowledge Base': new Set(['mitre', 'cwe']),
      'Risk Engine': new Set(['risk']),
      'Correlation Engine': new Set(['finding']),
      'Attack Chain Builder': new Set(['chain']),
      'LLM': new Set([]),
      'Report Generator': new Set(['remediation']),
    };
    const kset = stageToKind[decision.stage] || new Set();
    setHighlightedNodeIds(new Set(positionedNodes.filter((n) => kset.has(n.kind)).map((n) => n.id)));
  }, [positionedNodes]);

  const selectedNode = useMemo(() => positionedNodes.find((n) => n.id === selectedNodeId), [positionedNodes, selectedNodeId]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="flex items-center space-x-3 text-[var(--text-muted)]">
          <div className="w-5 h-5 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin" />
          <span>Loading investigation graph...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center text-[var(--danger)]">
        {error}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col">
      <div className="space-y-3 mb-3">
        <PageHeader
          eyebrow="Investigation"
          title="Investigation graph"
          description="Visualize the full deterministic pipeline — assets → services → rules → findings → chains → remediations."
        />
        <InvestigationSummary summary={summary} />
        <TimelineStrip activeStage={stageParam} onSelect={handleStageSelect} />

        <Card padding="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[260px] bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5">
              <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search nodes (label or subtitle)..."
                className="flex-1 bg-transparent text-sm text-[var(--text)] focus:outline-none placeholder:text-[var(--text-subtle)]"
              />
            </div>
            <NodeKindFilter
              selected={selectedKinds}
              onToggle={(k) => {
                const next = new Set(selectedKinds);
                if (next.has(k)) next.delete(k); else next.add(k);
                setSelectedKinds(next);
              }}
              onSelectAll={() => setSelectedKinds(new Set(KIND_COLUMN_ORDER))}
              onClearAll={() => setSelectedKinds(new Set())}
              counts={counts}
            />
            <button
              type="button"
              onClick={handleReplayStart}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white shadow-sm shadow-[var(--brand)]/20 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Replay Investigation
            </button>
          </div>
        </Card>
      </div>

      <div className="relative flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
        <div className={`h-full ${selectedNode ? 'pr-[380px]' : ''}`}>
          <ReactFlow
            nodes={styledNodes}
            edges={styledEdges}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.1}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ type: 'smoothstep' }}
          >
            <Background color={chrome.bg} gap={16} />
            <Controls className="!bg-[var(--surface)] !border !border-[var(--border)] [&>button]:!bg-[var(--surface)] [&>button]:!text-[var(--text)] [&>button]:!border-[var(--border)] [&>button:hover]:!bg-[var(--bg)]" />
            <MiniMap
              nodeColor={(n) => kinds[n.data?.kind]?.color || 'var(--text-subtle)'}
              maskColor={chrome.maskColor}
              className="!bg-[var(--surface)] !border !border-[var(--border)]"
              style={{ width: 160, height: 100 }}
            />
          </ReactFlow>
        </div>

        {selectedNode && (
          <DetailPanel
            node={selectedNode}
            findings={findings}
            remediation={remediation}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      {isReplaying && (
        <ReplayOverlay
          decisions={replayDecisions}
          onStepChange={handleReplayStep}
          onClose={() => {
            setIsReplaying(false);
            setHighlightedNodeIds(new Set());
          }}
        />
      )}
    </div>
  );
}