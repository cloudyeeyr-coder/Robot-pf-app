---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-008: Inspection 도메인 — 검수 승인/거절 (submitInspection) Server Action DTO, 상태 전이 규칙, 분쟁 자동 전환 규칙 정의"
labels: 'feature, backend, api-contract, escrow, inspection, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-008] 검수 승인/거절 (`submitInspection`) Server Action DTO, 상태 전이 규칙, 분쟁 자동 전환 규칙 정의
- 목적: 수요기업이 SI 파트너의 시공 완료 후 **검수 합격(approve)** 또는 **검수 거절(reject)** 판정을 수행하는 Server Action의 **Request/Response DTO**, **상태 전이 규칙**, **분쟁 자동 전환 규칙**, **에러 코드**를 정의한다. 이 액션은 에스크로 생애주기의 분기점(Branch Point)으로, 승인 시 `release_pending`으로 전환되어 Admin 방출 대기 상태에 진입하고, 거절 시 `disputed`로 전환되어 중재 프로세스가 자동 개시된다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-002`](../../docs/06_SRS-v1.md) — 검수 합격 승인 시 Admin 대시보드 방출 대기 알림
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-003`](../../docs/06_SRS-v1.md) — 분쟁 발생 시 중재 프로세스 자동 개시
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-005`](../../docs/06_SRS-v1.md) — 검수 기한(7영업일) 미응답 시 자동 분쟁 전환
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #5`](../../docs/06_SRS-v1.md) — `action: submitInspection` Server Action
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.1`](../../docs/06_SRS-v1.md) — 에스크로 결제 및 자금 방출 흐름 (검수 분기)
- 데이터 모델: [`06_SRS-v1.md#6.2.4 CONTRACT`](../../docs/06_SRS-v1.md) — status ENUM, inspection_deadline
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-008`](../07_TASK-LIST-v1.md)
- 선행 DTO: API-003 (ContractStatus State Machine)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 검수 판정 타입 정의
- [ ] `InspectionVerdict` 열거형 정의 (`lib/contracts/escrow/submit-inspection.ts`)
  ```typescript
  export enum InspectionVerdict {
    APPROVE = 'approve',   // 검수 합격 → release_pending
    REJECT  = 'reject',    // 검수 거절 → disputed
  }
  ```

### 2단계: Request DTO 정의
- [ ] `SubmitInspectionRequest` 타입 정의
  ```typescript
  export interface SubmitInspectionRequest {
    contractId: string;              // 대상 계약 ID (cuid)
    verdict: InspectionVerdict;      // 승인 또는 거절
    comment?: string;                // 검수 의견 (선택, 최대 2000자)
    rejectionReason?: string;        // 거절 사유 (거절 시 필수, 10~2000자)
    rejectionCategory?: RejectionCategory; // 거절 사유 카테고리 (거절 시 필수)
  }

  export enum RejectionCategory {
    QUALITY_DEFECT         = 'quality_defect',
    SPECIFICATION_MISMATCH = 'specification_mismatch',
    INCOMPLETE_WORK        = 'incomplete_work',
    SAFETY_ISSUE           = 'safety_issue',
    OTHER                  = 'other',
  }
  ```

### 3단계: Zod 유효성 스키마 정의 (조건부 검증)
- [ ] `submitInspectionSchema` 작성 — 승인/거절에 따른 조건부 유효성
  ```typescript
  export const submitInspectionSchema = z.object({
    contractId: z.string()
      .min(1, '계약 ID를 입력해주세요'),
    verdict: z.nativeEnum(InspectionVerdict, {
      errorMap: () => ({ message: '검수 판정(승인/거절)을 선택해주세요' })
    }),
    comment: z.string()
      .max(2000, '검수 의견은 2000자 이내로 입력해주세요')
      .optional(),
    rejectionReason: z.string()
      .min(10, '거절 사유는 최소 10자 이상 입력해주세요')
      .max(2000, '거절 사유는 2000자 이내로 입력해주세요')
      .optional(),
    rejectionCategory: z.nativeEnum(RejectionCategory).optional(),
  }).superRefine((data, ctx) => {
    // 거절 시 rejectionReason, rejectionCategory 필수
    if (data.verdict === InspectionVerdict.REJECT) {
      if (!data.rejectionReason || data.rejectionReason.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '검수 거절 시 거절 사유(10자 이상)를 반드시 입력해주세요',
          path: ['rejectionReason'],
        });
      }
      if (!data.rejectionCategory) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '검수 거절 시 거절 사유 카테고리를 선택해주세요',
          path: ['rejectionCategory'],
        });
      }
    }
  });
  ```

### 4단계: Response DTO 정의
- [ ] 승인 성공 응답 DTO
  ```typescript
  export interface InspectionApproveSuccessResponse {
    success: true;
    data: {
      contractId: string;
      previousStatus: 'inspecting';
      currentStatus: 'release_pending';
      verdict: 'approve';
      approvedAt: string;                // 승인 시각 (ISO 8601)
      adminNotificationSent: boolean;    // Admin '방출 대기' 알림 발송 여부
      message: string;                   // "검수가 승인되었습니다. Admin이 대금 방출을 진행합니다."
    };
  }
  ```
- [ ] 거절 성공 응답 DTO
  ```typescript
  export interface InspectionRejectSuccessResponse {
    success: true;
    data: {
      contractId: string;
      previousStatus: 'inspecting';
      currentStatus: 'disputed';
      verdict: 'reject';
      rejectedAt: string;
      rejectionCategory: RejectionCategory;
      mediationNotificationSent: boolean; // 중재팀 알림 발송 여부
      estimatedMediationStart: string;    // 예상 중재 개시일 (≤ 2영업일)
      message: string;                    // "검수가 거절되었습니다. 플랫폼 중재 프로세스가 개시됩니다."
    };
  }
  ```
- [ ] 통합 Response 타입
  ```typescript
  export type SubmitInspectionResponse =
    | InspectionApproveSuccessResponse
    | InspectionRejectSuccessResponse
    | SubmitInspectionErrorResponse;
  ```

### 5단계: 상태 전이 및 분쟁 자동 전환 규칙 정의
- [ ] 검수 판정에 따른 상태 전이 규칙 문서화
  ```
  ┌─────────────┐
  │ inspecting  │ ← 시공 완료 후 검수 대기 진입
  └─────────────┘
       │
       ├── verdict: 'approve' ──→ CONTRACT.status = 'release_pending'
       │                          + Admin 대시보드 '방출 대기' 알림
       │                          + admin_memo 기록 대기
       │
       └── verdict: 'reject'  ──→ CONTRACT.status = 'disputed'
                                  + 중재팀 알림 (≤ 2영업일 중재 개시)
                                  + ESCROW_TX.state 유지 ('held' — 방출 불가)
  ```
- [ ] 검수 기한 만료 자동 분쟁 전환 규칙 (CRON-001 연계)
  ```
  CONTRACT.inspection_deadline 설정 시점: ESCROW_HELD → INSPECTING 전환 시
  inspection_deadline = 시공 완료일 + 7영업일

  [CRON-001 배치] 매일 실행:
    WHERE status = 'inspecting'
      AND inspection_deadline < NOW()
    → CONTRACT.status = 'disputed' (자동 전환)
    → 중재팀 Slack 알림 (≤ 10분)
    → 수요기업/SI 알림 발송
  ```

### 6단계: 에러 코드 체계 정의
- [ ] `SubmitInspectionErrorCode` 정의
  ```typescript
  export enum SubmitInspectionErrorCode {
    VALIDATION_ERROR         = 'INS_008_VALIDATION',
    CONTRACT_NOT_FOUND       = 'INS_008_CONTRACT_NOT_FOUND',
    INVALID_STATUS           = 'INS_008_INVALID_STATUS',     // 계약이 'inspecting' 아님
    NOT_BUYER                = 'INS_008_NOT_BUYER',          // 수요기업만 검수 가능
    DEADLINE_EXPIRED         = 'INS_008_DEADLINE_EXPIRED',   // 검수 기한 만료
    REJECTION_REASON_MISSING = 'INS_008_REJECTION_REASON_MISSING',
    UNAUTHORIZED             = 'INS_008_UNAUTHORIZED',
    INTERNAL_ERROR           = 'INS_008_INTERNAL',
  }
  ```
  | 에러 코드 | HTTP Status | 설명 |
  |:---|:---:|:---|
  | `INS_008_VALIDATION` | 400 | 입력값 유효성 실패 |
  | `INS_008_CONTRACT_NOT_FOUND` | 404 | 계약 미존재 |
  | `INS_008_INVALID_STATUS` | 400 | 계약 상태 ≠ `inspecting` |
  | `INS_008_NOT_BUYER` | 403 | 해당 계약의 수요기업이 아님 |
  | `INS_008_DEADLINE_EXPIRED` | 400 | 검수 기한 만료 (이미 자동 분쟁 전환됨) |
  | `INS_008_REJECTION_REASON_MISSING` | 400 | 거절 시 사유 미입력 |
  | `INS_008_UNAUTHORIZED` | 401 | 미인증 |
  | `INS_008_INTERNAL` | 500 | 서버 오류 |

### 7단계: Server Action 시그니처 및 테스트
- [ ] Server Action 함수 시그니처 확정
  ```typescript
  'use server';
  export async function submitInspection(
    prevState: SubmitInspectionResponse | null,
    formData: FormData
  ): Promise<SubmitInspectionResponse> {
    // 1. 인증 확인 (buyer 역할)
    // 2. FormData → 객체 변환
    // 3. submitInspectionSchema.safeParse() — 조건부 유효성 (거절 시 사유 필수)
    // 4. CONTRACT 조회 (status === 'inspecting', 수요기업 본인 확인)
    // 5. 검수 기한 만료 확인 (inspection_deadline < now())
    // 6-A. verdict === 'approve':
    //    - CONTRACT UPDATE (status=release_pending)
    //    - Admin '방출 대기' 알림 발송
    // 6-B. verdict === 'reject':
    //    - CONTRACT UPDATE (status=disputed)
    //    - 중재팀 알림 발송 (≤ 2영업일)
    //    - ESCROW_TX 상태 유지 (held)
    // 7. 성공/실패 응답 반환
  }
  ```
- [ ] 단위 테스트 작성
  - 승인 정상 케이스: 2건 (코멘트 있음/없음)
  - 거절 정상 케이스: 2건 (각 카테고리)
  - 조건부 유효성 테스트: 3건 (거절 시 사유 누락, 카테고리 누락, 사유 10자 미만)
  - 상태 검증: 3건 (inspecting 아닌 상태, 기한 만료, 당사자 아님)

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 검수 합격 승인 — release_pending 전환**
- **Given:** `inspecting` 상태의 계약이 존재하고, 해당 수요기업이 로그인됨
- **When:** `verdict: 'approve'`로 `submitInspection`을 호출함
- **Then:** CONTRACT 상태가 `release_pending`으로 전환, Admin 대시보드에 '방출 대기' 알림 발송, `approvedAt` 타임스탬프 기록

**Scenario 2: 검수 거절 — disputed 전환 및 중재 개시**
- **Given:** `inspecting` 상태의 계약이 존재함
- **When:** `verdict: 'reject'`, `rejectionReason: '시공 품질이 계약 사양과 현저히 다름'`, `rejectionCategory: 'quality_defect'`로 호출함
- **Then:** CONTRACT 상태가 `disputed`로 전환, 중재팀 알림 발송 (≤ 2영업일 중재 개시), ESCROW_TX `state=held` 유지 (방출 불가)

**Scenario 3: 거절 시 거절 사유 미입력**
- **Given:** `verdict: 'reject'`이고 `rejectionReason`이 빈 문자열
- **When:** `submitInspectionSchema.safeParse(input)`를 실행함
- **Then:** `success: false`, `rejectionReason` 필드에 `"검수 거절 시 거절 사유(10자 이상)를 반드시 입력해주세요"` 에러

**Scenario 4: inspecting 상태가 아닌 계약에 검수 시도**
- **Given:** `pending` 상태의 계약이 존재함
- **When:** `submitInspection`을 호출함
- **Then:** `INS_008_INVALID_STATUS` 에러 코드와 400 상태 반환

**Scenario 5: 검수 기한 만료 후 검수 시도**
- **Given:** `inspecting` 상태이나 `inspection_deadline`이 이미 경과한 계약
- **When:** `submitInspection`을 호출함
- **Then:** `INS_008_DEADLINE_EXPIRED` 에러 코드 반환 (CRON-001에 의해 이미 disputed 전환 예정)

**Scenario 6: 수요기업이 아닌 사용자의 검수 시도**
- **Given:** SI 파트너 역할 사용자가 로그인됨
- **When:** 해당 계약에 대해 `submitInspection`을 호출함
- **Then:** `INS_008_NOT_BUYER` 에러 코드와 403 상태 반환

## :gear: Technical & Non-Functional Constraints

### 아키텍처
- **구현 방식:** Next.js Server Action — CON-12
- **조건부 유효성:** Zod `.superRefine()`을 사용하여 `verdict`에 따른 조건부 필드 검증
- **State Machine:** API-003에서 정의된 `inspecting → release_pending | disputed` 전이 규칙 참조

### 성능
- Server Action 전체 응답 p95 ≤ 500ms

### 보안
- 수요기업 본인만 검수 실행 가능 (계약의 `buyerCompanyId` 매칭)
- 거절 사유 및 분쟁 내용은 법적 증빙 용도로 5년 보존

### 안정성
- 검수 판정은 **비가역적(irreversible)**: 한번 승인/거절하면 되돌릴 수 없음
- 중재 프로세스 개시 알림 미발송 시 재시도 로직 필요

## :checkered_flag: Definition of Done (DoD)
- [ ] `SubmitInspectionRequest`, 승인/거절 Response DTO가 정의되었는가?
- [ ] `InspectionVerdict`, `RejectionCategory` 열거형이 정의되었는가?
- [ ] Zod `.superRefine()` 조건부 검증 로직이 구현되었는가?
- [ ] 상태 전이 규칙(inspecting → release_pending / disputed)이 문서화되었는가?
- [ ] 검수 기한 만료 자동 전환 규칙(CRON-001 연계)이 명세되었는가?
- [ ] 에러 코드 및 HTTP 매핑이 정의되었는가?
- [ ] 단위 테스트가 통과하는가? (승인 2건 + 거절 2건 + 조건부 3건 + 상태 3건)
- [ ] ESLint / TypeScript 경고 0건인가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-005 | `CONTRACT` 테이블 스키마 (status ENUM, inspection_deadline) | 필수 |
| API-003 | ContractStatus State Machine 정의 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| FC-007 | 검수 승인 Command 로직 (inspecting → release_pending) |
| FC-008 | 검수 거절 Command 로직 (inspecting → disputed) |
| CRON-001 | 검수 기한 만료 자동 분쟁 전환 배치 — inspection_deadline 규칙 의존 |
| TEST-003 | 검수 승인 단위 테스트 |
| TEST-004 | 검수 거절 + 분쟁 자동 개시 테스트 |
| UI-006 | 검수 승인/거절 UI — 거절 사유 입력 폼 |

### 참고사항
- `inspection_deadline` 계산 로직: 시공 완료 보고(escrow_held → inspecting 전환) 시점 + 7영업일. 공휴일 처리는 MVP에서 미적용 (단순 7일 기준), Phase 2에서 공휴일 캘린더 연동 예정
- 검수 판정의 비가역성: 승인/거절 후 재판정 불가. 오판정 시 분쟁 접수(API-006)를 통한 구제만 가능
