---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-024: O2O 도메인 — 방문 보고서 등록 (submitVisitReport) Server Action DTO, 보고서 필수 항목 정의"
labels: 'feature, backend, api-contract, o2o, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [API-024] 방문 보고서 등록 (`submitVisitReport`) Server Action DTO 및 보고서 필수 항목 정의
- 목적: O2O 파견 매니저가 현장 방문 후 **상담 요약·추천 SI·견적 범위**를 포함한 보고서를 등록하는 Server Action의 DTO, 보고서 필수 항목 구조, 에러 코드를 정의한다. Phase 2 대비 설계이다.

## :link: References (Spec & Context)
- SRS: [`06_SRS-v1.md#REQ-FUNC-025`](../../docs/06_SRS-v1.md) — 방문 보고서 등록
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #24`](../../docs/06_SRS-v1.md)
- 데이터 모델: [`06_SRS-v1.md#6.2.9 O2O_BOOKING`](../../docs/06_SRS-v1.md) — report_content JSONB
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-024`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Request DTO
  ```typescript
  export interface SubmitVisitReportRequest {
    bookingId: string;
    reportContent: VisitReportContent;
  }

  export interface VisitReportContent {
    consultationSummary: string;    // 상담 요약 (10~3000자)
    recommendedSiPartners: {        // 추천 SI 파트너 (최소 1, 최대 5)
      siPartnerId: string;
      reason: string;
    }[];
    estimatedBudgetRange: {         // 견적 범위
      min: number;
      max: number;
      currency: 'KRW';
    };
    siteConditions?: string;        // 현장 상태 메모 (선택)
    followUpRequired: boolean;      // 후속 방문 필요 여부
  }
  ```

### 2단계: Zod 스키마
  ```typescript
  export const submitVisitReportSchema = z.object({
    bookingId: z.string().min(1),
    reportContent: z.object({
      consultationSummary: z.string().min(10).max(3000),
      recommendedSiPartners: z.array(z.object({
        siPartnerId: z.string().min(1),
        reason: z.string().min(1).max(500),
      })).min(1, '최소 1개 SI 추천').max(5),
      estimatedBudgetRange: z.object({
        min: z.number().min(0),
        max: z.number().min(0),
        currency: z.literal('KRW'),
      }).refine(d => d.max >= d.min, '최대 금액은 최소 금액 이상이어야 합니다'),
      siteConditions: z.string().max(2000).optional(),
      followUpRequired: z.boolean(),
    }),
  });
  ```

### 3단계: Response DTO
  ```typescript
  export interface SubmitVisitReportSuccessResponse {
    success: true;
    data: {
      bookingId: string;
      status: 'completed';
      reportSubmittedAt: string;
      message: string;
    };
  }
  ```

### 4단계: 에러 코드
  ```typescript
  export enum SubmitVisitReportErrorCode {
    VALIDATION_ERROR     = 'O2O_024_VALIDATION',
    BOOKING_NOT_FOUND    = 'O2O_024_NOT_FOUND',
    BOOKING_NOT_CONFIRMED= 'O2O_024_NOT_CONFIRMED',
    REPORT_ALREADY_EXISTS= 'O2O_024_ALREADY_EXISTS',
    NOT_ASSIGNED_MANAGER = 'O2O_024_NOT_MANAGER',
    UNAUTHORIZED         = 'O2O_024_UNAUTHORIZED',
    INTERNAL_ERROR       = 'O2O_024_INTERNAL',
  }
  ```

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 보고서 정상 등록**
- **Given:** confirmed 상태의 O2O 예약, 배정 매니저 로그인
- **When:** 상담요약·추천SI·견적범위 포함하여 `submitVisitReport` 호출
- **Then:** O2O_BOOKING UPDATE (report_content, report_submitted_at, status=completed)

**Scenario 2: 이미 보고서 등록된 예약**
- **Given:** report_submitted_at IS NOT NULL
- **When:** 재등록 시도
- **Then:** `O2O_024_ALREADY_EXISTS` 에러 409

**Scenario 3: 추천 SI 0건**
- **Given:** `recommendedSiPartners` 빈 배열
- **When:** 유효성 검증
- **Then:** `"최소 1개 SI 추천"` 에러

## :gear: Technical & Non-Functional Constraints
- **구현:** Next.js Server Action — CON-12
- **권한:** 배정 매니저(assigned_manager_id) 또는 Admin만 등록 가능
- **성능:** p95 ≤ 500ms
- **데이터:** report_content는 JSONB 컬럼에 저장

## :checkered_flag: Definition of Done (DoD)
- [ ] Request/Response DTO 및 `VisitReportContent` 구조 정의
- [ ] 에러 코드 정의, ESLint 경고 0건

## :construction: Dependencies & Blockers
### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-010 | `O2O_BOOKING` 테이블 (report_content JSONB) | 필수 |
| API-023 | `createO2oBooking` DTO (예약 상태 전이) | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| FC-024 | 방문 보고서 Command 로직 |
