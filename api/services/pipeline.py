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

        required_fields = {"image_url", "caption", "source_id"}
        processed_items = []
        image_urls = []
        captions = []

        for index, data in enumerate(raw_data):
            missing_fields = [
                field for field in required_fields if field not in data or data[field] is None
            ]
            if missing_fields:
                raise ValueError(
                    f"raw_data[{index}] is missing required fields: {', '.join(sorted(missing_fields))}"
                )

            image_urls.append(str(data["image_url"]))
            captions.append(str(data["caption"]))
            processed_items.append(dict(data))

        embedding_items = self.embedder.generate_embeddings_with_metadata(
            image_urls=image_urls,
            captions=captions,
        )
        if len(embedding_items) != len(processed_items):
            raise RuntimeError("Embedding count does not match raw_data length")

        for i, embedding_item in enumerate(embedding_items):
            processed_items[i]["embedding"] = embedding_item["embedding"]
            processed_items[i]["image_fetch_status"] = embedding_item["image_fetch_status"]
            processed_items[i]["fallback_used"] = embedding_item["fallback_used"]

        await self.vdb.upsert_dataset(dataset_id, version, processed_items)
        return True
