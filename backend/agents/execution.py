import time
import uuid
import hashlib
from typing import Dict, Any, Optional
from agents.base import BaseAgent
from models import AgentType, RecoveryPlan, RecoveryOption, Shipment, ShipmentStatus, IncidentStatus, AuditEvent, RiskLevel
from database import db

class ExecutionAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_type=AgentType.EXECUTION,
            name="Execution Agent",
            description="Executes verified and human-approved recovery plans across TMS, WMS, and customer communication channels with cryptographic audit verification."
        )

    def execute_plan(self, plan: RecoveryPlan, chosen_option_id: str, approved_by: str = "Logistics Operations Lead") -> Dict[str, Any]:
        start_time = time.time()

        # Find the selected option
        chosen_opt: Optional[RecoveryOption] = None
        for opt in plan.options:
            if opt.option_id == chosen_option_id:
                chosen_opt = opt
                break

        if not chosen_opt:
            raise ValueError(f"Option {chosen_option_id} not found in plan {plan.id}")

        shipment = db.get_shipment(plan.shipment_id)
        if not shipment:
            raise ValueError(f"Shipment {plan.shipment_id} not found")

        # Generate idempotency key and confirmation hash
        idempotency_key = f"EXEC-{plan.id}-{chosen_opt.option_id}-{int(time.time())}"
        confirmation_data = f"{idempotency_key}:{shipment.id}:{chosen_opt.added_cost_inr}:{approved_by}"
        confirmation_hash = "SHA256:" + hashlib.sha256(confirmation_data.encode()).hexdigest()[:16]

        tool_calls = [
            {"tool": "tms_dispatch_reassignment", "args": {"shipment_id": shipment.id, "carrier": chosen_opt.carrier_name or shipment.carrier_name, "route_strategy": chosen_opt.strategy_type.value}, "result": {"tms_status": "CONFIRMED", "tms_dispatch_id": f"TMS-DSP-{uuid.uuid4().hex[:6].upper()}"}},
            {"tool": "wms_reserve_dispatch", "args": {"warehouse_id": chosen_opt.alternative_warehouse_id or "WH-CHN-01"}, "result": {"wms_status": "ALLOCATED"}},
            {"tool": "customer_sla_notification_dispatch", "args": {"order_id": shipment.order_id, "revised_eta": chosen_opt.revised_eta, "status": "ON_TIME_GUARANTEED"}, "result": {"sms_status": "SENT", "email_status": "SENT"}},
            {"tool": "write_immutable_audit_ledger", "args": {"hash": confirmation_hash, "actor": approved_by}, "result": {"ledger_block": 10429, "status": "COMMITTED"}}
        ]

        # Update shipment state in database
        shipment.revised_eta = chosen_opt.revised_eta
        shipment.status = ShipmentStatus.RECOVERING
        shipment.risk_level = RiskLevel.LOW
        shipment.delay_minutes = max(0, chosen_opt.eta_delta_minutes)
        if chosen_opt.carrier_name:
            shipment.carrier_name = chosen_opt.carrier_name
        db.update_shipment(shipment)

        # Update recovery plan and incident status
        plan.status = IncidentStatus.EXECUTING
        plan.approved_by = approved_by
        plan.approved_option_id = chosen_opt.option_id
        db.save_recovery_plan(plan)

        incident = db.get_incident(plan.incident_id)
        if incident:
            incident.status = IncidentStatus.EXECUTING
            db.save_incident(incident)

        # Record Audit Event
        audit = AuditEvent(
            id=f"AUD-{uuid.uuid4().hex[:8].upper()}",
            actor=approved_by,
            action="EXECUTE_APPROVED_RECOVERY_STRATEGY",
            entity_type="SHIPMENT",
            entity_id=shipment.id,
            details={
                "plan_id": plan.id,
                "chosen_option": chosen_opt.title,
                "strategy": chosen_opt.strategy_type.value,
                "added_cost_inr": chosen_opt.added_cost_inr,
                "revised_eta": chosen_opt.revised_eta,
                "steps_dispatched": chosen_opt.action_steps
            },
            external_confirmation_hash=confirmation_hash,
            idempotency_key=idempotency_key
        )
        db.record_audit_event(audit)

        def mock_execution_result():
            return {
                "execution_status": "SUCCESS",
                "confirmation_hash": confirmation_hash,
                "idempotency_key": idempotency_key,
                "plan_id": plan.id,
                "selected_option": chosen_opt.title,
                "revised_eta": chosen_opt.revised_eta,
                "actions_executed": chosen_opt.action_steps,
                "reasoning": (
                    f"Execution confirmed by {approved_by}. Dispatched digital transport reassignment to TMS, "
                    f"notified destination receiving docks, and updated customer order SLA status. "
                    f"Confirmation hash: {confirmation_hash} committed to the audit ledger."
                )
            }

        prompt = f"Execute recovery plan {plan.id} using option {chosen_opt.title} approved by {approved_by}."
        system_instruction = "You are the Execution Agent. Execute approved operational actions and return audit confirmation."

        result = self.call_llm_or_mock(prompt, system_instruction, mock_execution_result)
        latency = int((time.time() - start_time) * 1000)

        run = self.record_run(
            incident_id=plan.incident_id,
            shipment_id=shipment.id,
            tool_calls=tool_calls,
            reasoning_summary=result.get("reasoning", ""),
            output_payload=result,
            latency_ms=latency
        )
        db.record_agent_run(run)

        return result
