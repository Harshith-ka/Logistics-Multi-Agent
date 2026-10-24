from fastapi import APIRouter
from simulator import simulator
from database import db
from models import DisruptionCause

router = APIRouter(prefix="/simulation", tags=["Simulation Control"])

@router.post("/pause")
def pause_simulation():
    simulator.is_running = False
    return {"status": "PAUSED"}

@router.post("/resume")
def resume_simulation():
    simulator.is_running = True
    return {"status": "RUNNING"}

@router.post("/speed")
def set_simulation_speed(factor: float = 1.0):
    simulator.speed_factor = max(0.5, min(5.0, factor))
    return {"status": "SPEED_UPDATED", "speed_factor": simulator.speed_factor}

@router.post("/reset")
def reset_simulation():
    db.seed_data()
    return {"status": "RESET_COMPLETED"}

@router.post("/trigger-flagship-incident")
def trigger_flagship_incident():
    """Triggers the Chennai-Bengaluru highway collision disruption scenario from PRD."""
    incident = simulator.inject_disruption(
        shipment_id="SHP-1024",
        cause=DisruptionCause.TRAFFIC_CONGESTION,
        delay_minutes=95,
        custom_message="Multi-axle truck collision causing standstill on NH48 Vellore bypass km 114"
    )
    return {"status": "INCIDENT_TRIGGERED", "incident": incident}
