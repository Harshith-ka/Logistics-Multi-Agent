import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "AgentForge Logistics"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
    USE_MOCK_LLM_FALLBACK: bool = True
    SIMULATION_INTERVAL_SECONDS: float = 3.0
    SIMULATION_SPEED_MULTIPLIER: float = 1.0

settings = Settings()
