---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-006: Escrow 도메인 — 분쟁 접수 (POST /api/escrow/dispute) Route Handler DTO, 에러 코드 정의"
labels: 'feature, backend, api-contract, escrow, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-006] 분쟁 접수 (`POST /api/escrow/dispute`) Route Handler Request/Response DTO 및 에러 코드 정의
- 목적: 수요기업이 검수 거절 또는 분쟁을 신청할 때 사용하는 Route Handler의 **Request/Response DTO**, **분쟁 상태 전환 규칙**, **에러 코드**를 정의한다. 분쟁 접수 시 CONTRACT 상태가 `disputed`로 전환되며, 자금은 에스크로에 유지(방출 불가)되고, 중재팀에 ≤ 2영업일 내 알림이 전송된다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-003`](../../docs/06_SRS-v1.md) — 분쟁 발생 시 중재 프로세스 자동 개시
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #2`](../../docs/06_SRS-v1.md) — `POST /api/escrow/dispute` Route Handler
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.1`](../../docs/06_SRS-v1.md) — 검수 거절 / 분쟁 흐름
- 데이터 모델: [`06_SRS-v1.md#6.2.4 CONTRACT`](../../docs/06_SRS-v1.md) — status ENUM
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-006`](../07_TASK-LIST-v1.md)
- 선행 DTO: API-003 (ContractStatus State Machine)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Request DTO 정의
- [ ] `CreateDisputeRequest` 타입 정의 (`lib/contracts/escrow/create-dispute.ts`)
  ```typescript
  export interface CreateDisputeRequest {
    contractId: string;          // 분쟁 대상 계약 ID (cuid)
    reason: DisputeReason;       // 분쟁 사유 카테고리
    description: string;         // 상세 분쟁 사유 (10~2000자)
    evidenceUrls?: string[];     // 증빙 자료 URL 목록 (선택, 최대 5개)
  }

  export enum DisputeReason {
    QUALITY_DEFECT     = 'quality_defect',      // 시공 품질 결함
    SPECIFICATION_MISMATCH = 'specification_mismatch', // 사양 불일치
    SCHEDULE_BREACH    = 'schedule_breach',      // 납기 위반
    COMMUNICATION_FAILURE = 'communication_failure', // 소통 불가
    OTHER              = 'other',                // 기타
  }
  ```

### 2단계: Zod 유효성 스키마 정의
- [ ] `createDisputeSchema` 작성
  ```typescript
  export const createDisputeSchema = z.object({
    contractId: z.string()
      .min(1, '계약 ID를 입력해주세요'),
    reason: z.nativeEnum(DisputeReason, {
      errorMap: () => ({ message: '유효한 분쟁 사유를 선택해주세요' })
    }),
    description: z.string()
      .min(10, '분쟁 사유는 최소 10자 이상 입력해주세요')
      .max(2000, '분쟁 사유는 2000자 이내로 입력해주세요'),
    evidenceUrls: z.array(z.string().url('올바른 URL을 입력해주세요'))
      .max(5, '증빙 자료는 최대 5개까지 첨부 가능합니다')
      .optional(),
  });
  ```

### 3단계: Response DTO 정의
- [ ] 성공 응답 DTO
  ```typescript
  export interface CreateDisputeSuccessResponse {
    success: true;
    data: {
      contractId: string;
      previousStatus: string;        // 분쟁 전 상태 (inspecting 또는 escrow_held)
      currentStatus: 'disputed';
      disputeCreatedAt: string;      // 분쟁 접수 시각 (ISO 8601)
      estimatedMediationStart: string; // 예상 중재 개시일 (≤ 2영업일)
      message: string;               // 사용자 안내 메시지
    };
  }
  ```

### 4단계: 분쟁 상태 전환 규칙 정의
- [ ] 분쟁 접수 허용 조건 정의
  ```typescript
  export const DISPUTABLE_STATUSES: ContractStatus[] = [
    ContractStatus.ESCROW_HELD,    // 예치 후 분쟁
    ContractStatus.INSPECTING,     // 검수 중 분쟁
  ];
  ```
- [ ] 분쟁 접수 시 동작 규칙:
  1. CONTRACT.status → `disputed` 전환
  2. ESCROW_TX.state 유지 (`held` — 방출 불가)
  3. 중재팀 알림 발송 (≤ 2영업일 내 중재 개시)
  4. 수요기업에게 "분쟁 접수 확인" 알림

### 5단계: 에러 코드 체계 정의
- [ ] `CreateDisputeErrorCode` 정의
  ```typescript
  export enum CreateDisputeErrorCode {
    VALIDATION_ERROR       = 'ESC_006_VALIDATION',
    CONTRACT_NOT_FOUND     = 'ESC_006_CONTRACT_NOT_FOUND',
    INVALID_STATUS         = 'ESC_006_INVALID_STATUS',
    NOT_CONTRACT_PARTY     = 'ESC_006_NOT_CONTRACT_PARTY',
    ALREADY_DISPUTED       = 'ESC_006_ALREADY_DISPUTED',
    UNAUTHORIZED           = 'ESC_006_UNAUTHORIZED',
    INTERNAL_ERROR         = 'ESC_006_INTERNAL',
  }
  ```
  | 에러 코드 | HTTP Status | 설명 |
  |:---|:---:|:---|
  | `ESC_006_VALIDATION` | 400 | 입력값 유효성 실패 |
  | `ESC_006_CONTRACT_NOT_FOUND` | 404 | 계약 미존재 |
  | `ESC_006_INVALID_STATUS` | 400 | 분쟁 불가 상태 (pending, completed 등) |
  | `ESC_006_NOT_CONTRACT_PARTY` | 403 | 해당 계약의 당사자가 아님 |
  | `ESC_006_ALREADY_DISPUTED` | 409 | 이미 분쟁 상태 |
  | `ESC_006_UNAUTHORIZED` | 401 | 미인증 |
  | `ESC_006_INTERNAL` | 500 | 서버 오류 |

### 6단계: Route Handler 시그니처 및 테스트
- [ ] Route Handler 정의 (`app/api/escrow/dispute/route.ts`)
  ```typescript
  export async function POST(request: Request): Promise<Response> {
    // 1. 인증 확인 (buyer 역할)
    // 2. Request Body JSON 파싱
    // 3. createDisputeSchema.safeParse() 유효성 검증
    // 4. CONTRACT 조회 및 당사자 확인
    // 5. 분쟁 가능 상태 확인 (DISPUTABLE_STATUSES)
    // 6. Prisma: CONTRACT UPDATE (status=disputed)
    // 7. 중재팀 알림 발송
    // 8. NextResponse.json() 반환
  }
  ```
- [ ] 단위 테스트 작성 (유효 3건 + 무효 6건)

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 검수 중 분쟁 접수 성공**
- **Given:** `inspecting` 상태의 계약이 존재하고, 수요기업이 로그인됨
- **When:** 유효한 `reason`, `description`을 포함하여 `POST /api/escrow/dispute`를 호출함
- **Then:** CONTRACT 상태가 `disputed`로 전환, ESCROW_TX 상태는 `held` 유지, 중재팀 알림 발송

**Scenario 2: 분쟁 불가 상태에서 분쟁 시도**
- **Given:** `completed` 상태의 계약이 존재함
- **When:** 분쟁 접수를 요청함
- **Then:** `ESC_006_INVALID_STATUS` 에러 코드와 400 상태 반환

**Scenario 3: 계약 당사자가 아닌 사용자의 분쟁 시도**
- **Given:** 다른 수요기업의 사용자가 로그인됨
- **When:** 해당 사용자가 남의 계약에 분쟁 접수를 시도함
- **Then:** `ESC_006_NOT_CONTRACT_PARTY` 에러 코드와 403 상태 반환

**Scenario 4: 분쟁 사유 미달 (10자 미만)**
- **Given:** `description`이 `"불량"` (3자)인 입력이 주어짐
- **When:** 유효성 검증 실행
- **Then:** `description` 필드에 `"분쟁 사유는 최소 10자 이상 입력해주세요"` 에러

## :gear: Technical & Non-Functional Constraints

### 아키텍처
- **구현 방식:** Next.js Route Handler (`POST /api/escrow/dispute`) — CON-12
  - Route Handler 사용 이유: 외부 시스템(Admin 대시보드 등)에서 REST API로 접근 가능성 고려
- **State Machine:** API-003 `ContractStatus` State Machine의 전이 규칙 준수

### 보안
- 계약 당사자(buyerCompanyId) 확인 필수
- 분쟁 내용(`description`) 서버 로그에 마스킹 불필요 (사내 증빙 용도)
- ESCROW_TX 상태 `held` 유지 — 분쟁 중 자금 방출 원천 차단

### 성능
- Route Handler 응답 p95 ≤ 500ms

## :checkered_flag: Definition of Done (DoD)
- [ ] Request/Response DTO가 정의되었는가?
- [ ] `DisputeReason` 열거형 및 `DISPUTABLE_STATUSES` 규칙이 정의되었는가?
- [ ] 에러 코드 및 HTTP 매핑이 정의되었는가?
- [ ] Zod 스키마 단위 테스트가 통과하는가?
- [ ] ESLint / TypeScript 경고 0건인가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-005 | `CONTRACT` 테이블 스키마 (status ENUM, disputed 포함) | 필수 |
| API-003 | ContractStatus State Machine 정의 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| FC-010 | 분쟁 접수 Command 로직 |
| TEST-004 | 검수 거절 + 분쟁 자동 개시 테스트 |
| UI-006 | 검수 승인/거절 UI — 분쟁 접수 안내 |
