import io
import math
from typing import Any, Dict, List, Optional, Sequence

import requests
from PIL import Image


class EmbedderService:
    def __init__(self, model_name: str = "google/siglip-base-patch16-224", request_timeout: int = 10):
        self.model_name = model_name
        self.request_timeout = request_timeout
        self._model = None

    def _get_model(self):
        if self._model is None:
            # Lazy import keeps API boot lightweight inside Docker.
            try:
                from sentence_transformers import SentenceTransformer
            except ImportError as exc:
                raise RuntimeError("sentence-transformers is required for embedding generation") from exc

            try:
                self._model = SentenceTransformer(self.model_name)
            except Exception as exc:  # pragma: no cover - depends on runtime/model availability
                raise RuntimeError(f"Failed to load embedding model '{self.model_name}'") from exc
        return self._model

    @staticmethod
    def _to_vector(raw_vector: Any) -> List[float]:
        if hasattr(raw_vector, "tolist"):
            raw_vector = raw_vector.tolist()
        if isinstance(raw_vector, list) and raw_vector and isinstance(raw_vector[0], list):
            raw_vector = raw_vector[0]
        return [float(v) for v in raw_vector]

    @staticmethod
    def _normalize(vector: Sequence[float]) -> List[float]:
        norm = math.sqrt(sum(float(v) * float(v) for v in vector))
        if norm == 0.0:
            return [0.0 for _ in vector]
        return [float(v) / norm for v in vector]

    def _load_image(self, image_url: str) -> Optional[Image.Image]:
        try:
            response = requests.get(image_url, timeout=self.request_timeout)
            response.raise_for_status()
            return Image.open(io.BytesIO(response.content)).convert("RGB")
        except (requests.RequestException, OSError):
            return None

    def generate_embeddings(self, image_urls: List[str], captions: List[str]) -> List[List[float]]:
        metadata_items = self.generate_embeddings_with_metadata(image_urls=image_urls, captions=captions)
        return [item["embedding"] for item in metadata_items]

    def generate_embeddings_with_metadata(self, image_urls: List[str], captions: List[str]) -> List[Dict[str, Any]]:
        if len(image_urls) != len(captions):
            raise ValueError("image_urls and captions must have the same length")

        model = self._get_model()
        outputs: List[Dict[str, Any]] = []

        for image_url, caption in zip(image_urls, captions):
            text_vector = self._to_vector(model.encode(caption, convert_to_numpy=True))
            image = self._load_image(image_url)

            if image is None:
                outputs.append(
                    {
                        "embedding": self._normalize(text_vector),
                        "image_fetch_status": "FAIL",
                        "fallback_used": True,
                    }
                )
                continue

            image_vector = self._to_vector(model.encode(image, convert_to_numpy=True))
            if len(image_vector) != len(text_vector):
                raise RuntimeError("Image and text embedding dimensions must match")

            merged_vector = [(i + t) / 2.0 for i, t in zip(image_vector, text_vector)]
            outputs.append(
                {
                    "embedding": self._normalize(merged_vector),
                    "image_fetch_status": "OK",
                    "fallback_used": False,
                }
            )

        return outputs
