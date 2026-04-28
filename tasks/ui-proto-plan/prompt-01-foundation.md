# Firebase Studio MVP 프롬프트 — 1회차: 기반 세팅

## 목표
로봇 SI 안심 보증 매칭 플랫폼의 Next.js 프로젝트를 초기 세팅하고,
Supabase DB 스키마·Mock Seed·공통 레이아웃(헤더/사이드바/푸터)을 구현한다.

---

## 기술 스택

- Framework: Next.js 14 App Router (TypeScript)
- Styling: Tailwind CSS + shadcn/ui
- Auth: Supabase Auth (RBAC 4 roles)
- DB: Supabase (PostgreSQL)
- Form: react-hook-form + Zod
- Font: Pretendard (한국어 최적화, Google Fonts CDN)

---

## 1단계: Supabase 테이블 스키마

아래 테이블을 Supabase에 생성한다.

```sql
-- 수요기업
CREATE TABLE buyer_company (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  biz_registration_no VARCHAR(12) UNIQUE NOT NULL, -- 포맷: XXX-XX-XXXXX
  region VARCHAR(50) NOT NULL,
  segment VARCHAR(5) NOT NULL CHECK (segment IN ('Q1','Q2','Q3','Q4')),
  contact_name VARCHAR(100) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SI 파트너
CREATE TABLE si_partner (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  biz_registration_no VARCHAR(12) UNIQUE NOT NULL,
  region VARCHAR(50) NOT NULL,
  tier VARCHAR(20) DEFAULT 'Silver' CHECK (tier IN ('Silver','Gold','Diamond')),
  status VARCHAR(20) DEFAULT 'pending_review' CHECK (status IN ('pending_review','approved','rejected')),
  contact_name VARCHAR(100) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SI 프로필
CREATE TABLE si_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  si_partner_id UUID REFERENCES si_partner(id) ON DELETE CASCADE,
  completed_projects INT DEFAULT 0,
  failed_projects INT DEFAULT 0,
  capability_tags TEXT[] DEFAULT '{}',
  review_summary JSONB DEFAULT '{}',
  financial_grade VARCHAR(5),
  financial_grade_updated_at DATE,
  avg_rating NUMERIC(3,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 제조사
CREATE TABLE manufacturer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 뱃지
CREATE TABLE badge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  si_partner_id UUID REFERENCES si_partner(id),
  manufacturer_id UUID REFERENCES manufacturer(id),
  is_active BOOLEAN DEFAULT TRUE,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT
);

-- 파트너 제안
CREATE TABLE partner_proposal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id UUID REFERENCES manufacturer(id),
  si_partner_id UUID REFERENCES si_partner(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','expired')),
  message TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 계약
CREATE TABLE contract (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_company_id UUID REFERENCES buyer_company(id),
  si_partner_id UUID REFERENCES si_partner(id),
  amount NUMERIC(15,2) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending'
    CHECK (status IN ('pending','inspecting','release_pending','disputed','completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 에스크로
CREATE TABLE escrow_tx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contract(id),
  amount NUMERIC(15,2) NOT NULL,
  state VARCHAR(20) DEFAULT 'pending'
    CHECK (state IN ('pending','held','released','refunded')),
  held_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  admin_verified_at TIMESTAMPTZ,
  admin_memo TEXT
);

-- AS 보증서
CREATE TABLE warranty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contract(id),
  as_company_name VARCHAR(255),
  as_contact VARCHAR(100),
  as_email VARCHAR(255),
  warranty_scope TEXT,
  warranty_months INT,
  pdf_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- AS 티켓
CREATE TABLE as_ticket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contract(id),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('normal','urgent')),
  symptom_description TEXT NOT NULL,
  engineer_name VARCHAR(100),
  engineer_phone VARCHAR(20),
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- O2O 예약
CREATE TABLE o2o_booking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_company_id UUID REFERENCES buyer_company(id),
  region VARCHAR(50) NOT NULL,
  booking_date DATE NOT NULL,
  slot_time VARCHAR(10) NOT NULL,
  address_detail TEXT,
  memo TEXT,
  status VARCHAR(20) DEFAULT 'confirmed'
    CHECK (status IN ('confirmed','cancelled','completed','waiting')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 견적 리드
CREATE TABLE quote_lead (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_company_id UUID,
  robot_model VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  term_months INT NOT NULL,
  contact_name VARCHAR(100) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  memo TEXT,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','contacted','quoted','closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알림
CREATE TABLE notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(30) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 로봇 모델
CREATE TABLE robot_model (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_code VARCHAR(50) UNIQUE NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  base_price NUMERIC(15,2) NOT NULL,
  manufacturer_name VARCHAR(100)
);

-- 이벤트 로그
CREATE TABLE event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2단계: Mock Seed 데이터

아래 데이터를 Supabase에 INSERT한다.

```sql
-- 제조사 3개
INSERT INTO manufacturer (company_name) VALUES
  ('Universal Robots'), ('두산로보틱스'), ('레인보우로보틱스');

-- SI 파트너 20개사 (tier 분포: Silver 10 / Gold 7 / Diamond 3)
INSERT INTO si_partner (company_name, biz_registration_no, region, tier, status, contact_name, contact_email, contact_phone) VALUES
  ('로봇시공', '123-45-67890', '서울', 'Diamond', 'approved', '김철수', 'kim@robotsi.kr', '010-1234-5678'),
  ('스마트팩토리', '234-56-78901', '경기', 'Diamond', 'approved', '이영희', 'lee@smartf.kr', '010-2345-6789'),
  ('오토메이션코리아', '345-67-89012', '부산', 'Diamond', 'approved', '박민준', 'park@autoK.kr', '010-3456-7890'),
  ('테크솔루션', '456-78-90123', '인천', 'Gold', 'approved', '최수진', 'choi@tech.kr', '010-4567-8901'),
  ('로보텍', '567-89-01234', '대전', 'Gold', 'approved', '정호준', 'jung@robotech.kr', '010-5678-9012'),
  ('인더스트리봇', '678-90-12345', '울산', 'Gold', 'approved', '강지은', 'kang@ibot.kr', '010-6789-0123'),
  ('퓨처시스템', '789-01-23456', '광주', 'Gold', 'approved', '윤서연', 'yoon@future.kr', '010-7890-1234'),
  ('넥스트로봇', '890-12-34567', '수원', 'Gold', 'approved', '임태양', 'lim@nextr.kr', '010-8901-2345'),
  ('에이스SI', '901-23-45678', '성남', 'Gold', 'approved', '한가영', 'han@acesi.kr', '010-9012-3456'),
  ('프리미엄로봇', '012-34-56789', '고양', 'Gold', 'approved', '오준혁', 'oh@premr.kr', '010-0123-4567'),
  ('정밀시공', '111-22-33333', '서울', 'Silver', 'approved', '신민아', 'shin@precise.kr', '010-1111-2222'),
  ('빠른설치', '222-33-44444', '경기', 'Silver', 'approved', '권태호', 'kwon@fast.kr', '010-2222-3333'),
  ('안전로봇', '333-44-55555', '부산', 'Silver', 'approved', '노지수', 'no@safe.kr', '010-3333-4444'),
  ('현대SI', '444-55-66666', '대구', 'Silver', 'approved', '문재원', 'moon@hsi.kr', '010-4444-5555'),
  ('한국자동화', '555-66-77777', '인천', 'Silver', 'approved', '배소영', 'bae@kauto.kr', '010-5555-6666'),
  ('스마트SI', '666-77-88888', '전주', 'Silver', 'approved', '서동진', 'seo@smartsi.kr', '010-6666-7777'),
  ('로봇전문', '777-88-99999', '창원', 'Silver', 'approved', '조현우', 'cho@robpro.kr', '010-7777-8888'),
  ('테크마스터', '888-99-00000', '포항', 'Silver', 'approved', '장예린', 'jang@techm.kr', '010-8888-9999'),
  ('AI시공', '999-00-11111', '청주', 'Silver', 'approved', '황민석', 'hwang@aisc.kr', '010-9999-0000'),
  ('미래로봇', '101-01-10101', '천안', 'Silver', 'pending_review', '류상호', 'ryu@futur.kr', '010-1010-1010');

-- SI 프로필 (위 파트너와 연결, 첫 5개만 상세 작성)
-- 실제 구현 시 si_partner_id를 실제 UUID로 교체
INSERT INTO robot_model (model_code, model_name, base_price, manufacturer_name) VALUES
  ('UR10e', 'Universal Robots UR10e', 45000000, 'Universal Robots'),
  ('UR5e', 'Universal Robots UR5e', 35000000, 'Universal Robots'),
  ('UR3e', 'Universal Robots UR3e', 28000000, 'Universal Robots'),
  ('M1013', '두산로보틱스 M1013', 52000000, '두산로보틱스'),
  ('H2017', '두산로보틱스 H2017', 68000000, '두산로보틱스'),
  ('RB5-850E', '레인보우 RB5-850E', 38000000, '레인보우로보틱스'),
  ('RB10-1300E', '레인보우 RB10-1300E', 48000000, '레인보우로보틱스'),
  ('YAS-GP8', '야스카와 GP8', 42000000, '야스카와'),
  ('FANUC-LR', 'FANUC LR Mate', 39000000, 'FANUC'),
  ('ABB-IRB', 'ABB IRB 1200', 41000000, 'ABB');
```

---

## 3단계: [UI-015] 공통 레이아웃 구현

### 파일 구조
```
/app
  layout.tsx              ← 루트 레이아웃 (Pretendard 폰트, ThemeProvider, Toaster)
  (public)/layout.tsx     ← 비로그인 공개 페이지용
  (auth)/layout.tsx       ← 로그인 필요 페이지용
  admin/layout.tsx        ← Admin 사이드바 레이아웃
  manufacturer/layout.tsx ← 제조사 사이드바 레이아웃
  partner/layout.tsx      ← SI 파트너 사이드바 레이아웃

/components
  layout/
    Header.tsx
    Sidebar.tsx
    Footer.tsx
    MobileNav.tsx
    NotificationBell.tsx  ← 미읽음 뱃지 포함 (UI-014 연동 대비)
```

### 헤더 컴포넌트 (`Header.tsx`)

**비로그인 상태:**
- 로고(홈 링크) + "로그인" 버튼 + "회원가입" DropdownMenu (수요기업/SI파트너)

**로그인 상태 — 역할별 네비게이션:**

| Role | 메뉴 항목 |
|---|---|
| buyer | SI 파트너 검색(`/search`) / 비용 계산기(`/calculator`) / 내 계약(`/my/contracts`) / AS 내역(`/my/as-tickets`) |
| si_partner | 내 프로필(`/partner/profile`) / 파트너 제안(`/partner/proposals`) / 뱃지 현황(`/partner/badges`) |
| manufacturer | 파트너 현황(`/manufacturer/dashboard`) / 뱃지 관리(`/manufacturer/badges`) / 파트너 제안(`/manufacturer/proposals`) |
| admin | 대시보드(`/admin`) / 에스크로(`/admin/escrow`) / AS SLA(`/admin/as-sla`) / 이벤트 로그(`/admin/events`) / 분쟁(`/admin/disputes`) |

- 우측: NotificationBell + 유저 아바타 + DropdownMenu (프로필/로그아웃)
- 현재 경로 `aria-current="page"` + 활성 하이라이트
- 모바일: 햄버거 → `Sheet` 드로어

### 사이드바 (`Sidebar.tsx`)
- admin / manufacturer / si_partner 포털 전용
- 데스크탑: 고정 240px, 아이콘 + 텍스트 라벨
- 태블릿: 60px 아이콘만, 호버 시 텍스트
- 모바일: 헤더 햄버거 드로어로 대체 (하단 탭 바 방식도 허용)

### 푸터 (`Footer.tsx`)
- 서비스명, 사업자 정보
- 이용약관 / 개인정보처리방침 / 고객센터 링크
- "© 2026 로봇 SI 안심 보증 매칭 플랫폼"
- 데스크탑 3열 → 모바일 1열

### 접근성
- 스킵 네비게이션 링크 ("본문 바로가기") — 최상단
- `<nav aria-label="주 메뉴">` / `<nav aria-label="관리 메뉴">`
- 햄버거: `aria-expanded`, `aria-controls`

### shadcn/ui 컴포넌트
`NavigationMenu`, `DropdownMenu`, `Sheet`, `Avatar`, `Button`, `Badge`

---

## 4단계: 라우트 가드 설정

```typescript
// middleware.ts
// - 비인증 사용자 → /login 리다이렉트 (보호 경로)
// - 역할 불일치 → /403 페이지
// 보호 경로 패턴:
//   /my/*, /contracts/*, /partner/*, /manufacturer/*, /admin/*
// 공개 경로:
//   /, /search, /search/[id], /calculator, /signup/*, /login
```

### 403 페이지 (`/app/403/page.tsx`)
- "접근 권한이 없습니다" 메시지
- 홈으로 돌아가기 버튼

---

## 완료 기준

- [ ] Supabase 테이블 전체 생성 확인
- [ ] Mock Seed 데이터 INSERT 확인
- [ ] 헤더: 4개 역할별 네비게이션 메뉴 정상 렌더링
- [ ] 비로그인/로그인 헤더 상태 전환 동작
- [ ] 모바일 햄버거 → Sheet 드로어 동작
- [ ] Admin/Manufacturer/SI 사이드바 렌더링
- [ ] 라우트 가드 (미인증 리다이렉트, 역할 불일치 403) 동작
- [ ] 스킵 네비게이션, aria-current 접근성 속성 적용
- [ ] ESLint / TypeScript 경고 0건
