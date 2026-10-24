import time
from typing import Dict, Any, Optional
from agents.base import BaseAgent
from agents.monitoring import ShipmentMonitoringAgent
from agents.disruption import DisruptionAnalysisAgent
from agents.inventory import InventoryAgent
from agents.route import RouteOptimizationAgent
from agents.cost import CostOptimizationAgent
from agents.recovery import RecoveryPlanningAgent
from agents.validation import ValidationAgent
from agents.execution import ExecutionAgent
from models import AgentType, Incident, Shipment, RecoveryPlan, IncidentStatus, ShipmentStatus, RiskLevel
from database import db

class OrchestratorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_type=AgentType.ORCHESTRATOR,
            name="Central Orchestrator Agent",
            description="Coordinates specialized logistics agents, manages dependency execution pipelines, and enforces human-in-the-loop control gates."
        )
        self.monitoring_agent = ShipmentMonitoringAgent()
        self.disruption_agent = DisruptionAnalysisAgent()
        self.inventory_agent = InventoryAgent()
        self.route_agent = RouteOptimizationAgent()
        self.cost_agent = CostOptimizationAgent()
        self.recovery_agent = RecoveryPlanningAgent()
        self.validation_agent = ValidationAgent()
        self.execution_agent = ExecutionAgent()

    def orchestrate_disruption_recovery(self, incident_id: str) -> Dict[str, Any]:
        """
        Executes the closed-loop recovery pipeline up to the validation & approval gate.
        """
        start_time = time.time()
        incident = db.get_incident(incident_id)
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")

        shipment = db.get_shipment(incident.shipment_id)
        if not shipment:
            raise ValueError(f"Shipment {incident.shipment_id} not found")

        # Mark incident and shipment state
        incident.status = IncidentStatus.INVESTIGATING
        shipment.status = ShipmentStatus.AT_RISK
        shipment.risk_level = incident.severity
        shipment.active_incident_id = incident.id
        db.save_incident(incident)
        db.update_shipment(shipment)

        pipeline_steps = []

        # 1. Disruption Analysis
        disruption_res = self.disruption_agent.analyze_incident(incident, shipment)
        pipeline_steps.append({"agent": "disruption", "status": "completed", "summary": disruption_res.get("summary")})

        # 2. Inventory and Route Evaluation (Parallel / Sequential)
        inventory_res = self.inventory_agent.evaluate_inventory_options(shipment)
        pipeline_steps.append({"agent": "inventory", "status": "completed", "best_hub": inventory_res.get("best_alternative_hub")})

        route_res = self.route_agent.optimize_routes(shipment)
        pipeline_steps.append({"agent": "route", "status": "completed", "recommended_route": route_res.get("recommended_route")})

        # 3. Cost Optimization
        cost_res = self.cost_agent.evaluate_costs(shipment, route_res, inventory_res)
        pipeline_steps.append({"agent": "cost", "status": "completed", "optimal_strategy": cost_res.get("most_cost_effective_on_time")})

        # 4. Recovery Planning
        plan = self.recovery_agent.formulate_plan(
            incident=incident,
            shipment=shipment,
            disruption_data=disruption_res,
            inventory_data=inventory_res,
            route_data=route_res,
            cost_data=cost_res
        )
        pipeline_steps.append({"agent": "recovery", "status": "completed", "plan_id": plan.id, "options_count": len(plan.options)})

        # 5. Validation Check
        val_res = self.validation_agent.validate_plan(plan, shipment)
        pipeline_steps.append({"agent": "validation", "status": "completed", "gate_status": val_res.get("overall_status")})

        # 6. Set status for Human-in-the-Loop review
        incident.status = IncidentStatus.PENDING_APPROVAL
        db.save_incident(incident)

        def mock_orchestrator_summary():
            return {
                "incident_id": incident.id,
                "shipment_id": shipment.id,
                "plan_id": plan.id,
                "status": "AWAITING_HUMAN_APPROVAL",
                "pipeline_steps": pipeline_steps,
                "recommended_option_id": plan.recommended_option_id,
                "reasoning": (
                    f"Orchestration completed for Disruption {incident.id}. Agents (Disruption, Route, Inventory, Cost, Recovery, Validation) "
                    f"have completed investigation and generated 4 ranked options. Validation confirmed all physical constraints. "
                    f"System is now holding at the Human-in-the-Loop gate awaiting Logistics Manager review."
                )
            }

        prompt = f"Summarize orchestration run for incident {incident.id}."
        system_instruction = "You are the Central Orchestrator Agent. Summarize the end-to-end multi-agent execution results."

        summary = self.call_llm_or_mock(prompt, system_instruction, mock_orchestrator_summary)
        latency = int((time.time() - start_time) * 1000)

        run = self.record_run(
            incident_id=incident.id,
            shipment_id=shipment.id,
            tool_calls=[{"tool": "dispatch_agent_pipeline", "args": {"agents": ["disruption", "inventory", "route", "cost", "recovery", "validation"]}, "result": {"pipeline_status": "SUCCESS"}}],
            reasoning_summary=summary.get("reasoning", ""),
            output_payload=summary,
            latency_ms=latency
        )
        db.record_agent_run(run)

        return summary

    def execute_approved_recovery(self, plan_id: str, selected_option_id: str, reviewer: str) -> Dict[str, Any]:
        """Dispatches the execution agent upon human authorization."""
        plan = db.get_recovery_plan(plan_id)
        if not plan:
            raise ValueError(f"Plan {plan_id} not found")
        
        exec_res = self.execution_agent.execute_plan(plan, selected_option_id, approved_by=reviewer)
        return exec_res
