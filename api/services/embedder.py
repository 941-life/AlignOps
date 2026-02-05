import hashlib
from typing import List


class EmbedderService:
    def __init__(self):
        self._model = None

    def _get_model(self):
        if self._model is None:
            # Lazy import keeps API boot lightweight inside Docker.
            try:
                from sentence_transformers import SentenceTransformer
            except ImportError:
                return None

            self._model = SentenceTransformer("google/siglip-base-patch16-224")
        return self._model

    @staticmethod
    def _fallback_embedding(text: str, size: int = 768) -> List[float]:
        # Deterministic pseudo-embedding for environments without ML deps.
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        seed = digest * ((size // len(digest)) + 1)
        return [((b / 255.0) * 2.0) - 1.0 for b in seed[:size]]

    def generate_embeddings(self, image_urls: List[str], captions: List[str]) -> List[List[float]]:
        model = self._get_model()
        if model is None:
            return [self._fallback_embedding(caption) for caption in captions]

        text_embeddings = model.encode(captions)
        return text_embeddings.tolist()
