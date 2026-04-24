---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DB-010: O2O_BOOKING 테이블 스키마 및 마이그레이션 (status ENUM 4종, report_content JSONB) — Phase 2 대비"
labels: 'feature, backend, db, o2o, phase-2, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [DB-010] `O2O_BOOKING` (O2O 매니저 파견 예약) 테이블 스키마 및 마이그레이션 작성
- 목적: **F-06 현장 O2O 매니저 파견 예약 시스템의 저장소**. 비대면 계약을 꺼리는 수요기업(Pain P-03)이 로컬 매니저의 현장 방문·상담을 요청하는 시나리오를 지원한다. **본 기능은 Phase 2 범위**이지만, **스키마와 DTO는 Phase 1에서 사전 정의하여 향후 확장성을 확보**한다(07_TASK-LIST-v1.md 참고 사항). 4단계 status ENUM(`requested/confirmed/completed/cancelled`)으로 예약 생명주기를 관리하고, 매니저 방문 완료 후 `report_content` JSONB 필드에 상담 요약·추천 SI 3개사·예상 견적 범위를 구조화 저장하여, **O2O 파견 → 견적 요청 전환율 ≥ 40%(G-03, REQ-NF-026)** 의 핵심 퍼널 데이터로 활용한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.9 O2O_BOOKING`](../06_SRS-v1.md) — O2O 예약 테이블 스키마 정의 (10개 필드)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-023`](../06_SRS-v1.md) — 희망 지역·날짜 기반 가용 슬롯 조회 (≤ 2초)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-024`](../06_SRS-v1.md) — 예약 확정 시 SMS + 카카오톡 이중 알림 (≤ 30초)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-025`](../06_SRS-v1.md) — 방문 보고서 등록 (상담 요약·추천 SI 3개사·예상 견적 범위)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-026`](../06_SRS-v1.md) — 가용 슬롯 0건 시 대기 예약 옵션 + 자동 추천 (≤ 2초)
- SRS 문서: [`06_SRS-v1.md#REQ-NF-026`](../06_SRS-v1.md) — O2O 파견 후 견적 요청 전환율 ≥ 40% (G-03 KPI, Phase 2)
- SRS 문서: [`06_SRS-v1.md#6.3.6`](../06_SRS-v1.md) — O2O 매니저 파견 예약 상세 시퀀스 (Phase 2)
- SRS 문서: [`06_SRS-v1.md#6.2.13 Class Diagram (O2oBooking)`](../06_SRS-v1.md) — `create`, `confirm`, `submitReport`, `cancel` 도메인 메서드
- 태스크 리스트: [`07_TASK-LIST-v1.md#DB-010`](../TASKS/07_TASK-LIST-v1.md)
- Phase 구분 주의: Phase 2 범위 — Phase 1에서는 **스키마만 사전 정의** (연동 API/FC/UI는 모두 Phase 2)
- 연동 API: `API-023` (createO2oBooking), `API-024` (submitVisitReport) — 모두 Phase 2
- 연동 DB: `DB-002` (BUYER_COMPANY 상위)
- 선행 태스크: `DB-002` (BUYER_COMPANY)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 예약 상태 ENUM 정의
- [ ] `O2oBookingStatus` enum 정의 (4단계):
  ```prisma
  enum O2oBookingStatus {
    requested    // 예약 요청 (가용 슬롯 0건 시 "대기 예약" 상태도 포함)
    confirmed    // 예약 확정 (매니저 배정 + SMS/카카오톡 이중 알림 발송 완료)
    completed    // 방문 완료 (방문 보고서 등록 완료)
    cancelled    // 취소 (수요기업 또는 운영팀 취소)
  }
  ```
- [ ] 상태 전이 규칙 문서화 (`/docs/o2o-booking-state-machine.md`):
  ```
  (new)       → requested    (INSERT 시 초기 상태)
  requested   → confirmed    (매니저 배정, API-023)
  requested   → cancelled    (수요기업 또는 운영팀 취소)
  confirmed   → completed    (방문 보고서 등록, API-024)
  confirmed   → cancelled    (방문 전 취소)
  completed   → (terminal)
  cancelled   → (terminal)
  ```

### 2단계: `report_content` JSONB 스키마 정의
- [ ] 방문 보고서 구조 TypeScript 타입 (`/lib/types/o2o-booking.ts`):
  ```ts
  export type VisitReportContent = {
    consultationSummary: string              // 상담 요약 (필수)
    recommendedSiPartners: RecommendedSi[]   // 추천 SI 3개사 (필수, 정확히 3건 권장)
    estimatedBudgetRange: {                  // 예상 견적 범위 (필수)
      min: number                            // 원화 기준
      max: number
      currency: 'KRW'
    }
    visitDurationMinutes?: number            // 방문 소요 시간 (선택)
    buyerFeedback?: string                   // 고객 현장 피드백 (선택)
    photos?: string[]                        // 현장 사진 URL (선택, 추후 S3/Supabase Storage)
    submittedBy: string                      // 작성 매니저 ID
    submittedAt: string                      // ISO 8601 타임스탬프
  }

  export type RecommendedSi = {
    siPartnerId: string
    reason: string                           // 추천 사유
    matchScore?: number                      // 매칭 점수 (0~100)
  }
  ```
- [ ] Zod 런타임 검증 스키마 작성 (API-024에서 활용):
  ```ts
  export const visitReportContentSchema = z.object({
    consultationSummary: z.string().min(50).max(5000),  // 최소 50자 (의미 있는 요약 강제)
    recommendedSiPartners: z.array(z.object({
      siPartnerId: z.string(),
      reason: z.string().max(500),
      matchScore: z.number().min(0).max(100).optional(),
    })).min(1).max(5),  // 최소 1건, 권장 3건, 최대 5건
    estimatedBudgetRange: z.object({
      min: z.number().positive(),
      max: z.number().positive(),
      currency: z.literal('KRW'),
    }).refine(data => data.max >= data.min, { message: 'max must be >= min' }),
    visitDurationMinutes: z.number().int().positive().optional(),
    buyerFeedback: z.string().max(2000).optional(),
    photos: z.array(z.string().url()).max(10).optional(),
    submittedBy: z.string(),
    submittedAt: z.string().datetime(),
  })
  ```

### 3단계: Prisma 모델 정의 (`prisma/schema.prisma`)
- [ ] `O2oBooking` 모델 정의 (SRS 6.2.9 10개 필드 반영):
  ```prisma
  model O2oBooking {
    id                    String            @id @default(cuid())
    buyerCompanyId        String
    visitDate             DateTime          @db.Date
    region                String            @db.VarChar(100)
    assignedManagerId     String?                                 // 매니저 배정 전 NULL, 배정 후 String
    status                O2oBookingStatus  @default(requested)
    reportSubmittedAt     DateTime?
    reportContent         Json?                                    // VisitReportContent JSON
    createdAt             DateTime          @default(now())
    updatedAt             DateTime          @updatedAt

    // FK Relations
    buyerCompany          BuyerCompany      @relation(fields: [buyerCompanyId], references: [id], onDelete: Restrict)

    @@index([buyerCompanyId])
    @@index([status])
    @@index([visitDate])
    @@index([region, visitDate])                                    // FQ-011 핵심 쿼리: 지역·날짜 기반 가용 슬롯 조회
    @@index([assignedManagerId])                                    // 매니저별 예약 이력
    @@map("o2o_booking")
  }
  ```
- [ ] **`assignedManagerId` FK 미설정:** MVP에서는 매니저를 별도 엔티티로 모델링하지 않음 (Phase 2에서 `MANAGER` 테이블 도입 시 FK 연결). 현 스키마는 Nullable String으로 선제 정의
- [ ] **Cascade 정책:** BuyerCompany → `Restrict` (예약 이력 보존, 전자금융거래법 5년 보존 대상 아니지만 감사 추적)

### 4단계: 인덱스 전략 수립
- [ ] `[region, visitDate]` → **FQ-011 핵심 쿼리** 최적화: 지역·날짜 기반 가용 슬롯 조회 (REQ-FUNC-023, p95 ≤ 2초)
- [ ] `status` → 상태별 필터 (Admin 대시보드, '요청 대기' 목록)
- [ ] `buyerCompanyId` → 수요기업별 예약 이력
- [ ] `assignedManagerId` → 매니저별 예약 이력 (Phase 2)
- [ ] `visitDate` 단독 → 날짜 범위 집계 쿼리 대응 (KPI 리포트)

### 5단계: Migration 파일 생성 및 검증
- [ ] `pnpm prisma migrate dev --name add_o2o_booking` 실행
- [ ] 생성된 SQL 검토:
  - `CREATE TYPE "O2oBookingStatus" AS ENUM ('requested', 'confirmed', 'completed', 'cancelled');`
  - `CREATE TABLE "o2o_booking" (...)`:
    - `visit_date DATE NOT NULL` (시간 불필요)
    - `region VARCHAR(100) NOT NULL`
    - `assigned_manager_id UUID NULL` (매니저 테이블 미존재, Nullable String)
    - `report_content JSONB` (PostgreSQL) / TEXT (SQLite)
    - `report_submitted_at TIMESTAMP NULL`
  - FK `ON DELETE RESTRICT` (buyer_company)
  - 5개 인덱스 생성 확인
- [ ] `pnpm prisma generate` → `O2oBooking`, `O2oBookingStatus` 타입 export 검증

### 6단계: 상태 전이 유틸리티 작성 (`/lib/o2o-booking/state-machine.ts`)
- [ ] 허용 전이 테이블:
  ```ts
  import type { O2oBookingStatus } from '@prisma/client'

  export const ALLOWED_TRANSITIONS: Record<O2oBookingStatus, O2oBookingStatus[]> = {
    requested: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  }

  export function canTransition(from: O2oBookingStatus, to: O2oBookingStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to)
  }
  ```
- [ ] 단위 테스트

### 7단계: TypeScript 타입 유틸 작성 (`/lib/types/o2o-booking.ts`)
- [ ] Prisma 타입 re-export + VisitReportContent 타입 (이미 2단계에서 정의, 통합):
  ```ts
  import type { O2oBooking as PrismaO2oBooking, O2oBookingStatus } from '@prisma/client'
  export type O2oBooking = Omit<PrismaO2oBooking, 'reportContent'> & {
    reportContent: VisitReportContent | null
  }
  export type { O2oBookingStatus }

  // 수요기업용 공개 DTO (민감 필드 제거)
  export type O2oBookingBuyerView = Pick<
    O2oBooking,
    'id' | 'visitDate' | 'region' | 'status' | 'createdAt'
  >

  // 운영팀 관리용 DTO
  export type O2oBookingAdminView = O2oBooking & {
    buyerCompanyName: string
  }
  ```

### 8단계: 간이 Integration 검증 스크립트
- [ ] `scripts/verify-o2o-booking-schema.ts` (PR 머지 전 제거):
  - BuyerCompany 시드 후 O2oBooking INSERT (status=requested, assignedManagerId=null, reportContent=null) → 성공
  - 존재하지 않는 buyerCompanyId FK → `P2003` 확인
  - status 전이 시뮬레이션: requested → confirmed → completed
  - visitReportContentSchema Zod 검증: 유효 구조 → pass, `consultationSummary` 10자 → fail
  - FQ-011 쿼리 시뮬레이션: `WHERE region = '서울' AND visit_date BETWEEN ... AND status IN ('requested', 'confirmed')` → `[region, visitDate]` 인덱스 활용 확인

### 9단계: 문서 업데이트
- [ ] `/docs/erd.md`에 O2oBooking 엔티티 반영 (Phase 2 표시)
- [ ] `/docs/o2o-booking-state-machine.md` 상태 전이 규칙
- [ ] `/docs/phase2-readiness.md` (신규 또는 기존 문서 업데이트) — Phase 1에서 사전 정의된 Phase 2 스키마 목록 (DB-010 포함, 추가 후보: DB-016 ROBOT_MODEL 등)
- [ ] Phase 2 착수 시점 담당자가 참조할 수 있도록 스키마 설계 의도와 확장 포인트 명시

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상적인 O2O 예약 생성 (초기 상태 requested)**
- **Given:** BuyerCompany B1 레코드 존재
- **When:** `prisma.o2oBooking.create({ data: { buyerCompanyId: 'B1', visitDate: tomorrow, region: '서울' } })` (status/assignedManagerId 미지정)
- **Then:** status 기본값 `requested`, assignedManagerId/reportContent/reportSubmittedAt 모두 NULL, 생성 성공.

**Scenario 2: 가용 슬롯 0건 대기 예약 시나리오 (REQ-FUNC-026)**
- **Given:** 희망 지역·날짜에 확정된 예약이 이미 있음
- **When:** 수요기업이 대기 예약 옵션 선택 → status=requested, assignedManagerId=null INSERT
- **Then:** 레코드 생성 성공. Ops 팀이 매니저 수동 배정 후 status=confirmed로 전환.

**Scenario 3: 매니저 배정 및 확정 (requested → confirmed)**
- **Given:** O2oBooking (status=requested)
- **When:** `prisma.o2oBooking.update({ where: { id }, data: { status: 'confirmed', assignedManagerId: 'mgr-01' } })` 호출 (SMS+카카오톡 이중 알림 발송과 함께)
- **Then:** 상태 전이 성공, assignedManagerId 기록.

**Scenario 4: 방문 보고서 등록 (confirmed → completed)**
- **Given:** O2oBooking (status=confirmed, 방문 완료)
- **When:** `prisma.o2oBooking.update({ where: { id }, data: { status: 'completed', reportSubmittedAt: now, reportContent: { consultationSummary: "...", recommendedSiPartners: [...], estimatedBudgetRange: {...}, submittedBy: "mgr-01", submittedAt: "..." } } })` 호출
- **Then:** 보고서 JSON 저장, 상태 전이 성공.

**Scenario 5: 방문 보고서 Zod 검증 실패 케이스**
- **Given:** `reportContent.consultationSummary = "너무짧음"` (10자 미만)
- **When:** `visitReportContentSchema.parse(content)` 실행
- **Then:** Zod 에러 발생 (최소 50자 필수).

**Scenario 6: 추천 SI 3개사 구조 검증**
- **Given:** `recommendedSiPartners = []` (빈 배열)
- **When:** Zod 검증
- **Then:** 최소 1건 제약 위반으로 실패. REQ-FUNC-025 "추천 SI 3개사" 권장 준수를 위해 API-024에서 정확히 3건 가이드.

**Scenario 7: FQ-011 가용 슬롯 조회 성능 (REQ-FUNC-023, p95 ≤ 2초)**
- **Given:** O2oBooking 500건 시드 (지역/날짜 분산)
- **When:** `prisma.o2oBooking.findMany({ where: { region: '서울', visitDate: { gte: start, lte: end }, status: { in: ['requested', 'confirmed'] } } })` 실행
- **Then:** `[region, visitDate]` 복합 인덱스 활용으로 p95 ≤ 500ms (요구사항 2초의 25% 수준).

**Scenario 8: JSONB 필드 저장 및 조회 (PostgreSQL)**
- **Given:** Supabase PostgreSQL 환경
- **When:** `reportContent: { ... 복잡한 구조 ... }` 저장 후 조회
- **Then:** Prisma `Json` 타입 반환 → Zod 파싱으로 `VisitReportContent` 타입 안전 변환.

**Scenario 9: BuyerCompany 삭제 Restrict 차단**
- **Given:** BuyerCompany B1에 O2oBooking 1건 이상 존재
- **When:** BuyerCompany 삭제 시도
- **Then:** `P2003` Restrict 에러, 삭제 차단 (감사 추적 데이터 보존).

**Scenario 10: 인덱스 생성 검증**
- **Given:** 마이그레이션 완료된 PostgreSQL DB
- **When:** `\d o2o_booking` 실행
- **Then:** PK(id), INDEX(buyer_company_id), INDEX(status), INDEX(visit_date), COMPOSITE(region, visit_date), INDEX(assigned_manager_id) 6개 이상 존재.

## :gear: Technical & Non-Functional Constraints

### 스키마 설계
- **필드 수 준수:** SRS 6.2.9에 명시된 10개 필드 정확히 반영
- **Phase 2 대비 사전 정의:** Phase 1에서는 스키마와 DTO만, API/FC/UI는 Phase 2
- **NULLABLE 정책:**
  - `assignedManagerId`, `reportSubmittedAt`, `reportContent`: 단계별 진입 전 NULL
  - `visitDate`, `region`, `buyerCompanyId`: NOT NULL (예약 시 필수 입력)
- **타입 매핑:**
  - `DATE` (visitDate) → `@db.Date`
  - `JSONB` (reportContent) → Prisma `Json`
  - `VARCHAR(100)` (region) → `@db.VarChar(100)`

### 성능
- **FQ-011 가용 슬롯 조회:** p95 ≤ 2초 (REQ-FUNC-023) — 복합 인덱스로 여유 있는 달성
- **Phase 2 실제 운영 시:** 월 파견 건수 100건 이내 예상 (MVP+12개월) — 현 인덱스로 3년 이상 충분
- **JSONB 조회 성능:** 보고서 전체 조회는 단일 PK 조회이므로 성능 이슈 없음

### 안정성
- 상태 전이 무결성은 `/lib/o2o-booking/state-machine.ts`의 `assertTransition`로 강제
- 보고서 구조는 **반드시 `visitReportContentSchema` Zod 파싱** 후 저장 (API-024 필수)
- SMS+카카오톡 이중 알림 발송 실패율 < 1% (REQ-FUNC-024) — Phase 2 FC-025에서 재시도 로직 구현

### 보안
- `reportContent.buyerFeedback`에 고객 민감 피드백 포함 가능 → **Buyer/Admin/배정 매니저만 접근**
- `photos` URL은 Supabase Storage 서명 URL 사용 예정 (Phase 2) — 공개 URL 금지
- 매니저 개인정보(이름, 연락처)는 별도 테이블로 분리 예정 (Phase 2 `MANAGER` 테이블)

### 비즈니스 정확성 (REQ-NF-026)
- **G-03 KPI:** O2O 파견 후 견적 요청 전환율 ≥ 40% — `O2oBooking.completed` 건 중 `QUOTE_LEAD` 연결 건수 / 전체 completed 건수
- Phase 2 구현 시 BuyerCompany와 QuoteLead를 조인한 퍼널 분석 쿼리 별도 설계 필요
- 본 테이블은 "O2O 파견 완료" 시점까지만 관장, 이후 전환 추적은 `QUOTE_LEAD`(DB-012)와 연계

### 유지보수성
- **Phase 2 확장 포인트:**
  - `MANAGER` 테이블 신설 → `assignedManagerId` Nullable String을 FK로 전환 마이그레이션
  - 매니저 스케줄/슬롯 별도 테이블 (가용 슬롯 조회 성능 최적화)
  - 고객 만족도 설문 (`satisfactionScore` 필드 추가)
  - `reportContent` JSON 스키마 버전 관리 (`schemaVersion` 필드)

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~10)를 충족하는가?
- [ ] `prisma/schema.prisma`에 `O2oBookingStatus` enum + `O2oBooking` 모델이 SRS 6.2.9 명세대로 정의되었는가?
- [ ] 4단계 status ENUM이 정확히 정의되고 `requested` 기본값이 적용되었는가?
- [ ] `assignedManagerId`, `reportSubmittedAt`, `reportContent`가 NULLABLE로 정의되었는가?
- [ ] FK `onDelete: Restrict` 정책이 적용되었는가?
- [ ] 5개 이상의 인덱스(특히 `[region, visitDate]` 복합 인덱스)가 생성되었는가?
- [ ] `@prisma/client`가 재생성되어 `O2oBooking`, `O2oBookingStatus` 타입이 정상 export되는가?
- [ ] 로컬 SQLite와 Supabase PostgreSQL 양쪽에서 마이그레이션이 성공하는가?
- [ ] `/lib/o2o-booking/state-machine.ts` 상태 전이 유틸리티 및 단위 테스트 통과?
- [ ] `/lib/types/o2o-booking.ts` `VisitReportContent` TypeScript 타입 및 Zod 스키마(`visitReportContentSchema`) 정의?
- [ ] `/docs/o2o-booking-state-machine.md` 및 `/docs/phase2-readiness.md` 문서 작성?
- [ ] Phase 2 확장 포인트(MANAGER 테이블 전환, 슬롯 분리 등)가 명시적으로 문서화되었는가?
- [ ] ESLint / TypeScript 컴파일 경고 0건?
- [ ] PR 머지 전 임시 검증 스크립트 제거?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-002 | `BUYER_COMPANY` 테이블 — `buyer_company_id` FK 참조 대상 | 필수 |

### Blocks (후행 태스크 — 모두 Phase 2)
| Task ID | 설명 | Phase |
|:---|:---|:---:|
| MOCK-007 | Prisma Seed — O2O 예약 5건, 매니저 슬롯 데이터 | Phase 2 |
| API-023 | `createO2oBooking` Server Action DTO + 가용 슬롯 조회 | Phase 2 |
| API-024 | `submitVisitReport` Server Action DTO | Phase 2 |
| FC-025 | O2O 매니저 예약 생성 Command (SMS+카카오톡 이중 알림) | Phase 2 |
| FC-026 | 가용 슬롯 0건 대기 예약 + 자동 추천 | Phase 2 |
| FC-027 | 방문 보고서 등록 Command | Phase 2 |
| FQ-011 | 가용 매니저 슬롯 조회 Server Component | Phase 2 |
| UI-012 | O2O 매니저 파견 예약 캘린더 UI | Phase 2 |

### 참고사항
- **Phase 1 vs Phase 2 범위:** 본 태스크는 **스키마만 Phase 1에서 사전 정의**. 실제 기능(API, FC, UI)은 모두 Phase 2. Phase 1 완료 시점에 DB-010 스키마가 배포된 상태로 유지되며, Phase 2 착수 시 별도 스키마 작업 없이 바로 로직 구현 가능
- **MANAGER 엔티티 부재 결정:**
  - Phase 1에서는 매니저 상세 정보(이름/연락처/역량/가용 일정)를 별도 엔티티로 관리하지 않음
  - `assignedManagerId`는 Nullable String으로 선제 정의 — Phase 2에서 `MANAGER` 테이블 신설 후 FK로 전환 마이그레이션
  - 이 결정은 **Phase 1 범위 축소 + Phase 2 확장성 확보**의 균형점
- **report_content 구조 고도화 여지:**
  - MVP 구조는 상담 요약·추천 SI 3개사·예상 견적 중심
  - Phase 2에서 사진 업로드(Supabase Storage), 음성 녹취 요약(LLM), 전자서명 등 확장 가능
  - `schemaVersion` 필드 추가로 버전 관리 권장 (Phase 2)
- **`[region, visitDate]` 복합 인덱스 중요성:** FQ-011의 핵심 쿼리 패턴. 추가로 `status` 필터가 자주 붙을 경우 `[region, visitDate, status]` 3열 인덱스 검토 (Phase 2 성능 테스트 후 결정)
- **전환율 KPI 계산 구조:** G-03 전환율은 본 테이블만으로 계산 불가 — `BuyerCompany → O2oBooking (completed) → QuoteLead` 퍼널을 조인한 분석 쿼리가 필요 (Phase 2 BI 리포트 영역)
- **대기 예약 vs 확정 예약 구분:** 두 케이스 모두 `status=requested`로 저장하되, `assignedManagerId=NULL` 여부로 구분 (FQ-011 쿼리에서 필터 활용)
