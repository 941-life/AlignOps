from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
import os
from typing import Any, Dict, List, Sequence

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
                    "source_id": data_list[i]["source_id"]
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
                },
            )
            for i, item in enumerate(data_list)
            if item.get("embedding") is not None
        ]

        if points:
            self.client.upsert(collection_name=self.collection_name, points=points)
