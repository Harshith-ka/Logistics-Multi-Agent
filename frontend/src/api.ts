import {
  Shipment, Incident, RecoveryPlan, Warehouse, InventoryItem,
  AgentRun, WorkflowData, AuditEvent, ControlTowerKPIs, DisruptionCause
} from './types';

const API_BASE = 'http://localhost:8000/api';

export async function fetchKPIs(): Promise<ControlTowerKPIs> {
  const res = await fetch(`${API_BASE}/analytics/kpis`);
  return res.json();
}

export async function fetchShipments(): Promise<Shipment[]> {
  const res = await fetch(`${API_BASE}/shipments`);
  return res.json();
}

export async function fetchShipment(id: string): Promise<Shipment> {
  const res = await fetch(`${API_BASE}/shipments/${id}`);
  return res.json();
}

export async function fetchIncidents(): Promise<Incident[]> {
  const res = await fetch(`${API_BASE}/incidents`);
  return res.json();
}

export async function fetchRecoveryPlans(): Promise<RecoveryPlan[]> {
  const res = await fetch(`${API_BASE}/recovery/plans`);
  return res.json();
}

export async function fetchPlanForIncident(incidentId: string): Promise<RecoveryPlan | null> {
  const res = await fetch(`${API_BASE}/recovery/incident/${incidentId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function submitApproval(
  planId: string,
  selectedOptionId: string,
  reviewerName: string = "Logistics Operations Lead",
  notes?: string
) {
  const res = await fetch(`${API_BASE}/recovery/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan_id: planId,
      selected_option_id: selectedOptionId,
      reviewer_name: reviewerName,
      action: 'approve',
      notes
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to approve recovery plan');
  }
  return res.json();
}

export async function fetchWarehouses(): Promise<Warehouse[]> {
  const res = await fetch(`${API_BASE}/inventory/warehouses`);
  return res.json();
}

export async function fetchInventory(): Promise<InventoryItem[]> {
  const res = await fetch(`${API_BASE}/inventory/items`);
  return res.json();
}

export async function fetchAgentRuns(incidentId?: string): Promise<AgentRun[]> {
  const url = incidentId ? `${API_BASE}/agents/runs?incident_id=${incidentId}` : `${API_BASE}/agents/runs`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchWorkflowGraph(incidentId: string): Promise<WorkflowData> {
  const res = await fetch(`${API_BASE}/agents/workflow/${incidentId}`);
  return res.json();
}

export async function fetchAuditTrail(): Promise<AuditEvent[]> {
  const res = await fetch(`${API_BASE}/analytics/audit`);
  return res.json();
}

export async function injectDisruption(payload: {
  shipment_id: string;
  cause: DisruptionCause;
  delay_minutes: number;
  custom_message?: string;
}): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents/inject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to inject disruption');
  }
  return res.json();
}

export async function triggerFlagshipDemo(): Promise<any> {
  const res = await fetch(`${API_BASE}/simulation/trigger-flagship-incident`, { method: 'POST' });
  return res.json();
}

export async function resetSimulation(): Promise<any> {
  const res = await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
  return res.json();
}

export async function toggleSimulationPause(paused: boolean): Promise<any> {
  const endpoint = paused ? 'pause' : 'resume';
  const res = await fetch(`${API_BASE}/simulation/${endpoint}`, { method: 'POST' });
  return res.json();
}

export async function setSimulationSpeed(factor: number): Promise<any> {
  const res = await fetch(`${API_BASE}/simulation/speed?factor=${factor}`, { method: 'POST' });
  return res.json();
}
