---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-010: AS 도메인 — AS 엔지니어 배정 (assignEngineer) Server Action DTO, 배정 규칙(지역·역량 기반), 에러 코드 정의"
labels: 'feature, backend, api-contract, as-warranty, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-010] AS 엔지니어 배정 (`assignEngineer`) Server Action DTO, 배정 규칙(지역·역량 기반), 에러 코드 정의
- 목적: 접수된 AS 티켓에 **로컬 AS 엔지니어를 배정**하는 Server Action의 **Request/Response DTO**, **지역·역량 기반 배정 규칙(Matching Rule)**, **에러 코드**를 정의한다. 배정은 운영팀(Admin/Ops)이 수행하며, ≤ 4시간 이내 완료 목표이다. 엔지니어 매칭은 현장 지역과 엔지니어의 담당 지역·역량을 기반으로 최적 매칭하는 규칙을 적용한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-007`](../../docs/06_SRS-v1.md) — 로컬 AS 엔지니어 자동 매칭 배정
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-008`](../../docs/06_SRS-v1.md) — AS 티켓 전 과정 추적 및 SLA
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #7`](../../docs/06_SRS-v1.md) — `action: assignEngineer` Server Action
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.3`](../../docs/06_SRS-v1.md) — 긴급 AS 접수 및 출동 흐름 (엔지니어 배정 단계)
- 데이터 모델: [`06_SRS-v1.md#6.2.6 AS_TICKET`](../../docs/06_SRS-v1.md) — assigned_engineer_id, assigned_at
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-010`](../07_TASK-LIST-v1.md)
- 선행 DTO: API-009 (AS 티켓 생애주기, AsTicketPriority)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Request DTO 정의
- [ ] `AssignEngineerRequest` 타입 정의 (`lib/contracts/as/assign-engineer.ts`)
  ```typescript
  export interface AssignEngineerRequest {
    ticketId: string;                // AS 티켓 ID (cuid)
    engineerId?: string;             // 수동 배정 시 엔지니어 ID (선택)
    autoAssign?: boolean;            // 자동 매칭 여부 (기본: true)
    assignmentNote?: string;         // 배정 메모 (선택, 최대 500자)
  }
  ```

### 2단계: Zod 유효성 스키마 정의
- [ ] `assignEngineerSchema` 작성
  ```typescript
  export const assignEngineerSchema = z.object({
    ticketId: z.string()
      .min(1, 'AS 티켓 ID를 입력해주세요'),
    engineerId: z.string()
      .min(1, '엔지니어 ID를 입력해주세요')
      .optional(),
    autoAssign: z.boolean()
      .default(true),
    assignmentNote: z.string()
      .max(500, '배정 메모는 500자 이내로 입력해주세요')
      .optional(),
  }).superRefine((data, ctx) => {
    // 수동 배정(autoAssign=false) 시 engineerId 필수
    if (data.autoAssign === false && !data.engineerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '수동 배정 시 엔지니어 ID를 선택해주세요',
        path: ['engineerId'],
      });
    }
  });
  ```

### 3단계: 지역·역량 기반 배정 규칙(Matching Rule) 정의
- [ ] 자동 매칭 알고리즘 인터페이스 정의
  ```typescript
  /**
   * AS 엔지니어 자동 매칭 규칙
   * 
   * 매칭 우선순위:
   *   1. 지역 매칭: 티켓 현장 주소의 지역(region)과 엔지니어 담당 지역 일치
   *   2. 역량 매칭: 티켓 관련 로봇 모델/브랜드와 엔지니어 전문 역량 일치
   *   3. 가용 상태: 엔지니어의 현재 가용 상태 (available)
   *   4. 부하 분산: 현재 배정된 활성 티켓 수가 가장 적은 엔지니어 우선
   */
  export interface EngineerMatchingCriteria {
    region: string;                   // 티켓 현장 지역
    robotBrand?: string;              // 관련 로봇 브랜드 (계약 정보에서 추출)
    robotModel?: string;              // 관련 로봇 모델
    priority: AsTicketPriority;       // 티켓 긴급도
  }

  export interface EngineerMatchResult {
    engineerId: string;
    engineerName: string;
    matchScore: number;               // 매칭 점수 (0~100)
    matchReasons: string[];           // 매칭 사유 목록
    estimatedArrivalMinutes?: number; // 예상 도착 시간 (분)
  }
  ```
- [ ] 매칭 결과 시나리오별 동작 정의
  ```
  [매칭 성공] → 최고 점수 엔지니어 자동 배정
              → AS_TICKET.assigned_engineer_id = engineerId
              → AS_TICKET.assigned_at = now()
              → 엔지니어에게 출동 요청 알림 발송
              → 수요기업에게 배정 완료 알림 (엔지니어 정보 포함)
  
  [가용 엔지니어 0명] → 배정 실패 응답
                      → Ops Slack 즉시 알림 발송 (CRON-007 연계)
                      → 수요기업에게 "배정 지연" 안내 발송
                      → 인접 지역 엔지니어 후보 3명 추천 목록 반환
  ```

### 4단계: Response DTO 정의
- [ ] 배정 성공 응답 DTO
  ```typescript
  export interface AssignEngineerSuccessResponse {
    success: true;
    data: {
      ticketId: string;
      assignedEngineer: {
        id: string;
        name: string;
        phone: string;                 // 엔지니어 연락처
        region: string;                // 담당 지역
        specialties: string[];         // 전문 역량 (예: ['UR', '두산', '용접'])
      };
      assignedAt: string;              // 배정 시각 (ISO 8601)
      matchScore: number;              // 매칭 점수
      matchReasons: string[];          // 매칭 사유
      slaDeadline: string;             // SLA 기한 (해결 기한, ISO 8601)
      message: string;
    };
  }
  ```
- [ ] 배정 실패 (가용 엔지니어 0명) 응답 DTO
  ```typescript
  export interface AssignEngineerNoAvailableResponse {
    success: true;
    data: {
      ticketId: string;
      assignmentStatus: 'pending_manual';  // 수동 배정 대기
      opsNotified: boolean;                // Ops 알림 발송 여부
      suggestedEngineers: {                // 인접 지역 후보 엔지니어 목록
        id: string;
        name: string;
        region: string;
        currentLoad: number;               // 현재 활성 티켓 수
        estimatedArrivalMinutes: number;
      }[];
      message: string;                     // "해당 지역에 가용 엔지니어가 없습니다. 운영팀이 수동 배정합니다."
    };
  }
  ```
- [ ] 에러 응답 DTO
  ```typescript
  export interface AssignEngineerErrorResponse {
    success: false;
    error: {
      code: AssignEngineerErrorCode;
      message: string;
      details?: Record<string, string[]>;
    };
  }
  ```

### 5단계: 에러 코드 체계 정의
- [ ] `AssignEngineerErrorCode` 정의
  ```typescript
  export enum AssignEngineerErrorCode {
    VALIDATION_ERROR         = 'AS_010_VALIDATION',
    TICKET_NOT_FOUND         = 'AS_010_TICKET_NOT_FOUND',
    INVALID_TICKET_STATUS    = 'AS_010_INVALID_TICKET_STATUS',  // reported 아님
    ALREADY_ASSIGNED         = 'AS_010_ALREADY_ASSIGNED',
    ENGINEER_NOT_FOUND       = 'AS_010_ENGINEER_NOT_FOUND',     // 수동 배정 시
    ENGINEER_UNAVAILABLE     = 'AS_010_ENGINEER_UNAVAILABLE',   // 비가용 상태
    UNAUTHORIZED             = 'AS_010_UNAUTHORIZED',
    FORBIDDEN                = 'AS_010_FORBIDDEN',              // Admin/Ops 역할 아님
    INTERNAL_ERROR           = 'AS_010_INTERNAL',
  }
  ```
  | 에러 코드 | HTTP Status | 설명 |
  |:---|:---:|:---|
  | `AS_010_VALIDATION` | 400 | 입력값 유효성 실패 |
  | `AS_010_TICKET_NOT_FOUND` | 404 | AS 티켓 미존재 |
  | `AS_010_INVALID_TICKET_STATUS` | 400 | 티켓 상태가 `reported`가 아님 (이미 배정/완료됨) |
  | `AS_010_ALREADY_ASSIGNED` | 409 | 이미 엔지니어가 배정됨 |
  | `AS_010_ENGINEER_NOT_FOUND` | 404 | 수동 배정 시 해당 엔지니어 미존재 |
  | `AS_010_ENGINEER_UNAVAILABLE` | 400 | 선택한 엔지니어가 비가용 상태 |
  | `AS_010_UNAUTHORIZED` | 401 | 미인증 |
  | `AS_010_FORBIDDEN` | 403 | Admin/Ops 역할 아님 |
  | `AS_010_INTERNAL` | 500 | 서버 오류 |

### 6단계: Server Action 시그니처 및 테스트
- [ ] Server Action 함수 시그니처 확정
  ```typescript
  'use server';
  export async function assignEngineer(
    prevState: AssignEngineerResponse | null,
    formData: FormData
  ): Promise<AssignEngineerResponse> {
    // 1. Admin/Ops 권한 검증
    // 2. FormData → 객체 변환
    // 3. assignEngineerSchema.safeParse() — 조건부 유효성
    // 4. AS_TICKET 조회 (status === 'reported', 미배정 확인)
    // 5-A. autoAssign=true:
    //    - 티켓 지역·역량 기반 엔지니어 후보 조회 (AS_ENGINEER 테이블)
    //    - 매칭 점수 산출 (지역·역량·가용성·부하)
    //    - 최고 점수 엔지니어 선택 (0명 시 → 실패 응답 + Ops 알림)
    // 5-B. autoAssign=false:
    //    - engineerId로 엔지니어 존재 및 가용 상태 확인
    // 6. Prisma: AS_TICKET UPDATE (assigned_engineer_id, assigned_at=now())
    // 7. 엔지니어에게 출동 요청 알림 (SMS + 카카오)
    // 8. 수요기업에게 배정 완료 알림 (엔지니어 정보 포함)
    // 9. 성공/실패 응답 반환
  }

  export type AssignEngineerResponse =
    | AssignEngineerSuccessResponse
    | AssignEngineerNoAvailableResponse
    | AssignEngineerErrorResponse;
  ```
- [ ] 단위 테스트 작성
  - 자동 매칭 성공: 2건 (지역 일치, 역량 일치)
  - 자동 매칭 실패 (0명): 1건
  - 수동 배정 성공: 1건
  - 수동 배정 실패 (엔지니어 미존재): 1건
  - 이미 배정됨: 1건
  - 조건부 유효성 (autoAssign=false, engineerId 미입력): 1건
  - 권한 검증 (비Admin): 1건

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 자동 매칭으로 엔지니어 배정 성공**
- **Given:** `reported` 상태의 urgent AS 티켓이 존재하고, 해당 지역에 가용 엔지니어가 있음
- **When:** `autoAssign: true`로 `assignEngineer`를 호출함
- **Then:** 지역·역량 기반 최고 점수 엔지니어가 배정, `assigned_at` 기록, 엔지니어에게 출동 요청 알림 발송, 수요기업에게 배정 완료 알림 (엔지니어 연락처 포함)

**Scenario 2: 가용 엔지니어 0명 시 수동 배정 대기**
- **Given:** 해당 지역에 가용 AS 엔지니어가 0명
- **When:** `autoAssign: true`로 `assignEngineer`를 호출함
- **Then:** `assignmentStatus: 'pending_manual'` 응답, Ops Slack 즉시 알림 발송, 인접 지역 후보 엔지니어 목록(`suggestedEngineers`) 반환

**Scenario 3: 수동 배정으로 특정 엔지니어 선택**
- **Given:** `reported` 상태의 AS 티켓이 존재하고, Ops가 특정 엔지니어를 선택함
- **When:** `autoAssign: false`, `engineerId: 'eng_abc123'`으로 `assignEngineer`를 호출함
- **Then:** 해당 엔지니어가 배정되고, `assigned_at` 기록

**Scenario 4: 이미 엔지니어가 배정된 티켓에 재배정 시도**
- **Given:** `assigned` 상태의 AS 티켓 (이미 엔지니어 배정됨)
- **When:** `assignEngineer`를 호출함
- **Then:** `AS_010_ALREADY_ASSIGNED` 에러 코드와 409 상태 반환

**Scenario 5: 수동 배정 시 engineerId 미입력**
- **Given:** `autoAssign: false`이고 `engineerId`가 미입력
- **When:** 유효성 검증 실행
- **Then:** `engineerId` 필드에 `"수동 배정 시 엔지니어 ID를 선택해주세요"` 에러

**Scenario 6: 비Admin/Ops 사용자가 배정 시도**
- **Given:** `buyer` 역할의 사용자가 로그인됨
- **When:** `assignEngineer`를 호출함
- **Then:** `AS_010_FORBIDDEN` 에러 코드와 403 상태 반환

## :gear: Technical & Non-Functional Constraints

### 아키텍처
- **구현 방식:** Next.js Server Action — CON-12
- **권한:** Admin/Ops 전용 (RBAC: `role in ['admin', 'ops']`)
- **매칭 엔진:** `lib/domain/as/engineer-matching.ts`에 순수 함수로 구현
  - 매칭 점수 계산 로직은 비즈니스 규칙 변경에 유연하도록 설정 기반(config-driven) 구현
- **조건부 유효성:** Zod `.superRefine()` — autoAssign=false 시 engineerId 필수

### 성능
- 자동 매칭 알고리즘 실행 ≤ 200ms (엔지니어 수 ≤ 100명 가정)
- Server Action 전체 응답 p95 ≤ 500ms

### 보안
- 엔지니어 개인정보(연락처)는 배정 완료 후 수요기업에게만 노출
- 배정 기록 (배정자, 시각, 사유) 감사 로그 유지

### 안정성
- 배정 ≤ 4시간 SLA 모니터링 (CRON-007 연계)
- 가용 엔지니어 0명 시 Ops Slack 즉시 알림 → 수동 개입 유도

## :checkered_flag: Definition of Done (DoD)
- [ ] `AssignEngineerRequest`, 성공/실패/가용 없음 Response DTO가 정의되었는가?
- [ ] `EngineerMatchingCriteria`, `EngineerMatchResult` 매칭 규칙 인터페이스가 정의되었는가?
- [ ] 매칭 우선순위 (지역 → 역량 → 가용성 → 부하분산) 규칙이 문서화되었는가?
- [ ] 가용 엔지니어 0명 시 Ops 알림 + 후보 추천 플로우가 정의되었는가?
- [ ] Zod `.superRefine()` 조건부 검증 (autoAssign=false 시 engineerId 필수)이 구현되었는가?
- [ ] 에러 코드 및 HTTP 매핑이 정의되었는가?
- [ ] 단위 테스트가 통과하는가? (자동 2건 + 실패 1건 + 수동 2건 + 상태 1건 + 조건부 1건 + 권한 1건)
- [ ] ESLint / TypeScript 경고 0건인가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-007 | `AS_TICKET` 테이블 스키마 (assigned_engineer_id, assigned_at) | 필수 |
| DB-017 | `AS_ENGINEER` 테이블 스키마 (이름, 지역, 역량, 가용 상태) | 필수 |
| API-009 | `createAsTicket` DTO — AS 티켓 생애주기, AsTicketPriority 정의 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| API-011 | `resolveTicket` — AS 완료 처리 (엔지니어 배정 전제) |
| FC-012 | AS 엔지니어 배정 Command 로직 |
| TEST-009 | AS 엔지니어 배정 테스트 |
| CRON-007 | AS 24시간 미배정 모니터링 — 배정 데이터 의존 |

### 참고사항
- MVP 단계에서 엔지니어 수는 ≤ 50명 가정 (수도권 5개 산단 대상). 따라서 매칭 알고리즘의 시간 복잡도 최적화보다 **정확성·투명성**을 우선
- 자동 매칭 결과에 대해 Ops가 재배정할 수 있는 UI는 UI-008 (Admin 대시보드)에서 구현
- `AS_ENGINEER` 테이블은 SRS 6.3.5 시퀀스 다이어그램에서 요구되나, ER Diagram에 미포함된 보완 엔티티 (DB-017 참조)
