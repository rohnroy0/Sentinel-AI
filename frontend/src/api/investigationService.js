import { fetchApi } from './apiClient';

// ─── In-Memory Response Cache for Resources ───────────────────────────────
const RESOURCE_CACHE = new Map();
const CACHE_TTL_MS = 15000; // 15s TTL

function getCachedOrFetch(key, fetcher) {
  const now = Date.now();
  if (RESOURCE_CACHE.has(key)) {
    const { timestamp, data, promise } = RESOURCE_CACHE.get(key);
    if (promise) return promise; // Deduplicate inflight requests
    if (data && now - timestamp < CACHE_TTL_MS) {
      return Promise.resolve(data);
    }
  }

  const promise = fetcher().then((res) => {
    const isEmpty = !res ||
      (res && res.nodes && Array.isArray(res.nodes) && res.nodes.length === 0) ||
      (Array.isArray(res) && res.length === 0) ||
      (typeof res === 'object' && Object.keys(res).length === 0);

    if (!isEmpty) {
      RESOURCE_CACHE.set(key, { timestamp: Date.now(), data: res, promise: null });
    } else {
      RESOURCE_CACHE.delete(key);
    }
    return res;
  }).catch((err) => {
    RESOURCE_CACHE.delete(key);
    throw err;
  });

  RESOURCE_CACHE.set(key, { timestamp: now, data: null, promise });
  return promise;
}


export function clearResourceCache(investigationId = null) {
  if (investigationId) {
    for (const key of RESOURCE_CACHE.keys()) {
      if (key.includes(investigationId)) {
        RESOURCE_CACHE.delete(key);
      }
    }
  } else {
    RESOURCE_CACHE.clear();
  }
}

// ─── Upload & Investigation ────────────────────────────────────────────────

export async function uploadScan(data) {
  clearResourceCache();
  return fetchApi('/upload', {
    method: 'POST',
    body: JSON.stringify({ content: data })
  });
}

export async function startInvestigation(investigationId) {
  clearResourceCache(investigationId);
  return fetchApi(`/investigation/${investigationId}/start`, {
    method: 'POST'
  });
}

export async function getInvestigationStatus(investigationId) {
  // Always fetch live status without caching
  return fetchApi(`/investigation/${investigationId}/status`);
}

export async function getAllInvestigations() {
  return fetchApi('/agent/investigations');
}

// ─── Investigation Resources (Cached & Deduplicated) ────────────────────

export async function getFindings(investigationId) {
  return getCachedOrFetch(`findings_${investigationId}`, () => fetchApi(`/investigation/${investigationId}/findings`));
}

export async function getDetectedServices(investigationId) {
  return getCachedOrFetch(`services_${investigationId}`, () => fetchApi(`/investigation/${investigationId}/detected-services`));
}

export async function getInvestigationSummary(investigationId) {
  return getCachedOrFetch(`summary_${investigationId}`, () => fetchApi(`/investigation/${investigationId}/investigation-summary`));
}

export async function getInvestigationGraph(investigationId) {
  return getCachedOrFetch(`graph_${investigationId}`, () => fetchApi(`/investigation/${investigationId}/graph`));
}

export async function getAttackChains(investigationId) {
  return getCachedOrFetch(`chains_${investigationId}`, () => fetchApi(`/investigation/${investigationId}/attack-chain`));
}

export async function getDecisionLog(investigationId) {
  return getCachedOrFetch(`decisions_${investigationId}`, () => fetchApi(`/investigation/${investigationId}/decision-log`));
}

export async function getReport(investigationId) {
  return getCachedOrFetch(`report_${investigationId}`, () => fetchApi(`/investigation/${investigationId}/report`));
}

export async function getRiskDashboard(investigationId) {
  return getCachedOrFetch(`risk_${investigationId}`, () => fetchApi(`/investigation/${investigationId}/risk-dashboard`));
}

export async function getRemediation(investigationId) {
  return getCachedOrFetch(`remediation_${investigationId}`, () => fetchApi(`/investigation/${investigationId}/remediation`));
}

// ─── Backend Health ────────────────────────────────────────────────────────

export async function getBackendHealth() {
  return fetchApi('/health');
}

export async function getBackendInfo() {
  return fetchApi('/info');
}

