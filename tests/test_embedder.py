import math
import unittest
from unittest.mock import patch

from PIL import Image

from api.services.embedder import EmbedderService


class FakeModel:
    def encode(self, data, convert_to_numpy=True):
        if isinstance(data, str):
            if data == "caption-a":
                return [1.0, 0.0, 0.0]
            return [0.0, 1.0, 0.0]

        # PIL.Image input
        red_channel = float(data.getpixel((0, 0))[0])
        return [red_channel + 1.0, 0.0, 1.0]


class EmbedderServiceTests(unittest.TestCase):
    def test_generate_embeddings_produces_different_vectors_for_different_inputs(self):
        service = EmbedderService()
        image_1 = Image.new("RGB", (1, 1), color=(255, 0, 0))
        image_2 = Image.new("RGB", (1, 1), color=(0, 0, 0))

        with patch.object(service, "_get_model", return_value=FakeModel()):
            with patch.object(service, "_load_image", side_effect=[image_1, image_2]):
                embeddings = service.generate_embeddings(
                    image_urls=["https://example.com/a.jpg", "https://example.com/b.jpg"],
                    captions=["caption-a", "caption-b"],
                )

        self.assertEqual(len(embeddings), 2)
        self.assertNotEqual(embeddings[0], embeddings[1])
        self.assertTrue(math.isclose(math.sqrt(sum(v * v for v in embeddings[0])), 1.0))
        self.assertTrue(math.isclose(math.sqrt(sum(v * v for v in embeddings[1])), 1.0))

    def test_generate_embeddings_falls_back_to_text_when_image_load_fails(self):
        service = EmbedderService()

        with patch.object(service, "_get_model", return_value=FakeModel()):
            with patch.object(service, "_load_image", return_value=None):
                embeddings = service.generate_embeddings(
                    image_urls=["https://example.com/missing.jpg"],
                    captions=["caption-a"],
                )

        self.assertEqual(embeddings, [[1.0, 0.0, 0.0]])

    def test_generate_embeddings_with_metadata_tracks_fetch_status_and_fallback(self):
        service = EmbedderService()
        image_ok = Image.new("RGB", (1, 1), color=(255, 0, 0))

        with patch.object(service, "_get_model", return_value=FakeModel()):
            with patch.object(service, "_load_image", side_effect=[image_ok, None]):
                outputs = service.generate_embeddings_with_metadata(
                    image_urls=["https://example.com/ok.jpg", "https://example.com/fail.jpg"],
                    captions=["caption-a", "caption-b"],
                )

        self.assertEqual(outputs[0]["image_fetch_status"], "OK")
        self.assertEqual(outputs[0]["fallback_used"], False)
        self.assertEqual(outputs[1]["image_fetch_status"], "FAIL")
        self.assertEqual(outputs[1]["fallback_used"], True)

    def test_generate_embeddings_raises_when_lengths_do_not_match(self):
        service = EmbedderService()
        with self.assertRaises(ValueError):
            service.generate_embeddings(image_urls=["a"], captions=["x", "y"])


if __name__ == "__main__":
    unittest.main()
