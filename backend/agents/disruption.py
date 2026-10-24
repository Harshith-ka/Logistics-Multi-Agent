import time
from typing import Dict, Any
from agents.base import BaseAgent
from models import AgentType, Shipment, Incident, DisruptionCause, RiskLevel
from database import db

class DisruptionAnalysisAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_type=AgentType.DISRUPTION,
            name="Disruption Analysis Agent",
            description="Investigates root causes of logistics bottlenecks, evaluates traffic/weather feeds, assesses impact, and classifies severity."
        )

    def analyze_incident(self, incident: Incident, shipment: Shipment) -> Dict[str, Any]:
        start_time = time.time()
        
        tool_calls = [
            {"tool": "query_traffic_radar_api", "args": {"highway": "NH48", "sector": "Ranipet-Vellore km 112-118"}, "result": {"congestion_index": 8.7, "average_speed_kmh": 12.0, "incident_reported": "Multi-axle vehicle overturned at bridge passage"}},
            {"tool": "query_carrier_telematics", "args": {"vehicle_id": shipment.vehicle_id}, "result": {"engine_rpm": 950, "stationary_duration_min": 42, "driver_status": "Standstill in traffic queue"}},
            {"tool": "query_order_impact", "args": {"order_id": shipment.order_id}, "result": {"customer": "Bengaluru Precision OEM Assembly", "tier": "Tier-1 Assembly Plant", "production_downtime_penalty_per_hour_inr": 50000.0}}
        ]

        def mock_analysis():
            cause_desc = {
                DisruptionCause.TRAFFIC_CONGESTION: "Confirmed severe bottleneck on NH48 near Vellore bypass due to a multi-vehicle collision blocking 2 of 3 lanes.",
                DisruptionCause.VEHICLE_BREAKDOWN: "Confirmed mechanical transmission lock on Vehicle " + shipment.vehicle_id + " requiring roadside recovery.",
                DisruptionCause.WEATHER_DISRUPTION: "Flash localized rainfall causing waterlogging on expressway exit ramps.",
                DisruptionCause.WAREHOUSE_BOTTLENECK: "Cross-dock bay congestion delaying outbound staging."
            }.get(incident.cause_category, "Unscheduled transit delay.")

            return {
                "incident_id": incident.id,
                "shipment_id": shipment.id,
                "cause_category": incident.cause_category.value,
                "cause_classification": "CONFIRMED_EXTERNAL_BOTTLENECK",
                "severity": incident.severity.value,
                "summary": incident.summary,
                "detailed_analysis": cause_desc,
                "impacted_deliveries": [shipment.order_id],
                "penalty_exposure_inr": 50000.0,
                "recommended_agents": ["inventory", "route", "cost", "recovery"],
                "reasoning": (
                    f"Disruption Investigation Confirmed: {cause_desc} The delay of {shipment.delay_minutes} minutes "
                    f"directly threatens delivery of high-value cargo ({shipment.cargo_description}) before the {shipment.deadline} cutoff. "
                    f"Recommended immediate parallel evaluation: (1) Route detours avoiding NH48 bottleneck, "
                    f"and (2) Stock availability at intermediate hubs (Hosur/Vellore) for expedited replacement."
                )
            }

        prompt = f"Analyze disruption {incident.id} for shipment {shipment.id} with cause {incident.cause_category} and delay {shipment.delay_minutes} mins."
        system_instruction = "You are the Disruption Analysis Agent. Determine root cause, severity, impact, and output JSON."

        result = self.call_llm_or_mock(prompt, system_instruction, mock_analysis)
        latency = int((time.time() - start_time) * 1000)

        run = self.record_run(
            incident_id=incident.id,
            shipment_id=shipment.id,
            tool_calls=tool_calls,
            reasoning_summary=result.get("reasoning", ""),
            output_payload=result,
            latency_ms=latency
        )
        db.record_agent_run(run)

        return result
