import unittest
from types import SimpleNamespace
from unittest.mock import Mock

from api.services.vector_db import QdrantService


class QdrantServiceTests(unittest.TestCase):
    def test_get_mean_vector_returns_average_for_filtered_points(self):
        service = QdrantService()
        service.client = Mock()
        service.client.collection_exists.return_value = True
        service.client.scroll.side_effect = [
            ([SimpleNamespace(vector=[1.0, 0.0])], 1),
            ([SimpleNamespace(vector=[0.0, 1.0])], None),
        ]

        mean_vector = service.get_mean_vector("demo", "v1")

        self.assertEqual(mean_vector, [0.5, 0.5])

    def test_get_samples_returns_image_and_caption_pairs(self):
        service = QdrantService()
        service.client = Mock()
        service.client.collection_exists.return_value = True
        service.client.scroll.return_value = (
            [
                SimpleNamespace(payload={"image_url": "img-1", "caption": "cap-1"}),
                SimpleNamespace(payload={"image_url": "img-2", "caption": "cap-2"}),
            ],
            None,
        )

        sample_images, sample_captions = service.get_samples("demo", "v2", limit=2)

        self.assertEqual(sample_images, ["img-1", "img-2"])
        self.assertEqual(sample_captions, ["cap-1", "cap-2"])

    def test_upsert_dataset_persists_image_fetch_metadata(self):
        service = QdrantService()
        service.client = Mock()
        service.client.collection_exists.return_value = True

        import asyncio

        asyncio.run(
            service.upsert_dataset(
                "demo",
                "v2",
                [
                    {
                        "embedding": [0.1, 0.2],
                        "caption": "cap",
                        "source_id": "src",
                        "image_url": "img",
                        "image_fetch_status": "FAIL",
                        "fallback_used": True,
                    }
                ],
            )
        )

        _, kwargs = service.client.upsert.call_args
        payload = kwargs["points"][0].payload
        self.assertEqual(payload["image_fetch_status"], "FAIL")
        self.assertEqual(payload["fallback_used"], True)


if __name__ == "__main__":
    unittest.main()
