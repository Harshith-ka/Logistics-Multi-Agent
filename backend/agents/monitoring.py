import time
from typing import Dict, Any, Tuple
from agents.base import BaseAgent
from models import AgentType, Shipment, RiskLevel, ShipmentStatus, Incident, DisruptionCause, IncidentStatus
from database import db
import datetime
import uuid

class ShipmentMonitoringAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_type=AgentType.MONITORING,
            name="Shipment Monitoring Agent",
            description="Continuously tracks vehicle telemetry, compares revised ETA against delivery deadlines, and emits disruption risk signals."
        )

    def analyze_shipment(self, shipment: Shipment) -> Tuple[Dict[str, Any], bool]:
        """
        Monitors shipment progress. Returns (monitoring_payload, is_at_risk).
        """
        start_time = time.time()
        tool_calls = [
            {"tool": "gps_telemetry_fetch", "args": {"vehicle_id": shipment.vehicle_id}, "result": {"speed_kmh": shipment.speed_kmh, "location": shipment.current_location.model_dump()}},
            {"tool": "calculate_eta_delta", "args": {"scheduled_eta": shipment.scheduled_eta, "revised_eta": shipment.revised_eta, "deadline": shipment.deadline}, "result": {"delay_minutes": shipment.delay_minutes}}
        ]

        is_at_risk = shipment.delay_minutes > 15 or shipment.status in [ShipmentStatus.AT_RISK, ShipmentStatus.DELAYED]

        def mock_analysis():
            if is_at_risk:
                risk_lvl = RiskLevel.CRITICAL if shipment.delay_minutes > 60 else RiskLevel.HIGH
                reasoning = (
                    f"Vehicle {shipment.vehicle_id} carrying order {shipment.order_id} shows a predicted delay "
                    f"of {shipment.delay_minutes} minutes. The revised ETA ({shipment.revised_eta}) breaches the contractual "
                    f"deadline ({shipment.deadline}). Immediate operational intervention is required."
                )
            else:
                risk_lvl = RiskLevel.LOW
                reasoning = (
                    f"Vehicle {shipment.vehicle_id} is operating on-schedule at {shipment.speed_kmh:.1f} km/h. "
                    f"Current ETA {shipment.revised_eta} is well within the SLA deadline {shipment.deadline}."
                )
            return {
                "shipment_id": shipment.id,
                "status": "at_risk" if is_at_risk else "normal",
                "delay_minutes": shipment.delay_minutes,
                "risk_level": risk_lvl.value,
                "reasoning": reasoning
            }

        prompt = f"Analyze shipment {shipment.id} with delay {shipment.delay_minutes} mins against deadline {shipment.deadline}."
        system_instruction = "You are the Shipment Monitoring Agent. Determine delay risk and output JSON with shipment_id, status, delay_minutes, risk_level, and reasoning."
        
        result = self.call_llm_or_mock(prompt, system_instruction, mock_analysis)
        latency = int((time.time() - start_time) * 1000)

        run = self.record_run(
            incident_id=shipment.active_incident_id,
            shipment_id=shipment.id,
            tool_calls=tool_calls,
            reasoning_summary=result.get("reasoning", ""),
            output_payload=result,
            latency_ms=latency
        )
        db.record_agent_run(run)

        return result, is_at_risk
