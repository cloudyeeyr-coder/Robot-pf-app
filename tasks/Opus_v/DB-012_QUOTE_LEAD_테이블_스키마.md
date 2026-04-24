---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DB-012: QUOTE_LEAD 테이블 스키마 및 마이그레이션 (status ENUM 4종, response_data JSONB)"
labels: 'feature, backend, db, raas, quote, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [DB-012] `QUOTE_LEAD` (수기 견적 요청) 테이블 스키마 및 마이그레이션 작성
- 목적: **F-05 RaaS 계산기 → 수기 견적 요청 전환 퍼널의 리드(Lead) 저장소**. 사용자가 RaaS 구독 계산 결과를 보고 "운영팀에 맞춤 견적 요청하기"를 제출하면 본 테이블에 Lead가 INSERT되고, Admin이 Slack+이메일 알림을 받아 **2영업일 내 오프라인 협의 후 견적 응답**을 등록한다(REQ-FUNC-020). **G-04 KPI(RaaS 계산기 사용 후 계약 전환율 ≥ 25%, REQ-NF-027)** 의 입구 지표이자, `buyer_company_id`가 **NULLABLE**이라는 점이 특징 — 비로그인 사용자도 폼 제출 가능해야 리드 수집 효율이 극대화된다. 4단계 status ENUM(`pending/in_progress/responded/closed`)으로 Admin 처리 상태를 추적한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.11 QUOTE_LEAD`](../06_SRS-v1.md) — 견적 요청 테이블 스키마 정의 (13개 필드)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-020`](../06_SRS-v1.md) — "운영팀에 맞춤 견적 요청하기" 폼 제출 → QUOTE_LEAD 저장 + Admin Slack/이메일 알림
- SRS 문서: [`06_SRS-v1.md#3.4.6`](../06_SRS-v1.md) — RaaS 구독 흐름 시퀀스 (Admin 금융 파트너 협의 후 응답 등록)
- SRS 문서: [`06_SRS-v1.md#REQ-NF-027`](../06_SRS-v1.md) — RaaS 계산기 사용 후 계약 전환율 ≥ 25% (G-04 KPI)
- SRS 문서: [`06_SRS-v1.md#6.2.13 Class Diagram (QuoteLead)`](../06_SRS-v1.md) — `submit`, `respond`, `close` 도메인 메서드
- 태스크 리스트: [`07_TASK-LIST-v1.md#DB-012`](../TASKS/07_TASK-LIST-v1.md)
- 연동 API: `API-022` (requestManualQuote Server Action)
- 연동 로직: `FC-022` (수기 견적 요청 Command), `FC-029` (Admin 견적 응답 등록)
- 연동 DB: `DB-002` (BUYER_COMPANY, nullable 상위)
- 선행 태스크: `DB-002` (BUYER_COMPANY)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 상태 ENUM 정의
- [ ] `QuoteLeadStatus` enum 정의 (4단계):
  ```prisma
  enum QuoteLeadStatus {
    pending        // 초기 제출 (Admin 대응 대기)
    in_progress    // Admin이 금융 파트너 협의 중
    responded      // 견적 응답 등록 완료, 사용자에게 이메일 발송
    closed         // 종결 (사용자 수용/거절/연락 두절 모두 포함)
  }
  ```
- [ ] 상태 전이 규칙 (`/docs/quote-lead-state-machine.md`):
  ```
  (new)        → pending     (폼 제출 시 초기 상태)
  pending      → in_progress (Admin이 처리 시작 시 수동 전환)
  in_progress  → responded   (Admin이 견적 응답 등록, FC-029)
  responded    → closed      (사용자 수용/거절 또는 장기 미응답 후 종결)
  pending      → closed      (스팸/중복 리드 Admin 판단 시 즉시 종결)
  ```

### 2단계: `response_data` JSONB 스키마 정의 (`/lib/types/quote-lead.ts`)
- [ ] Admin 응답 구조 타입 + Zod:
  ```ts
  export type QuoteResponseData = {
    monthlyFee: number               // 월 구독료 (원)
    upfrontFee?: number              // 초기 설치비
    contractTermMonths: number       // 계약 기간
    inclusions: string[]             // 포함 서비스 (예: "24h AS", "소프트웨어 업데이트")
    exclusions?: string[]            // 제외 항목
    financingPartner?: string        // 금융 파트너명 (예: "OO캐피탈")
    validUntil: string               // 견적 유효기간 ISO 8601
    notes?: string                   // Admin 추가 메모
    respondedBy: string              // Admin User ID
  }

  export const quoteResponseDataSchema = z.object({
    monthlyFee: z.number().positive(),
    upfrontFee: z.number().nonnegative().optional(),
    contractTermMonths: z.number().int().positive(),
    inclusions: z.array(z.string().min(1)).min(1),
    exclusions: z.array(z.string()).optional(),
    financingPartner: z.string().optional(),
    validUntil: z.string().datetime(),
    notes: z.string().max(2000).optional(),
    respondedBy: z.string(),
  })
  ```

### 3단계: Prisma 모델 정의 (`prisma/schema.prisma`)
- [ ] `QuoteLead` 모델 정의 (SRS 6.2.11 13개 필드 반영):
  ```prisma
  model QuoteLead {
    id                  String           @id @default(cuid())
    buyerCompanyId      String?                                   // NULLABLE — 비로그인 사용자 리드 허용
    robotModel          String           @db.VarChar(255)
    quantity            Int                                       // > 0 application 검증
    termMonths          Int                                       // > 0 application 검증
    contactName         String           @db.VarChar(100)
    contactEmail        String           @db.VarChar(255)
    contactPhone        String           @db.VarChar(20)
    status              QuoteLeadStatus  @default(pending)
    responseData        Json?
    adminRespondedAt    DateTime?
    createdAt           DateTime         @default(now())
    updatedAt           DateTime         @updatedAt

    // FK Relations (nullable)
    buyerCompany        BuyerCompany?    @relation(fields: [buyerCompanyId], references: [id], onDelete: SetNull)

    @@index([status])
    @@index([buyerCompanyId])
    @@index([createdAt(sort: Desc)])
    @@index([contactEmail])                                       // 동일 이메일 반복 리드 감지
    @@map("quote_lead")
  }
  ```
- [ ] **핵심 결정: `buyerCompanyId` NULLABLE** — SRS 6.2.11 명시. 비로그인 리드 수집 가능
- [ ] **Cascade 정책:** `onDelete: SetNull` — Buyer 삭제 시 리드 이력은 보존하되 FK만 NULL 처리 (마케팅 분석용)

### 4단계: 인덱스 전략
- [ ] `status` — Admin 대시보드 상태별 필터 (FQ-008 "상태별 견적 요청 목록")
- [ ] `buyerCompanyId` — 로그인 사용자의 견적 이력 조회
- [ ] `createdAt(sort: Desc)` — 최신순 정렬
- [ ] `contactEmail` — 중복/반복 리드 탐지 (동일 이메일 다건 요청 추적)

### 5단계: Migration 및 타입 유틸
- [ ] `pnpm prisma migrate dev --name add_quote_lead` 실행 후 SQL 검토:
  - `buyer_company_id UUID NULL` (NULLABLE 확인)
  - `response_data JSONB NULL`
  - `admin_responded_at TIMESTAMP NULL`
  - 4개 인덱스 생성 확인
- [ ] 상태 전이 유틸리티 `/lib/quote-lead/state-machine.ts` 작성 (허용 전이 lookup + assertTransition)
- [ ] 스팸 방지 유틸리티 초안 (`/lib/quote-lead/spam-detector.ts`): 동일 이메일 24시간 내 3건 초과 시 자동 `closed` 권장 로직 (FC-022에서 활용)

### 6단계: TypeScript 타입 유틸 통합
- [ ] Prisma 타입 re-export + JSON 필드 타입 매핑:
  ```ts
  import type { QuoteLead as PrismaQuoteLead, QuoteLeadStatus } from '@prisma/client'
  export type QuoteLead = Omit<PrismaQuoteLead, 'responseData'> & {
    responseData: QuoteResponseData | null
  }
  export type { QuoteLeadStatus }
  ```

### 7단계: 간이 Integration 검증
- [ ] `scripts/verify-quote-lead-schema.ts` (PR 머지 전 제거):
  - 로그인 사용자 리드 INSERT (`buyerCompanyId='B1'`) → 성공
  - **비로그인 리드 INSERT (`buyerCompanyId=null`)** → 성공 (NULLABLE 핵심 검증)
  - `quantity=0`, `termMonths=-1` INSERT → 스키마 허용, **FC-022 Zod 차단 주석 명시**
  - 상태 전이: pending → in_progress → responded (responseData JSON 저장 포함)
  - Buyer 삭제 시 `buyerCompanyId=null`로 SetNull 동작 확인

### 8단계: 문서 업데이트
- [ ] `/docs/erd.md` 반영, `/docs/quote-lead-state-machine.md` 전이 규칙
- [ ] `/docs/quote-lead-kpi.md` — G-04 KPI 집계 쿼리 패턴 (QuoteLead 제출 건 중 Contract 전환 수 / 전체 건)

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 로그인 사용자 견적 요청 제출 (pending)**
- **Given:** BuyerCompany B1 레코드 존재
- **When:** `prisma.quoteLead.create({ data: { buyerCompanyId: 'B1', robotModel: 'UR10e', quantity: 2, termMonths: 36, contactName: '홍길동', contactEmail: 'hong@test.com', contactPhone: '010-1234-5678' } })`
- **Then:** 레코드 생성, status 기본값 `pending`, responseData/adminRespondedAt NULL.

**Scenario 2: 비로그인 사용자 리드 제출 (buyerCompanyId NULL)**
- **Given:** 비로그인 상태
- **When:** `buyerCompanyId: null`로 INSERT
- **Then:** **성공** — NULLABLE 필드 덕분에 비로그인 리드 수집 가능. REQ-FUNC-020 UX 구현의 핵심 전제.

**Scenario 3: Admin 견적 응답 등록 (in_progress → responded)**
- **Given:** QuoteLead (status=in_progress)
- **When:** `prisma.quoteLead.update({ where: { id }, data: { status: 'responded', responseData: {...}, adminRespondedAt: new Date() } })`
- **Then:** responseData JSON 저장, adminRespondedAt 기록, FC-029에서 사용자 이메일 알림 트리거.

**Scenario 4: QuoteResponseData Zod 검증**
- **Given:** `monthlyFee: -100` (음수)
- **When:** `quoteResponseDataSchema.parse(data)`
- **Then:** Zod 에러 (positive 제약).

**Scenario 5: 상태 ENUM 제약**
- **Given:** `QuoteLeadStatus` 4개 값만 허용
- **When:** `status: 'draft'` INSERT
- **Then:** TypeScript 또는 Prisma Validation Error.

**Scenario 6: Buyer 삭제 시 SetNull 동작**
- **Given:** QuoteLead의 buyerCompanyId='B1'
- **When:** Buyer B1 삭제 (실제로는 CONTRACT Restrict로 차단되지만 우회 삭제 가정)
- **Then:** buyerCompanyId=NULL로 자동 설정, 리드 데이터 보존.

**Scenario 7: 동일 이메일 반복 리드 탐지 (스팸 방지)**
- **Given:** `contact_email='spam@test.com'`으로 24시간 내 5건 INSERT 시뮬레이션
- **When:** 조회 `WHERE contact_email='spam@test.com' AND created_at > NOW()-1d`
- **Then:** `contactEmail` 인덱스 활용, p95 ≤ 100ms. FC-022에서 3건 초과 시 자동 closed 처리 가능.

**Scenario 8: G-04 KPI 집계 쿼리**
- **Given:** QuoteLead 100건 + Contract 30건 중 일부 연계
- **When:** `SELECT status, COUNT(*) FROM quote_lead WHERE created_at BETWEEN ... GROUP BY status`
- **Then:** `status` 인덱스 활용 p95 ≤ 200ms.

**Scenario 9: JSON 필드 저장/조회**
- **Given:** `responseData: { monthlyFee: 500000, ... }`
- **When:** INSERT 후 SELECT
- **Then:** Prisma Json 반환 → Zod 파싱으로 QuoteResponseData 타입 안전 변환.

**Scenario 10: 인덱스 검증**
- **Given:** 마이그레이션 완료
- **When:** `\d quote_lead`
- **Then:** PK, INDEX(status), INDEX(buyer_company_id), INDEX(created_at DESC), INDEX(contact_email) 5개 이상.

## :gear: Technical & Non-Functional Constraints

### 스키마 설계
- **필드 수 준수:** SRS 6.2.11 13개 필드 정확히 반영
- **`buyerCompanyId` NULLABLE 핵심:** 비로그인 리드 수집 — 전환 퍼널 최대화의 설계 결정
- **Cascade `SetNull`:** Buyer 삭제 시 리드 이력 보존 (마케팅 분석 가치)
- **`quantity > 0`, `termMonths > 0`:** application-level 검증 (Zod, API-022/FC-022)

### 성능
- Admin 대시보드 상태별 필터 p95 ≤ 300ms (FQ-008)
- 스팸 탐지 쿼리 p95 ≤ 100ms (contactEmail 인덱스)
- KPI 집계 p95 ≤ 200ms
- 예상 규모: MVP+6개월 월 100건 리드 → 3년 3,600건 — 현 인덱스 충분

### 안정성
- JSON 필드는 Zod 파싱 필수
- 상태 전이는 state-machine 유틸로 강제
- Admin 응답 시 **`adminRespondedAt + responseData + status` 동시 업데이트 트랜잭션** (FC-029)

### 보안 (PII 보호)
- `contactName`, `contactEmail`, `contactPhone`은 개인정보 — 로그 출력 시 마스킹, Admin 외부 노출 금지
- 비로그인 리드의 연락처는 **GDPR/개인정보보호법 수집·이용 동의** 폼에 포함 (UI-011 폼 설계)
- 개인정보 보존기간: 리드 종결 후 1년 (REQ-NF-012 "탈퇴 후 30일"은 회원 기준, 리드는 별도 정책)

### 비즈니스 정확성
- **리드 중복 방지:** 스키마 레벨 UNIQUE 미도입 (동일인이 다른 로봇 모델 문의 가능) — 스팸 방지는 `[contactEmail, createdAt]` 패턴 검사
- **G-04 전환율 계산:** QuoteLead → Contract 전환 추적을 위한 `contract_id` 필드 추가 검토 (Phase 2)

### 유지보수성
- `responseData` JSON 구조 변경 시 마이그레이션 불필요 (Zod 스키마 버전 관리)
- 금융 파트너 정규화(`FINANCING_PARTNER` 테이블) Phase 2 검토

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria 충족?
- [ ] 13개 필드가 SRS 6.2.11 명세대로 정의되었는가?
- [ ] `buyerCompanyId` NULLABLE로 정의되어 비로그인 리드가 허용되는가?
- [ ] FK `onDelete: SetNull`이 적용되었는가?
- [ ] 4개 이상의 인덱스가 생성되었는가?
- [ ] `@prisma/client` 재생성 및 `QuoteLead`, `QuoteLeadStatus` 타입 export?
- [ ] 양쪽 환경에서 마이그레이션 성공?
- [ ] `/lib/types/quote-lead.ts` QuoteResponseData 타입 및 Zod 스키마?
- [ ] `/lib/quote-lead/state-machine.ts` 상태 전이 유틸 + 테스트?
- [ ] `/lib/quote-lead/spam-detector.ts` 스팸 방지 유틸 초안?
- [ ] `/docs/quote-lead-state-machine.md`, `/docs/quote-lead-kpi.md`?
- [ ] ESLint / TypeScript 경고 0건, 임시 스크립트 제거?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-002 | `BUYER_COMPANY` — `buyer_company_id` FK 참조 (nullable) | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| MOCK-006 | Prisma Seed — 견적 리드 5건 |
| API-022 | `requestManualQuote` Server Action DTO |
| FC-022 | 수기 견적 요청 Command (Admin Slack/이메일 알림) |
| FC-029 | Admin 견적 응답 등록 Command (사용자 이메일) |
| FQ-008 | Admin 대시보드 — 견적 요청 목록 조회 |
| UI-011 | 수기 견적 요청 팝업 |

### 참고사항
- **비로그인 리드 설계 의도:** REQ-FUNC-020 "특정 RaaS 플랜 선택 시 팝업" — 가입 강제하지 않고 폼 제출 허용이 전환율 극대화에 유리. 단, **GDPR/개인정보 동의 체크박스**는 UI-011 필수
- **G-04 전환율 추적:** 현 스키마는 QuoteLead → Contract 자동 연결 FK 없음. Phase 2에서 `converted_contract_id` 필드 추가 검토 — MVP는 BI 리포트에서 수동 매칭
- **스팸 탐지:** `contactEmail` 인덱스는 초기 방어선. Phase 2에서 reCAPTCHA 연동 검토
- **리드 SLA:** SRS "2영업일 내 연락" — Admin 운영 SOP로 관리, 현재 스키마에는 SLA 자동 측정 필드 없음. 필요 시 `slaBreachedAt` 추가 가능
