export type ShipmentStatus = 'created' | 'in_transit' | 'at_risk' | 'delayed' | 'recovering' | 'recovered' | 'delivered';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type DisruptionCause = 'traffic_congestion' | 'weather_disruption' | 'vehicle_breakdown' | 'warehouse_bottleneck' | 'port_strike';
export type IncidentStatus = 'detected' | 'investigating' | 'recovery_proposed' | 'pending_approval' | 'approved' | 'rejected' | 'executing' | 'resolved';
export type StrategyType = 'continue_as_is' | 'reroute' | 'alternate_carrier' | 'alternate_warehouse' | 'expedite_replacement';
export type AgentType = 'orchestrator' | 'monitoring' | 'disruption' | 'inventory' | 'route' | 'cost' | 'recovery' | 'validation' | 'execution';

export interface GPSLocation {
  lat: number;
  lng: number;
  address: string;
  city: string;
}

export interface Waypoint {
  name: string;
  lat: number;
  lng: number;
  passed: boolean;
  estimated_arrival?: string;
}

export interface Shipment {
  id: string;
  tracking_number: string;
  order_id: string;
  origin_hub: string;
  destination_hub: string;
  carrier_name: string;
  vehicle_id: string;
  driver_name: string;
  driver_phone: string;
  status: ShipmentStatus;
  risk_level: RiskLevel;
  delay_minutes: number;
  current_location: GPSLocation;
  route_waypoints: Waypoint[];
  current_waypoint_index: number;
  progress_percent: number;
  speed_kmh: number;
  total_distance_km: number;
  remaining_distance_km: number;
  departure_time: string;
  scheduled_eta: string;
  revised_eta: string;
  deadline: string;
  cargo_description: string;
  cargo_value_inr: number;
  temperature_sensitive: boolean;
  sla_priority: string;
  active_incident_id?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  city: string;
  location: GPSLocation;
  capacity_pallets: number;
  operating_hours: string;
  contact_phone: string;
}

export interface InventoryItem {
  id: string;
  warehouse_id: string;
  sku: string;
  product_name: string;
  category: string;
  available_qty: number;
  reserved_qty: number;
  unit_cost_inr: number;
  safety_threshold: number;
}

export interface Incident {
  id: string;
  shipment_id: string;
  cause_category: DisruptionCause;
  summary: string;
  description: string;
  severity: RiskLevel;
  status: IncidentStatus;
  delay_minutes_detected: number;
  detected_at: string;
  resolved_at?: string;
  affected_orders: string[];
  location?: GPSLocation;
}

export interface RecoveryOption {
  option_id: string;
  strategy_type: StrategyType;
  title: string;
  description: string;
  added_cost_inr: number;
  revised_eta: string;
  eta_delta_minutes: number;
  status_prediction: string;
  feasibility_score: number;
  risk_level: RiskLevel;
  action_steps: string[];
  carrier_name?: string;
  alternative_warehouse_id?: string;
  toll_cost_inr: number;
  fuel_cost_inr: number;
  penalty_avoided_inr: number;
  is_recommended: boolean;
  validation_status: string;
  tradeoff_explanation: string;
}

export interface RecoveryPlan {
  id: string;
  incident_id: string;
  shipment_id: string;
  options: RecoveryOption[];
  recommended_option_id: string;
  status: IncidentStatus;
  validation_passed: boolean;
  validation_notes: string[];
  approved_by?: string;
  approved_option_id?: string;
  approval_timestamp?: string;
  created_at: string;
}

export interface AgentRun {
  id: string;
  agent_type: AgentType;
  incident_id?: string;
  shipment_id?: string;
  status: string;
  started_at: string;
  completed_at?: string;
  latency_ms: number;
  tool_calls: Array<{ tool: string; args: any; result: any }>;
  reasoning_summary: string;
  output_payload: any;
  tokens_used: number;
}

export interface WorkflowNode {
  id: string;
  name: string;
  role: string;
  type: string;
  status: string;
  latency_ms: number;
  tool_calls: any[];
  reasoning: string;
  completed_at?: string;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  label: string;
}

export interface WorkflowData {
  incident_id: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  incident_status: string;
  plan_id?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  external_confirmation_hash?: string;
  idempotency_key?: string;
}

export interface ControlTowerKPIs {
  active_shipments: number;
  at_risk_shipments: number;
  recovering_shipments: number;
  delivered_shipments: number;
  active_disruptions: number;
  on_time_sla_rate: number;
  total_penalty_avoided_inr: number;
  average_agent_latency_ms: number;
  incident_detection_recall: string;
  valid_recovery_plans_rate: string;
  unauthorized_actions: number;
}
