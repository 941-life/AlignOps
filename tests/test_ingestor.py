import unittest
from datetime import datetime, timedelta, timezone

from api.services.ingestor import IngestorService


class IngestorServiceTests(unittest.TestCase):
    def test_validate_l1_computes_freshness_delay_from_latest_timestamp(self):
        service = IngestorService()
        latest = datetime.now(timezone.utc) - timedelta(seconds=30)
        old = datetime.now(timezone.utc) - timedelta(seconds=120)

        report = service.validate_l1(
            [
                {"image_url": "u1", "caption": "c1", "source_id": "s1", "created_at": old.isoformat()},
                {"image_url": "u2", "caption": "c2", "source_id": "s2", "timestamp": latest.isoformat()},
            ]
        )

        self.assertGreaterEqual(report.freshness_delay_sec, 0)
        self.assertLess(report.freshness_delay_sec, 90)
        self.assertEqual(report.details["freshness_known"], True)

    def test_validate_l1_sets_unknown_freshness_when_no_timestamp(self):
        service = IngestorService()
        report = service.validate_l1(
            [
                {"image_url": "u1", "caption": "c1", "source_id": "s1"},
                {"image_url": "u2", "caption": "c2", "source_id": "s2"},
            ]
        )

        self.assertEqual(report.freshness_delay_sec, -1)
        self.assertEqual(report.details["freshness_known"], False)


if __name__ == "__main__":
    unittest.main()
