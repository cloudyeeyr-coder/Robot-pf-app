# Firebase Studio MVP 프롬프트 — 4회차: 관리자 · 파트너 포털

## 전제 조건
1~3회차 완료 상태. 공통 레이아웃·DB·거래 플로우 페이지 동작 중.

## 이번 회차 목표
- UI-008: Admin 대시보드 (에스크로 관리 · AS SLA · 이벤트 로그)
- UI-009: 제조사 포털 (뱃지 발급/철회 · 파트너 제안)
- UI-013: SI 파트너 포털 (프로필 관리 · 제안 수락/거절 · 뱃지 현황)

---

## [UI-008] Admin 대시보드

### 경로 및 접근 제어
```
/app/admin/page.tsx           ← 대시보드 메인 (KPI)
/app/admin/escrow/page.tsx    ← 에스크로 관리
/app/admin/as-sla/page.tsx    ← AS SLA 모니터링
/app/admin/events/page.tsx    ← 이벤트 로그
/app/admin/disputes/page.tsx  ← 분쟁 목록
```
- `admin` 역할 전용 — 미인증 또는 다른 역할 → `/403`
- 레이아웃: 1회차에서 구현한 Admin 사이드바 레이아웃 사용

---

### 대시보드 메인 — KPI 카드 4개

```
┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  에스크로 대기  │  │   분쟁 진행    │  │  AS 미배정    │  │  이달 신규가입  │
│     3건        │  │     2건        │  │    1건        │  │    12명        │
│  [바로가기 →]  │  │  [바로가기 →]  │  │  [바로가기 →] │  │  [바로가기 →]  │
└────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘
```

Supabase 쿼리:
- 에스크로 대기: `escrow_tx.state = 'pending'` COUNT
- 분쟁 진행: `contract.status = 'disputed'` COUNT
- AS 미배정: `as_ticket.assigned_at IS NULL AND reported_at < NOW() - INTERVAL '4 hours'` COUNT
- 이달 신규 가입: `event_log.event_type = 'signup_complete' AND created_at >= date_trunc('month', NOW())` COUNT

각 카드 클릭 → 해당 서브 페이지 이동

---

### 에스크로 관리 (`/admin/escrow`)

**필터 탭**: 전체 / 예치 대기(pending) / 방출 대기(held) / 완료(released) / 환불(refunded)

**테이블 컬럼**:
| 계약 ID | 수요기업명 | SI 파트너명 | 금액 | 상태 | 예치일 | Admin 메모 | 액션 |
|---|---|---|---|---|---|---|---|

- 금액: 천 단위 쉼표 포맷 (X,XXX,XXX원)
- 상태 Badge 색상: pending=노란 / held=파란 / released=녹색 / refunded=회색
- 정렬: 예치일 최신순

**"입금 확인" 버튼** (state=pending 행):
→ `AlertDialog` 확인 모달:
```
제목: 입금을 확인하시겠습니까?
Admin 메모 입력: Textarea (필수, min 5자)
버튼: [취소] [확인]
```
→ Supabase `escrow_tx.state` → `held`, `admin_verified_at = NOW()`, `admin_memo` 저장
→ `notification` INSERT (buyer에게 "에스크로 예치 완료" 알림)
→ 성공 Toast "입금이 확인되었습니다."

**"방출 확인" 버튼** (state=held + contract.status=release_pending 행):
→ `AlertDialog` 확인 모달:
```
제목: 대금을 방출하시겠습니까?
내용: "수기 송금이 완료된 경우에만 확인해주세요."
버튼: [취소] [방출 확인]
```
→ Supabase `escrow_tx.state` → `released`, `released_at = NOW()`
→ `contract.status` → `completed`
→ `notification` INSERT (si_partner에게 "대금이 지급되었습니다" 알림)
→ 성공 Toast "대금 방출이 확인되었습니다."

**서버 사이드 페이지네이션**: 20건/페이지

---

### AS SLA 모니터링 (`/admin/as-sla`)

**SLA 요약 카드 3개**:
```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  24h 출동 성공률  │  │   미배정 건수    │  │  평균 해결 시간   │
│     94.2%        │  │     2건 ⚠️       │  │     18.3시간     │
│  목표: ≥95%      │  │  4시간 초과      │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```
- 출동 성공률 < 95% → 빨간색 경고

**티켓 테이블**:
| 티켓 ID | 계약 ID | 긴급도 | 접수일 | 배정일 | 출동일 | 해결일 | SLA |
|---|---|---|---|---|---|---|---|

- 필터 탭: 전체 / 미배정 / 진행 중 / 완료 / SLA 미충족
- SLA 미충족 행: 빨간 배경 + ❌ 아이콘
- 미배정 4시간 초과 행: 주황 배경 + ⚠️ 아이콘

---

### 이벤트 로그 (`/admin/events`)

**검색 필터**:
- 이벤트 유형 Select: signup_complete / escrow_deposit_confirmed / contract_created / inspection_approved / inspection_rejected / dispute_created / as_ticket_created
- 날짜 범위: DatePicker (시작일 ~ 종료일)
- 사용자 ID 검색: Input

**테이블**:
| 이벤트 유형 | 사용자 ID | 발생 시각 | 페이로드 요약 |
|---|---|---|---|
- payload 요약: JSONB에서 key 목록만 표시 (예: "company_name, region, segment")

**일별 이벤트 트렌드 차트**:
- Recharts `BarChart` (최근 7일, 이벤트 유형별 스택)
- x축: 날짜, y축: 건수

**서버 사이드 페이지네이션**: 50건/페이지

---

### 분쟁 목록 (`/admin/disputes`)

**테이블**:
| 계약 ID | 수요기업 | SI 파트너 | 분쟁 접수일 | 거절 사유 | 진행 상태 |
|---|---|---|---|---|---|
- 진행 상태 Badge: 검토 중(노란) / 중재 진행(파란) / 해결 완료(녹색)
- Supabase: `contract.status = 'disputed'` 조회

---

## [UI-009] 제조사 포털

### 경로 및 접근 제어
```
/app/manufacturer/dashboard/page.tsx   ← 파트너 현황 메인
/app/manufacturer/badges/page.tsx      ← 뱃지 발급/철회
/app/manufacturer/proposals/page.tsx   ← 파트너 제안
```
- `manufacturer` 역할 전용
- 레이아웃: Manufacturer 사이드바

---

### 파트너 현황 대시보드 (`/manufacturer/dashboard`)

**KPI 카드 4개**:
- 활성 파트너 수 (뱃지 보유 + is_active=true)
- 대기 제안 수 (proposal.status='pending')
- 만료 예정 뱃지 수 (expires_at < NOW() + INTERVAL '30 days' AND is_active=true)
- 이달 신규 파트너 수

**파트너 목록 테이블**:
| SI 회사명 | 뱃지 상태 | 발급일 | 만료일 | 지역 |
|---|---|---|---|---|
- 상태 Badge: 활성(녹색) / 만료(회색) / 철회(빨간)
- 검색: 회사명 Input, 상태 Select 필터

---

### 뱃지 발급/철회 (`/manufacturer/badges`)

**뱃지 발급 폼** (상단 카드):
```
SI 파트너 선택: Combobox (회사명 자동완성 검색)
만료일 설정: DatePicker (오늘 이후만 선택 가능)
발급 메모: Textarea (선택, max 500자)
[뱃지 발급] 버튼
```
→ 확인 모달 → Supabase `badge` INSERT (is_active=true)
→ 성공 Toast "뱃지가 발급되었습니다."
→ 중복 발급 시 (해당 SI에 is_active=true 뱃지 존재): "이미 활성 뱃지가 존재합니다" 에러

**뱃지 목록 테이블**:
| SI명 | 발급일 | 만료일 | 상태 | 액션 |
|---|---|---|---|---|
- 만료 D-7 이하 행: 노란 배경
- 활성 뱃지만 "철회" 버튼 표시

**뱃지 철회 플로우**:
→ 철회 사유 입력 Textarea (필수, min 10자) → 확인 모달:
```
"철회 시 SI 프로필에서 즉시 비노출됩니다."
```
→ Supabase `badge.is_active` → false, `revoked_at = NOW()`, `revoke_reason` 저장
→ 성공 Toast "뱃지가 철회되었습니다."

---

### 파트너 제안 (`/manufacturer/proposals`)

**제안 발송 폼** (상단 카드):
```
SI 파트너 선택: Combobox (뱃지 미보유 SI 우선 표시)
제안 메시지: Textarea (선택, max 1000자)
[파트너 제안 발송] 버튼
```
→ Supabase `partner_proposal` INSERT (status='pending', deadline=NOW()+5 영업일)
→ `notification` INSERT (si_partner에게 "파트너 제안 도착" 알림)
→ 성공 Toast "제안이 발송되었습니다. SI의 응답 기한은 5영업일입니다."
→ 이미 대기 중 제안 있는 SI 재발송 → "이미 대기 중인 제안이 있습니다" 에러

**제안 목록 테이블**:
| SI명 | 발송일 | 응답 기한 | 상태 | 메시지 요약 |
|---|---|---|---|---|
- 상태 탭: 전체 / 대기(pending) / 수락(accepted) / 거절(rejected) / 만료(expired)
- 상태 Badge 색상: pending=노란 / accepted=녹색 / rejected=빨간 / expired=회색

**만료 제안 행**:
```
만료됨 표시 + "대안 SI 3개사 추천" 섹션 (같은 지역 활성 SI 3개 표시)
```

---

## [UI-013] SI 파트너 포털

### 경로 및 접근 제어
```
/app/partner/profile/page.tsx      ← 프로필 관리
/app/partner/proposals/page.tsx    ← 파트너 제안 목록
/app/partner/badges/page.tsx       ← 뱃지 현황
```
- `si_partner` 역할 전용
- 레이아웃: SI Partner 사이드바

---

### 프로필 관리 (`/partner/profile`)

**조회 모드** (기본):
- 현재 등록 정보 읽기 전용 표시
- Admin 검토 상태 Badge: "✅ 승인됨" (녹색) / "⏳ 검토 대기 중" (노란)
- "프로필 수정" 버튼 → 수정 모드 전환

**수정 모드**:
- UI-002와 동일 Zod 스키마 (`siPartnerSignupSchema`) 재사용
- 수정 가능 필드:
  - 회사명, 지역, 담당자 정보
  - 완료/실패 프로젝트 수 (시공 성공률 자동 재계산)
  - 역량 태그 (Tag Input, 추가/삭제)
- "저장" 버튼 → Supabase `si_partner` + `si_profile` UPDATE
- 성공 Toast "프로필이 업데이트되었습니다."
- "취소" 버튼 → 수정 사항 버리고 조회 모드로 전환

---

### 파트너 제안 관리 (`/partner/proposals`)

**필터 탭**: 전체 / 대기(pending) / 수락됨(accepted) / 거절됨(rejected) / 만료됨(expired)

**제안 목록 테이블** (모바일: 카드 뷰):
| 제조사명 | 발송일 | 응답 기한 | 상태 | 메시지 | 액션 |
|---|---|---|---|---|---|

**응답 기한 카운트다운**:
- `deadline`까지 잔여 영업일 계산: D-5, D-4, ..., D-1
- D-2 이하: 주황색 경고
- D-0(당일): 빨간색 경고 + "오늘 마감"
- `aria-live="polite"`

**수락 액션** (pending 행):
→ `AlertDialog` 확인 모달 → Supabase `partner_proposal.status` → `accepted`
→ `badge` INSERT (is_active=true, expires_at=1년 후) — 파트너십 뱃지 자동 발급
→ 성공 Toast "파트너십이 체결되었습니다! 뱃지가 발급되었습니다."

**거절 액션** (pending 행):
→ 거절 사유 Textarea (선택, max 500자) → 확인
→ Supabase `partner_proposal.status` → `rejected`
→ `notification` INSERT (manufacturer에게 "제안이 거절되었습니다" 알림)
→ 성공 Toast "제안을 거절했습니다."

---

### 뱃지 현황 (`/partner/badges`)

**통계 요약**:
```
활성 N개  /  만료 N개  /  철회 N개
```

**뱃지 카드 목록**:
```
┌──────────────────────────────────┐
│ 🏅 Universal Robots              │
│ 발급일: 2025-06-01               │
│ 만료일: 2026-06-01               │
│ 상태: ✅ 활성                    │
└──────────────────────────────────┘
```
- 만료 D-7 이하: 노란 테두리 + "N일 후 만료" 경고
- 만료됨: 회색 처리 + "만료됨" 라벨
- 철회됨: 회색 처리 + "철회됨" 라벨

---

## 공통 구현 기준

### 테이블 공통 패턴 (shadcn/ui `Table`)
```typescript
// 모바일에서 테이블 → 카드 뷰 전환
const isMobile = useMediaQuery('(max-width: 768px)');
return isMobile ? <CardList data={data} /> : <DataTable data={data} />;
```

### Combobox 패턴 (shadcn/ui `Command` + `Popover`)
- 타이핑 → Supabase `ilike` 검색 (debounce 300ms)
- 키보드: 화살표 이동, Enter 선택, Esc 닫기
- 선택 후 값 `form.setValue()` 연동

### 관리자 액션 공통 원칙
- 모든 변경 액션은 `AlertDialog` 확인 모달 필수 (이중 안전장치)
- 액션 중 버튼 disabled + 로딩 스피너 (중복 클릭 방지)
- 성공/실패 결과는 shadcn/ui `toast()` 로 표시

---

## shadcn/ui 컴포넌트 목록

`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`,
`AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`,
`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`,
`Badge`, `Card`, `CardHeader`, `CardContent`,
`Command`, `CommandInput`, `CommandList`, `CommandItem`,
`Popover`, `PopoverTrigger`, `PopoverContent`,
`Calendar`, `Skeleton`, `Textarea`, `Input`, `Select`, `Button`

---

## 완료 기준

- [ ] UI-008: KPI 카드 4개 Supabase 데이터 정상 집계
- [ ] UI-008: 에스크로 "입금 확인" → state=held 전환, Admin 메모 저장
- [ ] UI-008: "방출 확인" → state=released + contract=completed 전환
- [ ] UI-008: AS SLA 테이블, SLA 미충족 빨간색 강조
- [ ] UI-008: 이벤트 로그 필터 + 트렌드 차트 렌더링
- [ ] UI-008: non-admin 접근 → 403 차단
- [ ] UI-009: 뱃지 발급 Combobox + DatePicker 동작
- [ ] UI-009: 중복 발급 차단 에러 메시지
- [ ] UI-009: 뱃지 철회 + is_active=false 전환
- [ ] UI-009: 파트너 제안 발송 + notification INSERT
- [ ] UI-009: 만료 제안 → 대안 SI 3개 추천 섹션 표시
- [ ] UI-013: 프로필 조회/수정 모드 전환, 역량 태그 수정
- [ ] UI-013: 시공 성공률 자동 재계산
- [ ] UI-013: 제안 수락 → 뱃지 자동 발급 (badge INSERT)
- [ ] UI-013: 제안 거절 → manufacturer 알림 발송
- [ ] UI-013: 응답 기한 카운트다운 D-2 이하 경고색
- [ ] UI-013: 뱃지 만료 D-7 경고 표시
- [ ] 모바일 반응형 (테이블 → 카드 뷰) 전체 확인
- [ ] ESLint / TypeScript 경고 0건
