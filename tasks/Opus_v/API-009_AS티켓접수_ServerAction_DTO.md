---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-009: AS 도메인 — AS 티켓 접수 (createAsTicket) Server Action DTO, priority ENUM, 에러 코드 정의"
labels: 'feature, backend, api-contract, as-warranty, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-009] AS 티켓 접수 (`createAsTicket`) Server Action DTO, priority ENUM, 에러 코드 정의
- 목적: 수요기업이 SI 파트너의 부도·폐업·연락두절 상황에서 **긴급 AS 티켓**을 접수하는 Server Action의 **Request/Response DTO**, **priority ENUM(normal/urgent)**, **에러 코드**를 정의한다. AS 티켓은 플랫폼의 핵심 안전망(Safety Net)으로, 접수 후 ≤ 4시간 내 로컬 AS 엔지니어 배정과 ≤ 24시간 내 현장 출동으로 연결되는 SLA 기반 서비스의 시작점이다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-007`](../../docs/06_SRS-v1.md) — SI 부도/폐업/연락두절 시 로컬 AS 엔지니어 자동 매칭
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-008`](../../docs/06_SRS-v1.md) — AS 티켓 전 과정 추적 및 SLA 자동 기록
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #6`](../../docs/06_SRS-v1.md) — `action: createAsTicket` Server Action
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.3`](../../docs/06_SRS-v1.md) — 긴급 AS 접수 및 출동 흐름
- 데이터 모델: [`06_SRS-v1.md#6.2.6 AS_TICKET`](../../docs/06_SRS-v1.md) — AS_TICKET 테이블 스키마
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-009`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 우선순위 ENUM 정의
- [ ] `AsTicketPriority` 열거형 정의 (`lib/contracts/as/create-as-ticket.ts`)
  ```typescript
  export enum AsTicketPriority {
    NORMAL = 'normal',    // 일반 AS 요청
    URGENT = 'urgent',    // 긴급 AS (SI 부도/폐업/연락두절)
  }
  ```
- [ ] 우선순위별 SLA 기준 정의
  ```typescript
  export const AS_SLA_TARGETS = {
    [AsTicketPriority.URGENT]: {
      assignmentDeadlineHours: 4,    // 엔지니어 배정 ≤ 4시간
      resolutionDeadlineHours: 24,   // 현장 출동 ≤ 24시간
      successRateTarget: 0.95,       // 출동 성공률 ≥ 95%
    },
    [AsTicketPriority.NORMAL]: {
      assignmentDeadlineHours: 24,
      resolutionDeadlineHours: 72,
      successRateTarget: 0.90,
    },
  } as const;
  ```

### 2단계: Request DTO 정의
- [ ] `CreateAsTicketRequest` 타입 정의
  ```typescript
  export interface CreateAsTicketRequest {
    contractId: string;                // 관련 계약 ID (cuid)
    priority: AsTicketPriority;        // 긴급도 (normal / urgent)
    symptomDescription: string;        // 증상 설명 (10~3000자)
    siPartnerStatus?: SiPartnerIssue;  // SI 파트너 상태 이슈 (urgent 시 필수)
    contactPhone?: string;             // 현장 연락 가능 번호 (선택)
    siteAddress?: string;              // 현장 주소 (선택, 최대 500자)
  }

  export enum SiPartnerIssue {
    BANKRUPTCY       = 'bankruptcy',       // 부도
    CLOSURE          = 'closure',          // 폐업
    UNREACHABLE      = 'unreachable',      // 연락두절
    REFUSAL          = 'refusal',          // AS 거부
    QUALITY_ISSUE    = 'quality_issue',    // 시공 품질 문제
  }
  ```

### 3단계: Zod 유효성 스키마 정의 (조건부 검증)
- [ ] `createAsTicketSchema` 작성
  ```typescript
  export const createAsTicketSchema = z.object({
    contractId: z.string()
      .min(1, '계약 ID를 입력해주세요'),
    priority: z.nativeEnum(AsTicketPriority, {
      errorMap: () => ({ message: '긴급도를 선택해주세요' })
    }),
    symptomDescription: z.string()
      .min(10, '증상 설명은 최소 10자 이상 입력해주세요')
      .max(3000, '증상 설명은 3000자 이내로 입력해주세요'),
    siPartnerStatus: z.nativeEnum(SiPartnerIssue).optional(),
    contactPhone: z.string()
      .regex(/^01[016789]-\d{3,4}-\d{4}$/, '올바른 전화번호 형식을 입력해주세요')
      .optional(),
    siteAddress: z.string()
      .max(500, '현장 주소는 500자 이내로 입력해주세요')
      .optional(),
  }).superRefine((data, ctx) => {
    // urgent 시 siPartnerStatus 필수
    if (data.priority === AsTicketPriority.URGENT && !data.siPartnerStatus) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '긴급 AS 접수 시 SI 파트너 상태(부도/폐업/연락두절 등)를 선택해주세요',
        path: ['siPartnerStatus'],
      });
    }
  });
  ```

### 4단계: Response DTO 정의
- [ ] 성공 응답 DTO
  ```typescript
  export interface CreateAsTicketSuccessResponse {
    success: true;
    data: {
      ticketId: string;              // 생성된 AS_TICKET PK (cuid)
      contractId: string;
      priority: AsTicketPriority;
      status: 'reported';            // 초기 상태: 접수됨
      reportedAt: string;            // 접수 시각 (ISO 8601)
      slaTarget: {
        assignmentDeadline: string;  // 배정 기한 (ISO 8601)
        resolutionDeadline: string;  // 해결 기한 (ISO 8601)
      };
      message: string;               // "AS 티켓이 접수되었습니다. n시간 내 엔지니어가 배정됩니다."
    };
  }
  ```
- [ ] 실패 응답 DTO
  ```typescript
  export interface CreateAsTicketErrorResponse {
    success: false;
    error: {
      code: CreateAsTicketErrorCode;
      message: string;
      details?: Record<string, string[]>;
    };
  }
  ```

### 5단계: AS 티켓 생애주기(Lifecycle) 정의
- [ ] AS 티켓 상태 전이 규칙 문서화
  ```
  ┌──────────┐  엔지니어 배정  ┌──────────┐  현장 출동  ┌──────────────┐  처리 완료  ┌───────────┐
  │ reported │ ──────────────→ │ assigned │ ──────────→ │ dispatched   │ ──────────→ │ resolved  │
  └──────────┘  (≤ 4h urgent)  └──────────┘             └──────────────┘  (≤ 24h)   └───────────┘
       │                                                                                  │
       └───────────────────────── SLA 자동 판정: resolved_at - reported_at ≤ 24h ──────────┘
  ```
- [ ] 각 단계별 타임스탬프:
  - `reported_at`: 접수 시각 (본 액션에서 기록)
  - `assigned_at`: 엔지니어 배정 시각 (API-010에서 기록)
  - `dispatched_at`: 현장 출동 시각 (엔지니어 보고)
  - `resolved_at`: 해결 완료 시각 (API-011에서 기록)
  - `sla_met`: `resolved_at - reported_at ≤ 24h` 자동 판정

### 6단계: 에러 코드 체계 정의
- [ ] `CreateAsTicketErrorCode` 정의
  ```typescript
  export enum CreateAsTicketErrorCode {
    VALIDATION_ERROR         = 'AS_009_VALIDATION',
    CONTRACT_NOT_FOUND       = 'AS_009_CONTRACT_NOT_FOUND',
    CONTRACT_NOT_COMPLETED   = 'AS_009_CONTRACT_NOT_COMPLETED', // 에스크로 미완료 계약
    NOT_BUYER                = 'AS_009_NOT_BUYER',
    SI_STATUS_REQUIRED       = 'AS_009_SI_STATUS_REQUIRED',     // urgent인데 SI 상태 미선택
    DUPLICATE_ACTIVE_TICKET  = 'AS_009_DUPLICATE_TICKET',       // 이미 진행 중인 티켓 존재
    UNAUTHORIZED             = 'AS_009_UNAUTHORIZED',
    INTERNAL_ERROR           = 'AS_009_INTERNAL',
  }
  ```
  | 에러 코드 | HTTP Status | 설명 |
  |:---|:---:|:---|
  | `AS_009_VALIDATION` | 400 | 입력값 유효성 실패 |
  | `AS_009_CONTRACT_NOT_FOUND` | 404 | 계약 미존재 |
  | `AS_009_CONTRACT_NOT_COMPLETED` | 400 | 에스크로 결제 미완료 계약 (보증서 미발급) |
  | `AS_009_NOT_BUYER` | 403 | 해당 계약의 수요기업이 아님 |
  | `AS_009_SI_STATUS_REQUIRED` | 400 | urgent 접수 시 SI 파트너 상태 미선택 |
  | `AS_009_DUPLICATE_TICKET` | 409 | 해당 계약에 이미 진행 중 AS 티켓 존재 |
  | `AS_009_UNAUTHORIZED` | 401 | 미인증 |
  | `AS_009_INTERNAL` | 500 | 서버 오류 |

### 7단계: Server Action 시그니처 및 테스트
- [ ] Server Action 함수 시그니처 확정
  ```typescript
  'use server';
  export async function createAsTicket(
    prevState: CreateAsTicketResponse | null,
    formData: FormData
  ): Promise<CreateAsTicketResponse> {
    // 1. 인증 확인 (buyer 역할)
    // 2. FormData → 객체 변환
    // 3. createAsTicketSchema.safeParse() — 조건부 유효성 (urgent 시 SI 상태 필수)
    // 4. CONTRACT 조회 (에스크로 완료 상태 확인, 수요기업 본인 확인)
    // 5. 중복 활성 티켓 확인
    // 6. SI 파트너 부도/폐업/연락두절 상태 확인 (urgent 시)
    // 7. AS_TICKET INSERT (priority, symptom_description, reported_at=now())
    // 8. 운영팀 알림 발송 (로컬 AS 엔지니어 매칭 요청)
    // 9. 성공/실패 응답 반환
  }
  ```
- [ ] 단위 테스트 작성
  - 정상: urgent 접수 2건, normal 접수 1건
  - 조건부: urgent인데 SI 상태 미선택 1건
  - 상태 검증: 에스크로 미완료 1건, 중복 티켓 1건, 당사자 아님 1건
  - 유효성: 증상 설명 10자 미만 1건, 초과 1건

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 긴급 AS 티켓 접수 성공**
- **Given:** 에스크로 완료(completed) 상태의 계약이 존재하고, 수요기업이 로그인됨
- **When:** `priority: 'urgent'`, `siPartnerStatus: 'bankruptcy'`, `symptomDescription: '로봇 암 관절부 이상 작동. SI 업체 A사 부도로 연락 불가.'`로 `createAsTicket`을 호출함
- **Then:** AS_TICKET이 `priority=urgent`로 생성, `reportedAt` 기록, SLA 기한(배정 ≤ 4h, 해결 ≤ 24h) 응답에 포함, 운영팀 알림 발송

**Scenario 2: urgent 접수 시 SI 파트너 상태 미선택**
- **Given:** `priority: 'urgent'`이고 `siPartnerStatus`가 미입력
- **When:** 유효성 검증 실행
- **Then:** `siPartnerStatus` 필드에 `"긴급 AS 접수 시 SI 파트너 상태를 선택해주세요"` 에러

**Scenario 3: 에스크로 미완료 계약에 AS 접수 시도**
- **Given:** `pending` 상태(에스크로 미완료)의 계약이 존재함
- **When:** 해당 계약에 AS 티켓 접수를 시도함
- **Then:** `AS_009_CONTRACT_NOT_COMPLETED` 에러 코드와 400 상태 반환

**Scenario 4: 이미 진행 중인 AS 티켓이 존재하는 계약**
- **Given:** 해당 계약에 `reported` 상태의 AS 티켓이 이미 존재함
- **When:** 동일 계약에 새 AS 티켓 접수를 시도함
- **Then:** `AS_009_DUPLICATE_TICKET` 에러 코드와 409 상태 반환

**Scenario 5: 증상 설명 최소 길이 미달**
- **Given:** `symptomDescription`이 `"로봇 고장"` (5자)
- **When:** 유효성 검증 실행
- **Then:** `symptomDescription` 필드에 `"증상 설명은 최소 10자 이상 입력해주세요"` 에러

## :gear: Technical & Non-Functional Constraints

### 아키텍처
- **구현 방식:** Next.js Server Action — CON-12
- **조건부 유효성:** Zod `.superRefine()` — priority가 urgent일 때 siPartnerStatus 필수
- **SLA 기한 계산:** `reportedAt` 기준으로 `assignmentDeadline`, `resolutionDeadline` 자동 산출

### 성능
- Server Action 전체 응답 p95 ≤ 300ms

### 보안
- 수요기업 본인만 AS 접수 가능 (계약의 buyerCompanyId 매칭)
- 증상 설명은 개인정보 비포함 가정, 마스킹 불필요

### 안정성
- AS 티켓 접수 실패율 < 0.1%
- 운영팀 알림 미발송 시 재시도 로직 필요 (CRON-007 모니터링 연계)

## :checkered_flag: Definition of Done (DoD)
- [ ] `CreateAsTicketRequest`, 성공/실패 Response DTO가 정의되었는가?
- [ ] `AsTicketPriority`, `SiPartnerIssue` 열거형이 정의되었는가?
- [ ] `AS_SLA_TARGETS` SLA 기준이 정의되었는가?
- [ ] AS 티켓 생애주기(reported → assigned → dispatched → resolved) 상태 전이가 문서화되었는가?
- [ ] Zod `.superRefine()` 조건부 검증 (urgent 시 siPartnerStatus 필수)이 구현되었는가?
- [ ] 에러 코드 및 HTTP 매핑이 정의되었는가?
- [ ] 단위 테스트가 통과하는가?
- [ ] ESLint / TypeScript 경고 0건인가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-007 | `AS_TICKET` 테이블 스키마 (priority ENUM, 4단계 timestamp) | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| API-010 | `assignEngineer` — AS 엔지니어 배정 (티켓 존재 전제) |
| API-011 | `resolveTicket` — AS 완료 처리 |
| FC-011 | AS 티켓 접수 Command 로직 |
| TEST-008 | 긴급 AS 접수 테스트 |
| UI-007 | 긴급 AS 접수 UI |
| CRON-007 | AS 24시간 미배정 모니터링 — 티켓 데이터 의존 |
