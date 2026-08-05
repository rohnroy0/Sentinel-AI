import { fetchApi } from './apiClient';

// ─── Upload & Investigation ────────────────────────────────────────────────

export async function uploadScan(data) {
  return fetchApi('/upload', {
    method: 'POST',
    body: JSON.stringify({ content: data })
  });
}

export async function startInvestigation(investigationId) {
  return fetchApi(`/investigation/${investigationId}/start`, {
    method: 'POST'
  });
}

export async function getInvestigationStatus(investigationId) {
  return fetchApi(`/investigation/${investigationId}/status`);
}

export async function getAllInvestigations() {
  return fetchApi('/agent/investigations');
}

// ─── Investigation Resources ───────────────────────────────────────────────

export async function getFindings(investigationId) {
  return fetchApi(`/investigation/${investigationId}/findings`);
}

export async function getDetectedServices(investigationId) {
  return fetchApi(`/investigation/${investigationId}/detected-services`);
}

export async function getInvestigationSummary(investigationId) {
  return fetchApi(`/investigation/${investigationId}/investigation-summary`);
}

export async function getInvestigationGraph(investigationId) {
  return fetchApi(`/investigation/${investigationId}/graph`);
}

export async function getAttackChains(investigationId) {
  return fetchApi(`/investigation/${investigationId}/attack-chain`);
}

export async function getDecisionLog(investigationId) {
  return fetchApi(`/investigation/${investigationId}/decision-log`);
}

export async function getReport(investigationId) {
  return fetchApi(`/investigation/${investigationId}/report`);
}

export async function getRiskDashboard(investigationId) {
  return fetchApi(`/investigation/${investigationId}/risk-dashboard`);
}

export async function getRemediation(investigationId) {
  return fetchApi(`/investigation/${investigationId}/remediation`);
}

// ─── Backend Health ────────────────────────────────────────────────────────

export async function getBackendHealth() {
  return fetchApi('/health');
}

export async function getBackendInfo() {
  return fetchApi('/info');
}
