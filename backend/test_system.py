import pytest
from database import db
from models import DisruptionCause, ShipmentStatus, IncidentStatus, RiskLevel
from simulator import simulator
from agents.orchestrator import OrchestratorAgent

def test_multi_agent_pipeline_end_to_end():
    db.seed_data()
    orchestrator = OrchestratorAgent()
    simulator.set_orchestrator(orchestrator)

    # 1. Verify initial seed state
    shipments = db.get_all_shipments()
    assert len(shipments) == 3
    shp1024 = db.get_shipment("SHP-1024")
    assert shp1024 is not None
    assert shp1024.status == ShipmentStatus.IN_TRANSIT
    assert shp1024.delay_minutes == 0

    # 2. Inject highway disruption on SHP-1024
    incident = simulator.inject_disruption(
        shipment_id="SHP-1024",
        cause=DisruptionCause.TRAFFIC_CONGESTION,
        delay_minutes=95,
        custom_message="Accident causing standstill on NH48 Vellore bypass"
    )

    assert incident.id.startswith("INC-")
    assert incident.severity == RiskLevel.HIGH

    # 3. Verify orchestrator executed pipeline
    plan = db.get_plan_by_incident(incident.id)
    assert plan is not None
    assert plan.validation_passed is True
    assert len(plan.options) == 4
    assert plan.recommended_option_id == "OPT-CARRIER-02"
    assert incident.status == IncidentStatus.PENDING_APPROVAL

    # 4. Verify agent runs were recorded
    runs = db.get_agent_runs(incident_id=incident.id)
    assert len(runs) >= 6
    agent_types = [r.agent_type.value for r in runs]
    assert "disruption" in agent_types
    assert "inventory" in agent_types
    assert "route" in agent_types
    assert "cost" in agent_types
    assert "recovery" in agent_types
    assert "validation" in agent_types

    # 5. Human approval action
    exec_res = orchestrator.execute_approved_recovery(
        plan_id=plan.id,
        selected_option_id="OPT-CARRIER-02",
        reviewer="Logistics Lead Test"
    )
    assert exec_res["execution_status"] == "SUCCESS"
    assert "confirmation_hash" in exec_res
    assert exec_res["confirmation_hash"].startswith("SHA256:")

    # 6. Verify shipment updated to RECOVERING and audit log written
    updated_shp = db.get_shipment("SHP-1024")
    assert updated_shp.status == ShipmentStatus.RECOVERING
    assert updated_shp.carrier_name == "Delhivery Rapid Freight"
    assert updated_shp.revised_eta == "05:45 PM"

    audit_events = db.get_audit_events()
    assert any(a.action == "EXECUTE_APPROVED_RECOVERY_STRATEGY" for a in audit_events)

if __name__ == "__main__":
    test_multi_agent_pipeline_end_to_end()
    print("All multi-agent pipeline tests passed!")
