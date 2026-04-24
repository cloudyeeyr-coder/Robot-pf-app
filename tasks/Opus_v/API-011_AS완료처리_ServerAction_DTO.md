---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-011: AS 도메인 — AS 완료 처리 (resolveTicket) Server Action DTO, SLA 자동 판정 로직 인터페이스 정의"
labels: 'feature, backend, api-contract, as-warranty, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [API-011] AS 완료 처리 (`resolveTicket`) Server Action DTO 및 SLA 자동 판정 로직 인터페이스 정의
- 목적: AS 엔지니어의 현장 출동 및 처리 완료를 기록하고, `resolved_at - reported_at ≤ 24h` 기준으로 **SLA 충족 여부를 자동 판정**하는 Server Action의 **Request/Response DTO**, **SLA 판정 순수 함수 인터페이스**, **에러 코드**를 정의한다. AS 티켓 생애주기의 최종 단계로, 4단계 timestamp(reported → assigned → dispatched → resolved)의 순차 기록을 완료하는 액션이다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-008`](../../docs/06_SRS-v1.md) — AS 티켓 전 과정 추적 및 SLA 자동 기록
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #8`](../../docs/06_SRS-v1.md) — `action: resolveTicket` Server Action
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.3`](../../docs/06_SRS-v1.md) — 긴급 AS 접수 및 출동 흐름 (처리 완료 단계)
- 데이터 모델: [`06_SRS-v1.md#6.2.6 AS_TICKET`](../../docs/06_SRS-v1.md) — resolved_at, sla_met 필드
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-011`](../07_TASK-LIST-v1.md)
- 선행 DTO: API-009 (AS 티켓 생애주기), API-010 (엔지니어 배정)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Request DTO 정의
- [ ] `ResolveTicketRequest` 타입 정의 (`lib/contracts/as/resolve-ticket.ts`)
  ```typescript
  export interface ResolveTicketRequest {
    ticketId: string;                // AS 티켓 ID (cuid)
    resolutionNote: string;          // 처리 결과 메모 (10~2000자)
    resolvedByEngineerId: string;    // 처리 완료한 엔지니어 ID
    partsUsed?: string[];            // 사용 부품 목록 (선택)
  }
  ```

### 2단계: Zod 유효성 스키마 정의
- [ ] `resolveTicketSchema` 작성
  ```typescript
  export const resolveTicketSchema = z.object({
    ticketId: z.string().min(1, 'AS 티켓 ID를 입력해주세요'),
    resolutionNote: z.string()
      .min(10, '처리 결과는 최소 10자 이상 입력해주세요')
      .max(2000, '처리 결과는 2000자 이내로 입력해주세요'),
    resolvedByEngineerId: z.string().min(1, '엔지니어 ID를 입력해주세요'),
    partsUsed: z.array(z.string()).max(20).optional(),
  });
  ```

### 3단계: SLA 자동 판정 순수 함수 인터페이스 정의
- [ ] `evaluateSla` 순수 함수 시그니처 정의
  ```typescript
  /**
   * SLA 충족 여부 자동 판정
   * 기준: resolved_at - reported_at ≤ 24h (정확히 24h = 충족)
   * 모든 timestamp는 UTC 기준
   */
  export function evaluateSla(
    reportedAt: Date,
    resolvedAt: Date
  ): SlaEvaluation {
    const elapsedMs = resolvedAt.getTime() - reportedAt.getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    return {
      slaMet: elapsedHours <= 24,
      elapsedHours: Math.round(elapsedHours * 100) / 100,
    };
  }

  export interface SlaEvaluation {
    slaMet: boolean;
    elapsedHours: number;     // 소수점 2자리 반올림
  }
  ```

### 4단계: Response DTO 정의
- [ ] 성공 응답 DTO
  ```typescript
  export interface ResolveTicketSuccessResponse {
    success: true;
    data: {
      ticketId: string;
      resolvedAt: string;          // ISO 8601
      slaMet: boolean;             // SLA 충족 여부
      elapsedHours: number;        // 접수~해결 경과 시간
      timestamps: {
        reportedAt: string;
        assignedAt: string;
        dispatchedAt: string;
        resolvedAt: string;
      };
    };
  }
  ```

### 5단계: 상태 전이 사전 조건 규칙 정의
- [ ] 완료 처리 가능 조건
  ```typescript
  export const RESOLVE_PRECONDITIONS = {
    // assigned_at IS NOT NULL — 엔지니어 배정 완료
    requireAssigned: true,
    // dispatched_at IS NOT NULL — 현장 출동 완료
    requireDispatched: true,
    // resolved_at IS NULL — 미완료 상태
    requireUnresolved: true,
    // resolvedByEngineerId === assigned_engineer_id (또는 Admin)
    requireAuthorizedResolver: true,
  };
  ```

### 6단계: 에러 코드 정의
- [ ] `ResolveTicketErrorCode` 정의
  ```typescript
  export enum ResolveTicketErrorCode {
    VALIDATION_ERROR        = 'AS_011_VALIDATION',
    TICKET_NOT_FOUND        = 'AS_011_TICKET_NOT_FOUND',
    TICKET_NOT_DISPATCHED   = 'AS_011_NOT_DISPATCHED',
    TICKET_ALREADY_RESOLVED = 'AS_011_ALREADY_RESOLVED',
    UNAUTHORIZED_ENGINEER   = 'AS_011_UNAUTHORIZED_ENGINEER',
    UNAUTHORIZED            = 'AS_011_UNAUTHORIZED',
    INTERNAL_ERROR          = 'AS_011_INTERNAL',
  }
  ```
  | 에러 코드 | HTTP | 설명 |
  |:---|:---:|:---|
  | `AS_011_VALIDATION` | 400 | 입력값 유효성 실패 |
  | `AS_011_TICKET_NOT_FOUND` | 404 | 티켓 미존재 |
  | `AS_011_NOT_DISPATCHED` | 409 | 출동 전(dispatched_at IS NULL) 완료 시도 |
  | `AS_011_ALREADY_RESOLVED` | 409 | 이미 완료된 티켓 재처리 시도 |
  | `AS_011_UNAUTHORIZED_ENGINEER` | 403 | 배정 엔지니어가 아닌 사용자의 완료 시도 |
  | `AS_011_UNAUTHORIZED` | 401 | 미인증 |
  | `AS_011_INTERNAL` | 500 | 서버 오류 |

### 7단계: 테스트
- [ ] `evaluateSla` 단위 테스트: 경계값(정확히 24h), 충족(23h), 미충족(25h), 음수 기간
- [ ] Zod 스키마 테스트: 유효 3건 + 무효 4건

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 완료 처리 (SLA 충족)**
- **Given:** 배정·출동 완료된 AS 티켓, `reported_at`으로부터 23시간 경과
- **When:** 유효한 `resolveTicketInput`으로 `resolveTicket`을 호출함
- **Then:** `resolved_at=now()`, `sla_met=true`, `elapsed_hours≈23` 반환, DB 갱신

**Scenario 2: SLA 미충족 케이스**
- **Given:** `reported_at`으로부터 25시간 경과한 티켓
- **When:** `resolveTicket`을 호출함
- **Then:** `sla_met=false`, `elapsed_hours≈25` 반환 (요청 자체는 성공)

**Scenario 3: 출동 전 완료 처리 시도**
- **Given:** `dispatched_at IS NULL`인 티켓
- **When:** `resolveTicket`을 호출함
- **Then:** `AS_011_NOT_DISPATCHED` 에러와 409 반환

**Scenario 4: 이미 완료된 티켓 재처리**
- **Given:** `resolved_at IS NOT NULL`인 티켓
- **When:** `resolveTicket`을 호출함
- **Then:** `AS_011_ALREADY_RESOLVED` 에러와 409 반환

## :gear: Technical & Non-Functional Constraints
- **정확성:** `evaluateSla` 경계값(정확히 24h 00m 00s)은 충족(true). UTC 기준 ms 차이 계산
- **성능:** Server Action 응답 p95 ≤ 300ms
- **보안:** `resolvedByEngineerId`는 `assigned_engineer_id`와 일치하거나 Admin만 허용

## :checkered_flag: Definition of Done (DoD)
- [ ] Request/Response DTO가 정의되었는가?
- [ ] `evaluateSla` 순수 함수 인터페이스 및 단위 테스트가 작성되었는가?
- [ ] 사전 조건(RESOLVE_PRECONDITIONS) 4항목이 문서화되었는가?
- [ ] 에러 코드 및 HTTP 매핑이 정의되었는가?
- [ ] ESLint / TypeScript 경고 0건인가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-007 | `AS_TICKET` 테이블 스키마 | 필수 |
| API-010 | `assignEngineer` DTO — 배정 완료 상태 정의 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| FC-013 | AS 완료 처리 Command 로직 |
| FQ-005 | SLA 충족 여부 조회 |
| TEST-010 | SLA 자동 판정 테스트 |
