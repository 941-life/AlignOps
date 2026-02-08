import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

import api.main as main_module
from api.models import DatasetObject, L2Reasoning, ReasoningTrace, StatusEnum


class TriggerL2Tests(unittest.TestCase):
    def setUp(self):
        main_module.dataset_registry.clear()
        main_module.dataset_registry["demo:v2"] = DatasetObject(
            dataset_id="demo",
            version="v2",
            source_id="src-1",
            status=StatusEnum.VALIDATING,
        )
        self.client = TestClient(main_module.app)

    @staticmethod
    def _audit_result(status: StatusEnum = StatusEnum.WARN) -> L2Reasoning:
        return L2Reasoning(
            model_name="gemini-2.5-flash",
            distribution_drift={"cosine_mean_shift": 0.2},
            reasoning_trace=ReasoningTrace(
                summary="summary",
                key_observations=["obs"],
                decision_rationale="rationale",
            ),
            judgment_summary="judgment",
            confidence_score=0.7,
            l2_status=status,
        )

    def test_cosine_distance_known_vectors(self):
        self.assertAlmostEqual(main_module.cosine_distance([1.0, 0.0], [0.0, 1.0]), 1.0)
        self.assertAlmostEqual(main_module.cosine_distance([1.0, 0.0], [1.0, 0.0]), 0.0)

    def test_cosine_distance_returns_one_when_zero_norm(self):
        self.assertEqual(main_module.cosine_distance([0.0, 0.0], [1.0, 0.0]), 1.0)

    def test_trigger_l2_success_uses_real_drift_payload(self):
        audit_mock = AsyncMock(return_value=self._audit_result())
        outlier_samples = [
            {"image_url": "img-1", "caption": "cap-1", "outlier_score": 0.9},
            {"image_url": "img-2", "caption": "cap-2", "outlier_score": 0.8},
            {"image_url": "img-3", "caption": "cap-3", "outlier_score": 0.7},
        ]
        with patch.object(main_module.pipeline.vdb, "get_mean_vector", side_effect=[[1.0, 0.0], [0.0, 1.0]]):
            with patch.object(main_module.pipeline.vdb, "get_outlier_samples", return_value=outlier_samples):
                with patch.object(main_module.gemini_svc, "audit_dataset", new=audit_mock):
                    response = self.client.post("/datasets/demo/v/v2/trigger-l2")

        self.assertEqual(response.status_code, 200)
        drift_stats, sample_images, sample_captions = audit_mock.await_args.args
        outlier_context = audit_mock.await_args.kwargs["outlier_context"]
        self.assertAlmostEqual(drift_stats["cosine_mean_shift"], 1.0)
        self.assertEqual(sample_images, ["img-1", "img-2", "img-3"])
        self.assertEqual(sample_captions, ["cap-1", "cap-2", "cap-3"])
        self.assertEqual(outlier_context, outlier_samples)
        self.assertEqual(main_module.dataset_registry["demo:v2"].status, StatusEnum.WARN)

    def test_trigger_l2_rejects_non_v2(self):
        response = self.client.post("/datasets/demo/v/v1/trigger-l2")
        self.assertEqual(response.status_code, 400)

    def test_trigger_l2_requires_both_versions_in_qdrant(self):
        with patch.object(main_module.pipeline.vdb, "get_mean_vector", side_effect=[None, [0.0, 1.0]]):
            response = self.client.post("/datasets/demo/v/v2/trigger-l2")
        self.assertEqual(response.status_code, 400)

    def test_trigger_l2_returns_404_when_dataset_missing(self):
        response = self.client.post("/datasets/unknown/v/v2/trigger-l2")
        self.assertEqual(response.status_code, 404)

    def test_trigger_l2_requires_at_least_three_outlier_samples(self):
        with patch.object(main_module.pipeline.vdb, "get_mean_vector", side_effect=[[1.0, 0.0], [0.0, 1.0]]):
            with patch.object(
                main_module.pipeline.vdb,
                "get_outlier_samples",
                return_value=[{"image_url": "img", "caption": "cap", "outlier_score": 0.7}],
            ):
                response = self.client.post("/datasets/demo/v/v2/trigger-l2")
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
