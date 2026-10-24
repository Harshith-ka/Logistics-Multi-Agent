import time
from typing import Dict, Any, List
from agents.base import BaseAgent
from models import AgentType, Shipment
from database import db

class InventoryAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_type=AgentType.INVENTORY,
            name="Inventory Agent",
            description="Queries regional fulfillment centers, checks stock availability vs reserved buffers, and assesses alternative stock allocation."
        )

    def evaluate_inventory_options(self, shipment: Shipment, sku: str = "AUTO-SEN-902", required_qty: int = 180) -> Dict[str, Any]:
        start_time = time.time()

        # Query all inventory matching SKU
        items = db.get_inventory_by_sku(sku)
        
        tool_calls = [
            {"tool": "query_wms_stock_levels", "args": {"sku": sku}, "result": [{"warehouse_id": i.warehouse_id, "available_qty": i.available_qty, "reserved_qty": i.reserved_qty} for i in items]},
            {"tool": "check_reservation_feasibility", "args": {"required_qty": required_qty, "candidate_hubs": ["WH-HOS-03", "WH-VEL-02", "WH-BLR-04"]}, "result": {"wh_hos_03_qualified": True, "wh_vel_02_qualified": False}}
        ]

        # Evaluate candidate hubs
        candidates = []
        for i in items:
            wh = db.get_warehouse(i.warehouse_id)
            wh_name = wh.name if wh else i.warehouse_id
            can_fulfill = i.available_qty >= required_qty
            candidates.append({
                "warehouse_id": i.warehouse_id,
                "warehouse_name": wh_name,
                "available_qty": i.available_qty,
                "reserved_qty": i.reserved_qty,
                "can_fulfill_full_order": can_fulfill,
                "fulfillment_lead_time_minutes": 45 if "HOS" in i.warehouse_id else (90 if "VEL" in i.warehouse_id else 180),
                "handling_cost_inr": 800.0 if can_fulfill else 0.0
            })

        def mock_inventory_analysis():
            return {
                "sku": sku,
                "required_quantity": required_qty,
                "evaluated_warehouses": candidates,
                "best_alternative_hub": "WH-HOS-03",
                "alternative_hub_name": "Hosur Advanced Fulfillment Center",
                "available_stock_at_hub": 310,
                "dispatch_lead_time_minutes": 45,
                "estimated_transit_to_destination_minutes": 40,
                "feasible": True,
                "reasoning": (
                    f"Inventory query for SKU {sku} (Qty: {required_qty}): Hosur Fulfillment Center (WH-HOS-03) has 310 units "
                    f"readily unreserved with immediate dispatch capability. Cross-docking replacement inventory from Hosur to "
                    f"Bengaluru East (WH-BLR-04) can be accomplished in 85 minutes total (45 min pick/pack + 40 min transit), "
                    f"arriving well before the destination SLA deadline."
                )
            }

        prompt = f"Evaluate inventory options for SKU {sku}, quantity {required_qty} for shipment {shipment.id}."
        system_instruction = "You are the Inventory Agent. Evaluate stock availability and pick the optimal alternative fulfillment center."

        result = self.call_llm_or_mock(prompt, system_instruction, mock_inventory_analysis)
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
