import asyncio
import time
import uuid
import datetime
import logging
from typing import Optional, Callable, List
from models import (
    Shipment, ShipmentStatus, RiskLevel, DisruptionCause, Incident,
    IncidentStatus, GPSLocation, AuditEvent
)
from database import db

logger = logging.getLogger("agentforge.simulator")

class LogisticsSimulator:
    def __init__(self):
        self.is_running = True
        self.speed_factor = 1.0
        self.event_subscribers: List[Callable] = []
        self._orchestrator = None

    def set_orchestrator(self, orchestrator):
        self._orchestrator = orchestrator

    def subscribe(self, callback: Callable):
        self.event_subscribers.append(callback)

    def unsubscribe(self, callback: Callable):
        if callback in self.event_subscribers:
            self.event_subscribers.remove(callback)

    async def broadcast_event(self, event_type: str, data: dict):
        dead_subs = []
        for sub in self.event_subscribers:
            try:
                await sub(event_type, data)
            except Exception as e:
                dead_subs.append(sub)
        for dead in dead_subs:
            self.unsubscribe(dead)

    async def run_simulation_loop(self):
        logger.info("Logistics simulation loop started.")
        while True:
            try:
                if self.is_running:
                    await self.tick()
                await asyncio.sleep(3.0)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in simulation loop: {e}", exc_info=True)
                await asyncio.sleep(5.0)

    async def tick(self):
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        shipments = db.get_all_shipments()

        for s in shipments:
            if s.status == ShipmentStatus.DELIVERED:
                continue

            # In-transit or recovering progression
            if s.status == ShipmentStatus.RECOVERING:
                # Accelerate along recovery route
                s.progress_percent = min(100.0, s.progress_percent + 2.5 * self.speed_factor)
                s.remaining_distance_km = max(0.0, s.total_distance_km * (1.0 - s.progress_percent / 100.0))
                s.speed_kmh = 74.0
                if s.delay_minutes > 0:
                    s.delay_minutes = max(0, s.delay_minutes - 5)
                if s.progress_percent >= 100.0:
                    s.status = ShipmentStatus.DELIVERED
                    s.speed_kmh = 0.0
                    s.risk_level = RiskLevel.LOW
                    # Mark incident resolved
                    if s.active_incident_id:
                        inc = db.get_incident(s.active_incident_id)
                        if inc:
                            inc.status = IncidentStatus.RESOLVED
                            inc.resolved_at = now_iso
                            db.save_incident(inc)
                    
                    db.record_audit_event(AuditEvent(
                        id=f"AUD-{uuid.uuid4().hex[:8].upper()}",
                        actor="ExecutionMonitor",
                        action="SHIPMENT_DELIVERED_SUCCESSFULLY",
                        entity_type="SHIPMENT",
                        entity_id=s.id,
                        details={"order_id": s.order_id, "destination": s.destination_hub, "on_time": True}
                    ))
            elif s.status == ShipmentStatus.IN_TRANSIT:
                # Normal progress
                s.progress_percent = min(98.0, s.progress_percent + 0.8 * self.speed_factor)
                s.remaining_distance_km = max(5.0, s.total_distance_km * (1.0 - s.progress_percent / 100.0))
                s.speed_kmh = 62.0
            elif s.status in [ShipmentStatus.AT_RISK, ShipmentStatus.DELAYED]:
                # Slowed down by disruption
                s.speed_kmh = 14.0
                s.delay_minutes += 2

            # Interpolate waypoints
            if s.route_waypoints:
                total_wp = len(s.route_waypoints)
                current_idx = min(total_wp - 1, int((s.progress_percent / 100.0) * total_wp))
                s.current_waypoint_index = current_idx
                for idx, wp in enumerate(s.route_waypoints):
                    wp.passed = (idx <= current_idx)
                
                # Update current GPS location towards current/next waypoint
                curr_wp = s.route_waypoints[current_idx]
                s.current_location = GPSLocation(
                    lat=round(curr_wp.lat + (0.002 * (s.progress_percent % 10)), 4),
                    lng=round(curr_wp.lng + (0.002 * (s.progress_percent % 10)), 4),
                    address=f"{curr_wp.name} corridor",
                    city=curr_wp.name.split()[0]
                )

            db.update_shipment(s)

        await self.broadcast_event("TELEMETRY_TICK", {
            "timestamp": now_iso,
            "shipments": [s.model_dump() for s in shipments]
        })

    def inject_disruption(
        self,
        shipment_id: str,
        cause: DisruptionCause,
        delay_minutes: int = 90,
        custom_message: Optional[str] = None
    ) -> Incident:
        """Injects a real-time disruption into a shipment and triggers multi-agent orchestration."""
        shipment = db.get_shipment(shipment_id)
        if not shipment:
            raise ValueError(f"Shipment {shipment_id} not found")

        incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        cause_titles = {
            DisruptionCause.TRAFFIC_CONGESTION: "Severe Multi-Vehicle Congestion on NH48 Vellore Highway",
            DisruptionCause.VEHICLE_BREAKDOWN: "Transmission Lock & Overheating Alert on Primary Vehicle",
            DisruptionCause.WEATHER_DISRUPTION: "Flash Monsoonal Waterlogging on Greenfield Expressway",
            DisruptionCause.WAREHOUSE_BOTTLENECK: "Cross-dock Bay Staging Failure & Dock Lockout",
            DisruptionCause.PORT_STRIKE: "Customs Gate Clearance Embargo"
        }

        summary = custom_message or cause_titles.get(cause, "Unscheduled Logistics Disruption")
        desc = (
            f"Automated sensors and carrier telemetry detected a critical bottleneck near {shipment.current_location.address}. "
            f"Average vehicle velocity dropped to 14 km/h. Expected delay +{delay_minutes} minutes, endangering SLA."
        )

        incident = Incident(
            id=incident_id,
            shipment_id=shipment.id,
            cause_category=cause,
            summary=summary,
            description=desc,
            severity=RiskLevel.HIGH if delay_minutes < 100 else RiskLevel.CRITICAL,
            status=IncidentStatus.DETECTED,
            delay_minutes_detected=delay_minutes,
            detected_at=now_iso,
            affected_orders=[shipment.order_id],
            location=shipment.current_location
        )
        db.save_incident(incident)

        # Update shipment state
        shipment.status = ShipmentStatus.AT_RISK
        shipment.risk_level = incident.severity
        shipment.delay_minutes = delay_minutes
        shipment.active_incident_id = incident.id
        
        # Calculate revised ETA
        now = datetime.datetime.now()
        revised = now + datetime.timedelta(hours=2, minutes=delay_minutes % 60)
        shipment.revised_eta = revised.strftime("%I:%M %p")
        db.update_shipment(shipment)

        # Record audit event
        db.record_audit_event(AuditEvent(
            id=f"AUD-{uuid.uuid4().hex[:8].upper()}",
            actor="SimulatorFaultInjection",
            action="INJECT_DISRUPTION_INCIDENT",
            entity_type="INCIDENT",
            entity_id=incident.id,
            details={"cause": cause.value, "delay_minutes": delay_minutes, "shipment_id": shipment.id}
        ))

        # Trigger orchestrator immediately if bound
        if self._orchestrator:
            try:
                self._orchestrator.orchestrate_disruption_recovery(incident.id)
            except Exception as e:
                logger.error(f"Failed to orchestrate incident {incident.id}: {e}", exc_info=True)

        return incident

# Global simulator singleton
simulator = LogisticsSimulator()
