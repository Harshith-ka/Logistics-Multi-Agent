from fastapi import APIRouter
from typing import List, Optional
from models import Warehouse, InventoryItem
from database import db

router = APIRouter(prefix="/inventory", tags=["Inventory & Warehouses"])

@router.get("/warehouses", response_model=List[Warehouse])
def get_warehouses():
    return db.get_all_warehouses()

@router.get("/items", response_model=List[InventoryItem])
def get_inventory_items(warehouse_id: Optional[str] = None, sku: Optional[str] = None):
    if warehouse_id:
        return db.get_inventory_for_warehouse(warehouse_id)
    if sku:
        return db.get_inventory_by_sku(sku)
    return db.get_all_inventory()
