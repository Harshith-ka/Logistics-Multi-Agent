import datetime
import uuid
from typing import Dict, List, Optional
from models import (
    Shipment, ShipmentStatus, RiskLevel, GPSLocation, Waypoint,
    Warehouse, InventoryItem, Vehicle, Incident, DisruptionCause,
    IncidentStatus, RecoveryPlan, RecoveryOption, StrategyType,
    AgentRun, AgentType, AgentRunStatus, AuditEvent
)

class InMemoryDatabase:
    def __init__(self):
        self.shipments: Dict[str, Shipment] = {}
        self.warehouses: Dict[str, Warehouse] = {}
        self.inventory: Dict[str, InventoryItem] = {}
        self.vehicles: Dict[str, Vehicle] = {}
        self.incidents: Dict[str, Incident] = {}
        self.recovery_plans: Dict[str, RecoveryPlan] = {}
        self.agent_runs: List[AgentRun] = []
        self.audit_events: List[AuditEvent] = []
        self.seed_data()

    def seed_data(self):
        self.shipments.clear()
        self.warehouses.clear()
        self.inventory.clear()
        self.vehicles.clear()
        self.incidents.clear()
        self.recovery_plans.clear()
        self.agent_runs.clear()
        self.audit_events.clear()

        # 1. Warehouses
        wh1 = Warehouse(
            id="WH-CHN-01",
            name="Chennai Central Logistics Hub",
            code="CHN-01",
            city="Chennai",
            location=GPSLocation(lat=13.0827, lng=80.2707, address="Poonamallee High Rd, Chennai", city="Chennai"),
            capacity_pallets=12000,
            operating_hours="24/7 Operations",
            contact_phone="+91-44-2839-0101"
        )
        wh2 = Warehouse(
            id="WH-VEL-02",
            name="Vellore Distribution Node",
            code="VEL-02",
            city="Vellore",
            location=GPSLocation(lat=12.9165, lng=79.1325, address="NH48 Highway Hub, Vellore", city="Vellore"),
            capacity_pallets=4500,
            operating_hours="06:00 - 22:00",
            contact_phone="+91-416-224-8890"
        )
        wh3 = Warehouse(
            id="WH-HOS-03",
            name="Hosur Advanced Fulfillment Center",
            code="HOS-03",
            city="Hosur",
            location=GPSLocation(lat=12.7409, lng=77.8253, address="Sipcot Industrial Complex, Hosur", city="Hosur"),
            capacity_pallets=9000,
            operating_hours="24/7 Operations",
            contact_phone="+91-4344-278-400"
        )
        wh4 = Warehouse(
            id="WH-BLR-04",
            name="Bengaluru East Multi-Modal Hub",
            code="BLR-04",
            city="Bengaluru",
            location=GPSLocation(lat=12.9716, lng=77.5946, address="Whitefield Logistics Corridor, Bengaluru", city="Bengaluru"),
            capacity_pallets=15000,
            operating_hours="24/7 Operations",
            contact_phone="+91-80-4112-9900"
        )
        self.warehouses = {w.id: w for w in [wh1, wh2, wh3, wh4]}

        # 2. Inventory Items
        inv_data = [
            # Precision Sensors
            InventoryItem(id="INV-001", warehouse_id="WH-CHN-01", sku="AUTO-SEN-902", product_name="Precision Automotive LiDAR & Radar Sensors", category="Automotive Electronics", available_qty=240, reserved_qty=180, unit_cost_inr=14500.0, safety_threshold=50),
            InventoryItem(id="INV-002", warehouse_id="WH-VEL-02", sku="AUTO-SEN-902", product_name="Precision Automotive LiDAR & Radar Sensors", category="Automotive Electronics", available_qty=85, reserved_qty=10, unit_cost_inr=14500.0, safety_threshold=30),
            InventoryItem(id="INV-003", warehouse_id="WH-HOS-03", sku="AUTO-SEN-902", product_name="Precision Automotive LiDAR & Radar Sensors", category="Automotive Electronics", available_qty=310, reserved_qty=60, unit_cost_inr=14500.0, safety_threshold=50),
            InventoryItem(id="INV-004", warehouse_id="WH-BLR-04", sku="AUTO-SEN-902", product_name="Precision Automotive LiDAR & Radar Sensors", category="Automotive Electronics", available_qty=40, reserved_qty=40, unit_cost_inr=14500.0, safety_threshold=50),
            
            # Lithium Cells
            InventoryItem(id="INV-005", warehouse_id="WH-CHN-01", sku="BAT-LIP-480", product_name="Lithium Polymer EV Cell Packs 48V", category="Energy Storage", available_qty=500, reserved_qty=200, unit_cost_inr=28000.0, safety_threshold=100),
            InventoryItem(id="INV-006", warehouse_id="WH-HOS-03", sku="BAT-LIP-480", product_name="Lithium Polymer EV Cell Packs 48V", category="Energy Storage", available_qty=420, reserved_qty=150, unit_cost_inr=28000.0, safety_threshold=80),
            
            # Micro-Controllers
            InventoryItem(id="INV-007", warehouse_id="WH-CHN-01", sku="MCU-IND-108", product_name="Industrial 32-bit Micro-Controller Units", category="Semiconductors", available_qty=1200, reserved_qty=400, unit_cost_inr=3200.0, safety_threshold=200),
            InventoryItem(id="INV-008", warehouse_id="WH-BLR-04", sku="MCU-IND-108", product_name="Industrial 32-bit Micro-Controller Units", category="Semiconductors", available_qty=850, reserved_qty=300, unit_cost_inr=3200.0, safety_threshold=150),
        ]
        self.inventory = {i.id: i for i in inv_data}

        # 3. Vehicles
        v1 = Vehicle(id="VEH-TN-01-9872", registration_number="TN-01-BZ-9872", vehicle_type="Container Truck 28T", capacity_kg=28000, driver_name="Ramesh Kumar", driver_phone="+91-98401-22314", location=GPSLocation(lat=12.92, lng=79.13, address="NH48 Vellore Bypass", city="Vellore"))
        v2 = Vehicle(id="VEH-KA-05-4421", registration_number="KA-05-AE-4421", vehicle_type="Express Air-Suspension 16T", capacity_kg=16000, driver_name="Suresh Gowda", driver_phone="+91-98450-77123", location=GPSLocation(lat=12.74, lng=77.82, address="Hosur Outer Ring", city="Hosur"))
        v3 = Vehicle(id="VEH-TN-23-1102", registration_number="TN-23-CX-1102", vehicle_type="Heavy Duty Hauler 32T", capacity_kg=32000, driver_name="Karthik Rajan", driver_phone="+91-94432-88091", location=GPSLocation(lat=13.08, lng=80.27, address="Chennai Port Terminal", city="Chennai"))
        self.vehicles = {v.id: v for v in [v1, v2, v3]}

        # 4. Shipments (Chennai -> Bengaluru corridor flagship)
        corridor_waypoints = [
            Waypoint(name="Chennai Central Hub", lat=13.0827, lng=80.2707, passed=True, estimated_arrival="10:00 AM"),
            Waypoint(name="Sriperumbudur Industrial Corridor", lat=12.9675, lng=79.9405, passed=True, estimated_arrival="11:30 AM"),
            Waypoint(name="Ranipet Toll Plaza", lat=12.9272, lng=79.3328, passed=True, estimated_arrival="01:15 PM"),
            Waypoint(name="Vellore NH48 Bypass", lat=12.9165, lng=79.1325, passed=False, estimated_arrival="02:30 PM"),
            Waypoint(name="Ambur Transit Gate", lat=12.7904, lng=78.7166, passed=False, estimated_arrival="03:45 PM"),
            Waypoint(name="Krishnagiri Junction", lat=12.5186, lng=78.2137, passed=False, estimated_arrival="04:50 PM"),
            Waypoint(name="Hosur Border Checkpoint", lat=12.7409, lng=77.8253, passed=False, estimated_arrival="05:30 PM"),
            Waypoint(name="Bengaluru Electronic City", lat=12.8399, lng=77.6770, passed=False, estimated_arrival="05:50 PM"),
            Waypoint(name="Bengaluru East Multi-Modal Hub", lat=12.9716, lng=77.5946, passed=False, estimated_arrival="06:00 PM")
        ]

        now = datetime.datetime.now()
        dep_time = (now - datetime.timedelta(hours=4)).strftime("%I:%M %p")
        sched_eta = (now + datetime.timedelta(hours=1, minutes=15)).strftime("%I:%M %p")
        deadline = (now + datetime.timedelta(hours=1, minutes=45)).strftime("%I:%M %p")

        shp1 = Shipment(
            id="SHP-1024",
            tracking_number="AGF-IN-102498",
            order_id="ORD-90281-OEM",
            origin_hub="Chennai Central Logistics Hub (WH-CHN-01)",
            destination_hub="Bengaluru East Multi-Modal Hub (WH-BLR-04)",
            carrier_name="BlueDart Prime Logistics",
            vehicle_id="VEH-TN-01-9872",
            driver_name="Ramesh Kumar",
            driver_phone="+91-98401-22314",
            status=ShipmentStatus.IN_TRANSIT,
            risk_level=RiskLevel.LOW,
            delay_minutes=0,
            current_location=GPSLocation(lat=12.9250, lng=79.2500, address="NH48 km 114, near Vellore", city="Vellore"),
            route_waypoints=corridor_waypoints,
            current_waypoint_index=3,
            progress_percent=42.0,
            speed_kmh=64.0,
            total_distance_km=346.0,
            remaining_distance_km=200.0,
            departure_time=dep_time,
            scheduled_eta=sched_eta,
            revised_eta=sched_eta,
            deadline=deadline,
            cargo_description="180x Precision Automotive LiDAR & Radar Sensors (SKU: AUTO-SEN-902)",
            cargo_value_inr=2610000.0,
            temperature_sensitive=False,
            sla_priority="Critical OEM Assembly Tier-1"
        )

        shp2 = Shipment(
            id="SHP-2048",
            tracking_number="AGF-IN-204855",
            order_id="ORD-78119-MED",
            origin_hub="Hosur Advanced Fulfillment Center (WH-HOS-03)",
            destination_hub="Bengaluru East Multi-Modal Hub (WH-BLR-04)",
            carrier_name="Delhivery Express Freight",
            vehicle_id="VEH-KA-05-4421",
            driver_name="Suresh Gowda",
            driver_phone="+91-98450-77123",
            status=ShipmentStatus.IN_TRANSIT,
            risk_level=RiskLevel.LOW,
            delay_minutes=0,
            current_location=GPSLocation(lat=12.7800, lng=77.7800, address="Attibele Highway, Hosur", city="Hosur"),
            route_waypoints=[
                Waypoint(name="Hosur Hub", lat=12.7409, lng=77.8253, passed=True, estimated_arrival="01:00 PM"),
                Waypoint(name="Attibele Toll", lat=12.7800, lng=77.7800, passed=True, estimated_arrival="01:30 PM"),
                Waypoint(name="Electronic City", lat=12.8399, lng=77.6770, passed=False, estimated_arrival="02:10 PM"),
                Waypoint(name="Bengaluru Hub", lat=12.9716, lng=77.5946, passed=False, estimated_arrival="02:30 PM")
            ],
            current_waypoint_index=2,
            progress_percent=65.0,
            speed_kmh=52.0,
            total_distance_km=48.0,
            remaining_distance_km=18.0,
            departure_time=(now - datetime.timedelta(hours=1)).strftime("%I:%M %p"),
            scheduled_eta=(now + datetime.timedelta(minutes=45)).strftime("%I:%M %p"),
            revised_eta=(now + datetime.timedelta(minutes=45)).strftime("%I:%M %p"),
            deadline=(now + datetime.timedelta(hours=1, minutes=30)).strftime("%I:%M %p"),
            cargo_description="150x Lithium Polymer EV Cell Packs 48V (SKU: BAT-LIP-480)",
            cargo_value_inr=4200000.0,
            temperature_sensitive=True,
            sla_priority="High"
        )

        shp3 = Shipment(
            id="SHP-3091",
            tracking_number="AGF-IN-309102",
            order_id="ORD-55410-SEM",
            origin_hub="Chennai Central Logistics Hub (WH-CHN-01)",
            destination_hub="Hosur Advanced Fulfillment Center (WH-HOS-03)",
            carrier_name="Gati KWE Logistics",
            vehicle_id="VEH-TN-23-1102",
            driver_name="Karthik Rajan",
            driver_phone="+91-94432-88091",
            status=ShipmentStatus.IN_TRANSIT,
            risk_level=RiskLevel.LOW,
            delay_minutes=0,
            current_location=GPSLocation(lat=12.9675, lng=79.9405, address="Sriperumbudur Industrial Sector", city="Sriperumbudur"),
            route_waypoints=[
                Waypoint(name="Chennai Hub", lat=13.0827, lng=80.2707, passed=True, estimated_arrival="12:00 PM"),
                Waypoint(name="Sriperumbudur", lat=12.9675, lng=79.9405, passed=True, estimated_arrival="01:10 PM"),
                Waypoint(name="Ranipet", lat=12.9272, lng=79.3328, passed=False, estimated_arrival="02:40 PM"),
                Waypoint(name="Hosur Hub", lat=12.7409, lng=77.8253, passed=False, estimated_arrival="05:15 PM")
            ],
            current_waypoint_index=1,
            progress_percent=25.0,
            speed_kmh=58.0,
            total_distance_km=302.0,
            remaining_distance_km=226.0,
            departure_time=(now - datetime.timedelta(hours=2)).strftime("%I:%M %p"),
            scheduled_eta=(now + datetime.timedelta(hours=3)).strftime("%I:%M %p"),
            revised_eta=(now + datetime.timedelta(hours=3)).strftime("%I:%M %p"),
            deadline=(now + datetime.timedelta(hours=3, minutes=45)).strftime("%I:%M %p"),
            cargo_description="400x Industrial 32-bit Micro-Controllers (SKU: MCU-IND-108)",
            cargo_value_inr=1280000.0,
            temperature_sensitive=False,
            sla_priority="Medium"
        )

        self.shipments = {s.id: s for s in [shp1, shp2, shp3]}

        # Initial Audit Event
        self.audit_events.append(
            AuditEvent(
                id=f"AUD-{uuid.uuid4().hex[:8].upper()}",
                actor="SystemBootstrap",
                action="INITIALIZE_SEED_TOPOLOGY",
                entity_type="SYSTEM",
                entity_id="AGENTFORGE_CORE",
                details={"shipments_count": len(self.shipments), "warehouses_count": len(self.warehouses)},
                external_confirmation_hash="SHA256:8f9a2b71d99e0a12",
                idempotency_key=f"BOOTSTRAP-{datetime.date.today().isoformat()}"
            )
        )

    # Retrieval and mutation helpers
    def get_shipment(self, shipment_id: str) -> Optional[Shipment]:
        return self.shipments.get(shipment_id)

    def get_all_shipments(self) -> List[Shipment]:
        return list(self.shipments.values())

    def update_shipment(self, shipment: Shipment) -> Shipment:
        self.shipments[shipment.id] = shipment
        return shipment

    def get_all_warehouses(self) -> List[Warehouse]:
        return list(self.warehouses.values())

    def get_warehouse(self, warehouse_id: str) -> Optional[Warehouse]:
        return self.warehouses.get(warehouse_id)

    def get_all_inventory(self) -> List[InventoryItem]:
        return list(self.inventory.values())

    def get_inventory_for_warehouse(self, warehouse_id: str) -> List[InventoryItem]:
        return [i for i in self.inventory.values() if i.warehouse_id == warehouse_id]

    def get_inventory_by_sku(self, sku: str) -> List[InventoryItem]:
        return [i for i in self.inventory.values() if i.sku == sku]

    def update_inventory(self, item: InventoryItem) -> InventoryItem:
        self.inventory[item.id] = item
        return item

    def get_all_incidents(self) -> List[Incident]:
        return list(self.incidents.values())

    def get_incident(self, incident_id: str) -> Optional[Incident]:
        return self.incidents.get(incident_id)

    def save_incident(self, incident: Incident) -> Incident:
        self.incidents[incident.id] = incident
        return incident

    def get_recovery_plan(self, plan_id: str) -> Optional[RecoveryPlan]:
        return self.recovery_plans.get(plan_id)

    def get_plan_by_incident(self, incident_id: str) -> Optional[RecoveryPlan]:
        for p in self.recovery_plans.values():
            if p.incident_id == incident_id:
                return p
        return None

    def save_recovery_plan(self, plan: RecoveryPlan) -> RecoveryPlan:
        self.recovery_plans[plan.id] = plan
        return plan

    def record_agent_run(self, run: AgentRun) -> AgentRun:
        self.agent_runs.append(run)
        return run

    def get_agent_runs(self, incident_id: Optional[str] = None, shipment_id: Optional[str] = None) -> List[AgentRun]:
        runs = self.agent_runs
        if incident_id:
            runs = [r for r in runs if r.incident_id == incident_id]
        if shipment_id:
            runs = [r for r in runs if r.shipment_id == shipment_id]
        return runs

    def record_audit_event(self, event: AuditEvent) -> AuditEvent:
        self.audit_events.insert(0, event)  # newest first
        return event

    def get_audit_events(self, limit: int = 50) -> List[AuditEvent]:
        return self.audit_events[:limit]

# Singleton instance
db = InMemoryDatabase()
