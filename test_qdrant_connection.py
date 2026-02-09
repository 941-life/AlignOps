"""
Qdrant 연결 테스트 스크립트
"""
import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient

# .env 파일 로드
load_dotenv()

def test_qdrant_connection():
    print("[INFO] Qdrant 연결 테스트 시작...\n")
    
    # 환경 변수 확인
    qdrant_url = os.getenv("QDRANT_URL")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    
    print(f"[OK] QDRANT_URL: {qdrant_url}")
    print(f"[OK] QDRANT_API_KEY: {'설정됨' if qdrant_api_key else '없음'}\n")
    
    try:
        # Qdrant 클라이언트 생성
        if qdrant_api_key:
            client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
        else:
            client = QdrantClient(url=qdrant_url)
        
        print("[OK] Qdrant 클라이언트 생성 성공!\n")
        
        # 컬렉션 목록 가져오기
        collections = client.get_collections()
        print("[INFO] 현재 컬렉션 목록:")
        if collections.collections:
            for collection in collections.collections:
                print(f"   - {collection.name} (vectors: {collection.vectors_count})")
        else:
            print("   (컬렉션 없음)")
        
        print("\n[SUCCESS] Qdrant 연결 성공! 정상적으로 연동되었습니다.")
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Qdrant 연결 실패: {e}")
        return False

if __name__ == "__main__":
    success = test_qdrant_connection()
    exit(0 if success else 1)
