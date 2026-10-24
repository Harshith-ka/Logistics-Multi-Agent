from fastapi import APIRouter, HTTPException
from typing import List, Optional
from models import Shipment, ShipmentStatus
from database import db
import uuid
import datetime

router = APIRouter(prefix="/shipments", tags=["Shipments"])

@router.get("", response_model=List[Shipment])
def get_shipments(status: Optional[ShipmentStatus] = None):
    shipments = db.get_all_shipments()
    if status:
        return [s for s in shipments if s.status == status]
    return shipments

@router.get("/{shipment_id}", response_model=Shipment)
def get_shipment(shipment_id: str):
    s = db.get_shipment(shipment_id)
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return s

@router.post("", response_model=Shipment)
def create_shipment(shipment: Shipment):
    if not shipment.id:
        shipment.id = f"SHP-{uuid.uuid4().hex[:4].upper()}"
    db.update_shipment(shipment)
    return shipment
