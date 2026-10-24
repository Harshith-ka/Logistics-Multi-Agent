from fastapi import APIRouter, HTTPException
from typing import List
from models import Incident, DisruptionInjectionRequest
from database import db
from simulator import simulator

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("", response_model=List[Incident])
def get_incidents():
    return db.get_all_incidents()

@router.get("/{incident_id}", response_model=Incident)
def get_incident(incident_id: str):
    inc = db.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@router.post("/inject", response_model=Incident)
def inject_disruption(req: DisruptionInjectionRequest):
    try:
        incident = simulator.inject_disruption(
            shipment_id=req.shipment_id,
            cause=req.cause,
            delay_minutes=req.delay_minutes,
            custom_message=req.custom_message
        )
        return incident
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
