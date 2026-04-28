# Firebase Studio MVP 프롬프트 — 2회차: 회원가입 · 검색 플로우

## 전제 조건
1회차(기반 세팅)가 완료된 상태. Supabase 테이블·공통 레이아웃·라우트 가드가 동작 중.

## 이번 회차 목표
- UI-001: 수요기업 회원가입
- UI-002: SI 파트너 회원가입
- UI-003: SI 파트너 검색 결과 목록
- UI-004: SI 프로필 상세 페이지

---

## [UI-001] 수요기업 회원가입

### 경로
`/app/signup/buyer/page.tsx` — Public, Client Component (폼)

### Zod 스키마 (`lib/schemas/buyer.ts`)
```typescript
export const buyerSignupSchema = z.object({
  company_name: z.string().min(1, '회사명을 입력해주세요').max(255),
  biz_registration_no: z
    .string()
    .regex(/^\d{3}-\d{2}-\d{5}$/, '올바른 사업자등록번호 형식(XXX-XX-XXXXX)을 입력해주세요'),
  region: z.string().min(1, '지역을 선택해주세요'),
  segment: z.enum(['Q1', 'Q2', 'Q3', 'Q4'], { message: '산업 세그먼트를 선택해주세요' }),
  contact_name: z.string().min(1, '담당자 이름을 입력해주세요').max(100),
  contact_email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  contact_phone: z
    .string()
    .regex(/^01[016789]-\d{3,4}-\d{4}$/, '올바른 휴대폰 번호를 입력해주세요'),
});
```

### 폼 필드
| 필드 | 컴포넌트 | 비고 |
|---|---|---|
| 회사명 | `Input` | max 255자 |
| 사업자등록번호 | `Input` | 숫자 입력 시 자동 하이픈 (예: 123-45-67890) |
| 소재 지역 | `Select` | 서울/경기/인천/부산/대구/광주/대전/울산/세종/강원/충북/충남/전북/전남/경북/경남/제주 |
| 산업 세그먼트 | `Select` | Q1(제조), Q2(물류), Q3(식품), Q4(기타) |
| 담당자 이름 | `Input` | max 100자 |
| 담당자 이메일 | `Input` | email 타입 |
| 담당자 전화번호 | `Input` | 숫자 입력 시 자동 하이픈 (010-XXXX-XXXX) |

### 동작 명세
- `react-hook-form` + Zod resolver, `mode: 'onChange'` (실시간 인라인 에러)
- 자동 하이픈 포맷팅: `onChange` 핸들러에서 숫자만 추출 후 포맷 적용
- 제출 중: "가입하기" 버튼 disabled + "계정 생성 중..." + 로딩 스피너
- 성공: Supabase `buyer_company` INSERT → `event_log`에 `signup_complete` 기록 → `/search` 리다이렉트
- 실패 처리:
  - 사업자등록번호 중복(409) → 해당 필드 하단 "이미 가입된 사업자등록번호입니다"
  - 400 → 서버 응답 필드별 에러 매핑
  - 500 → 전역 Toast "서버 오류가 발생했습니다. 다시 시도해주세요."
- 레이아웃: 중앙 Card (max-width: 560px), 모바일 풀 너비 단일 컬럼
- 필수 항목 `*` 표시, `<Label>` + `aria-describedby` 에러 연결

### shadcn/ui
`Card`, `CardHeader`, `CardContent`, `Input`, `Label`, `Button`, `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`

---

## [UI-002] SI 파트너 회원가입

### 경로
- `/app/signup/partner/page.tsx` — 가입 폼
- `/app/signup/partner/pending/page.tsx` — 검토 대기 안내

### Zod 스키마 (`lib/schemas/si-partner.ts`)
```typescript
export const siPartnerSignupSchema = z.object({
  company_name: z.string().min(1, '회사명을 입력해주세요').max(255),
  biz_registration_no: z
    .string()
    .regex(/^\d{3}-\d{2}-\d{5}$/, '올바른 사업자등록번호 형식을 입력해주세요'),
  region: z.string().min(1, '지역을 선택해주세요'),
  contact_name: z.string().min(1, '담당자 이름을 입력해주세요').max(100),
  contact_email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  contact_phone: z
    .string()
    .regex(/^01[016789]-\d{3,4}-\d{4}$/, '올바른 휴대폰 번호를 입력해주세요'),
  completed_projects: z.number().int().min(0, '0 이상의 숫자를 입력해주세요'),
  failed_projects: z.number().int().min(0, '0 이상의 숫자를 입력해주세요'),
  capability_tags: z
    .array(z.string())
    .min(1, '최소 1개의 역량 태그를 선택해주세요')
    .max(10, '역량 태그는 최대 10개까지 선택할 수 있습니다'),
});
```

### 폼 구성
**섹션 1 — 회사 기본 정보** (UI-001과 동일 필드: company_name, biz_registration_no, region, contact_*)

**섹션 2 — 시공 이력**
- 완료 프로젝트 수: `Input[type=number]` (min=0)
- 실패 프로젝트 수: `Input[type=number]` (min=0)
- 시공 성공률: 읽기 전용 텍스트, 자동 계산
  - 공식: `완료/(완료+실패) × 100` → 소수점 1자리 표시
  - 완료+실패 = 0이면 "데이터 없음" 표시

**섹션 3 — 역량 태그 Tag Input**
- 미리 정의 태그 (클릭으로 토글 선택):
  `['용접','조립','도장','검사','팔레타이징','픽앤플레이스','CNC 로딩','AGV','협동로봇','비전검사']`
- 선택된 태그: 파란 배경 + X 버튼으로 제거
- 직접 입력 후 Enter로 커스텀 태그 추가 가능
- 최소 1개 / 최대 10개 제한
- 키보드: Tab 이동, Enter 선택, Backspace 마지막 태그 삭제

### 동작 명세
- 제출 → Supabase `si_partner` + `si_profile` INSERT (트랜잭션)
- 성공 → `/signup/partner/pending` 리다이렉트
- 중복 사업자등록번호(409) → 해당 필드 인라인 에러

### 검토 대기 안내 페이지 (`/pending`)
```
✅ 아이콘 + "가입 신청이 완료되었습니다!"

안내 문구:
"운영팀 검토 후 승인 시 이메일로 알림을 보내드립니다."
"예상 검토 기간: 2~3 영업일"
"검토 완료 전까지 SI 프로필이 검색 결과에 노출되지 않습니다."

문의처: support@robotsi-platform.kr
"홈으로 돌아가기" 버튼
```

---

## [UI-003] SI 파트너 검색 결과 목록

### 경로
`/app/search/page.tsx` — Server Component (SSR)

URL 쿼리 파라미터로 필터 상태 관리:
`/search?region=서울&brand=UR&tag=용접&has_badge=true&sort=success_rate&page=1`

### 레이아웃
- 데스크탑: 좌측 필터 패널(240px, 고정) + 우측 카드 그리드(2~3열)
- 태블릿: 상단 접이식 필터 + 카드 2열
- 모바일: 상단 접이식 필터(Collapsible) + 카드 1열

### 필터 패널
```
지역: Select 다중 (시/도 목록)
브랜드/제조사: Checkbox Group
  - Universal Robots / 두산로보틱스 / 레인보우로보틱스 / 야스카와 / FANUC / ABB
역량 태그: Checkbox Group
  - 용접 / 조립 / 도장 / 검사 / 팔레타이징 / 픽앤플레이스 / CNC 로딩 / AGV / 협동로봇 / 비전검사
뱃지 보유: Toggle Switch ("인증 파트너만 보기")
SI 등급: Checkbox Group (Silver / Gold / Diamond)
[필터 초기화] 버튼
```

**필터 → URL 동기화**: `useRouter` + `useSearchParams`로 쿼리 파라미터 업데이트 (브라우저 뒤로가기 지원)

### SI 파트너 카드 컴포넌트 (`SiPartnerCard`)
```
┌─────────────────────────────────────────┐
│ [Diamond] 로봇시공              서울     │
│                                          │
│ 시공 성공률  ████████████░░  96.2%       │
│ 완료 50건 · 실패 2건                     │
│                                          │
│ 태그: [용접] [조립] [협동로봇] +2개      │
│ 뱃지: UR · 두산 · 레인보우               │
│ 평점: ★ 4.8  (리뷰 32건)                │
│                          [상세 보기 →]   │
└─────────────────────────────────────────┘
```
- tier 뱃지 색상: Silver(회색) / Gold(노란) / Diamond(파란)
- 역량 태그: 최대 5개 표시 + "+N개" 더보기 표시
- "상세 보기" → `/search/[siPartnerId]` 링크

### 정렬 옵션
오른쪽 상단 `Select`: 성공률 높은 순 / 평점 높은 순 / 최신 등록 순

### 페이지네이션
- 서버 사이드 (Supabase `.range()`)
- 페이지당 10개
- UI: 이전/다음 + 페이지 번호(최대 5개)
- 현재 페이지 URL 동기화

### 빈 결과
```
🔍 아이콘
"조건에 맞는 SI 파트너가 없습니다."
"필터를 조정하거나 다른 검색 조건을 시도해주세요."
[필터 초기화] 버튼
```

### Skeleton 로딩 UI
- `loading.tsx` 또는 Suspense boundary
- 카드 모양 Skeleton 10개 표시 (shadcn/ui `Skeleton`)

### 데이터 쿼리 조건
- `has_badge=true` 시: `badge.is_active = true AND badge.expires_at > NOW()` JOIN 조건 적용 (미인증 혼입 0% 보장)
- `si_partner.status = 'approved'` 조건 항상 적용

### 접근성
- 필터 영역: `role="search"`, `aria-label="SI 파트너 필터"`
- 카드: `role="article"`
- 검색 결과 수: `aria-live="polite"` ("총 N개의 SI 파트너가 있습니다")

---

## [UI-004] SI 프로필 상세 페이지

### 경로
`/app/search/[siPartnerId]/page.tsx` — Server Component (SSR, Public)

동적 메타데이터:
```typescript
export async function generateMetadata({ params }) {
  const si = await getSiPartner(params.siPartnerId);
  return {
    title: `${si.company_name} | SI 파트너 프로필`,
    description: `${si.company_name}의 시공 성공률, 인증 뱃지, 리뷰를 확인하세요.`,
  };
}
```

### 페이지 구성

**헤더 섹션**
```
[Diamond] 로봇시공                    [기안 리포트 PDF ↓]
서울 · 가입일: 2024-03-15
프로필 갱신일: 2026-04-20
```

**KPI 카드 3개 (가로 배치, 모바일 세로 스택)**
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  재무등급   │  │ 시공 성공률 │  │  평균 평점  │
│    A+       │  │   96.2%     │  │  ★ 4.8     │
│ 기준일:     │  │ 완료 50건   │  │  리뷰 32건  │
│ 2026-03-15  │  │ 실패 2건    │  │             │
│ *운영팀     │  │    ◯ 차트   │  │             │
│  업데이트   │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
```
- 재무등급 카드: "운영팀 사전 업데이트 기반" 회색 작은 고지 텍스트
- 시공 성공률: 원형 Progress bar (CSS 또는 SVG)

**탭 섹션 (shadcn/ui `Tabs`)**

`[역량 & 태그]` 탭:
- capability_tags 전체 목록 (뱃지 형태)
- 프로젝트 이력 요약

`[인증 뱃지]` 탭:
- 뱃지 목록 테이블: 제조사명 / 발급일 / 만료일 / 상태
- 활성: 녹색 "활성" / 만료: 회색 "만료됨" / 철회: 빨강 "철회됨"

`[리뷰 요약]` 탭:
- `review_summary` JSONB 렌더링
- null/빈 데이터 → "아직 등록된 리뷰가 없습니다"

### PDF 다운로드
- "기안 리포트 PDF 다운로드" 버튼 클릭 → `POST /api/reports/[siPartnerId]/pdf`
- 생성 중: 버튼 disabled + "리포트 생성 중..." + 로딩 스피너
- 성공: 브라우저 자동 다운로드 (Content-Disposition: attachment)
- PDF 포함 내용: 재무등급 / 기술역량 / 인증뱃지 / 리뷰 4섹션
- 실패 → Toast "리포트 생성에 실패했습니다. 다시 시도해주세요."
- MVP에서는 `pdf-lib` 또는 `@react-pdf/renderer` 사용, ≤5초

### 에러 처리
- 존재하지 않는 `siPartnerId` → `notFound()` (404 페이지)
- 데이터 조회 실패 → error boundary + "다시 시도" 버튼

### Skeleton 로딩
- 헤더 영역 Skeleton
- KPI 카드 3개 Skeleton
- 탭 콘텐츠 Skeleton

### 접근성
- 별점: `aria-label="평점 4.8점 (32건 리뷰)"`
- PDF 버튼: `aria-busy` 로딩 상태
- 탭: 키보드 좌우 화살표 이동

---

## 공통 구현 기준

### 반응형
| 구분 | 기준 |
|---|---|
| Mobile | ≤ 768px |
| Tablet | 769 ~ 1024px |
| Desktop | ≥ 1025px |

### 폼 공통 패턴
```typescript
// react-hook-form + Zod 연동 패턴
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  mode: 'onChange', // 실시간 유효성 검증
});

// 자동 하이픈 포맷팅 (사업자등록번호 예시)
const formatBizNo = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0,3)}-${digits.slice(3)}`;
  return `${digits.slice(0,3)}-${digits.slice(3,5)}-${digits.slice(5,10)}`;
};
```

### 에러 처리 공통 패턴
- 400/409 → 해당 필드 `setError()` 인라인 에러
- 500 → shadcn/ui `toast({ variant: 'destructive', ... })`

---

## 완료 기준

- [ ] UI-001: 정상 가입 → `/search` 리다이렉트, 409 중복 에러 표시
- [ ] UI-001: 사업자등록번호·전화번호 자동 하이픈 포맷팅
- [ ] UI-002: 시공 성공률 자동 계산, 역량 태그 Tag Input 동작
- [ ] UI-002: 가입 완료 → `/signup/partner/pending` 안내 페이지 표시
- [ ] UI-003: 필터 → URL 동기화, 뱃지 필터 시 미인증 혼입 0%
- [ ] UI-003: 페이지네이션 동작, Skeleton 로딩 UI
- [ ] UI-004: 재무등급·성공률·뱃지·리뷰 통합 표시, 404 처리
- [ ] UI-004: PDF 다운로드 버튼 동작 (Mock PDF라도 다운로드 트리거)
- [ ] 모바일 반응형 전체 확인
- [ ] ESLint / TypeScript 경고 0건
