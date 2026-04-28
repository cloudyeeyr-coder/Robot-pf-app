# 로봇 SI 안심 보증 매칭 플랫폼 - 프로젝트 구조

## 개요
B2B 로봇 시스템 통합(SI) 파트너 매칭 플랫폼의 초기 구조 및 공통 레이아웃

## 기술 스택
- **프레임워크**: React 18 + Vite
- **라우팅**: React Router 7
- **스타일링**: Tailwind CSS v4
- **UI 컴포넌트**: shadcn/ui (Radix UI 기반)
- **폼 검증**: React Hook Form + Zod
- **아이콘**: Lucide React

## 사용자 역할 (RBAC)
1. **buyer** (수요기업): 로봇 구매를 원하는 중소기업
2. **si_partner** (SI 파트너): 시스템 통합 업체
3. **manufacturer** (제조사): 로봇 제조사 (뱃지 발급)
4. **admin** (관리자): 플랫폼 운영팀

## 프로젝트 구조

```
src/
├── app/
│   ├── components/
│   │   ├── ui/              # shadcn/ui 컴포넌트
│   │   ├── layout/          # 레이아웃 컴포넌트
│   │   │   ├── Header.tsx   # 헤더 (인증 상태별 분기)
│   │   │   ├── Sidebar.tsx  # 사이드바 (역할별 메뉴)
│   │   │   ├── Footer.tsx   # 푸터
│   │   │   └── RoleLayout.tsx # 역할별 레이아웃 래퍼
│   │   └── guards/
│   │       └── RouteGuard.tsx # 라우트 접근 제어
│   └── App.tsx              # 메인 앱 + 라우팅
├── contexts/
│   └── AuthContext.tsx      # 인증 컨텍스트 (현재 Mock)
├── pages/                   # 페이지 컴포넌트
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── NotFound.tsx
│   ├── Forbidden.tsx
│   └── Placeholder.tsx      # 개발 중 페이지
├── types/
│   └── index.ts             # TypeScript 타입 정의
└── lib/
    └── utils.ts             # 유틸리티 함수

```

## 라우트 구조

### 공개 라우트 (인증 불필요)
- `/` - 홈페이지
- `/login` - 로그인
- `/search` - SI 파트너 검색
- `/calculator` - RaaS 계산기
- `/signup/buyer` - 수요기업 회원가입
- `/signup/partner` - SI 파트너 회원가입

### 수요기업 라우트 (buyer)
- `/my/contracts` - 내 계약 목록
- `/my/as-tickets` - AS 요청 내역
- `/booking` - O2O 방문 예약

### SI 파트너 라우트 (si_partner)
- `/partner/profile` - 프로필 관리
- `/partner/proposals` - 받은 제안
- `/partner/badges` - 내 인증 뱃지

### 제조사 라우트 (manufacturer)
- `/manufacturer/dashboard` - 대시보드
- `/manufacturer/badges` - 뱃지 관리
- `/manufacturer/proposals` - 제안 관리

### 관리자 라우트 (admin)
- `/admin` - 관리자 대시보드
- `/admin/escrow` - 에스크로 관리
- `/admin/as-sla` - AS SLA 모니터링
- `/admin/events` - 이벤트 로그
- `/admin/disputes` - 분쟁 관리

## 주요 기능

### 1. 역할 기반 접근 제어 (RBAC)
- `RouteGuard` 컴포넌트로 라우트 레벨 권한 체크
- 비인증 사용자 → `/login` 리다이렉트
- 권한 없는 역할 → `/403` 페이지

### 2. 레이아웃 시스템
- **Header**: 인증 상태에 따라 로그인/회원가입 또는 역할별 메뉴 표시
- **Sidebar**: Admin/Manufacturer/SI Partner 포털에서 사용 (240px desktop, 모바일 슬라이드)
- **Footer**: 회사 정보, 약관 링크

### 3. 반응형 디자인
- **Desktop** (≥1024px): 전체 사이드바 + 상단 헤더
- **Tablet** (768-1023px): 접을 수 있는 사이드바
- **Mobile** (≤767px): 햄버거 메뉴 + 슬라이드 사이드바

### 4. 접근성 (WCAG 2.1 AA)
- Skip navigation 링크 ("본문으로 건너뛰기")
- Semantic HTML (`<nav>`, `<main>`, `<header>`, `<footer>`)
- `aria-current="page"` 활성 메뉴 표시
- 키보드 네비게이션 지원

## 로그인 테스트 방법

현재 Mock 인증이 구현되어 있습니다:

1. `/login` 페이지 방문
2. 역할 선택 (수요기업/SI 파트너/제조사/관리자)
3. 임의의 이메일/비밀번호 입력
4. 선택한 역할에 따라 해당 대시보드로 자동 이동

## 다음 단계 (PROMPT 2~10)

### PROMPT 2: 회원가입 플로우
- `/signup/buyer`, `/signup/partner` 페이지 구현
- Zod 스키마 기반 폼 검증
- 사업자등록번호 자동 하이픈, 전화번호 포맷팅

### PROMPT 3: SI 검색 & 상세
- 필터링 (지역, 브랜드, 역량 태그, 인증 여부)
- 서버 사이드 페이지네이션
- PDF 다운로드 기능

### PROMPT 4: 에스크로 결제
- 3단계 에스크로 플로우
- 30초 폴링 (상태 업데이트)
- 보증서 다운로드

### PROMPT 5~10
- 검수 승인/거절, AS 접수
- RaaS 계산기
- 제조사/SI 포털 기능
- 관리자 대시보드
- 알림 센터
- O2O 예약 캘린더

## 개발 서버 실행

```bash
pnpm install
pnpm run dev
```

## 주의사항

- 현재 Firebase 연동 전 Mock 상태입니다
- 실제 데이터는 Firestore 연동 후 사용 가능
- 인증은 Firebase Auth로 교체 예정
