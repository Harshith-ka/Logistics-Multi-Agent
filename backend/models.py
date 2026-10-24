from __future__ import annotations
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field
import datetime

class ShipmentStatus(str, Enum):
    CREATED = "created"
    IN_TRANSIT = "in_transit"
    AT_RISK = "at_risk"
    DELAYED = "delayed"
    RECOVERING = "recovering"
    RECOVERED = "recovered"
    DELIVERED = "delivered"

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class DisruptionCause(str, Enum):
    TRAFFIC_CONGESTION = "traffic_congestion"
    WEATHER_DISRUPTION = "weather_disruption"
    VEHICLE_BREAKDOWN = "vehicle_breakdown"
    WAREHOUSE_BOTTLENECK = "warehouse_bottleneck"
    PORT_STRIKE = "port_strike"

class IncidentStatus(str, Enum):
    DETECTED = "detected"
    INVESTIGATING = "investigating"
    RECOVERY_PROPOSED = "recovery_proposed"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXECUTING = "executing"
    RESOLVED = "resolved"

class StrategyType(str, Enum):
    CONTINUE_AS_IS = "continue_as_is"
    REROUTE = "reroute"
    ALTERNATE_CARRIER = "alternate_carrier"
    ALTERNATE_WAREHOUSE = "alternate_warehouse"
    EXPEDITE_REPLACEMENT = "expedite_replacement"

class AgentType(str, Enum):
    ORCHESTRATOR = "orchestrator"
    MONITORING = "monitoring"
    DISRUPTION = "disruption"
    INVENTORY = "inventory"
    ROUTE = "route"
    COST = "cost"
    RECOVERY = "recovery"
    VALIDATION = "validation"
    EXECUTION = "execution"

class AgentRunStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    TOOL_CALL = "tool_call"
    SUCCESS = "success"
    FAILED = "failed"
    AWAITING_APPROVAL = "awaiting_approval"

class GPSLocation(BaseModel):
    lat: float
    lng: float
    address: str = ""
    city: str = ""

class Waypoint(BaseModel):
    name: str
    lat: float
    lng: float
    passed: bool = False
    estimated_arrival: Optional[str] = None

class Shipment(BaseModel):
    id: str
    tracking_number: str
    order_id: str
    origin_hub: str
    destination_hub: str
    carrier_name: str
    vehicle_id: str
    driver_name: str
    driver_phone: str
    status: ShipmentStatus = ShipmentStatus.IN_TRANSIT
    risk_level: RiskLevel = RiskLevel.LOW
    delay_minutes: int = 0
    current_location: GPSLocation
    route_waypoints: List[Waypoint] = []
    current_waypoint_index: int = 0
    progress_percent: float = 0.0
    speed_kmh: float = 60.0
    total_distance_km: float = 350.0
    remaining_distance_km: float = 350.0
    departure_time: str
    scheduled_eta: str
    revised_eta: str
    deadline: str
    cargo_description: str
    cargo_value_inr: float = 1250000.0
    temperature_sensitive: bool = False
    sla_priority: str = "High"
    active_incident_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())

class Vehicle(BaseModel):
    id: str
    registration_number: str
    vehicle_type: str
    capacity_kg: float
    driver_name: str
    driver_phone: str
    location: GPSLocation
    is_active: bool = True

class Warehouse(BaseModel):
    id: str
    name: str
    code: str
    city: str
    location: GPSLocation
    capacity_pallets: int
    operating_hours: str
    contact_phone: str

class InventoryItem(BaseModel):
    id: str
    warehouse_id: str
    sku: str
    product_name: str
    category: str
    available_qty: int
    reserved_qty: int
    unit_cost_inr: float
    safety_threshold: int = 20

class Incident(BaseModel):
    id: str
    shipment_id: str
    cause_category: DisruptionCause
    summary: str
    description: str
    severity: RiskLevel
    status: IncidentStatus = IncidentStatus.DETECTED
    delay_minutes_detected: int = 0
    detected_at: str
    resolved_at: Optional[str] = None
    affected_orders: List[str] = []
    location: Optional[GPSLocation] = None

class RecoveryOption(BaseModel):
    option_id: str
    strategy_type: StrategyType
    title: str
    description: str
    added_cost_inr: float
    revised_eta: str
    eta_delta_minutes: int
    status_prediction: str  # "on_time", "minor_delay", "late"
    feasibility_score: int  # 0 to 100
    risk_level: RiskLevel
    action_steps: List[str] = []
    carrier_name: Optional[str] = None
    alternative_warehouse_id: Optional[str] = None
    toll_cost_inr: float = 0.0
    fuel_cost_inr: float = 0.0
    penalty_avoided_inr: float = 0.0
    is_recommended: bool = False
    validation_status: str = "validated"
    tradeoff_explanation: str = ""

class RecoveryPlan(BaseModel):
    id: str
    incident_id: str
    shipment_id: str
    options: List[RecoveryOption] = []
    recommended_option_id: str
    status: IncidentStatus = IncidentStatus.PENDING_APPROVAL
    validation_passed: bool = True
    validation_notes: List[str] = []
    approved_by: Optional[str] = None
    approved_option_id: Optional[str] = None
    approval_timestamp: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())

class AgentRun(BaseModel):
    id: str
    agent_type: AgentType
    incident_id: Optional[str] = None
    shipment_id: Optional[str] = None
    status: AgentRunStatus = AgentRunStatus.RUNNING
    started_at: str
    completed_at: Optional[str] = None
    latency_ms: int = 0
    tool_calls: List[Dict[str, Any]] = []
    reasoning_summary: str = ""
    output_payload: Dict[str, Any] = {}
    tokens_used: int = 0

class AuditEvent(BaseModel):
    id: str
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    actor: str = "System"
    action: str
    entity_type: str
    entity_id: str
    details: Dict[str, Any] = {}
    external_confirmation_hash: Optional[str] = None
    idempotency_key: Optional[str] = None

class ApprovalRequest(BaseModel):
    plan_id: str
    selected_option_id: str
    reviewer_name: str = "Logistics Ops Lead"
    action: str = "approve"  # approve or reject
    notes: Optional[str] = None

class DisruptionInjectionRequest(BaseModel):
    shipment_id: str
    cause: DisruptionCause
    delay_minutes: int = 90
    location_name: Optional[str] = None
    custom_message: Optional[str] = None
