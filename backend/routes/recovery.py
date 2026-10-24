from fastapi import APIRouter, HTTPException
from typing import List, Optional
from models import RecoveryPlan, ApprovalRequest
from database import db
from agents.orchestrator import OrchestratorAgent

router = APIRouter(prefix="/recovery", tags=["Recovery"])

orchestrator_instance = None

def get_orchestrator():
    global orchestrator_instance
    if not orchestrator_instance:
        orchestrator_instance = OrchestratorAgent()
    return orchestrator_instance

@router.get("/plans", response_model=List[RecoveryPlan])
def get_recovery_plans():
    return list(db.recovery_plans.values())

@router.get("/plans/{plan_id}", response_model=RecoveryPlan)
def get_recovery_plan(plan_id: str):
    plan = db.get_recovery_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Recovery plan not found")
    return plan

@router.get("/incident/{incident_id}", response_model=Optional[RecoveryPlan])
def get_plan_for_incident(incident_id: str):
    plan = db.get_plan_by_incident(incident_id)
    return plan

@router.post("/approve")
def submit_approval(req: ApprovalRequest):
    plan = db.get_recovery_plan(req.plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Recovery plan not found")

    orch = get_orchestrator()
    try:
        result = orch.execute_approved_recovery(
            plan_id=req.plan_id,
            selected_option_id=req.selected_option_id,
            reviewer=req.reviewer_name
        )
        return {
            "status": "APPROVED_AND_EXECUTED",
            "plan_id": plan.id,
            "selected_option_id": req.selected_option_id,
            "reviewer": req.reviewer_name,
            "execution_result": result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
