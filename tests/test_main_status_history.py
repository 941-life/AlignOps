import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

import api.main as main_module


class StatusHistoryTests(unittest.TestCase):
    def setUp(self):
        main_module.dataset_registry.clear()
        self.client = TestClient(main_module.app)

    def _create_dataset(self):
        payload = {
            "dataset": {
                "dataset_id": "demo",
                "version": "v2",
                "source_id": "src-1",
            },
            "raw_data": [
                {"image_url": "https://example.com/img1.jpg", "caption": "caption 1", "source_id": "src-1"}
            ],
        }
        with patch.object(main_module, "start_ingestion_task", new=AsyncMock()):
            response = self.client.post("/datasets/", json=payload)
        self.assertEqual(response.status_code, 200)
        return response.json()

    def test_create_dataset_adds_system_validating_history(self):
        dataset = self._create_dataset()
        history = dataset["status_history"]
        self.assertGreaterEqual(len(history), 1)
        self.assertEqual(history[-1]["status"], "VALIDATING")
        self.assertEqual(history[-1]["source"], "SYSTEM")

    def test_validate_l1_appends_l1_history(self):
        self._create_dataset()
        l1_payload = {
            "schema_passed": True,
            "volume_actual": 10,
            "volume_expected": 10,
            "freshness_delay_sec": 1,
            "l1_status": "PASS",
            "details": {},
        }
        response = self.client.patch("/datasets/demo/v/v2/validate-l1", json=l1_payload)
        self.assertEqual(response.status_code, 200)

        history = response.json()["status_history"]
        self.assertEqual(history[-1]["status"], "PASS")
        self.assertEqual(history[-1]["source"], "L1")
        self.assertIn("schema_passed=", history[-1]["reason"])

    def test_audit_l2_appends_l2_history_with_reason(self):
        self._create_dataset()
        l2_payload = {
            "model_name": "gemini-2.5-flash",
            "distribution_drift": {"cosine_mean_shift": 0.3},
            "reasoning_trace": {
                "summary": "summary",
                "key_observations": ["obs"],
                "decision_rationale": "rationale",
                "recommended_action": None,
            },
            "judgment_summary": "Need human review",
            "flagged_samples": [],
            "confidence_score": 0.8,
            "l2_status": "WARN",
        }
        response = self.client.patch("/datasets/demo/v/v2/audit-l2", json=l2_payload)
        self.assertEqual(response.status_code, 200)

        history = response.json()["status_history"]
        self.assertEqual(history[-1]["status"], "WARN")
        self.assertEqual(history[-1]["source"], "L2")
        self.assertEqual(history[-1]["reason"], "Need human review")


if __name__ == "__main__":
    unittest.main()
