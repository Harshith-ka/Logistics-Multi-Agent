import time
import json
import logging
from typing import Dict, Any, List, Optional
from config import settings
from models import AgentType, AgentRun, AgentRunStatus

logger = logging.getLogger("agentforge.agent")

class BaseAgent:
    def __init__(self, agent_type: AgentType, name: str, description: str):
        self.agent_type = agent_type
        self.name = name
        self.description = description
        self.client = None
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception as e:
                logger.warning(f"Failed to initialize Google GenAI client: {e}. Will use mock fallback.")
                self.client = None

    def call_llm_or_mock(self, prompt: str, system_instruction: str, mock_fallback_func) -> Dict[str, Any]:
        """Calls Gemini API if client is configured, otherwise executes the deterministic mock engine."""
        if self.client and not settings.USE_MOCK_LLM_FALLBACK:
            try:
                response = self.client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt,
                    config={
                        "system_instruction": system_instruction,
                        "response_mime_type": "application/json"
                    }
                )
                if response.text:
                    return json.loads(response.text)
            except Exception as e:
                logger.warning(f"LLM call failed for {self.name}: {e}. Falling back to deterministic engine.")

        # Fallback deterministic generator
        return mock_fallback_func()

    def record_run(
        self,
        incident_id: Optional[str],
        shipment_id: Optional[str],
        tool_calls: List[Dict[str, Any]],
        reasoning_summary: str,
        output_payload: Dict[str, Any],
        latency_ms: int,
        status: AgentRunStatus = AgentRunStatus.SUCCESS
    ) -> AgentRun:
        import uuid
        import datetime
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return AgentRun(
            id=f"RUN-{uuid.uuid4().hex[:8].upper()}",
            agent_type=self.agent_type,
            incident_id=incident_id,
            shipment_id=shipment_id,
            status=status,
            started_at=now,
            completed_at=now,
            latency_ms=latency_ms,
            tool_calls=tool_calls,
            reasoning_summary=reasoning_summary,
            output_payload=output_payload,
            tokens_used=len(reasoning_summary.split()) * 2 + 120
        )
