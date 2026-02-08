import os
from typing import Any, Dict, List, Optional

from google import genai

from api.models import L2Reasoning


class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client: Optional[genai.Client] = None
        self.model_id = "gemini-2.5-flash"

    def _get_client(self) -> genai.Client:
        if self.client is None:
            if not self.api_key:
                raise RuntimeError("GEMINI_API_KEY is not set")
            self.client = genai.Client(api_key=self.api_key)
        return self.client

    async def audit_dataset(
        self,
        drift_data: Dict[str, float],
        sample_images: List[str],
        sample_captions: List[str],
        outlier_context: Optional[List[Dict[str, Any]]] = None,
    ) -> L2Reasoning:
        system_prompt = """
        You are a VLM dataset auditor.
        Review image-text samples and drift statistics, then decide alignment status.
        These are statistically most-outlying samples (lowest similarity cohort).
        Assess whether these outliers also indicate semantic misalignment.
        Return strict JSON that matches the provided schema.
        """

        user_content = f"""
        [Drift Stats]: {drift_data}
        [Samples]: {list(zip(sample_images, sample_captions))}
        [Outlier Context]: {outlier_context or []}
        """

        response = self._get_client().models.generate_content(
            model=self.model_id,
            contents=user_content,
            config={
                "system_instruction": system_prompt,
                "response_mime_type": "application/json",
                "response_schema": L2Reasoning.model_json_schema(),
            },
        )

        return L2Reasoning.model_validate_json(response.text)
