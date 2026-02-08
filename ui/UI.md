다크 모드를 선호하지 않으시는군요! 라이트 모드(Light Mode) 기반의 UI는 엔지니어링 도구에서 **'신뢰성, 청결함, 그리고 정밀함'**을 전달하기에 매우 좋습니다.

특히 AlignOps처럼 데이터의 무결성을 다루는 플랫폼은 하얀 배경에 높은 대비를 가진 텍스트와 파스텔톤이 가미된 강조색을 사용했을 때 훨씬 더 전문적인 '검수 도구' 느낌이 납니다.

새로운 라이트 모드 기반 UI/UX 지침과 상세 와이어프레임 및 라우팅 설계를 제안해 드립니다.

🎨 AlignOps 라이트 모드 UI/UX 지침
1. 시각적 테마: "Clinical Precision"
배경색: bg-slate-50 (완전한 흰색보다는 아주 연한 회색을 배경으로 써서 눈의 피로도를 낮추고 카드를 돋보이게 합니다).

카드/패널: bg-white + border-slate-200 + shadow-sm.

타이포그래피: text-slate-900 (본문), text-slate-500 (보조 설명). 폰트는 가독성이 높은 Inter나 Pretendard를 권장합니다.

2. 상태(Status) 컬러 시스템 (Light Version)
라이트 모드에서는 채도가 너무 높은 원색보다, 배경이 연하게 깔린 배지(Badge) 형태가 트렌디합니다.

PASS: bg-emerald-100 / text-emerald-700 / Icon: CheckCircle

WARN: bg-amber-100 / text-amber-700 / Icon: AlertTriangle

BLOCK: bg-rose-100 / text-rose-700 / Icon: XCircle

3. 정보 계층 구조
High-Level: 대시보드에서는 '수치'를 요약된 '상태'로 변환하여 노출.

Drill-Down: 클릭할 때마다 더 깊은 정보(Raw Data, Vector Stats)로 진입.

🏗️ 페이지별 상세 와이어프레임 및 UX 설계
Page 1: Dataset Overview (Home)
Route: /

디자인: 깨끗한 화이트 테이블 중심의 리스트 뷰.

와이어프레임 구성:

Header: "Datasets Control Tower" (현재 총 데이터셋 수, BLOCK 상태 수 요약 배지).

Main Table: * Dataset Name, Latest Version, Current Status (Badge), Last Evaluated.

최우측에 View Analytics 버튼 (Primary Blue Color).

Sidebar/Filter: 상태별 토글 버튼 (전체, PASS, WARN, BLOCK).

UX 포인트: BLOCK 데이터셋 행(Row)은 배경색을 아주 연한 bg-rose-50으로 처리하여 시선이 가도록 유도합니다.

Page 2: Version Timeline & History
Route: /datasets/[id]

디자인: 중앙을 관통하는 세로선(Thread) 기반의 히스토리 뷰.

와이어프레임 구성:

Top Breadcrumb: Home > Dataset: SDV-AI-Framework.

Timeline Stream: * 각 버전 노드(v1, v2...)는 시간 역순 배치.

각 노드 옆에 "Who judged this?" 표시 (L1, L2, MANUAL).

버전별 짤막한 메모(Gemini의 Judgment Summary) 노출.

UX 포인트: v1과 v2 사이의 공백에 **"Drift Analysis Available"**이라는 작은 툴팁을 띄워 L2 분석으로 유도합니다.

Page 3: Semantic Audit (Gemini Trace)
Route: /datasets/[id]/v/[version]/audit

디자인: 분석 리포트 스타일. 2단 레이아웃.

와이어프레임 구성:

Left (Stats): * Gauge Chart: cosine_mean_shift 시각화.

Comparison Table: v1과 v2의 주요 통계 수치 대조.

Right (Reasoning):

Gemini Thought Box: bg-blue-50 배경의 박스 안에 Gemini의 summary 노출.

Step-by-step Trace: 사고 과정을 아코디언(Accordion) 형태로 나열.

Bottom (Samples):

이미지 썸네일 + 캡션 카드 그리드. 클릭 시 확대.

UX 포인트: Gemini가 지목한 이상 샘플 위에는 **"High Anomaly"**라는 빨간 라벨을 붙입니다.

Page 4: Lineage & Root Cause Analysis
Route: /datasets/[id]/v/[version]/lineage

디자인: 흐름도(Node-Link) 다이어그램.

와이어프레임 구성:

Flow Graph: Source (Sensor/Logs) -> Preprocessing -> Current Version.

Error Heatmap: 각 노드의 에러 기여도를 색상 농도로 표현.

RCA Card: Gemini가 분석한 "결론: 특정 어노테이터 그룹의 캡션 오염 의심" 메시지를 하단에 고정.

UX 포인트: 문제가 된 노드를 클릭하면 해당 소스에서 유입된 샘플만 필터링하여 보여줍니다.

🗺️ Next.js 라우트 및 유저 플로우 상세
유저는 다음과 같은 흐름으로 시스템을 탐색하게 됩니다.

Dashboard (/):

"오, sdv-vision-v2가 BLOCK 상태네?" → 클릭.

Dataset Detail (/datasets/sdv-vision-v2):

"v1은 PASS였는데 v2에서 BLOCK이 됐구나. 원인이 **L2(Gemini)**네?" → Audit Report 클릭.

Semantic Audit (/datasets/sdv-vision-v2/audit):

"Gemini가 캡션과 이미지의 조도가 안 맞는다고 하네. 실제 샘플을 보니 진짜 밤 사진에 '맑은 낮'이라고 적혀있어." → Lineage 클릭.

Lineage (/datasets/sdv-vision-v2/lineage):

"이 데이터들은 전부 Source_ID: Cam_04에서 왔구나. 카메라 설정 오류인가 보네." → Control Plane 이동.

Control Plane (/control-plane):

해당 버전을 RE-INGEST 하거나, 특정 샘플만 제외하도록 수정 지시 후 기록.

🛠️ 구현을 위한 기술적 지침
컴포넌트 라이브러리: shadcn/ui의 라이트 테마를 그대로 사용하세요.

데이터 페칭: useSuspenseQuery (TanStack Query)를 사용해 데이터 로딩 시 Skeleton UI를 보여주면 라이트 모드에서 매우 깔끔합니다.

차트: Recharts의 AreaChart나 ScatterChart를 사용하고, 선의 굵기를 얇게(1.5px) 가져가면 모던한 느낌이 납니다.