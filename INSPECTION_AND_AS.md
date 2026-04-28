# 검수 승인/거절 & AS 접수 (PROMPT 5 구현)

## 구현 완료된 기능

### 1. 검수 승인/거절 페이지 (/contracts/:contractId/inspection)

**페이지 경로**: `/contracts/:contractId/inspection`

**접근 제어**:
- ✅ Buyer 역할 필수
- ✅ 계약 소유권 체크
- ✅ **`contract.status === 'inspecting'`일 때만 접근 가능**
- ✅ 다른 상태일 경우 → Toast 에러 + 계약 목록으로 리다이렉트

---

#### 계약 요약 카드
- SI 파트너명
- 계약 금액
- 시공 완료일

---

#### 검수 기한 카운트다운

**7 영업일 카운트다운**:
- D-7, D-6, D-5, ..., D-1, D-Day 표시
- 배경색 변화:
  - D-4 이상: 녹색 배경 (`bg-green-50`)
  - D-3 ~ D-1: 주황색 배경 (`bg-orange-50`)
  - D-Day: 빨간색 배경 (`bg-red-50`)

**경고 메시지**:
```
⏰ 검수 기한 D-3
기한 내 미응답 시 자동으로 분쟁 접수됩니다
```

---

#### SI 시공 완료 보고

시공 완료 보고서 요약 표시 (실제 환경에서는 상세 내용)

---

#### 검수 합격 섹션 (녹색 테두리)

**타이틀**: ✓ 검수 합격

**필드**:
- 메모 (선택사항, 최대 500자)
  - Textarea 컴포넌트
  - 글자 수 카운터 표시

**승인 버튼**: "검수 합격" (녹색 배경)

**확인 모달**:
```
검수 합격을 승인하시겠습니까?

승인 시 Admin에게 방출 대기 알림이 전송되며, 
에스크로 자금이 SI 파트너에게 지급됩니다.

[메모 내용 표시]

[취소] [승인]
```

**승인 처리**:
- TODO: `contract.status = 'release_pending'`
- TODO: Admin 알림 전송
- TODO: 이벤트 로그 생성
- Toast: "검수 합격이 승인되었습니다. Admin에게 방출 대기 알림이 전송되었습니다."
- 계약 목록으로 리다이렉트

---

#### 검수 거절 섹션 (빨간색 테두리)

**타이틀**: ✗ 검수 거절

**필드**:

1. **거절 사유 카테고리** (필수)
   - Select 컴포넌트
   - 옵션:
     - 품질 미달
     - 사양 불일치
     - 납기 지연
     - 기타

2. **상세 사유** (필수, 10~1000자)
   - Textarea, 5줄
   - 실시간 글자 수 검증
   - 10자 미만일 때 빨간색 테두리

**경고 배너** (노란색):
```
⚠️ 검수 거절 시 분쟁 접수로 전환됩니다. 
운영팀이 중재를 진행합니다.
```

**거절 버튼**: "검수 거절" (빨간색)

**확인 모달**:
```
검수 거절 확인

검수 거절 시 분쟁 접수로 전환됩니다. 계속하시겠습니까?

카테고리: 품질 미달
상세 사유: [입력한 내용]

[취소] [거절 및 분쟁 접수]
```

**거절 처리**:
- 10자 미만 검증 → Toast 에러
- 카테고리 미선택 → Toast 에러
- TODO: `contract.status = 'disputed'`
- TODO: Ops 팀 알림
- TODO: 분쟁 레코드 생성
- Toast: "검수 거절이 접수되었습니다. 분쟁 절차로 전환됩니다."
- `/contracts/:contractId/dispute`로 리다이렉트

---

### 2. 분쟁 랜딩 페이지 (/contracts/:contractId/dispute)

**페이지 경로**: `/contracts/:contractId/dispute`

#### 헤더
```
⚠️ (노란색 아이콘)
분쟁이 접수되었습니다
운영팀이 공정한 중재를 진행하겠습니다
```

---

#### 분쟁 티켓 정보 카드

- 티켓 번호: `DIS-2026-XXX` (파란색 강조)
- 접수일: YYYY-MM-DD
- 현재 상태: 중재 진행 중 (주황색)

---

#### 자금 보호 안심 메시지 (녹색 배경)

```
🛡️ 자금 보호 안내

에스크로에 예치된 자금은 중재 완료 시까지 안전하게 보호됩니다.
중재 결과에 따라 적절히 처리됩니다.
```

---

#### 중재 프로세스 타임라인 (4단계)

**Vertical Stepper**:

1. **분쟁 접수 완료** (완료 - 파란색)
   - 운영팀이 분쟁 내용을 검토하고 있습니다
   - 접수 시각 표시

2. **양측 의견 청취** (대기 - 회색)
   - 수요기업과 SI 파트너 양측의 입장을 확인합니다
   - 예상 소요: 2~3 영업일

3. **현장 실사** (대기 - 회색)
   - 필요한 경우 전문가가 현장을 방문하여 확인합니다
   - 예상 소요: 3~5 영업일

4. **중재 결과 통보** (대기 - 회색)
   - 공정한 판단에 따라 자금 처리 방향을 결정하고 통보드립니다
   - 전체 예상 소요: 7~14 영업일

---

#### 운영팀 연락처 카드

```
📞 1588-0000 (평일 09:00-18:00)
✉️ dispute@robotsi.com

※ 티켓 번호 (DIS-2026-XXX)를 알려주시면 
   빠른 상담이 가능합니다
```

---

### 3. 긴급 AS 티켓 작성 (/contracts/:contractId/as/new)

**페이지 경로**: `/contracts/:contractId/as/new`

**접근 제어**:
- Buyer 역할 + 계약 소유권 체크

---

#### 우선순위 선택 (필수)

**RadioGroup** (세로 배치):

**1. 일반 AS**
```
○ 일반 AS
  일반적인 고장이나 문의사항
```

**2. 긴급 AS**
```
○ 긴급 AS
  SI 부도·폐업·연락두절로 인한 긴급 상황
```

**긴급 AS 선택 시 경고**:
```
⚠️ 긴급 AS는 SI 파트너의 부도·폐업·연락두절이 확인된 경우에만 
접수 가능합니다. 4시간 내 엔지니어 배정, 24시간 내 현장 출동이 
보장됩니다.
```

---

#### 증상 설명 (필수, 20~2000자)

**Textarea** (8줄):
```
발생한 문제를 상세히 설명해주세요

예시:
- 언제부터 문제가 발생했나요?
- 어떤 증상이 나타나나요?
- 생산에 영향을 미치나요?
```

- 실시간 글자 수 카운터
- 20자 미만 → Zod 검증 에러

---

#### 현장 사진 (선택사항)

**파일 업로드**:
- 최대 5개
- 각 파일 최대 10MB
- Drag & Drop 영역 (점선 테두리)
- 업로드된 파일 목록 (파일명 + 크기 + X 버튼)

**검증**:
- 5개 초과 → Toast 에러
- 10MB 초과 → Toast 에러

---

#### 제출

**버튼**:
- "취소" (outline) → 계약 상세로
- "AS 요청 접수" (primary)

**처리**:
- TODO: Firebase Storage 사진 업로드
- TODO: Firestore `as_tickets` 컬렉션 생성
- TODO: SI 파트너 & AS 업체 알림
- Toast: "긴급 AS 요청이 접수되었습니다 (티켓번호: AS-2026-XXX)"
- `/contracts/:contractId/as/:ticketId`로 리다이렉트

---

### 4. AS 티켓 추적 (/contracts/:contractId/as/:ticketId)

**페이지 경로**: `/contracts/:contractId/as/:ticketId`

**30초 자동 폴링**:
- ✅ 30초마다 티켓 상태 자동 체크
- ✅ 상태 변경 시 Toast 알림
- ✅ `status='resolved'` 되면 폴링 중단

---

#### 헤더

- AS 진행 상황
- 티켓 번호: AS-2026-XXX
- 우선순위 배지 (긴급/일반)

---

#### SLA 준수 상태 (해결 완료 시만 표시)

**✓ SLA 목표 달성** (녹색 배경):
```
✓ SLA 목표 달성
24시간 내에 성공적으로 해결되었습니다
```

**✗ SLA 목표 미달성** (빨간색 배경):
```
✗ SLA 목표 미달성
24시간 목표를 초과했습니다
```

**판정 로직**:
```typescript
resolved_at - reported_at ≤ 24시간 → ✓
resolved_at - reported_at > 24시간 → ✗
```

---

#### 4단계 진행 Stepper

**Vertical Stepper with Icons**:

**1. 접수 완료** (✓)
- 타임스탬프: `reported_at`
- 티켓 번호 표시

**2. 엔지니어 배정** (👤)
- 타임스탬프: `assigned_at`
- 목표: 4시간 내
- 배정 완료 시:
  ```
  담당 엔지니어: 김기술
  연락처: 010-1234-5678
  ```
- 진행 중:
  - 경과 시간 / 목표 시간 표시
  - Progress Bar (파란색 → 초과 시 빨간색)
  - "2시간 경과 / 목표 4시간"

**3. 현장 출동** (📞)
- 타임스탬프: `dispatched_at`
- 목표: 24시간 내
- 진행 중: Progress Bar

**4. 해결 완료** (✓)
- 타임스탬프: `resolved_at`
- SLA 준수 여부 표시

---

#### 접수 내용 카드

- 증상 설명 (whitespace-pre-wrap)
- 첨부 사진 목록 (파일명)

---

#### 폴링 인디케이터

```
🕐 30초마다 자동으로 상태를 확인하고 있습니다...
```

---

#### Toast 알림

**상태 변경 시**:
- `reported` → `assigned`: "엔지니어가 배정되었습니다!"
- `assigned` → `dispatched`: "엔지니어가 현장으로 출동했습니다!"
- `dispatched` → `resolved`: "AS가 완료되었습니다!"

---

## Mock 데이터

### MOCK_AS_TICKETS

**ticket-001** (이미 해결됨):
```typescript
{
  id: 'ticket-001',
  contract_id: 'contract-002',
  symptom_description: '로봇 팔이 정해진 위치로 이동하지 않고...',
  priority: 'urgent',
  status: 'resolved',
  reported_at: 25시간 전,
  assigned_at: 24.5시간 전,
  dispatched_at: 23시간 전,
  resolved_at: 2시간 전,
  engineer_name: '김기술',
  engineer_contact: '010-1234-5678',
  ticket_number: 'AS-2026-001',
}
```

### 폴링 시뮬레이션

`simulateAsTicketProgress()`:
- 사이클 0-2: `reported`
- 사이클 3-5: `assigned` (엔지니어 배정)
- 사이클 6-8: `dispatched`
- 사이클 9+: `resolved`

30초 폴링 × 9회 = 약 4.5분 후 완전 해결

---

## 접근성 (WCAG 2.1 AA)

**검수 페이지**:
- 카운트다운: 색상 + 텍스트 정보 (색맹 대응)
- 모달: Focus Trap, Esc 닫기
- 에러: `role="alert"`, aria-describedby

**AS 티켓 페이지**:
- Stepper: 아이콘 + 텍스트 정보
- Progress Bar: 퍼센트 텍스트 병기
- Toast: 스크린 리더 읽기

---

## 반응형 디자인

**Desktop (≥1024px)**:
- 검수: 최대 너비 768px, 중앙 정렬
- AS: 최대 너비 1024px

**Mobile (≤767px)**:
- Stepper: Vertical 유지
- 버튼: 전체 너비
- 카드: 전체 너비

---

## 테스트 시나리오

### Scenario 1: 검수 합격

1. Buyer로 로그인
2. `/contracts/contract-004/inspection` 접속
3. 카운트다운 D-5 확인
4. 메모 입력 (선택)
5. "검수 합격" 클릭
6. 확인 모달 → "승인" 클릭
7. Toast 확인
8. 계약 목록으로 리다이렉트

### Scenario 2: 검수 거절 → 분쟁

1. `/contracts/contract-004/inspection` 접속
2. 거절 카테고리 선택: "품질 미달"
3. 상세 사유 5자 입력 → 빨간색 테두리 확인
4. 상세 사유 50자로 수정
5. "검수 거절" 클릭
6. 확인 모달 → "거절 및 분쟁 접수" 클릭
7. `/contracts/contract-004/dispute` 리다이렉트
8. 분쟁 티켓 정보 확인
9. 4단계 타임라인 확인
10. 운영팀 연락처 확인

### Scenario 3: 긴급 AS 접수

1. `/contracts/contract-002/as/new` 접속
2. "긴급 AS" 선택 → 경고 배너 확인
3. 증상 설명 10자 입력 → Zod 에러 확인
4. 증상 설명 100자로 수정
5. 사진 3개 업로드
6. "AS 요청 접수" 클릭
7. `/contracts/contract-002/as/:ticketId` 리다이렉트
8. 티켓 번호 확인

### Scenario 4: AS 진행 추적

1. AS 티켓 페이지 접속
2. Stepper Step 1 완료 확인
3. 30초 폴링 표시 확인
4. 90초 대기 → Step 2 전환 + Toast 알림
5. 엔지니어 정보 표시 확인
6. 4시간 경과 Progress Bar 확인
7. 계속 대기 → Step 3, 4 전환 확인
8. 해결 완료 시 SLA 준수 배지 확인

---

## Firestore 데이터 모델 (TODO)

### /as_tickets/{ticketId}
```typescript
{
  contract_id: string
  buyer_company_id: string
  si_partner_id: string
  symptom_description: string
  priority: 'normal' | 'urgent'
  photos?: string[] // Storage URLs
  status: 'reported' | 'assigned' | 'dispatched' | 'resolved'
  reported_at: Timestamp
  assigned_at?: Timestamp
  dispatched_at?: Timestamp
  resolved_at?: Timestamp
  engineer_name?: string
  engineer_contact?: string
  ticket_number: string
}
```

---

## TODO (실제 구현 시)

- [ ] Firestore `as_tickets` 컬렉션 CRUD
- [ ] Firebase Storage 사진 업로드
- [ ] 검수 승인/거절 Server Action
- [ ] 분쟁 레코드 생성
- [ ] 알림 전송 (Kakao/SMS/Email)
  - [ ] 엔지니어 배정 알림
  - [ ] 현장 출동 알림
  - [ ] 해결 완료 알림
- [ ] Firestore `onSnapshot` 실시간 리스너 (폴링 대체)
- [ ] SLA 모니터링 대시보드 (Admin용)
- [ ] 검수 기한 자동 분쟁 전환 (Cloud Function)

---

## 다음 단계 (PROMPT 6)

- RaaS 계산기 (CAPEX/리스/RaaS 비교)
- ROI 그래프 (Recharts)
- TCO 비교 차트
- PDF 결과 다운로드
- 견적 요청 모달
- 로봇 모델 자동완성 (Combobox)
