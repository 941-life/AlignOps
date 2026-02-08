from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from api.models import L1Report, StatusEnum


class IngestorService:
    TIMESTAMP_FIELDS = ("captured_at", "created_at", "updated_at", "timestamp", "event_time")

    @staticmethod
    def _parse_timestamp(value: Any) -> Optional[datetime]:
        if value is None:
            return None
        if isinstance(value, datetime):
            dt = value
        elif isinstance(value, (int, float)):
            dt = datetime.fromtimestamp(float(value), tz=timezone.utc)
        elif isinstance(value, str):
            candidate = value.strip()
            if candidate.endswith("Z"):
                candidate = candidate[:-1] + "+00:00"
            try:
                dt = datetime.fromisoformat(candidate)
            except ValueError:
                return None
        else:
            return None

        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    def _compute_freshness_delay(self, raw_data: List[Dict]) -> int:
        latest_timestamp: Optional[datetime] = None

        for item in raw_data:
            for field in self.TIMESTAMP_FIELDS:
                parsed = self._parse_timestamp(item.get(field))
                if parsed is None:
                    continue
                if latest_timestamp is None or parsed > latest_timestamp:
                    latest_timestamp = parsed

        if latest_timestamp is None:
            return -1

        now_utc = datetime.now(timezone.utc)
        delay = (now_utc - latest_timestamp).total_seconds()
        return max(0, int(delay))

    def validate_l1(self, raw_data: List[Dict]) -> L1Report:
        required_fields = {"image_url", "caption", "source_id"}
        schema_passed = all(required_fields.issubset(item.keys()) for item in raw_data)

        actual_count = len(raw_data)
        expected_count = 10
        freshness_delay_sec = self._compute_freshness_delay(raw_data)

        l1_status = StatusEnum.PASS if schema_passed and actual_count >= expected_count else StatusEnum.BLOCK

        return L1Report(
            schema_passed=schema_passed,
            volume_actual=actual_count,
            volume_expected=expected_count,
            freshness_delay_sec=freshness_delay_sec,
            l1_status=l1_status,
            details={
                "avg_caption_len": (sum(len(d["caption"]) for d in raw_data) / actual_count) if actual_count else 0.0,
                "freshness_known": freshness_delay_sec >= 0,
            },
        )
