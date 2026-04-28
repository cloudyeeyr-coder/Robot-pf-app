# Firebase Studio MVP 프롬프트 — 5회차: 부가 기능

## 전제 조건
1~4회차 완료 상태. 공통 레이아웃·DB·거래 플로우·포털 페이지 동작 중.

## 이번 회차 목표
- UI-010: RaaS 비용 비교 계산기
- UI-011: 수기 견적 요청 팝업 (UI-010에 통합)
- UI-014: 알림함 (헤더 벨 아이콘 + 전체 알림 페이지)

---

## [UI-010] RaaS 비용 비교 계산기

### 경로
`/app/calculator/page.tsx` — Public (비로그인도 계산 가능)

### 페이지 메타데이터
```typescript
export const metadata = {
  title: 'RaaS 비용 비교 계산기 | 일시불 vs 리스 vs RaaS',
  description: '로봇 도입 옵션별 비용을 실시간으로 비교하세요.',
};
```

### 전체 레이아웃
- 데스크탑: 좌측 입력 폼(320px 고정) + 우측 결과 영역
- 태블릿: 상단 입력 + 하단 결과 (2열 카드)
- 모바일: 세로 스택 (입력 → 결과 카드 1열)

---

### 입력 폼

**Zod 스키마** (`lib/schemas/calculator.ts`):
```typescript
export const raasCalcInputSchema = z.object({
  robot_model: z.string().min(1, '로봇 모델을 선택해주세요'),
  quantity: z
    .number({ invalid_type_error: '유효한 수량을 입력해주세요' })
    .int()
    .min(1, '수량은 1 이상이어야 합니다'),
  term_months: z.enum(['12', '24', '36', '48', '60'], {
    message: '계약 기간을 선택해주세요',
  }),
});
```

**폼 필드**:

1. **로봇 모델 Combobox** (Supabase `robot_model` 테이블 검색):
   - 입력 시 `model_code` + `model_name` 동시 `ilike` 검색 (debounce 300ms)
   - 선택 시 `base_price` 내부적으로 저장
   - 존재하지 않는 모델 코드 입력 시:
     - 인라인 에러: "해당 모델을 찾을 수 없습니다"
     - 드롭다운에 유사 모델 3건 자동 추천 (이름 유사도 기반, `ilike` 부분 매칭)
   - 키보드: 화살표 이동, Enter 선택, Esc 닫기

2. **수량** `Input[type=number]` (min=1):
   - `0` 입력 → "수량은 1 이상이어야 합니다" 인라인 에러 ≤200ms
   - 음수 입력 → "유효한 수량을 입력해주세요" 인라인 에러 ≤200ms
   - 에러 시 "비교 계산" 버튼 비활성화

3. **계약 기간** `Select`:
   - 12개월 / 24개월 / 36개월 / 48개월 / 60개월

**"비교 계산" 버튼** (Primary, 유효성 통과 시 활성화)

---

### 계산 로직 (`lib/utils/raas-calculator.ts`)

입력값: `base_price` (모델 단가), `quantity`, `term_months`

```typescript
export function calculateRaasOptions(basePrice: number, quantity: number, termMonths: number) {
  const totalCapex = basePrice * quantity;

  return {
    // 일시불 (CAPEX)
    capex: {
      total_cost: totalCapex,
      monthly_depreciation: Math.round(totalCapex / termMonths),
    },
    // 리스 (월 리스료 = 총액의 1.2배 / 기간)
    lease: {
      monthly_fee: Math.round((totalCapex * 1.2) / termMonths),
      total_cost: Math.round(totalCapex * 1.2),
      residual_value: Math.round(totalCapex * 0.15),
    },
    // RaaS (월 구독료 = 총액의 1.35배 / 기간)
    raas: {
      monthly_fee: Math.round((totalCapex * 1.35) / termMonths),
      total_cost: Math.round(totalCapex * 1.35),
      included_services: ['유지보수', 'AS 보증', '소모품 교체', '원격 모니터링'],
    },
  };
}
```

---

### 3옵션 비교 결과 카드

계산 중: 카드 영역 전체 Skeleton UI

결과 카드 3개 (가로 배치, 모바일 세로 스택):

```
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│   일시불 (CAPEX)   │  │      리스          │  │ ⭐ RaaS (OPEX)     │
│                    │  │                    │  │    추천            │
│  총 구매 비용      │  │  월 리스료         │  │  월 구독료         │
│  225,000,000원     │  │  7,500,000원       │  │  8,437,500원       │
│                    │  │                    │  │                    │
│  월 감가상각비     │  │  총 리스 비용      │  │  총 구독 비용      │
│  6,250,000원       │  │  270,000,000원     │  │  303,750,000원     │
│                    │  │  잔존가치 약 15%   │  │  포함: 유지보수    │
│                    │  │                    │  │  AS·소모품·원격    │
│  [이 플랜으로      │  │  [이 플랜으로      │  │  [이 플랜으로      │
│   견적 요청]       │  │   견적 요청]       │  │   견적 요청]       │
└────────────────────┘  └────────────────────┘  └────────────────────┘
```
- 총 비용 기준 가장 저렴한 옵션에 "추천" 뱃지 (노란 Star 배지)
- 금액: 천 단위 쉼표 포맷 `(XX,XXX,XXX원)`

---

### TCO 비교 바 차트 (Recharts `BarChart`)

```
세 옵션의 총 비용을 가로 막대 3개로 비교
x축: 총 비용 (원)
y축: 일시불 / 리스 / RaaS
색상: 일시불=파란 / 리스=녹색 / RaaS=주황
```

### ROI 누적 비용 선형 차트 (Recharts `LineChart`)
```
x축: 월 (1 ~ termMonths)
y축: 누적 비용 (원)
3개 라인: 일시불 / 리스 / RaaS
범례 표시
```

**차트 접근성**: `aria-label="옵션별 총 비용 비교 차트"` + 스크린 리더용 요약 텍스트

---

### PDF 다운로드

"결과 PDF 내려받기" 버튼 (결과 표시 후 활성화)
→ `POST /api/calculator/pdf` Route Handler
→ `@react-pdf/renderer`로 PDF 생성:
  - 페이지 1: 입력 정보 + 3옵션 비교 요약 테이블
  - 페이지 2: TCO 비교 + 월별 누적 비용 테이블
→ 브라우저 자동 다운로드 (`raas-comparison.pdf`)
→ 생성 중: "리포트 생성 중..." + 로딩 스피너
→ 실패: Toast "PDF 생성에 실패했습니다."

---

## [UI-011] 수기 견적 요청 팝업

### 위치
UI-010 페이지 내 `Dialog` 모달로 구현 (별도 경로 없음)

각 옵션 카드의 "이 플랜으로 견적 요청" 버튼 클릭 시 열림

### 비로그인 사용자
→ 버튼 클릭 시 `AlertDialog`:
```
"견적 요청을 위해 로그인이 필요합니다."
[취소] [로그인 →]
```

### 모달 구성

**헤더**: "운영팀에 맞춤 견적 요청하기"

**Zod 스키마** (`lib/schemas/quote.ts`):
```typescript
export const quoteRequestSchema = z.object({
  robot_model: z.string().min(1, '로봇 모델을 입력해주세요'),
  quantity: z.number().int().min(1, '수량은 1 이상이어야 합니다'),
  term_months: z.number().int().min(1, '계약 기간을 입력해주세요'),
  contact_name: z.string().min(1, '담당자 이름을 입력해주세요').max(100),
  contact_email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  contact_phone: z
    .string()
    .regex(/^01[016789]-\d{3,4}-\d{4}$/, '올바른 휴대폰 번호를 입력해주세요'),
  memo: z.string().max(500).optional(),
});
```

**폼 필드** (react-hook-form + Zod):

| 필드 | 컴포넌트 | 프리필 | 비고 |
|---|---|---|---|
| 로봇 모델 | `Input` | ✅ 계산기에서 | 수정 가능 |
| 수량 | `Input[number]` | ✅ 계산기에서 | 수정 가능 |
| 계약 기간 | `Select` | ✅ 계산기에서 | 수정 가능 |
| 담당자 이름 | `Input` | 로그인 유저 정보 | 필수 |
| 담당자 이메일 | `Input` | 로그인 유저 정보 | 필수 |
| 담당자 전화번호 | `Input` | — | 자동 하이픈, 필수 |
| 추가 요청 사항 | `Textarea` | — | 선택, max 500자, 글자수 표시 |

**"견적 요청하기" 버튼**:
→ Supabase `quote_lead` INSERT (status='pending')
→ `notification` INSERT (admin에게 "새 견적 요청" 알림)
→ 제출 중: 버튼 disabled + "요청 중..."

**성공 화면** (모달 내용 전환):
```
✅ 요청 완료!

운영팀이 2영업일 내 연락드립니다.

요청 번호: #QUOTE-XXXXXXXX

[확인] 버튼 → 모달 닫기
```

**모달 접근성**:
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`
- Focus Trap (Tab 키 모달 내 순환)
- Esc 키 닫기
- 모바일: Bottom Sheet 스타일 (`Sheet` 컴포넌트 + `side="bottom"`)

---

## [UI-014] 알림함

### 구성
1. 헤더 내 알림 벨 아이콘 (1회차 `NotificationBell.tsx` 완성)
2. 전체 알림 페이지 (`/notifications`)

---

### 헤더 NotificationBell 컴포넌트 완성

**미읽음 뱃지**:
```typescript
// Supabase: notification WHERE user_id = 현재유저 AND is_read = false COUNT
const unreadCount = ...;
```
- 0건: 뱃지 미표시
- 1~99: 숫자 표시 (빨간 원형 뱃지)
- 100+: "99+" 표시
- `aria-label={`알림 ${unreadCount}건`}` 동적 갱신

**드롭다운 패널** (shadcn/ui `Popover`):
- 최신 알림 10건 미리보기
- 각 항목:
  - 유형 아이콘: 에스크로 💰 / AS 🔧 / 뱃지 🏅 / 제안 🤝 / 시스템 ⚙️
  - 제목 (미읽음: bold) + 상대 시간 ("3분 전", "2시간 전", "어제")
  - 미읽음: 좌측 파란 점 (4px 원형)
  - 클릭 → is_read=true UPDATE + 딥링크 이동
- 하단: "전체 알림 보기 →" 링크 → `/notifications`
- 빈 알림: "새 알림이 없습니다"

**30초 폴링**:
```typescript
useEffect(() => {
  const fetch = () => supabase
    .from('notification')
    .select('id, type, title, is_read, created_at, link_url')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  fetch();
  const interval = setInterval(fetch, 30000);
  return () => clearInterval(interval);
}, [userId]);
```

신규 알림 도착 시 (이전 count < 현재 count):
- 미읽음 뱃지 숫자 갱신
- 드롭다운 열려 있으면 목록 상단에 슬라이드 애니메이션으로 추가

---

### 전체 알림 페이지 (`/notifications`)

**경로**: `/app/notifications/page.tsx` — 로그인 필수

**상단 액션 바**:
```
전체 알림 (N건)     [미읽음만 보기 Toggle]     [모두 읽음 처리]
```

**알림 목록** (최신순, 20건/페이지):
```
┌────────────────────────────────────────────────────────┐
│ ● 💰 에스크로 예치가 완료되었습니다.            2분 전  │
│   계약 #ABC123의 에스크로 예치가 확인되었습니다.        │
├────────────────────────────────────────────────────────┤
│   🔧 엔지니어가 배정되었습니다.                 1시간 전 │
│   AS 티켓 #XYZ456에 엔지니어가 배정되었습니다.          │
└────────────────────────────────────────────────────────┘
```
- 미읽음 항목: 좌측 파란 점 + 제목 bold + 배경 약간 강조
- 읽음 항목: 일반 스타일
- 클릭 → is_read=true UPDATE + 딥링크 이동

**딥링크 매핑**:
| 알림 type | 이동 경로 |
|---|---|
| `escrow_*` | `/contracts/[id]/payment/status` |
| `as_*` | `/contracts/[id]/as/[ticketId]` |
| `badge_*` | `/partner/badges` 또는 `/manufacturer/badges` |
| `proposal_*` | `/partner/proposals` 또는 `/manufacturer/proposals` |
| `system` | `/notifications` (현재 페이지 유지) |

**"모두 읽음 처리" 버튼**:
→ Supabase `notification` UPDATE SET is_read=true WHERE user_id=현재유저 AND is_read=false
→ 뱃지 숫자 → 0 (뱃지 제거)
→ Toast "모든 알림을 읽음 처리했습니다."

**"미읽음만 보기" 토글**:
→ `is_read=false` 조건 추가 필터

**페이지네이션**: 20건/페이지

**상대 시간 포맷** (`lib/utils/time.ts`):
```typescript
export function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 2) return '어제';
  return date.toLocaleDateString('ko-KR');
}
```

**반응형**:
- 데스크탑: 드롭다운 너비 360px
- 모바일: 드롭다운 → 전체 알림 페이지 바로 이동 (드롭다운 생략)

**접근성**:
- 드롭다운: `role="menu"`, 항목: `role="menuitem"`
- 읽지 않은 알림 항목: `aria-label="읽지 않은 알림: {제목}"`

---

## 공통 구현 기준

### 금액 포맷팅 유틸 (`lib/utils/format.ts`)
```typescript
export const formatKRW = (amount: number) =>
  new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);

export const formatNumber = (num: number) =>
  new Intl.NumberFormat('ko-KR').format(num);
```

### Recharts 기본 설정
```typescript
// 차트 컨테이너: ResponsiveContainer width="100%" height={300}
// 툴팁: formatter로 KRW 포맷 적용
// 모바일: height={200}
```

---

## 완료 기준

- [ ] UI-010: 로봇 모델 Combobox 검색 + 유사 모델 추천 동작
- [ ] UI-010: 수량 0/음수 인라인 에러 ≤200ms, 계산 버튼 비활성화
- [ ] UI-010: 3옵션 비교 결과 카드 렌더링 (Skeleton → 결과)
- [ ] UI-010: 추천 뱃지 (최저 비용 옵션)
- [ ] UI-010: Recharts TCO 바 차트 + ROI 선형 차트 렌더링
- [ ] UI-010: PDF 다운로드 버튼 동작
- [ ] UI-011: 계산기 결과에서 각 플랜 "견적 요청" 버튼 → 모달 열림
- [ ] UI-011: 계산기 선택값 모달 프리필 자동 완성
- [ ] UI-011: 폼 유효성 + 제출 → quote_lead INSERT
- [ ] UI-011: 성공 시 모달 내 "요청 완료" 화면 전환
- [ ] UI-011: 비로그인 → 로그인 유도 AlertDialog
- [ ] UI-011: 모달 Focus Trap + Esc 닫기 + 모바일 Bottom Sheet
- [ ] UI-014: 헤더 벨 아이콘 미읽음 뱃지 숫자 동적 표시
- [ ] UI-014: 드롭다운 10건 미리보기, 클릭 시 읽음 처리 + 딥링크
- [ ] UI-014: 전체 알림 페이지 목록 + 페이지네이션
- [ ] UI-014: "모두 읽음 처리" 일괄 업데이트
- [ ] UI-014: 30초 폴링 갱신
- [ ] UI-014: 상대 시간 포맷 ("3분 전", "어제" 등)
- [ ] 모바일 반응형 전체 확인
- [ ] ESLint / TypeScript 경고 0건
