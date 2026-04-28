# 에스크로 결제 흐름 (PROMPT 4 구현)

## 구현 완료된 기능

### 3단계 에스크로 결제 플로우

신뢰 중심의 안전한 결제 시스템으로, 사용자가 자금이 보호받고 있다는 확신을 가질 수 있도록 설계되었습니다.

---

## Step 1: 은행 계좌 정보 (/contracts/:contractId/payment)

**페이지 경로**: `/contracts/:contractId/payment`

**접근 제어**:
- ✅ Buyer 역할 필수
- ✅ 소유권 체크: `session.user.buyer_company_id === contract.buyer_company_id`
- ✅ 비소유자 → 403, 존재하지 않는 계약 → 404

### 표시 내용

**1. 계약 요약 카드**
- SI 파트너명
- 계약 금액 (큰 글씨, 파란색 강조)
- 계약 체결일

**2. 은행 계좌 정보 블록**
```
은행명: 신한은행
예금주: 로봇SI매칭플랫폼(주)
계좌번호: 110-123-456789
```
- 🔒 **보안**: 실제 환경에서는 서버 렌더링만 (클라이언트 JS 번들에 미포함)
- ✅ "계좌번호 복사" 버튼 (클립보드 복사 + Toast 피드백)

**3. 안전 보장 배너** (녹색 배경)
```
✓ 입금 후 자금은 시공 완료 및 검수 승인 전까지 안전하게 보호됩니다
```

**4. 안내 사항**
- 입금자명은 계약서 회사명과 동일해야 함
- 평균 입금 확인 소요: 1~2 영업일
- 입금 확인 후 자동 알림 발송

**5. 액션 버튼**
- "나중에 하기" (outline) → 계약 목록으로
- "입금 완료했습니다" (primary) → Step 2로 이동

---

## Step 2: 입금 상태 확인 (/contracts/:contractId/payment/status)

**페이지 경로**: `/contracts/:contractId/payment/status`

**30초 자동 폴링**:
- ✅ 30초마다 에스크로 상태 자동 체크
- ✅ `state=held` 또는 `status=disputed` 되면 폴링 중단
- ✅ 상태 변경 시 Toast 알림

### 3단계 Stepper

**시각적 진행 표시**:
1. **입금 대기 중** / 입금 완료
   - 완료 시: 입금 확인 시각 표시
2. **Admin 확인 중** / 예치 완료 (held)
   - 목표: 1~2 영업일
   - 완료 시: Admin 확인 시각 표시
3. **보증서 발급 대기** / 보증서 발급 완료
   - 완료 시: 발급 시각 표시

**Stepper 디자인**:
- 완료: 녹색 체크 아이콘 + 녹색 연결선
- 진행 중: 파란색 원형 + 숫자
- 대기: 회색 원형 + 숫자

### 상태별 분기

**pending (입금 대기)**:
```
⏱️ 입금을 기다리고 있습니다
```
- 은행 계좌 정보 재표시
- 폴링 활성 상태 표시

**escrow_held (예치 완료)**:
```
✅ 에스크로 예치가 완료되었습니다!
자금이 안전하게 보호되고 있습니다.
```
- "보증서 확인하기" 버튼 활성화
- 폴링 자동 중단

**disputed (분쟁)**:
```
⚠️ 분쟁이 접수되었습니다
```
- 중재 진행 중 메시지
- "자금은 중재 완료 시까지 에스크로에 안전하게 보호됩니다" 안심 문구
- "분쟁 상세 보기" 버튼

### 에스크로 상세 정보 카드

- 예치 금액: XX,XXX,XXX원
- 현재 상태: 배지 표시 (입금 대기 / 예치 완료 / 방출 완료 / 환불 완료)
- 예치 완료 시각 (해당되는 경우)

### 폴링 인디케이터

```
🕐 30초마다 자동으로 상태를 확인하고 있습니다...
```

---

## Step 3: 보증서 다운로드 (/contracts/:contractId/warranty)

**페이지 경로**: `/contracts/:contractId/warranty`

### 보증서 미발급 상태

```
⏱️ 보증서가 곧 발급됩니다
운영팀에서 보증서를 발급하고 있습니다. 잠시만 기다려주세요.
```
- 30초 자동 폴링 (발급 시까지)
- 발급 완료 시 Toast 알림

### 보증서 발급 완료

**성공 배너** (녹색):
```
✓ AS 보증서가 발급되었습니다
SI 파트너 부도/폐업 시에도 24시간 내 대체 엔지니어가 출동합니다
```

**보증서 정보 카드**:
- AS 업체명: 24시 로봇 케어
- 보증 기간: 12개월
- 보증 범위: "로봇 시스템 전체 (하드웨어, 소프트웨어, 부품 교체 포함)"
- 긴급 연락처:
  - 📞 1588-9999 (클릭 가능)
  - ✉️ support@robotcare.com (클릭 가능)
- 발급일: YYYY-MM-DD

**PDF 다운로드 버튼**:
- 로딩 상태: "PDF 생성 중..." (2초 시뮬레이션)
- 성공: Toast "보증서 PDF가 다운로드되었습니다"
- 실패: Toast "다운로드에 실패했습니다. 다시 시도해주세요"

**보증서 이용 안내**:
- SI 파트너 부도/폐업/연락두절 시 긴급 AS 요청 가능
- 접수 후 4시간 내 엔지니어 배정, 24시간 내 현장 출동
- 보증 기간은 시공 완료일로부터 N개월
- 보증서는 계약 목록에서 언제든지 다시 확인 가능

**액션 버튼**:
- "계약 목록으로" (outline)
- "긴급 AS 요청" (primary) → `/contracts/:contractId/as/new`

---

## 보안 요구사항

### 계좌 정보 보호
✅ **서버 렌더링 전용**:
- 은행 계좌 정보는 클라이언트 JS 번들에 절대 포함 안 됨
- 실제 환경: 환경 변수 또는 Admin 설정에서 로드

✅ **로깅 마스킹**:
```typescript
// 계좌번호 마스킹
accountNumber: '110-***-****89'

// 에스크로 금액 마스킹
amount: '***,***,000원'
```

### 접근 제어
✅ **모든 라우트**:
- 세션 체크 필수
- 소유권 검증 (buyer_company_id 매칭)
- 비인증/권한 없음 → 자동 리다이렉트

---

## 접근성 (WCAG 2.1 AA)

**Step 1 (은행 정보)**:
- 복사 버튼: 최소 44px 터치 영역 (모바일)
- 복사 성공: `role="status"` Toast

**Step 2 (상태 확인)**:
- Stepper: `aria-current="step"` (현재 단계)
- 상태 변경: `aria-live="polite"` (스크린 리더 알림)
- 폴링 인디케이터: 시각적 + 텍스트 피드백

**Step 3 (보증서)**:
- PDF 다운로드: `aria-busy` 상태
- 연락처 링크: `tel:`, `mailto:` 프로토콜
- 키보드 네비게이션 지원

---

## 반응형 디자인

**Desktop (≥1024px)**:
- 최대 너비 720px, 중앙 정렬
- 카드 레이아웃

**Tablet (768-1023px)**:
- 동일한 레이아웃, 패딩 조정

**Mobile (≤767px)**:
- 전체 너비
- 버튼: 전체 너비, 충분한 터치 영역 (최소 44px)
- 스택형 레이아웃

---

## Mock 데이터

### MOCK_CONTRACTS (3개)

```typescript
contract-001: pending (입금 대기)
contract-002: escrow_held (예치 완료) + 보증서 발급됨
contract-003: disputed (분쟁)
```

### MOCK_ESCROW_TX

```typescript
contract-001: state='pending'
contract-002: state='held' (3일 전 예치)
contract-003: state='held' (8일 전 예치)
```

### MOCK_WARRANTIES

```typescript
contract-002: 12개월 보증, 24시 로봇 케어
```

### 폴링 시뮬레이션

`simulateEscrowStateChange()`:
- 3번의 폴링 사이클 후 (90초) `pending` → `held` 전환
- 실제 환경: Firestore `onSnapshot` 실시간 리스너로 교체 가능

---

## 테스트 시나리오

### Scenario 1: 새로운 계약 (pending)

1. Buyer로 로그인
2. `/contracts/contract-001/payment` 접속
3. 은행 계좌 정보 확인
4. "계좌번호 복사" 클릭 → Toast 확인
5. "입금 완료했습니다" 클릭
6. `/contracts/contract-001/payment/status`로 이동
7. Stepper Step 1 활성 확인
8. 30초 폴링 표시 확인
9. 90초 대기 → Step 2 완료 전환 확인
10. "보증서 확인하기" 버튼 클릭
11. 보증서 미발급 메시지 확인

### Scenario 2: 예치 완료 (escrow_held)

1. `/contracts/contract-002/payment/status` 접속
2. 녹색 성공 배너 확인
3. Stepper Step 2 완료 상태 확인
4. 에스크로 상세 정보 확인 (예치 완료 시각)
5. "보증서 확인하기" 클릭
6. `/contracts/contract-002/warranty` 이동
7. 보증서 정보 카드 확인
8. "PDF 다운로드" 클릭 → 2초 로딩 → 성공 Toast
9. 긴급 연락처 클릭 (tel:, mailto:) 동작 확인

### Scenario 3: 분쟁 상태 (disputed)

1. `/contracts/contract-003/payment/status` 접속
2. 노란색 경고 배너 확인
3. "자금은 중재 완료 시까지 에스크로에 안전하게 보호됩니다" 메시지 확인
4. "분쟁 상세 보기" 버튼 확인

### Scenario 4: 소유권 체크

1. Buyer A로 로그인
2. Buyer B의 계약 (`contract-004`) URL 직접 접속
3. 403 페이지로 자동 리다이렉트 확인

---

## 성능 목표

- ✅ 페이지 로드: ≤500ms
- ✅ 폴링 간격: 30초 (서버 부하 최소화)
- ✅ PDF 생성: p95 ≤ 5000ms (실제 구현 시)
- ✅ 계좌번호 복사: ≤200ms 피드백

---

## Firestore 데이터 모델 (TODO)

### /contracts/{contractId}
```typescript
{
  buyer_company_id: string
  si_partner_id: string
  amount: number
  status: ContractStatus
  created_at: Timestamp
  updated_at: Timestamp
}
```

### /escrow_tx/{txId}
```typescript
{
  contract_id: string
  state: 'pending' | 'held' | 'released' | 'refunded'
  amount: number
  held_at?: Timestamp
  admin_verified_at?: Timestamp
  released_at?: Timestamp
}
```

### /warranties/{warrantyId}
```typescript
{
  contract_id: string
  as_company: string
  as_contact: string
  as_email: string
  coverage_scope: string
  period_months: number
  issued_at: Timestamp
  pdf_url?: string
}
```

---

## TODO (실제 구현 시)

현재 Mock 구현된 부분:
- [ ] Firestore 컬렉션 연동
- [ ] 실제 은행 계좌 정보 (환경 변수)
- [ ] PDF 생성 API (jsPDF, react-pdf)
- [ ] Firebase Functions: 
  - [ ] 입금 확인 알림 (Kakao/SMS)
  - [ ] 에스크로 상태 변경 알림
  - [ ] 보증서 자동 발급
- [ ] Firestore `onSnapshot` 실시간 리스너 (폴링 대체)
- [ ] 실제 파일 저장 (Firebase Storage)
- [ ] 감사 로그 (admin 액션)

---

## 다음 단계 (PROMPT 5)

- 검수 승인/거절 플로우
- 7 영업일 검수 데드라인 카운트다운
- 분쟁 접수 및 랜딩 페이지
- 긴급 AS 티켓 플로우
- 4단계 AS 처리 Stepper (접수 → 배정 → 출동 → 해결)
- SLA 준수 체크 (24시간 타겟)
