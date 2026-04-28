<!-- @AI_GUIDE: 이 README는 사람용 프로젝트 허브 문서입니다. AI 상세 컨텍스트는 PROJECT_KNOWLEDGE.md 참조. -->

# 🤖 Robot Platform Prototype V2

> 수요기업 · SI 파트너 · 제조사 · 관리자를 잇는 **로봇 도입 생태계 플랫폼** 프론트엔드 프로토타입

이 플랫폼은 **"로봇 도입의 모든 과정을 투명하게 연결하고, RaaS(Robot-as-a-Service)로 비용 부담을 낮추며, AS SLA 모니터링을 통해 신뢰성을 확보"** 하는 것을 목표로 합니다.

### 🚀 랜딩페이지 (고객 Hook 단계)
`/` 경로에 **C유형(결과 지향형) 전략** 기반의 랜딩페이지가 배치되어 있습니다.  
히어로 → 로고월 → 가치 제안 → 3단계 워크플로우 → ROI(Before/After) → 결과물 갤러리 → CTA 구성으로,  
고객의 사용 의향을 극대화한 뒤 CTA를 통해 서비스 페이지(`/home`)로 유도합니다.

---

## 🎨 Design Artifacts
- **Figma Design (UI/UX Flow)**: [Robot-pf-proto-figma-v2](https://www.figma.com/design/tDphB25MDksyFaUEU9Z09d/Robot-pf-proto-figma-v2?node-id=0-1&t=T3Mqm1qeb8OVCH8M-1)

---

## 📌 역할별 주요 기능 (RBAC)

| 역할 | 주요 기능 |
| :--- | :--- |
| **수요기업 (Buyer)** | RaaS 비용 계산기, SI 파트너 검색, 계약 관리, AS 서비스 신청, 방문 예약 |
| **SI 파트너 (SI Partner)** | 프로필/역량 관리, 제안서 수신, 제조사 인증 뱃지 관리 |
| **제조사 (Manufacturer)** | KPI 대시보드, SI 파트너 뱃지 발급/철회, 제안 관리 |
| **관리자 (Admin)** | 플랫폼 전체 지표, 에스크로 결제 승인, AS SLA 모니터링, 분쟁 조정 |

---

## 🛠️ 기술 스택

| 구분 | 기술 |
| :--- | :--- |
| **프레임워크** | React 18 + Vite (CSR) |
| **스타일링** | Tailwind CSS |
| **UI 라이브러리** | shadcn/ui (Radix UI 기반) |
| **라우팅** | react-router |
| **폼 검증** | react-hook-form + Zod |
| **차트** | Recharts |
| **아이콘** | Lucide-react |

---

## 🚀 실행 방법

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev
```

---

## 🏗️ 프로젝트 구조 요약

```
src/
├── app/
│   ├── App.tsx                    # 라우터 루트
│   └── components/
│       ├── layout/                # Header, Sidebar, RoleLayout, Footer
│       ├── dashboard/             # KpiCard (공통 KPI 카드)
│       ├── calculator/            # PricingPlanCard, CalculatorCharts
│       ├── guards/                # RouteGuard (인증/권한 보호)
│       └── ui/                    # shadcn/ui 래핑 컴포넌트
├── config/
│   └── navigation.ts              # ★ 역할별 메뉴/색상/라벨 중앙 설정
├── contexts/
│   └── AuthContext.tsx            # 전역 인증 상태 (useAuth 훅)
├── hooks/
│   └── useCalculatorData.ts       # 계산기 비즈니스 로직 분리
├── pages/
│   ├── Landing.tsx                # ★ 랜딩페이지 (/ 경로, 고객 Hook)
│   ├── Home.tsx                   # 서비스 홈 (/home 경로, CTA 진입점)
│   ├── admin/                     # 관리자 전용 페이지 (5개)
│   ├── manufacturer/              # 제조사 전용 페이지 (3개)
│   ├── partner/                   # SI 파트너 전용 페이지 (3개)
│   ├── as/                        # AS 티켓 페이지
│   └── *.tsx                      # 공통 페이지 (Search, Calculator 등)
└── lib/                           # Mock 데이터, 유틸리티, Zod 스키마
```

---

## 🧭 핵심 아키텍처 결정

### 1. 역할 기반 접근 제어 (RBAC)
- `AuthContext`가 `user`, `role`, `isAuthenticated`를 전역 제공
- `RouteGuard`가 인증 여부와 역할을 검사하여 접근 제어
- **`navigation.ts` 한 파일**에서 역할별 메뉴·색상·라벨을 모두 관리 → 메뉴 변경 시 이 파일만 수정

### 2. Prop Drilling 완전 제거
- `RoleLayout`에 `role` prop을 일일이 전달하는 방식 → `useAuth()` 훅으로 직접 조회 방식으로 전환
- `Sidebar`, `Header`가 독립적으로 역할 정보를 획득

### 3. 컴포넌트 재사용 전략
- **`KpiCard`**: Admin, Manufacturer, SI Partner의 모든 통계 수치 카드를 단일 컴포넌트로 통합
- **`PricingPlanCard`**: CAPEX / Lease / RaaS 세 가지 요금제 카드를 하나의 컴포넌트로 통합

### 4. 성능 최적화
- `useCalculatorData` 커스텀 훅: 폼 로직 + Mock API 호출을 페이지 컴포넌트에서 분리
- `useMemo`: 차트 데이터(`tcoData`, `roiData`) — `results` 변경 시에만 재계산
- `useCallback` + `React.memo`: 하위 컴포넌트 불필요 리렌더링 방지

### 5. 디자인 시스템 — "Premium Dynamic" 스타일
모든 KPI/지표 카드에 동일한 시각 언어 적용:
- **라벨**: `text-xs font-bold uppercase tracking-wider text-gray-400`
- **수치**: `text-4xl font-extrabold tracking-tighter text-gray-900`
- **호버**: `group-hover` + 그라데이션 오버레이 + `hover:-translate-y-1`

---

## 📚 문서 목록

| 문서 | 경로 | 대상 | 내용 |
| :--- | :--- | :---: | :--- |
| **README** | `README.md` | 사람/AI | 프로젝트 전체 허브 (본 문서) |
| **UX 흐름도** | `docs/UX_FLOW.md` | 사람 | 역할별 핵심 UX 시나리오 및 화면 이동 흐름 |
| **컴포넌트 구조** | `docs/COMPONENT_STRUCTURE.md` | 사람/AI | 컴포넌트 계층 트리, Props 흐름, 개선점 분석 |
| **코드 품질 리포트** | `docs/CODE_QUALITY_REPORT.md` | 사람/AI | 5개 항목 평가, Before/After, 기술 부채 목록 |
| **랜딩페이지 체크리스트** | `docs/LANDING_PAGE_CHECKLIST.md` | 사람/AI | C유형 전략 기반 랜딩페이지 평가 (11/11 달성) |
| **리팩토링 이력** | `REFACTORING_REPORT.md` | 사람 | 작업 전후 비교 및 테스트 결과 |
| **AI 컨텍스트** | `PROJECT_KNOWLEDGE.md` | AI | 압축된 아키텍처·컨벤션 가이드 (토큰 절약용) |

---

## 🔮 다음 단계 (Future Work)

| 우선순위 | 항목 |
| :---: | :--- |
| 🔴 | React Query 도입으로 Mock → 실제 API 전환 대비 |
| 🔴 | Vite Path Alias (`@/`) 설정으로 Import 경로 정리 |
| 🟡 | shadcn/ui 공식 Sidebar 컴포넌트로 커스텀 Sidebar 교체 |
| 🟡 | 공통 FormField 래퍼 컴포넌트 도입 |
| 🟡 | React Error Boundary 추가 |
| 🟢 | Vitest 기반 단위 테스트 작성 |
| 🟢 | axe-core를 통한 접근성(a11y) 검사 |