import asyncio
import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from simulator import simulator
from agents.orchestrator import OrchestratorAgent

# Import routers
from routes.shipments import router as shipments_router
from routes.incidents import router as incidents_router
from routes.recovery import router as recovery_router
from routes.inventory import router as inventory_router
from routes.agents import router as agents_router
from routes.analytics import router as analytics_router
from routes.simulation import router as simulation_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("agentforge.main")

connected_clients = set()

async def ws_broadcast_handler(event_type: str, data: dict):
    if not connected_clients:
        return
    message = json.dumps({"event": event_type, "data": data})
    disconnected = set()
    for client in connected_clients:
        try:
            await client.send_text(message)
        except Exception:
            disconnected.add(client)
    connected_clients.difference_update(disconnected)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize orchestrator and bind to simulator
    orchestrator = OrchestratorAgent()
    simulator.set_orchestrator(orchestrator)
    simulator.subscribe(ws_broadcast_handler)

    # Start simulation background task
    sim_task = asyncio.create_task(simulator.run_simulation_loop())
    logger.info("AgentForge Logistics backend engine initialized.")
    yield
    sim_task.cancel()
    try:
        await sim_task
    except asyncio.CancelledError:
        pass
    logger.info("AgentForge Logistics backend shutdown cleanly.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Agentic AI-Powered Multi-Agent Supply Chain Management System",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(shipments_router, prefix=settings.API_PREFIX)
app.include_router(incidents_router, prefix=settings.API_PREFIX)
app.include_router(recovery_router, prefix=settings.API_PREFIX)
app.include_router(inventory_router, prefix=settings.API_PREFIX)
app.include_router(agents_router, prefix=settings.API_PREFIX)
app.include_router(analytics_router, prefix=settings.API_PREFIX)
app.include_router(simulation_router, prefix=settings.API_PREFIX)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "gemini_enabled": bool(settings.GEMINI_API_KEY),
        "mock_fallback": settings.USE_MOCK_LLM_FALLBACK
    }

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        # Keep connection open and receive any client ping
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients.discard(websocket)
    except Exception:
        connected_clients.discard(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
