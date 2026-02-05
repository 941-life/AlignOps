from typing import List, Dict
from api.models import L1Report, StatusEnum

class IngestorService:
    def validate_l1(self, raw_data: List[Dict]) -> L1Report:
        # 1. Schema Check: 필드 존재 여부 확인
        required_fields = {"image_url", "caption", "source_id"}
        schema_passed = all(required_fields.issubset(item.keys()) for item in raw_data)
        
        # 2. Volume Check: 데이터 개수 확인
        actual_count = len(raw_data)
        expected_count = 10  # 예시 임계값
        
        # 3. Status Decision
        l1_status = StatusEnum.PASS if schema_passed and actual_count >= expected_count else StatusEnum.BLOCK
        
        return L1Report(
            schema_passed=schema_passed,
            volume_actual=actual_count,
            volume_expected=expected_count,
            freshness_delay_sec=0,  # 로컬 파일 기준
            l1_status=l1_status,
            details={"avg_caption_len": (sum(len(d["caption"]) for d in raw_data) / actual_count) if actual_count else 0.0}
        )
