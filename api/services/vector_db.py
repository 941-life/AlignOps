import logging
import os
from typing import Any, Dict, List, Optional, Sequence, Tuple

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

from api.services.math_utils import cosine_distance


logger = logging.getLogger(__name__)


class QdrantService:
    def __init__(self):
        self.client = QdrantClient(url=os.getenv("QDRANT_URL", "http://qdrant:6333"))
        self.collection_name = "alignops_vectors"

    def init_collection(self, vector_size: int = 768):
        if not self.client.collection_exists(self.collection_name):
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
            )

    @staticmethod
    def _point_id(dataset_id: str, version: str, index: int) -> int:
        # Keep IDs positive and deterministic for the same dataset/version/index.
        return abs(hash(f"{dataset_id}_{version}_{index}")) % (2**63 - 1)

    @staticmethod
    def _dataset_version_filter(dataset_id: str, version: str) -> Filter:
        return Filter(
            must=[
                FieldCondition(key="dataset_id", match=MatchValue(value=dataset_id)),
                FieldCondition(key="version", match=MatchValue(value=version)),
            ]
        )

    @staticmethod
    def _extract_vector(point: Any) -> Optional[List[float]]:
        vector = getattr(point, "vector", None)
        if vector is None:
            return None
        if isinstance(vector, dict):
            if not vector:
                return None
            vector = next(iter(vector.values()))
        if vector is None:
            return None
        return [float(v) for v in vector]

    def upsert_vectors(
        self,
        dataset_id: str,
        version: str,
        data_list: List[Dict[str, Any]],
        embeddings: Sequence[Sequence[float]],
    ) -> None:
        points = [
            PointStruct(
                id=self._point_id(dataset_id, version, i),
                vector=list(emb),
                payload={
                    "dataset_id": dataset_id,
                    "version": version,
                    "caption": data_list[i]["caption"],
                    "source_id": data_list[i]["source_id"],
                    "image_url": data_list[i].get("image_url"),
                    "image_fetch_status": data_list[i].get("image_fetch_status"),
                    "fallback_used": data_list[i].get("fallback_used", False),
                }
            ) for i, emb in enumerate(embeddings)
        ]
        self.client.upsert(collection_name=self.collection_name, points=points)

    async def upsert_dataset(self, dataset_id: str, version: str, data_list: List[Dict[str, Any]]) -> None:
        points = [
            PointStruct(
                id=self._point_id(dataset_id, version, i),
                vector=list(item["embedding"]),
                payload={
                    "dataset_id": dataset_id,
                    "version": version,
                    "caption": item.get("caption"),
                    "source_id": item.get("source_id"),
                    "image_url": item.get("image_url"),
                    "image_fetch_status": item.get("image_fetch_status"),
                    "fallback_used": item.get("fallback_used", False),
                },
            )
            for i, item in enumerate(data_list)
            if item.get("embedding") is not None
        ]

        if points:
            self.client.upsert(collection_name=self.collection_name, points=points)

    def get_vectors_by_version(self, dataset_id: str, version: str, page_size: int = 256) -> List[List[float]]:
        if not self.client.collection_exists(self.collection_name):
            return []

        vectors: List[List[float]] = []
        offset: Optional[Any] = None
        filter_query = self._dataset_version_filter(dataset_id, version)

        while True:
            points, next_offset = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=filter_query,
                limit=page_size,
                offset=offset,
                with_payload=False,
                with_vectors=True,
            )
            for point in points:
                vector = self._extract_vector(point)
                if vector is not None:
                    vectors.append(vector)

            if next_offset is None:
                break
            offset = next_offset

        return vectors

    def get_mean_vector(self, dataset_id: str, version: str) -> Optional[List[float]]:
        vectors = self.get_vectors_by_version(dataset_id, version)
        if not vectors:
            return None

        expected_dim = len(vectors[0])
        sum_vector = [0.0] * expected_dim
        count = 0

        for vector in vectors:
            if len(vector) != expected_dim:
                continue
            for i, value in enumerate(vector):
                sum_vector[i] += float(value)
            count += 1

        if count == 0:
            return None
        return [v / count for v in sum_vector]

    def get_outlier_samples(
        self,
        dataset_id: str,
        version: str,
        mean_v1: List[float],
        mean_v2: List[float],
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        if limit <= 0 or not self.client.collection_exists(self.collection_name):
            return []

        filter_query = self._dataset_version_filter(dataset_id, version)
        offset: Optional[Any] = None
        ranked_samples: List[Dict[str, Any]] = []

        while True:
            points, next_offset = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=filter_query,
                limit=256,
                offset=offset,
                with_payload=True,
                with_vectors=True,
            )

            if not points:
                break

            for point in points:
                payload = point.payload or {}
                image_url = payload.get("image_url")
                caption = payload.get("caption")
                if image_url is None or caption is None:
                    continue

                vector = self._extract_vector(point)
                if vector is None:
                    continue

                if len(vector) != len(mean_v1) or len(vector) != len(mean_v2):
                    logger.warning(
                        "Skipping point %s due to vector dimension mismatch (%s vs %s/%s)",
                        getattr(point, "id", "unknown"),
                        len(vector),
                        len(mean_v1),
                        len(mean_v2),
                    )
                    continue

                dist_to_v2_mean = cosine_distance(vector, mean_v2)
                dist_to_v1_mean = cosine_distance(vector, mean_v1)
                outlier_score = 0.5 * dist_to_v2_mean + 0.5 * dist_to_v1_mean

                ranked_samples.append(
                    {
                        "image_url": str(image_url),
                        "caption": str(caption),
                        "source_id": payload.get("source_id"),
                        "image_fetch_status": payload.get("image_fetch_status"),
                        "fallback_used": bool(payload.get("fallback_used", False)),
                        "dist_to_v2_mean": float(dist_to_v2_mean),
                        "dist_to_v1_mean": float(dist_to_v1_mean),
                        "outlier_score": float(outlier_score),
                    }
                )

            if next_offset is None:
                break
            offset = next_offset

        ranked_samples.sort(key=lambda item: item["outlier_score"], reverse=True)
        return ranked_samples[:limit]

    def get_samples(self, dataset_id: str, version: str, limit: int = 5) -> Tuple[List[str], List[str]]:
        if limit <= 0 or not self.client.collection_exists(self.collection_name):
            return [], []

        sample_images: List[str] = []
        sample_captions: List[str] = []
        offset: Optional[Any] = None
        filter_query = self._dataset_version_filter(dataset_id, version)

        while len(sample_images) < limit:
            points, next_offset = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=filter_query,
                limit=limit,
                offset=offset,
                with_payload=True,
                with_vectors=False,
            )

            if not points:
                break

            for point in points:
                payload = point.payload or {}
                image_url = payload.get("image_url")
                caption = payload.get("caption")
                if image_url is None or caption is None:
                    continue
                sample_images.append(str(image_url))
                sample_captions.append(str(caption))
                if len(sample_images) >= limit:
                    break

            if next_offset is None:
                break
            offset = next_offset

        return sample_images, sample_captions
