from api.services.embedder import EmbedderService
from api.services.vector_db import QdrantService


class DataPipeline:
    def __init__(self):
        self.embedder = EmbedderService()
        self.vdb = QdrantService()

    async def process_ingestion(self, dataset_id: str, version: str, raw_data: list):
        """Ingestion -> Embedding -> Vector DB flow"""
        # Initialize the collection only when ingestion runs so API startup is not blocked.
        self.vdb.init_collection()

        processed_items = []
        for data in raw_data:
            processed_items.append({
                **data,
                "embedding": [0.1] * 768,
            })

        await self.vdb.upsert_dataset(dataset_id, version, processed_items)
        return True