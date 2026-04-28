# Firebase Studio MVP 프롬프트 — 3회차: 핵심 거래 플로우

## 전제 조건
1·2회차 완료 상태. 공통 레이아웃, Supabase 테이블, 회원가입·검색 페이지 동작 중.

## 이번 회차 목표
- UI-005: 에스크로 결제 흐름 (법인 계좌 안내 → 예치 확인 → 보증서 다운로드)
- UI-006: 시공 검수 승인/거절 UI
- UI-007: 긴급 AS 접수 및 배정 추적 UI

---

## [UI-005] 에스크로 결제 흐름

### 경로
```
/app/contracts/[contractId]/payment/page.tsx          ← Step 1: 법인 계좌 안내
/app/contracts/[contractId]/payment/status/page.tsx   ← Step 2: 예치 상태 확인
/app/contracts/[contractId]/warranty/page.tsx         ← Step 3: 보증서 다운로드
```
- 인증 필수: `buyer` 역할 + `contract.buyer_company_id === 로그인 유저 ID` 소유권 검증
- 타인 계약 접근 → 403 ("접근 권한이 없습니다")
- 존재하지 않는 계약 → `notFound()` (404)

### 진행 상태 표시 (3단계 Stepper, 상단 공통)
```
[1] 계좌 안내  →  [2] 예치 확인  →  [3] 보증서 발급
```
현재 단계 강조 (filled circle + 색상), `aria-current="step"`

---

### Step 1 — 법인 계좌 안내 (`/payment`)

**계약 요약 카드**
- SI 파트너명, 총 계약 금액 (천 단위 쉼표), 계약 생성일

**법인 계좌 정보 카드**
```
은행명:   신한은행
계좌번호: 100-023-456789
예금주:   (주)로봇SI플랫폼
              [계좌번호 복사]
```
- "계좌번호 복사" 버튼: `navigator.clipboard.writeText()` → Toast "계좌번호가 복사되었습니다"
- 계좌 정보는 환경 변수(`NEXT_PUBLIC_ESCROW_BANK`, `NEXT_PUBLIC_ESCROW_ACCOUNT`, `NEXT_PUBLIC_ESCROW_OWNER`)에서 로드

**안내 문구**
- "아래 계좌로 계약 금액을 입금해주세요."
- "입금 후 운영팀이 확인하면 에스크로 예치가 완료됩니다. (평균 1~2 영업일 소요)"

**에스크로 보호 배너**
```
🔒 입금된 자금은 시공 완료 및 검수 승인 전까지 안전하게 보호됩니다.
```

**"입금 완료했습니다" 버튼** → `/payment/status`로 이동

---

### Step 2 — 예치 상태 확인 (`/payment/status`)

**에스크로 상태별 UI 분기**

`pending` (입금 대기):
```
⏳ 입금을 기다리고 있습니다.
운영팀이 입금을 확인하면 자동으로 업데이트됩니다.
[법인 계좌 정보 재표시]
```

`held` (예치 완료):
```
✅ 에스크로 예치가 완료되었습니다!
예치 금액: X,XXX,XXX원
확인 일시: YYYY-MM-DD HH:mm
[보증서 다운로드 →] 버튼 활성화
```

`disputed` (분쟁):
```
⚠️ 분쟁이 접수되었습니다.
운영팀이 2영업일 내 중재를 시작합니다.
자금은 중재 완료 시까지 에스크로에 보호됩니다.
문의: support@robotsi-platform.kr
```

**30초 폴링** (`setInterval`): `pending` 상태일 때만 Supabase에서 `escrow_tx.state` 재조회
- 상태 변경 시 Toast "에스크로 예치가 완료되었습니다!" + UI 자동 전환

**에스크로 TX 상세** (예치 완료 시): 예치 금액, `held_at` 시각, `admin_verified_at` 시각

---

### Step 3 — 보증서 다운로드 (`/warranty`)

**보증서 정보 카드**
| 항목 | 값 |
|---|---|
| AS 업체명 | (warranty.as_company_name) |
| 연락처 | (warranty.as_contact) |
| 이메일 | (warranty.as_email) |
| 보증 범위 | (warranty.warranty_scope) |
| 보증 기간 | N개월 |
| 발급일 | YYYY-MM-DD |

**"AS 보증서 PDF 다운로드" 버튼**
- 클릭 → `GET /api/contracts/[contractId]/warranty/pdf`
- 다운로드 중: 버튼 disabled + "다운로드 중..."
- 성공: 브라우저 자동 다운로드
- 실패: Toast "보증서 다운로드에 실패했습니다."

**보증서 미발급 상태 (warranty가 null)**:
```
🕐 보증서가 곧 발급됩니다.
잠시 후 다시 확인해주세요.
```
30초 폴링으로 자동 갱신

---

## [UI-006] 시공 검수 승인/거절

### 경로
`/app/contracts/[contractId]/inspection/page.tsx`

**접근 조건**: `buyer` 역할 + 계약 소유권 + `contract.status === 'inspecting'`
- 다른 status → "아직 검수 단계가 아닙니다" 안내 + 계약 상세로 리다이렉트

### 페이지 구성

**계약 요약 카드**
- SI 파트너명, 계약 금액, 시공 완료일

**검수 기한 카운트다운**
```
⏰ 검수 기한: D-5
```
- 잔여일 계산: 시공 완료일 기준 7영업일
- 잔여 3일 이하: 주황색 경고
- D-Day: 빨간색 경고
- "기한 내 미응답 시 자동으로 분쟁 접수됩니다." 안내 문구
- `aria-live="polite"`로 카운트다운 값 감지

**시공 완료 보고서 요약**
- SI가 제출한 보고서 내용 표시 (없을 경우 "보고서가 아직 등록되지 않았습니다")

---

### 검수 합격 섹션

**"검수 합격" 버튼** (녹색 Primary)

클릭 → `Dialog` 확인 모달:
```
제목: 검수 합격을 승인하시겠습니까?
내용: "승인 시 관리자에게 대금 방출 대기 알림이 전송됩니다."
      [승인 메모 Textarea, 선택입력, max 500자]
버튼: [취소]  [승인 확정 ✓]
```

승인 확정 클릭:
- Supabase `contract.status` → `release_pending` UPDATE
- `notification` INSERT (admin에게 "방출 대기" 알림)
- 성공 배너: "검수가 승인되었습니다. 관리자 확인 후 대금이 방출됩니다."
- 버튼 disabled + 로딩 스피너 (중복 제출 방지)

---

### 검수 거절 섹션

**"검수 거절" 버튼** (빨간 Destructive)

클릭 → 거절 폼 펼침 (모달 또는 인라인 확장):

```
거절 사유 카테고리: Select (필수)
  - 품질 미달
  - 사양 불일치
  - 납기 지연
  - 기타

거절 사유 상세: Textarea (필수, min 10자, max 1000자)
  placeholder: "구체적인 거절 사유를 입력해주세요 (최소 10자)"
  현재 글자 수 표시: N / 1000
```

Zod 검증:
```typescript
const inspectionRejectSchema = z.object({
  reject_category: z.enum(['품질 미달','사양 불일치','납기 지연','기타']),
  reject_reason: z.string().min(10, '거절 사유를 10자 이상 입력해주세요').max(1000),
});
```

사유 입력 후 "거절 확정" 클릭 → 확인 모달:
```
제목: 검수를 거절하시겠습니까?
내용: "거절 시 분쟁 접수로 전환됩니다. 이 작업은 되돌릴 수 없습니다."
버튼: [취소]  [거절 확정]
```

거절 확정:
- Supabase `contract.status` → `disputed` UPDATE
- 성공 → `/contracts/[contractId]/dispute` 리다이렉트

---

### 분쟁 안내 페이지 (`/contracts/[contractId]/dispute`)

```
⚖️ 분쟁이 접수되었습니다

분쟁 접수 번호: #CONTRACT-ID-앞8자리

중재 절차:
1단계 ─ 분쟁 접수 완료 ✅ (오늘)
2단계 ─ 운영팀 검토 (2영업일 이내)
3단계 ─ 양측 의견 수렴
4단계 ─ 중재 결정

🔒 자금은 중재 완료 시까지 에스크로에 안전하게 보호됩니다.

문의: disputes@robotsi-platform.kr | 02-000-0000
```

---

## [UI-007] 긴급 AS 접수 및 배정 추적

### 경로
```
/app/contracts/[contractId]/as/new/page.tsx              ← AS 접수 폼
/app/contracts/[contractId]/as/[ticketId]/page.tsx       ← 추적 화면
/app/my/as-tickets/page.tsx                              ← 내 AS 목록
```
- `buyer` 역할 + 계약 소유권 검증

---

### AS 접수 폼 (`/as/new`)

**연결 계약 정보 카드**
- SI 파트너명, 계약 상태

**Zod 스키마**
```typescript
const asTicketSchema = z.object({
  symptom_description: z
    .string()
    .min(20, '증상 설명을 20자 이상 입력해주세요')
    .max(2000),
  priority: z.enum(['normal', 'urgent']),
});
```

**폼 필드**
- 증상 설명: `Textarea` (필수, min 20자, max 2000자)
  - 현재 글자 수 표시: N / 2000
- 긴급도: `RadioGroup`
  - `normal`: "일반 AS"
  - `urgent`: "긴급 AS" → 선택 시 경고 안내:
    ```
    ⚠️ 긴급 AS는 SI 파트너의 부도·폐업·연락두절이 확인된 경우에만 접수 가능합니다.
    ```
- 현장 사진 첨부 (선택): 파일 업로드 버튼
  - 최대 5장, 10MB/장, 이미지 파일만 (jpg/png/webp)
  - 드래그&드롭 + 클릭 업로드
  - 미리보기 썸네일 + X 버튼 삭제

**제출**: Supabase `as_ticket` INSERT → `/as/[ticketId]` 추적 페이지 리다이렉트
- 제출 중: "접수 중..." 로딩 스피너 + 버튼 disabled

---

### 4단계 Stepper 추적 화면 (`/as/[ticketId]`)

**데스크탑**: 가로형 Stepper
**모바일**: 세로형 Stepper

```
Step 1: 접수 완료
  - 접수 일시: YYYY-MM-DD HH:mm
  - 티켓 번호: #AS-XXXXXXXX

Step 2: 엔지니어 배정  (목표: 접수 후 4시간 이내)
  - assigned_at이 null이면: "배정 대기 중... (X시간 경과 / 목표 4시간)"
  - assigned_at이 있으면: 배정 일시, 엔지니어명, 연락처

Step 3: 현장 출동  (목표: 접수 후 24시간 이내)
  - dispatched_at이 null이면: "출동 대기 중..."
  - dispatched_at이 있으면: 출동 일시

Step 4: 해결 완료
  - resolved_at이 null이면: "처리 중..."
  - resolved_at이 있으면: 해결 일시 + SLA 판정 배지
```

**SLA 판정 배지**:
- `resolved_at - reported_at ≤ 24시간` → `✅ SLA 충족 (N시간 소요 / 목표 24시간)`
- 초과 시 → `❌ SLA 미충족 (N시간 소요)`

**목표 시간 초과 경고**:
- Step 2에서 4시간 경과 미배정 → 빨간색 텍스트 + 경고 아이콘
- Step 3에서 24시간 경과 미출동 → 빨간색 텍스트 + 경고 아이콘

**30초 폴링**: 진행 중(`resolved_at = null`) 티켓만
- 상태 변경 시 Toast:
  - 배정 완료: "엔지니어가 배정되었습니다!"
  - 출동: "엔지니어가 현장으로 출동했습니다."
  - 해결: "AS가 완료되었습니다."

**접근성**:
- Stepper: `aria-current="step"` 현재 단계
- 경과 시간: `aria-live="polite"`

---

### 내 AS 목록 (`/my/as-tickets`)

**목록 테이블** (모바일: 카드 뷰):
| 티켓 ID | 계약 (SI명) | 긴급도 | 접수일 | 현재 단계 | SLA |
|---|---|---|---|---|---|

- 필터 탭: 전체 / 진행 중 / 완료 / SLA 미충족
- 각 행 클릭 → 해당 추적 페이지로 이동
- 빈 목록: "접수한 AS 티켓이 없습니다."

---

## 공통 구현 기준

### 30초 폴링 패턴
```typescript
// Client Component에서 사용
useEffect(() => {
  const interval = setInterval(async () => {
    const data = await fetchStatus(); // Supabase 조회
    if (data.state !== prevState) {
      toast({ title: '상태가 업데이트되었습니다.' });
      setStatus(data.state);
    }
  }, 30000);
  return () => clearInterval(interval);
}, []);
```

### 확인 모달 패턴 (shadcn/ui `AlertDialog`)
```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">검수 거절</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>검수를 거절하시겠습니까?</AlertDialogTitle>
      <AlertDialogDescription>거절 시 분쟁 접수로 전환됩니다.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>취소</AlertDialogCancel>
      <AlertDialogAction onClick={handleReject}>거절 확정</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 완료 기준

- [ ] UI-005: 3단계 Stepper 상태별 UI 분기 정상 동작 (pending/held/disputed)
- [ ] UI-005: 계좌번호 클립보드 복사 + Toast 동작
- [ ] UI-005: 30초 폴링으로 예치 상태 자동 갱신
- [ ] UI-005: 보증서 미발급 시 안내, 발급 후 다운로드 버튼 활성화
- [ ] UI-005: 타인 계약 접근 → 403 처리
- [ ] UI-006: 합격/거절 확인 모달 동작, Focus Trap 적용
- [ ] UI-006: 거절 사유 미입력 시 제출 차단 (min 10자 검증)
- [ ] UI-006: 검수 기한 카운트다운 표시, 3일 이하 경고색 전환
- [ ] UI-006: 분쟁 안내 페이지 리다이렉트 및 중재 절차 타임라인 표시
- [ ] UI-007: AS 접수 폼 유효성 (min 20자) 동작
- [ ] UI-007: 4단계 Stepper 상태별 렌더링, 목표 시간 경과 경고
- [ ] UI-007: SLA 판정 배지 정상 표시
- [ ] UI-007: 30초 폴링 + 상태 변경 Toast 동작
- [ ] 모바일 반응형 전체 확인
- [ ] ESLint / TypeScript 경고 0건
