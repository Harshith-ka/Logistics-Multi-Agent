import time
import uuid
from typing import Dict, Any, List
from agents.base import BaseAgent
from models import AgentType, Shipment, Incident, RecoveryPlan, RecoveryOption, StrategyType, RiskLevel, IncidentStatus
from database import db

class RecoveryPlanningAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_type=AgentType.RECOVERY,
            name="Recovery Planning Agent",
            description="Synthesizes multi-agent findings into prioritized, feasible recovery options with clear operational trade-offs."
        )

    def formulate_plan(
        self,
        incident: Incident,
        shipment: Shipment,
        disruption_data: Dict[str, Any],
        inventory_data: Dict[str, Any],
        route_data: Dict[str, Any],
        cost_data: Dict[str, Any]
    ) -> RecoveryPlan:
        start_time = time.time()

        tool_calls = [
            {"tool": "rank_recovery_matrix", "args": {"criteria": ["SLA_compliance", "net_cost", "execution_risk"]}, "result": {"winner": "OPT-ALT-CARRIER", "score": 94}},
            {"tool": "generate_contingency_steps", "args": {"selected_option": "OPT-ALT-CARRIER"}, "result": {"steps_count": 4}}
        ]

        # Construct concrete options
        opt1 = RecoveryOption(
            option_id="OPT-REROUTE-01",
            strategy_type=StrategyType.REROUTE,
            title="Alternative Route via SH-116 Bypass",
            description="Divert vehicle VEH-TN-01-9872 onto SH-116 state highway bypass around Vellore bottleneck.",
            added_cost_inr=850.0,
            revised_eta="06:30 PM",
            eta_delta_minutes=30,
            status_prediction="late",
            feasibility_score=82,
            risk_level=RiskLevel.MEDIUM,
            action_steps=[
                "Issue in-cab navigation update via TMS to driver Ramesh Kumar",
                "Recharge FASTag wallet with ₹250 for SH-116 toll plaza",
                "Notify destination staging dock of 30-minute delay adjustment"
            ],
            toll_cost_inr=250.0,
            fuel_cost_inr=600.0,
            penalty_avoided_inr=59150.0,
            is_recommended=False,
            tradeoff_explanation="Low added cost (₹850), but still misses the 6:00 PM deadline by 30 minutes."
        )

        opt2 = RecoveryOption(
            option_id="OPT-CARRIER-02",
            strategy_type=StrategyType.ALTERNATE_CARRIER,
            title="Alternate Carrier Reassignment at Vellore Interchange",
            description="Cross-dock 180 sensors onto Delhivery Rapid Freight (VEH-KA-05-4421) on express priority corridor.",
            added_cost_inr=2400.0,
            revised_eta="05:45 PM",
            eta_delta_minutes=-15,
            status_prediction="on_time",
            feasibility_score=95,
            risk_level=RiskLevel.LOW,
            action_steps=[
                "Dispatch TMS digital handover manifest to Delhivery Rapid Freight at Ranipet Toll Plaza",
                "Transfer cargo under dual-tamper seals within 15-minute cross-dock SLA",
                "Switch active telemetry stream to vehicle VEH-KA-05-4421",
                "Notify OEM Assembly plant that arrival is confirmed for 5:45 PM (15 mins early)"
            ],
            carrier_name="Delhivery Rapid Freight",
            toll_cost_inr=300.0,
            penalty_avoided_inr=75000.0,
            is_recommended=True,
            tradeoff_explanation="Highly Recommended: Added cost of ₹2,400 completely preserves SLA, avoiding ₹75,000 in contractual downtime penalties."
        )

        opt3 = RecoveryOption(
            option_id="OPT-WMS-03",
            strategy_type=StrategyType.ALTERNATE_WAREHOUSE,
            title="Emergency Fulfillment from Hosur Hub (WH-HOS-03)",
            description="Fulfill order directly from available buffer stock at Hosur Advanced Fulfillment Center with dedicated express dispatch.",
            added_cost_inr=3200.0,
            revised_eta="05:30 PM",
            eta_delta_minutes=-30,
            status_prediction="on_time",
            feasibility_score=88,
            risk_level=RiskLevel.LOW,
            action_steps=[
                "Create emergency WMS pick wave at Hosur Hub (WH-HOS-03) for 180 units AUTO-SEN-902",
                "Assign express transit shuttle to Whitefield Logistics Corridor",
                "Recall original shipment SHP-1024 to return to Vellore Hub for stock restaging"
            ],
            alternative_warehouse_id="WH-HOS-03",
            toll_cost_inr=150.0,
            penalty_avoided_inr=75000.0,
            is_recommended=False,
            tradeoff_explanation="Fastest arrival (5:30 PM) but slightly higher cost (₹3,200) and requires reverse-logistics restaging of original vehicle."
        )

        opt4 = RecoveryOption(
            option_id="OPT-CONTINUE-04",
            strategy_type=StrategyType.CONTINUE_AS_IS,
            title="Continue on Current Route (Standstill in Queue)",
            description="Maintain current driver instructions without rerouting or cargo reassignment.",
            added_cost_inr=0.0,
            revised_eta="08:00 PM",
            eta_delta_minutes=120,
            status_prediction="late",
            feasibility_score=40,
            risk_level=RiskLevel.CRITICAL,
            action_steps=[
                "Monitor vehicle telemetry periodically",
                "Send delay notification warning to customer"
            ],
            toll_cost_inr=0.0,
            penalty_avoided_inr=0.0,
            is_recommended=False,
            tradeoff_explanation="Unacceptable: Incurs ₹75,000 in assembly line stoppage penalties and causes severe SLA breach."
        )

        plan_id = f"PLAN-{uuid.uuid4().hex[:8].upper()}"
        plan = RecoveryPlan(
            id=plan_id,
            incident_id=incident.id,
            shipment_id=shipment.id,
            options=[opt2, opt1, opt3, opt4],  # Ranked: recommended first
            recommended_option_id=opt2.option_id,
            status=IncidentStatus.PENDING_APPROVAL,
            validation_passed=True,
            validation_notes=["Pending formal Validation Agent verification"]
        )

        def mock_recovery_synthesis():
            return {
                "plan_id": plan.id,
                "recommended_option": opt2.title,
                "recommended_option_id": opt2.option_id,
                "justification": (
                    f"Synthesized recovery plan evaluates 4 options. Option 2 ('Alternate Carrier Reassignment') "
                    f"is the top-ranked recommendation. At ₹2,400 it completely eliminates late-delivery risk, arriving at "
                    f"5:45 PM ahead of the 6:00 PM cutoff, yielding a net savings of ₹72,600 over penalty exposure."
                )
            }

        prompt = f"Synthesize recovery plan for shipment {shipment.id} with incident {incident.id}."
        system_instruction = "You are the Recovery Planning Agent. Prioritize options by feasibility, cost, and deadline compliance."

        result = self.call_llm_or_mock(prompt, system_instruction, mock_recovery_synthesis)
        latency = int((time.time() - start_time) * 1000)

        run = self.record_run(
            incident_id=incident.id,
            shipment_id=shipment.id,
            tool_calls=tool_calls,
            reasoning_summary=result.get("justification", ""),
            output_payload={"plan_id": plan.id, "options_count": len(plan.options), "recommended_option_id": plan.recommended_option_id},
            latency_ms=latency
        )
        db.record_agent_run(run)

        db.save_recovery_plan(plan)
        return plan
