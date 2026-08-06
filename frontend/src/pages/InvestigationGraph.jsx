import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';

import { useSearchParams, Link } from 'react-router-dom';
import { useInvestigation } from '../context/InvestigationContext';
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
  TrendingUp, Wrench, Server, Activity, ShieldAlert,
  Crosshair, Shield, GitBranch, Globe, Layers,
} from 'lucide-react';
import {
  getInvestigationGraph, getFindings, getInvestigationSummary,
  getRemediation, getDecisionLog, getInvestigationStatus,
} from '../api/investigationService';
import EmptyState from '../components/EmptyState';
import InvestigationSummary, { useKindColors } from '../components/InvestigationSummary';
import NodeKindFilter from '../components/NodeKindFilter';
import TimelineStrip from '../components/TimelineStrip';
import ReplayOverlay from '../components/ReplayOverlay';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useTheme } from '../theme/useTheme';

const COLUMN_WIDTH = 290;
const ROW_HEIGHT = 105;
const PADDING_X = 40;
const PADDING_Y = 40;

const TECHNICAL_KIND_ORDER = [
  'asset', 'service', 'finding', 'cve', 'mitre', 'remediation',
  'evidence', 'rule', 'risk', 'cwe',
];

const ATTACK_STAGE_ORDER = [
  'Internet Exposure',
  'Initial Access',
  'Privilege Escalation',
  'Lateral Movement',
  'Data Exposure',
];

// Severity color palette helper
const SEV_COLORS = {
  Critical: { bg: 'bg-[var(--danger-bg)]', text: 'text-[var(--danger)]', border: 'border-[var(--danger)]/30' },
  High:     { bg: 'bg-[var(--warning-bg)]', text: 'text-[var(--warning)]', border: 'border-[var(--warning)]/30' },
  Medium:   { bg: 'bg-[var(--warning-bg)]', text: 'text-[var(--warning)]', border: 'border-[var(--warning)]/30' },
  Low:      { bg: 'bg-[var(--info-bg)]', text: 'text-[var(--info)]', border: 'border-[var(--info)]/30' },
  Info:     { bg: 'bg-[var(--surface-2)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border)]' },
};

function getSeverityBadge(sev) {
  const s = String(sev || 'Info').capitalize ? String(sev || 'Info').capitalize() : (sev || 'Info');
  return SEV_COLORS[s] || SEV_COLORS.Info;
}

/**
 * Layout graph nodes by Layer and group Findings hierarchically by Host.
 * Technical Layer: Host (Asset) → Services → Findings → CVE → MITRE → Remediation
 * Attack Layer: Internet Exposure → Initial Access → Privilege Escalation → Lateral Movement → Data Exposure
 */
function layoutGraph(nodes, edges = [], layerFilter = 'all') {
  if (!Array.isArray(nodes) || nodes.length === 0) return [];

  const positioned = [];
  const edgeList = Array.isArray(edges) ? edges : [];

  // ─── ATTACK LAYER ONLY ───────────────────────────────────────────────────
  if (layerFilter === 'attack') {
    const attackNodes = nodes.filter((n) => n && (n.layer === 'attack' || n.kind === 'chain'));
    
    // Sort by canonical attack stage progression
    const stageRank = {
      'Internet Exposure': 0,
      'Initial Access': 1,
      'Privilege Escalation': 2,
      'Lateral Movement': 3,
      'Data Exposure': 4,
    };

    const sortedAttack = attackNodes.slice().sort((a, b) => {
      const stageA = a.stage || a.data?.stage || a.label || '';
      const stageB = b.stage || b.data?.stage || b.label || '';
      const rankA = Object.entries(stageRank).find(([k]) => stageA.includes(k))?.[1] ?? 99;
      const rankB = Object.entries(stageRank).find(([k]) => stageB.includes(k))?.[1] ?? 99;
      return rankA - rankB;
    });

    sortedAttack.forEach((node, colIdx) => {
      positioned.push({
        ...node,
        position: {
          x: PADDING_X + colIdx * (COLUMN_WIDTH + 30),
          y: PADDING_Y + 80,
        },
      });
    });
    return positioned;
  }

  // ─── TECHNICAL LAYER & ALL LAYERS ─────────────────────────────────────────
  const techNodes = layerFilter === 'technical'
    ? nodes.filter((n) => n && n.layer !== 'attack' && n.kind !== 'chain')
    : nodes.filter((n) => n && n.layer !== 'attack' && n.kind !== 'chain');

  // 1. Partition technical nodes by Host
  const hosts = new Set();
  techNodes.forEach((n) => {
    const h = n.host || n.data?.host;
    if (h) hosts.add(h);
  });
  if (hosts.size === 0) hosts.add('Target Host');

  const hostList = Array.from(hosts);
  let currentY = PADDING_Y;

  hostList.forEach((host) => {
    // Collect nodes for this host
    const hostNodes = techNodes.filter((n) => (n.host || n.data?.host) === host || (n.kind === 'asset' && n.label === host));
    const assetNode = hostNodes.find((n) => n.kind === 'asset') || techNodes.find((n) => n.kind === 'asset');
    const serviceNodes = hostNodes.filter((n) => n.kind === 'service');
    const findingNodes = hostNodes.filter((n) => n.kind === 'finding');
    const cveNodes = hostNodes.filter((n) => n.kind === 'cve');
    const mitreNodes = hostNodes.filter((n) => n.kind === 'mitre');
    const remNodes = hostNodes.filter((n) => n.kind === 'remediation');
    const otherNodes = hostNodes.filter((n) => !['asset', 'service', 'finding', 'cve', 'mitre', 'remediation'].includes(n.kind));

    const maxItemsInCol = Math.max(
      1,
      serviceNodes.length,
      findingNodes.length,
      cveNodes.length,
      mitreNodes.length,
      remNodes.length,
      otherNodes.length
    );

    const clusterStartY = currentY;

    // Col 0: Asset / Host
    if (assetNode && !positioned.some((p) => p.id === assetNode.id)) {
      positioned.push({
        ...assetNode,
        position: {
          x: PADDING_X,
          y: clusterStartY + Math.max(0, (maxItemsInCol - 1) * ROW_HEIGHT / 2),
        },
      });
    }

    // Col 1: Services (stacked under host)
    serviceNodes.forEach((node, rIdx) => {
      positioned.push({
        ...node,
        position: {
          x: PADDING_X + COLUMN_WIDTH,
          y: clusterStartY + rIdx * ROW_HEIGHT,
        },
      });
    });

    // Col 2: Findings / Vulnerabilities (stacked under services)
    findingNodes.forEach((node, rIdx) => {
      positioned.push({
        ...node,
        position: {
          x: PADDING_X + 2 * COLUMN_WIDTH,
          y: clusterStartY + rIdx * ROW_HEIGHT,
        },
      });
    });

    // Col 3: CVEs (aligned with findings)
    cveNodes.forEach((node, rIdx) => {
      positioned.push({
        ...node,
        position: {
          x: PADDING_X + 3 * COLUMN_WIDTH,
          y: clusterStartY + rIdx * ROW_HEIGHT,
        },
      });
    });

    // Col 4: MITRE Techniques
    mitreNodes.forEach((node, rIdx) => {
      positioned.push({
        ...node,
        position: {
          x: PADDING_X + 4 * COLUMN_WIDTH,
          y: clusterStartY + rIdx * ROW_HEIGHT,
        },
      });
    });

    // Col 5: Remediations
    remNodes.forEach((node, rIdx) => {
      positioned.push({
        ...node,
        position: {
          x: PADDING_X + 5 * COLUMN_WIDTH,
          y: clusterStartY + rIdx * ROW_HEIGHT,
        },
      });
    });

    // Col 6: Supporting nodes (evidence, rule, risk, cwe)
    otherNodes.forEach((node, rIdx) => {
      positioned.push({
        ...node,
        position: {
          x: PADDING_X + 6 * COLUMN_WIDTH,
          y: clusterStartY + rIdx * ROW_HEIGHT,
        },
      });
    });

    currentY += Math.max(maxItemsInCol * ROW_HEIGHT, 140) + 40;
  });

  // If "all" layer is selected, append the Attack Layer below the technical layer
  if (layerFilter === 'all') {
    const attackNodes = nodes.filter((n) => n && (n.layer === 'attack' || n.kind === 'chain'));
    if (attackNodes.length > 0) {
      const stageRank = {
        'Internet Exposure': 0,
        'Initial Access': 1,
        'Privilege Escalation': 2,
        'Lateral Movement': 3,
        'Data Exposure': 4,
      };

      const sortedAttack = attackNodes.slice().sort((a, b) => {
        const stageA = a.stage || a.data?.stage || a.label || '';
        const stageB = b.stage || b.data?.stage || b.label || '';
        const rankA = Object.entries(stageRank).find(([k]) => stageA.includes(k))?.[1] ?? 99;
        const rankB = Object.entries(stageRank).find(([k]) => stageB.includes(k))?.[1] ?? 99;
        return rankA - rankB;
      });

      const attackStartY = currentY + 30;
      sortedAttack.forEach((node, colIdx) => {
        positioned.push({
          ...node,
          position: {
            x: PADDING_X + colIdx * (COLUMN_WIDTH + 20),
            y: attackStartY,
          },
        });
      });
    }
  }

  // Add any unpositioned nodes
  const positionedIds = new Set(positioned.map((p) => p.id));
  let unplacedIdx = 0;
  nodes.forEach((n) => {
    if (!n || positionedIds.has(n.id)) return;
    positioned.push({
      ...n,
      position: {
        x: PADDING_X + 7 * COLUMN_WIDTH,
        y: PADDING_Y + unplacedIdx * ROW_HEIGHT,
      },
    });
    unplacedIdx++;
  });

  return positioned;
}

/**
 * Compact Custom Node Component.
 * Minimal text on face (Name, Severity, Confidence) with detailed telemetry in metadata.
 * Special high-fidelity display for CVE nodes (CVE ID, Severity, Impact, Confidence).
 */
const CustomNode = memo(function CustomNode({ data, selected }) {
  const { kinds } = useKindColors();
  const kind = data.kind || 'evidence';
  const palette = kinds[kind] || kinds.evidence;
  const Icon = palette.Icon;

  const severity = data.severity || data.data?.severity || 'Info';
  const confidence = data.confidence || data.data?.confidence || 'High';
  const impact = data.impact || data.data?.impact;
  const cveId = data.cve_id || data.data?.cve_id || (kind === 'cve' ? data.label : null);

  // ─── Special High-Fidelity CVE Node Display ──────────────────────────────
  if (kind === 'cve') {
    return (
      <div
        className={`relative bg-[var(--surface)] rounded-xl border transition-all w-[240px] ${
          selected
            ? 'shadow-xl scale-[1.03]'
            : 'border-[var(--border)] hover:border-[var(--border-strong)]'
        }`}
        style={{
          borderColor: selected ? palette.color : undefined,
          boxShadow: selected ? `0 0 0 2px ${palette.color}55` : '0 1px 3px var(--shadow)',
        }}
      >
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: palette.color, border: '2px solid var(--surface)', width: 8, height: 8 }}
        />

        {/* CVE Header */}
        <div
          className="flex items-center justify-between px-3 py-1.5 rounded-t-[11px]"
          style={{
            backgroundColor: `${palette.color}18`,
            borderBottom: `1px solid ${palette.color}35`,
          }}
        >
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" style={{ color: palette.color }} />
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: palette.color }}>
              Vulnerability
            </span>
          </div>
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-[var(--surface)] text-[var(--danger)] border border-[var(--danger)]/30">
            {severity}
          </span>
        </div>

        {/* CVE Body: ID & Impact */}
        <div className="px-3 py-2 space-y-1">
          <p className="text-xs font-mono font-bold text-[var(--text)] tracking-tight truncate">
            {cveId || data.label}
          </p>
          {impact && (
            <p className="text-[10px] font-medium text-[var(--text-muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded truncate border border-[var(--border)]">
              {impact}
            </p>
          )}
          <div className="flex items-center justify-between pt-0.5 text-[9px] text-[var(--text-muted)]">
            <span>Confidence</span>
            <span className="font-semibold text-[var(--text)]">{confidence}</span>
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Right}
          style={{ background: palette.color, border: '2px solid var(--surface)', width: 8, height: 8 }}
        />
      </div>
    );
  }

  // ─── Compact Standard Node Display (Asset, Service, Finding, MITRE, Remediation, Chain) ───
  return (
    <div
      className={`relative bg-[var(--surface)] rounded-xl border transition-all w-[230px] ${
        selected
          ? 'shadow-xl scale-[1.03]'
          : 'border-[var(--border)] hover:border-[var(--border-strong)]'
      }`}
      style={{
        borderColor: selected ? palette.color : undefined,
        boxShadow: selected ? `0 0 0 2px ${palette.color}55` : '0 1px 3px var(--shadow)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: palette.color, border: '2px solid var(--surface)', width: 8, height: 8 }}
      />

      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-1.5 rounded-t-[11px]"
        style={{
          backgroundColor: `${palette.color}15`,
          borderBottom: `1px solid ${palette.color}30`,
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: palette.color }} />
          <span
            className="text-[9px] font-bold uppercase tracking-wider truncate"
            style={{ color: palette.color }}
          >
            {data.layer === 'attack' ? (data.stage || 'Attack Stage') : palette.label}
          </span>
        </div>
        {severity && severity !== 'Info' && (
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-[var(--surface)] border border-[var(--border)] shrink-0">
            {severity}
          </span>
        )}
      </div>

      {/* Compact Body: Name & Confidence */}
      <div className="px-3 py-2">
        <p className="text-xs font-semibold text-[var(--text)] leading-snug truncate" title={data.label}>
          {data.label}
        </p>
        {data.subtitle && (
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate" title={data.subtitle}>
            {data.subtitle}
          </p>
        )}

        {/* Minimal metrics footer */}
        <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-[var(--border)]/60 text-[9px] text-[var(--text-muted)]">
          <span className="truncate">{data.host ? `Host: ${data.host}` : (data.port ? `Port ${data.port}` : palette.label)}</span>
          <span className="font-medium text-[var(--text)] shrink-0">{confidence} Conf</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: palette.color, border: '2px solid var(--surface)', width: 8, height: 8 }}
      />
    </div>
  );
});

const nodeTypes = { custom: CustomNode };


/**
 * Slide-out Detail Panel.
 * Holds all extensive evidence, telemetry, rules, justifications, and CVE details.
 */
function DetailPanel({ node, findings, remediation, onClose }) {
  const { kinds } = useKindColors();
  if (!node) return null;
  const data = node.data || {};
  const kind = node.kind;
  const palette = kinds[kind] || kinds.evidence;
  const Icon = palette.Icon;

  const relatedFinding = findings?.find((f) => `finding:${f.id}` === node.id || f.title === node.label);
  const relatedRem = remediation?.find((r) => r.title === node.label || `remediation:${r.id}` === node.id);

  return (
    <div className="absolute top-0 right-0 h-full w-[400px] bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl z-20 overflow-y-auto">
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
                {node.layer === 'attack' ? 'Attack Journey Stage' : palette.label}
              </p>
              <h3 className="text-sm font-bold text-[var(--text)] truncate">{node.label}</h3>
              {node.subtitle && <p className="text-xs text-[var(--text-muted)] truncate">{node.subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-subtle)] hover:text-[var(--text)] p-1 rounded-md hover:bg-[var(--bg)] shrink-0"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Core Attributes */}
        <section className="grid grid-cols-2 gap-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3">
          <div>
            <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Severity</p>
            <p className="text-xs font-bold text-[var(--text)]">{node.severity || data.severity || 'Info'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Confidence</p>
            <p className="text-xs font-bold text-[var(--text)]">{node.confidence || data.confidence || 'High'}</p>
          </div>
          {node.host && (
            <div>
              <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Host</p>
              <p className="text-xs font-mono text-[var(--brand)]">{node.host}</p>
            </div>
          )}
          {node.port && (
            <div>
              <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Port</p>
              <p className="text-xs font-mono text-[var(--text)]">{node.port}</p>
            </div>
          )}
        </section>

        {/* CVE Specific Intelligence */}
        {kind === 'cve' && (
          <section className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[var(--danger)]" /> Vulnerability Intelligence
            </p>
            <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">CVE ID</span>
                <span className="font-mono font-bold text-[var(--brand)]">{node.cve_id || data.cve || node.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Impact Summary</span>
                <span className="font-semibold text-[var(--text)]">{node.impact || data.impact || 'Remote Code Execution'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">CVSS Base Score</span>
                <span className="font-bold text-[var(--danger)]">{data.cvss || '9.8'} / 10.0</span>
              </div>
            </div>
          </section>
        )}

        {/* Description / Summary */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Description</p>
          <p className="text-xs text-[var(--text)] leading-relaxed">{describeKind(kind, data)}</p>
        </section>

        {/* Detailed Evidence */}
        {data.evidence && data.evidence.length > 0 && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
              <FileSearch className="w-3 h-3 text-[var(--brand)]" /> Telemetry & Evidence
            </p>
            <ul className="space-y-1.5">
              {(Array.isArray(data.evidence) ? data.evidence : [String(data.evidence)]).map((e, i) => (
                <li key={i} className="text-xs text-[var(--text)] bg-[var(--bg)] border border-[var(--border)] rounded px-2.5 py-1.5 font-mono break-words">
                  {e}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Raw Parser Lines */}
        {data.lines && data.lines.length > 0 && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
              <FileSearch className="w-3 h-3" /> Raw Parser Lines
            </p>
            <ul className="space-y-1">
              {(Array.isArray(data.lines) ? data.lines : [String(data.lines)]).map((line, i) => (
                <li key={i} className="text-xs text-[var(--text)] bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 font-mono">
                  {line}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Remediation Details */}
        {(kind === 'remediation' || relatedRem) && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
              <Wrench className="w-3 h-3 text-[var(--success)]" /> Remediation Action
            </p>
            <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 space-y-2">
              <code className="block text-xs text-[var(--code-text)] font-mono whitespace-pre-wrap break-words">
                {data.fix || relatedRem?.fix || 'Apply vendor security patch and restrict firewall ports.'}
              </code>
              <p className="text-xs text-[var(--success)] font-medium">
                {data.improvement || relatedRem?.improvement || 'Reduces overall attack surface.'}
              </p>
            </div>
            <Link
              to="/app/remediation"
              className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--brand)] hover:text-[var(--brand-700)] font-semibold"
            >
              View all remediations <ChevronRight className="w-3 h-3" />
            </Link>
          </section>
        )}

        {/* Raw JSON Data */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Raw Node Metadata</p>
          <pre className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 text-[10px] text-[var(--text)] overflow-x-auto font-mono max-h-48">
{JSON.stringify(data, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  );
}

function describeKind(kind, data) {
  switch (kind) {
    case 'asset': return `Target network host. ${data?.services_count || data?.services || 1} discovered service(s) running on this endpoint.`;
    case 'service': return `Network listening service on port ${data?.port || '?'}. Service banner: ${data?.service || ''} ${data?.version || ''}.`;
    case 'evidence': return 'Verified network telemetry captured directly from port scan output.';
    case 'rule': return `Deterministic security rule ${data?.rule_id || ''} evaluated against verified service telemetry.`;
    case 'finding': return `Security vulnerability identified on ${data?.host || 'target'}:${data?.port || ''}. Graded by Risk Engine.`;
    case 'risk': return 'Aggregated risk condition derived from severity, exposure, and exploitability.';
    case 'cve': return `National Vulnerability Database CVE record (${data?.cve_id || data?.cve || 'CVE'}). Known exploit vector.`;
    case 'mitre': return 'MITRE ATT&CK adversarial technique mapped from verified vulnerability patterns.';
    case 'cwe': return 'Common Weakness Enumeration architectural flaw category.';
    case 'chain': return data?.description || 'Adversarial attack progression stage modeled by Attack Chain Engine.';
    case 'remediation': return data?.fix || 'Prescribed security hardening and patch instruction.';
    default: return 'Graph node';
  }
}

function isConnectedTo(nodeId, otherId, edges) {
  if (nodeId === otherId) return true;
  if (!Array.isArray(edges)) return false;
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
  const { investigationId: invId } = useInvestigation();

  const [graph, setGraph] = useState({ nodes: [], edges: [], layers: {} });
  const [findings, setFindings] = useState([]);
  const [remediation, setRemediation] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Layer Filter State: 'technical' | 'attack' | 'all'
  const [layerFilter, setLayerFilter] = useState('technical');

  const [search, setSearch] = useState('');
  const [selectedKinds, setSelectedKinds] = useState(() => new Set(TECHNICAL_KIND_ORDER));
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState(new Set());
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayDecisions, setReplayDecisions] = useState([]);

  // Theme chrome
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
    const r = parseInt(maskBg.slice(1, 3), 16);
    const g = parseInt(maskBg.slice(3, 5), 16);
    const b = parseInt(maskBg.slice(5, 7), 16);
    setChrome({ bg, labelFill, labelBgFill, maskColor: `rgba(${r}, ${g}, ${b}, 0.85)` });
  }, [resolved]);

  useEffect(() => {
    if (!invId) {
      setLoading(false);
      return;
    }

    let intervalId = null;

    const loadData = async () => {
      try {
        const [g, f, s, r] = await Promise.all([
          getInvestigationGraph(invId),
          getFindings(invId),
          getInvestigationSummary(invId),
          getRemediation(invId).catch(() => []),
        ]);
        if (g && Array.isArray(g.nodes) && g.nodes.length > 0) setGraph(g);
        if (f && Array.isArray(f)) setFindings(f);
        if (s && typeof s === 'object') setSummary(s);
        if (r && Array.isArray(r)) setRemediation(r);
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

  // Filter nodes by active layer
  const layerFilteredNodes = useMemo(() => {
    if (!Array.isArray(graph?.nodes)) return [];
    if (layerFilter === 'technical') {
      return graph.nodes.filter((n) => n && (n.layer === 'technical' || n.kind !== 'chain'));
    }
    if (layerFilter === 'attack') {
      return graph.nodes.filter((n) => n && (n.layer === 'attack' || n.kind === 'chain'));
    }
    return graph.nodes;
  }, [graph?.nodes, layerFilter]);

  // Position nodes with host grouping
  const positionedNodes = useMemo(() => {
    return layoutGraph(layerFilteredNodes, graph.edges, layerFilter);
  }, [layerFilteredNodes, graph.edges, layerFilter]);

  const counts = useMemo(() => {
    const c = {};
    if (Array.isArray(layerFilteredNodes)) {
      for (const n of layerFilteredNodes) {
        if (!n) continue;
        const k = n.kind || 'unknown';
        c[k] = (c[k] || 0) + 1;
      }
    }
    return c;
  }, [layerFilteredNodes]);

  const filteredIds = useMemo(() => {
    const visible = new Set();
    const term = search.trim().toLowerCase();
    for (const n of positionedNodes) {
      if (layerFilter === 'technical' && !selectedKinds.has(n.kind)) continue;
      if (term) {
        const hay = `${n.label} ${n.subtitle || ''} ${n.host || ''} ${n.cve_id || ''}`.toLowerCase();
        if (!hay.includes(term)) continue;
      }
      visible.add(n.id);
    }
    return visible;
  }, [positionedNodes, selectedKinds, search, layerFilter]);

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

  // Reduced edge label clutter: only render label badge for important relationships or focused edges
  const styledEdges = useMemo(() => {
    if (!Array.isArray(graph?.edges)) return [];
    return graph.edges
      .filter((e) => {
        // Filter edges by active layer
        if (layerFilter === 'technical') return e.layer !== 'attack';
        if (layerFilter === 'attack') return e.layer === 'attack' || e.kind === 'generated';
        return true;
      })
      .map((e, idx) => {
        const srcVisible = filteredIds.has(e.source);
        const tgtVisible = filteredIds.has(e.target);
        const visible = srcVisible && tgtVisible;
        const focused = selectedNodeId && (e.source === selectedNodeId || e.target === selectedNodeId);
        const color = edgePalette[e.kind] || edgePalette.supports || 'var(--text-subtle)';

        // Show label only on important edges or when focused
        const showLabel = Boolean(e.important && e.label) || focused;

        return {
          ...e,
          id: (e.id || `${e.source}→${e.target}`) + `-${idx}`,
          source: e.source,
          target: e.target,
          label: showLabel ? e.label : undefined,
          type: 'smoothstep',
          animated: e.kind === 'generated' || e.kind === 'correlated' || focused || e.layer === 'attack',
          style: {
            stroke: color,
            strokeWidth: focused ? 2.5 : (e.important ? 2 : 1.4),
            opacity: visible ? (focused ? 1 : (e.important ? 0.85 : 0.45)) : 0.05,
          },
          labelStyle: showLabel ? {
            fill: chrome.labelFill,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.04em',
          } : undefined,
          labelBgStyle: showLabel ? {
            fill: chrome.labelBgFill,
            stroke: color,
            strokeWidth: 1,
          } : undefined,
          labelBgPadding: [4, 3],
        };
      });
  }, [graph.edges, filteredIds, selectedNodeId, edgePalette, chrome.labelFill, chrome.labelBgFill, layerFilter]);

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
      'Correlation Engine': new Set(['finding', 'cve']),
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
    if (!invId) return;
    try {
      const decisions = await getDecisionLog(invId);
      setReplayDecisions(Array.isArray(decisions) ? decisions : []);
      setIsReplaying(true);
    } catch (err) {
      console.error('Failed to load decision log for replay:', err);
    }
  }, [invId]);

  const handleReplayStep = useCallback((decision) => {
    const stageToKind = {
      'Parser': new Set(['asset', 'service', 'evidence']),
      'Rule Engine': new Set(['rule']),
      'Knowledge Base': new Set(['mitre', 'cwe']),
      'Risk Engine': new Set(['risk']),
      'Correlation Engine': new Set(['finding', 'cve']),
      'Attack Chain Builder': new Set(['chain']),
      'LLM': new Set([]),
      'Report Generator': new Set(['remediation']),
    };
    const kset = stageToKind[decision.stage] || new Set();
    setHighlightedNodeIds(new Set(positionedNodes.filter((n) => kset.has(n.kind)).map((n) => n.id)));
  }, [positionedNodes]);

  const selectedNode = useMemo(() => positionedNodes.find((n) => n.id === selectedNodeId), [positionedNodes, selectedNodeId]);

  if (!invId || error) {
    return <EmptyState title="No graph data available" description="Complete an investigation to visualize findings and attack chains." />;
  }

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



  if (!graph.nodes || graph.nodes.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-10 h-10 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin" />
        <div>
          <p className="text-[var(--text)] font-semibold">Pipeline in progress</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            The investigation graph will appear once the Risk Engine stage completes.
            <br />Polling for updates every 2 seconds…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col">
      <div className="space-y-3 mb-3">
        <PageHeader
          eyebrow="Investigation"
          title="Investigation graph"
          description="Explore the technical asset taxonomy and adversarial attack journeys with host-grouped findings."
        />
        <InvestigationSummary summary={summary} />
        <TimelineStrip activeStage={stageParam} onSelect={handleStageSelect} />

        {/* Toolbar & Layer Filter */}
        <Card padding="p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Layer Selection Pill Tabs */}
            <div className="flex items-center gap-1.5 bg-[var(--bg)] p-1 rounded-xl border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setLayerFilter('technical')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  layerFilter === 'technical'
                    ? 'bg-[var(--surface)] text-[var(--brand)] shadow-sm border border-[var(--border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Technical Layer</span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono ml-0.5">
                  (Asset → Remediation)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLayerFilter('attack')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  layerFilter === 'attack'
                    ? 'bg-[var(--surface)] text-[var(--brand)] shadow-sm border border-[var(--border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Attack Layer</span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono ml-0.5">
                  (Adversary Journey)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLayerFilter('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  layerFilter === 'all'
                    ? 'bg-[var(--surface)] text-[var(--brand)] shadow-sm border border-[var(--border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>All Layers</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-[320px] bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5">
              <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search nodes, hosts, CVEs..."
                className="flex-1 bg-transparent text-sm text-[var(--text)] focus:outline-none placeholder:text-[var(--text-subtle)]"
              />
            </div>

            {/* Replay Button */}
            <button
              type="button"
              onClick={handleReplayStart}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white shadow-sm shadow-[var(--brand)]/20 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Replay Investigation
            </button>
          </div>

          {/* Node Kind Filter (Active in Technical or All mode) */}
          {layerFilter !== 'attack' && (
            <div className="mt-2.5 pt-2.5 border-t border-[var(--border)]">
              <NodeKindFilter
                selected={selectedKinds}
                onToggle={(k) => {
                  const next = new Set(selectedKinds);
                  if (next.has(k)) next.delete(k); else next.add(k);
                  setSelectedKinds(next);
                }}
                onSelectAll={() => setSelectedKinds(new Set(TECHNICAL_KIND_ORDER))}
                onClearAll={() => setSelectedKinds(new Set())}
                counts={counts}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Graph Canvas */}
      <div className="relative flex-1 min-h-[550px] bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
        <div className={`h-full min-h-[550px] ${selectedNode ? 'pr-[400px]' : ''}`}>

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