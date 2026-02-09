# Vercel 프론트엔드 배포 가이드

## 🚀 빠른 배포 (3분 완성)

### 방법 1: Vercel CLI 사용 (추천)

```powershell
# 1. Vercel CLI 설치 (처음 한 번만)
npm install -g vercel

# 2. Vercel 로그인
vercel login

# 3. ui 디렉토리로 이동
cd ui

# 4. 프리뷰 배포 (테스트용)
vercel

# 또는 프로덕션 배포
vercel --prod
```

### 방법 2: 자동 배포 스크립트 사용

```powershell
# GCP API URL과 함께 배포
.\scripts\deploy_vercel.ps1 -ApiUrl "https://your-api.a.run.app" -Production
```

### 방법 3: GitHub 연동 (가장 간단)

1. **GitHub에 코드 푸시**
   ```powershell
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Vercel 대시보드에서 연동**
   - https://vercel.com 접속
   - "Add New Project" 클릭
   - GitHub 저장소 선택
   - Root Directory를 `ui`로 설정
   - Deploy 클릭

---

## ⚙️ 환경 변수 설정 (중요!)

배포 후 **반드시** Vercel 대시보드에서 환경 변수를 설정해야 합니다.

### Vercel 대시보드에서 설정

1. https://vercel.com/dashboard 접속
2. 프로젝트 선택 (`alignops-ui`)
3. **Settings** → **Environment Variables**
4. 다음 변수들 추가:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://your-api.a.run.app` | Production, Preview, Development |
| `NEXT_PUBLIC_USE_MOCKS` | `false` | Production, Preview, Development |

5. **Deployments** 탭으로 이동
6. 최신 배포 옆 **⋯** 클릭 → **Redeploy**

---

## 📋 배포 체크리스트

### 배포 전 확인사항

- [ ] GCP 백엔드가 배포되었고 URL을 확인했음
- [ ] `ui/package.json`의 dependencies가 모두 설치됨
- [ ] TypeScript 빌드 에러가 없음
- [ ] 로컬에서 `npm run build` 테스트 완료

```powershell
# 로컬 빌드 테스트
cd ui
npm run build
```

### 배포 후 확인사항

- [ ] Vercel 환경 변수 설정 완료
- [ ] 배포된 URL에서 페이지 로딩 확인
- [ ] Dashboard에서 실시간 폴링 동작 확인
- [ ] 백엔드 API 연결 확인 (CORS 에러 없음)
- [ ] 이미지 로딩 확인

---

## 🧪 배포 테스트

배포가 완료되면 다음을 테스트하세요:

```powershell
# 1. 배포된 프론트엔드 URL 확인 (예시)
$FRONTEND_URL = "https://alignops-ui-xxxxx.vercel.app"
$API_URL = "https://alignops-api-xxxxx.a.run.app"

# 2. 프론트엔드 접속
Start-Process $FRONTEND_URL

# 3. 데모 데이터 시드 (백엔드에)
.\scripts\seed_demo.ps1 -BaseUrl $API_URL
```

### 테스트 체크리스트

1. ✅ Dashboard가 로딩되는가?
2. ✅ "Live" 인디케이터가 회전하는가? (실시간 폴링)
3. ✅ "Create Dataset" 버튼이 동작하는가?
4. ✅ 데이터셋을 생성할 수 있는가?
5. ✅ Audit 페이지에서 이미지가 표시되는가?
6. ✅ Control Plane에서 L2 Audit를 트리거할 수 있는가?
7. ✅ 상태 변경 시 Toast 알림이 나타나는가?

---

## 🔧 트러블슈팅

### 1. "Module not found" 에러

**원인**: `package-lock.json`과 `package.json` 불일치

**해결**:
```powershell
cd ui
Remove-Item package-lock.json
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
vercel --prod
```

### 2. API 연결 안 됨 (Network Error)

**원인**: 환경 변수 `NEXT_PUBLIC_API_URL`이 설정되지 않음

**해결**:
1. Vercel Dashboard → Settings → Environment Variables
2. `NEXT_PUBLIC_API_URL` 추가
3. 재배포

### 3. CORS 에러

**원인**: GCP 백엔드에서 Vercel domain을 허용하지 않음

**해결**:
```python
# api/main.py에서 CORS origins 업데이트 필요
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",  # 이미 포함됨
    ],
    # ...
)
```

재배포:
```powershell
cd api
gcloud run deploy alignops-api --source . --region asia-northeast3
```

### 4. 이미지가 로딩되지 않음

**원인**: Unsplash 도메인이 `next.config.ts`에 없음

**해결**: 이미 `next.config.ts`에 다음이 포함되어 있습니다:
```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
    },
    {
      protocol: 'http',
      hostname: '**',
    },
  ],
}
```

### 5. Build 타임아웃

**원인**: Vercel Free tier 빌드 시간 제한 (45초)

**해결**:
1. Pro plan으로 업그레이드
2. 또는 빌드 최적화:
   ```json
   // ui/next.config.ts
   {
     experimental: {
       optimizeCss: true,
     }
   }
   ```

---

## 🎯 권장 배포 흐름

### 개발 → 스테이징 → 프로덕션

```powershell
# 1. 개발 브랜치에서 작업
git checkout -b feature/new-feature
# ... 코드 작성 ...

# 2. 프리뷰 배포 (자동 - GitHub 연동 시)
git push origin feature/new-feature

# 3. PR 생성 및 리뷰

# 4. main에 머지
git checkout main
git merge feature/new-feature

# 5. 프로덕션 배포 (자동 - GitHub 연동 시)
git push origin main
```

---

## 📊 배포 모니터링

### Vercel Analytics (무료)

Vercel Dashboard에서 자동으로 제공:
- 페이지 뷰
- 로딩 시간
- Core Web Vitals
- 에러 추적

### 커스텀 모니터링

Next.js에 내장된 `reportWebVitals`:

```typescript
// ui/app/layout.tsx에 이미 구현됨
export function reportWebVitals(metric) {
  console.log(metric)
}
```

---

## 💰 비용

### Vercel Pricing

| Tier | Price | Features |
|------|-------|----------|
| **Hobby** | **무료** | - 100 GB bandwidth/month<br>- 100 deployments/day<br>- 충분함! |
| Pro | $20/month | - 1 TB bandwidth<br>- 무제한 deployments |
| Enterprise | Custom | - Custom SLA<br>- 전용 지원 |

**권장**: Hobby tier로 시작 (무료)

---

## 🔐 보안 설정

### 프로덕션 체크리스트

- [ ] API URL이 HTTPS인지 확인
- [ ] 환경 변수에 민감 정보 없음 (API keys는 백엔드만)
- [ ] CSP (Content Security Policy) 설정
- [ ] Rate limiting (백엔드에서)

### Vercel 보안 헤더

`next.config.ts`에 추가 (이미 포함):
```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
      ],
    },
  ]
}
```

---

## 🚀 자동 배포 설정 (GitHub Actions)

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: ./ui
      
      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: ./ui
      
      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: ./ui
```

---

## 📝 요약

1. **가장 빠른 방법**: Vercel CLI
   ```powershell
   cd ui
   vercel --prod
   ```

2. **환경 변수 설정** (필수!)
   - Vercel Dashboard에서 설정
   - `NEXT_PUBLIC_API_URL` = GCP API URL

3. **테스트**
   - 프론트엔드 접속 확인
   - 실시간 폴링 동작 확인
   - 데모 데이터로 전체 플로우 테스트

배포 완료! 🎉
