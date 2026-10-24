from fastapi import APIRouter
from typing import List, Optional, Dict, Any
from models import AgentRun, AgentType
from database import db

router = APIRouter(prefix="/agents", tags=["Agents"])

@router.get("/runs", response_model=List[AgentRun])
def get_agent_runs(incident_id: Optional[str] = None, shipment_id: Optional[str] = None):
    return db.get_agent_runs(incident_id=incident_id, shipment_id=shipment_id)

@router.get("/workflow/{incident_id}")
def get_workflow_graph(incident_id: str) -> Dict[str, Any]:
    incident = db.get_incident(incident_id)
    runs = db.get_agent_runs(incident_id=incident_id)
    plan = db.get_plan_by_incident(incident_id)
    
    agent_status_map = {r.agent_type: r for r in runs}

    # Define visual graph topology of the 9 agents
    nodes = [
        {"id": "orchestrator", "name": "1. Orchestrator Agent", "role": "Central Workflow Coordinator", "type": "coordinator"},
        {"id": "monitoring", "name": "2. Shipment Monitoring", "role": "Telemetry & ETA Deviation", "type": "detector"},
        {"id": "disruption", "name": "3. Disruption Analysis", "role": "Root Cause & Impact", "type": "analyzer"},
        {"id": "inventory", "name": "4. Inventory Agent", "role": "Warehouse Reserves & Hubs", "type": "evaluator"},
        {"id": "route", "name": "5. Route Optimization", "role": "Road Detours & Corridors", "type": "evaluator"},
        {"id": "cost", "name": "6. Cost Optimization", "role": "Deterministic Financial ROI", "type": "evaluator"},
        {"id": "recovery", "name": "7. Recovery Planning", "role": "Ranked Strategy Synthesis", "type": "synthesizer"},
        {"id": "validation", "name": "8. Validation Agent", "role": "Constraint Checking Gate", "type": "gatekeeper"},
        {"id": "execution", "name": "9. Execution Agent", "role": "TMS & Audit Log Dispatch", "type": "executor"}
    ]

    for node in nodes:
        atype = node["id"]
        run = agent_status_map.get(atype)
        if run:
            node["status"] = run.status.value
            node["latency_ms"] = run.latency_ms
            node["tool_calls"] = run.tool_calls
            node["reasoning"] = run.reasoning_summary
            node["completed_at"] = run.completed_at
        else:
            if atype == "execution" and plan and plan.status.value == "executing":
                node["status"] = "success"
            elif atype == "execution" and plan and plan.status.value == "pending_approval":
                node["status"] = "awaiting_approval"
            else:
                node["status"] = "idle"
                node["latency_ms"] = 0
                node["tool_calls"] = []
                node["reasoning"] = "Standby - Waiting for pipeline activation."

    edges = [
        {"from": "orchestrator", "to": "monitoring", "label": "tracks"},
        {"from": "monitoring", "to": "disruption", "label": "triggers on delay"},
        {"from": "disruption", "to": "inventory", "label": "checks stock"},
        {"from": "disruption", "to": "route", "label": "requests detour"},
        {"from": "inventory", "to": "cost", "label": "passes inventory fees"},
        {"from": "route", "to": "cost", "label": "passes fuel/tolls"},
        {"from": "cost", "to": "recovery", "label": "feeds financial ROI"},
        {"from": "recovery", "to": "validation", "label": "submits plan"},
        {"from": "validation", "to": "execution", "label": "human approval gate"}
    ]

    return {
        "incident_id": incident_id,
        "nodes": nodes,
        "edges": edges,
        "incident_status": incident.status.value if incident else "unknown",
        "plan_id": plan.id if plan else None
    }
