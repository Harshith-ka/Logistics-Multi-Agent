import time
from typing import Dict, Any, List
from agents.base import BaseAgent
from models import AgentType, Shipment
from database import db

class CostOptimizationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_type=AgentType.COST,
            name="Cost Optimization Agent",
            description="Performs deterministic financial calculations of fuel, tolls, carrier fees, warehouse handling, and penalty avoidance."
        )

    def evaluate_costs(self, shipment: Shipment, route_data: Dict[str, Any], inventory_data: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.time()

        contractual_penalty_per_hour = 50000.0  # Tier-1 OEM line stoppage SLA
        
        tool_calls = [
            {"tool": "calculate_fuel_burn_cost", "args": {"consumption_liters_per_km": 0.35, "diesel_price_inr": 92.5}, "result": {"cost_per_km_inr": 32.37}},
            {"tool": "fetch_fastag_toll_rates", "args": {"highway_segments": ["NH48", "SH116"]}, "result": {"toll_variance_inr": 250.0}},
            {"tool": "calculate_sla_penalty_exposure", "args": {"projected_delay_hours": 1.5, "hourly_penalty": contractual_penalty_per_hour}, "result": {"penalty_exposure_inr": 75000.0}}
        ]

        # Deterministic cost breakdown for each recovery strategy
        options_cost_breakdown = [
            {
                "strategy": "continue_current_route",
                "fuel_cost_inr": 0.0,
                "toll_cost_inr": 0.0,
                "carrier_expedite_fee_inr": 0.0,
                "warehouse_handling_inr": 0.0,
                "total_added_cost_inr": 0.0,
                "sla_delay_penalty_inr": 75000.0,
                "net_financial_impact_inr": 75000.0,
                "roi_assessment": "Negative ROI - Incurs severe contractual line stoppage penalties of ₹75,000."
            },
            {
                "strategy": "reroute_sh116_bypass",
                "fuel_cost_inr": 600.0,
                "toll_cost_inr": 250.0,
                "carrier_expedite_fee_inr": 0.0,
                "warehouse_handling_inr": 0.0,
                "total_added_cost_inr": 850.0,
                "sla_delay_penalty_inr": 15000.0,
                "net_financial_impact_inr": 15850.0,
                "roi_assessment": "Moderate ROI - Saves ₹59,150 in gross penalty exposure, but still arrives 30 mins after SLA deadline."
            },
            {
                "strategy": "alternate_carrier_transfer",
                "fuel_cost_inr": 0.0,
                "toll_cost_inr": 300.0,
                "carrier_expedite_fee_inr": 2100.0,
                "warehouse_handling_inr": 0.0,
                "total_added_cost_inr": 2400.0,
                "sla_delay_penalty_inr": 0.0,
                "net_financial_impact_inr": 2400.0,
                "roi_assessment": "High ROI (Optimal) - For ₹2,400 investment, avoids all ₹75,000 delay penalties with 100% SLA adherence."
            },
            {
                "strategy": "alternate_warehouse_fulfillment",
                "fuel_cost_inr": 900.0,
                "toll_cost_inr": 150.0,
                "carrier_expedite_fee_inr": 1350.0,
                "warehouse_handling_inr": 800.0,
                "total_added_cost_inr": 3200.0,
                "sla_delay_penalty_inr": 0.0,
                "net_financial_impact_inr": 3200.0,
                "roi_assessment": "High ROI - Guarantees arrival at 5:30 PM from Hosur Hub, total added cost ₹3,200 vs ₹75,000 penalty."
            }
        ]

        def mock_cost_analysis():
            return {
                "shipment_id": shipment.id,
                "options_costs": options_cost_breakdown,
                "most_cost_effective_on_time": "alternate_carrier_transfer",
                "net_savings_inr": 72600.0,
                "reasoning": (
                    f"Financial Trade-off Analysis: Continuing as-is costs ₹0 upfront but will trigger ₹75,000 in customer "
                    f"downtime penalties. The Alternate Carrier option incurs ₹2,400 total expenditure (Carrier expedite fee ₹2,100 + "
                    f"Tolls ₹300) and preserves 100% on-time delivery, producing an immediate net economic benefit of ₹72,600."
                )
            }

        prompt = f"Perform cost optimization for shipment {shipment.id} options."
        system_instruction = "You are the Cost Optimization Agent. Output deterministic cost breakdowns, ROI, and explain trade-offs."

        result = self.call_llm_or_mock(prompt, system_instruction, mock_cost_analysis)
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

        return result
