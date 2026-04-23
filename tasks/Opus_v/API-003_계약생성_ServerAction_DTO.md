---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-003: Escrow 도메인 — 계약 생성 (createContract) Server Action DTO, 계약 상태 전이 규칙 정의"
labels: 'feature, backend, api-contract, escrow, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-003] 계약 생성 (`createContract`) Server Action DTO 및 계약 상태 전이(State Machine) 규칙 정의
- 목적: 수요기업과 SI 파트너 간 계약 생성 Server Action의 **Request/Response DTO**, **상태 전이(State Machine) 규칙**, **에러 코드**를 확정한다. CONTRACT 테이블의 6종 상태 ENUM(`pending → escrow_held → inspecting → release_pending → completed / disputed`)에 대한 전이 규칙을 명세하여, 에스크로 결제 흐름의 전체 생애주기를 정의하는 핵심 계약이다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-001`](../../docs/06_SRS-v1.md) — 에스크로 결제 시스템 요구사항
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #4`](../../docs/06_SRS-v1.md) — `action: createContract` Server Action
- 데이터 모델: [`06_SRS-v1.md#6.2.4 CONTRACT`](../../docs/06_SRS-v1.md) — CONTRACT 테이블 스키마
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.1`](../../docs/06_SRS-v1.md) — 에스크로 결제 및 자금 방출 흐름
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-003`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Contract Status State Machine 정의
- [ ] 계약 상태 전이 다이어그램 작성 및 문서화
  ```
  ┌─────────┐   Admin 예치 확인   ┌──────────────┐   시공 완료    ┌─────────────┐
  │ pending  │ ───────────────────→ │ escrow_held  │ ──────────────→ │ inspecting  │
  └─────────┘                      └──────────────┘                └─────────────┘
                                                                      │         │
                                                         검수 승인 ───┘         └─── 검수 거절
                                                              ↓                        ↓
                                                   ┌──────────────────┐     ┌───────────┐
                                                   │ release_pending  │     │ disputed  │
                                                   └──────────────────┘     └───────────┘
                                                              │                    ↑
                                                   Admin 방출 ↓         기한 만료 ──┘
                                                   ┌───────────┐
                                                   │ completed │
                                                   └───────────┘
  ```
- [ ] `ContractStatus` 열거형 정의
  ```typescript
  export enum ContractStatus {
    PENDING          = 'pending',
    ESCROW_HELD      = 'escrow_held',
    INSPECTING       = 'inspecting',
    RELEASE_PENDING  = 'release_pending',
    COMPLETED        = 'completed',
    DISPUTED         = 'disputed',
  }
  ```
- [ ] 상태 전이 허용 규칙 맵 정의
  ```typescript
  export const CONTRACT_STATUS_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
    [ContractStatus.PENDING]:         [ContractStatus.ESCROW_HELD],
    [ContractStatus.ESCROW_HELD]:     [ContractStatus.INSPECTING],
    [ContractStatus.INSPECTING]:      [ContractStatus.RELEASE_PENDING, ContractStatus.DISPUTED],
    [ContractStatus.RELEASE_PENDING]: [ContractStatus.COMPLETED],
    [ContractStatus.COMPLETED]:       [],
    [ContractStatus.DISPUTED]:        [ContractStatus.RELEASE_PENDING, ContractStatus.COMPLETED],
  };
  ```

### 2단계: Request DTO 정의
- [ ] `CreateContractRequest` 타입 정의 (`lib/contracts/escrow/create-contract.ts`)
  ```typescript
  export interface CreateContractRequest {
    buyerCompanyId: string;       // 수요기업 ID (cuid)
    siPartnerId: string;          // SI 파트너 ID (cuid)
    totalAmount: number;          // 총 계약 금액 (양수, > 0)
    description?: string;         // 계약 설명 (선택, 최대 2000자)
  }
  ```

### 3단계: Zod 유효성 스키마 정의
- [ ] `createContractSchema` 작성
  ```typescript
  export const createContractSchema = z.object({
    buyerCompanyId: z.string()
      .min(1, '수요기업을 선택해주세요'),
    siPartnerId: z.string()
      .min(1, 'SI 파트너를 선택해주세요'),
    totalAmount: z.number()
      .positive('계약 금액은 0보다 커야 합니다')
      .max(999999999999.99, '계약 금액이 허용 범위를 초과합니다'),
    description: z.string()
      .max(2000, '계약 설명은 2000자 이내로 입력해주세요')
      .optional(),
  });
  ```

### 4단계: Response DTO 정의
- [ ] 성공 응답 DTO
  ```typescript
  export interface CreateContractSuccessResponse {
    success: true;
    data: {
      contractId: string;           // 생성된 CONTRACT PK (cuid)
      status: 'pending';            // 초기 상태
      totalAmount: number;
      bankInfo: {                   // 법인 계좌 안내 정보
        bankName: string;
        accountNumber: string;
        accountHolder: string;
        transferNote: string;       // 입금자명 표기 규칙
      };
      createdAt: string;
    };
  }
  ```
- [ ] 실패 응답 DTO
  ```typescript
  export interface CreateContractErrorResponse {
    success: false;
    error: {
      code: CreateContractErrorCode;
      message: string;
      details?: Record<string, string[]>;
    };
  }
  ```

### 5단계: 에러 코드 체계 정의
- [ ] `CreateContractErrorCode` 열거형 정의
  ```typescript
  export enum CreateContractErrorCode {
    VALIDATION_ERROR     = 'ESC_003_VALIDATION',
    BUYER_NOT_FOUND      = 'ESC_003_BUYER_NOT_FOUND',
    SI_NOT_FOUND         = 'ESC_003_SI_NOT_FOUND',
    SI_NOT_ACTIVE        = 'ESC_003_SI_NOT_ACTIVE',
    DUPLICATE_CONTRACT   = 'ESC_003_DUPLICATE_CONTRACT',
    UNAUTHORIZED         = 'ESC_003_UNAUTHORIZED',
    INTERNAL_ERROR       = 'ESC_003_INTERNAL',
  }
  ```
  | 에러 코드 | HTTP Status | 설명 |
  |:---|:---:|:---|
  | `ESC_003_VALIDATION` | 400 | 입력값 유효성 검증 실패 |
  | `ESC_003_BUYER_NOT_FOUND` | 404 | 존재하지 않는 수요기업 |
  | `ESC_003_SI_NOT_FOUND` | 404 | 존재하지 않는 SI 파트너 |
  | `ESC_003_SI_NOT_ACTIVE` | 400 | Admin 검토 미완료 또는 비활성 SI |
  | `ESC_003_DUPLICATE_CONTRACT` | 409 | 동일 수요기업-SI 간 진행 중 계약 존재 |
  | `ESC_003_UNAUTHORIZED` | 403 | 인증되지 않은 사용자 |
  | `ESC_003_INTERNAL` | 500 | 서버 내부 오류 |

### 6단계: 테스트 및 문서화
- [ ] Zod 스키마 및 State Machine 단위 테스트 작성
  - 유효 입력: 정상 금액, 유효 ID 조합
  - 무효 입력: 0 이하 금액, 빈 ID, 초과 금액
  - 상태 전이: 허용 전이, 불허 전이 각각 검증
- [ ] Contract Status State Machine 다이어그램 문서화

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 유효한 계약 생성 요청**
- **Given:** 유효한 `buyerCompanyId`, `siPartnerId`, `totalAmount`가 주어짐
- **When:** `createContractSchema.safeParse(input)`를 실행함
- **Then:** `success: true` 반환, 파싱 데이터가 입력과 일치

**Scenario 2: 금액 0 이하 입력 시 유효성 에러**
- **Given:** `totalAmount`가 `0`인 입력이 주어짐
- **When:** `createContractSchema.safeParse(input)`를 실행함
- **Then:** `success: false`, `totalAmount` 필드에 `"계약 금액은 0보다 커야 합니다"` 에러

**Scenario 3: 계약 생성 성공 시 법인 계좌 정보 포함 응답**
- **Given:** 유효한 입력으로 Server Action이 성공함
- **When:** 응답 객체를 검사함
- **Then:** `data.status`가 `'pending'`, `data.bankInfo`에 법인 계좌 정보(bankName, accountNumber, accountHolder) 포함

**Scenario 4: 비활성 SI 파트너와 계약 시도**
- **Given:** `siPartnerId`의 SI 파트너가 `pending_review` 상태임
- **When:** `createContract` Server Action을 호출함
- **Then:** `ESC_003_SI_NOT_ACTIVE` 에러 코드와 400 상태 반환

**Scenario 5: 상태 전이 규칙 검증 — 허용 전이**
- **Given:** `ContractStatus.INSPECTING` 상태의 계약
- **When:** `release_pending` 또는 `disputed`로 전이를 시도함
- **Then:** 전이가 허용됨

**Scenario 6: 상태 전이 규칙 검증 — 불허 전이**
- **Given:** `ContractStatus.PENDING` 상태의 계약
- **When:** `completed`로 직접 전이를 시도함
- **Then:** 전이가 거부되며 에러 반환

## :gear: Technical & Non-Functional Constraints

### 아키텍처
- **구현 방식:** Next.js Server Action — CON-12
- **상태 관리:** Contract Status State Machine은 `lib/domain/escrow/contract-state-machine.ts`에 순수 함수로 구현
- **금액 타입:** Prisma `Decimal(15,2)` 매핑, TypeScript에서는 `number`로 처리하되 DB 저장 시 Prisma Decimal 변환

### 성능
- Server Action 전체 응답 p95 ≤ 500ms

### 보안
- Buyer 본인 확인: 로그인한 사용자의 `buyerCompanyId`와 요청 `buyerCompanyId` 일치 여부 검증 필수
- 계약 금액은 서버 로그에 마스킹 처리

## :checkered_flag: Definition of Done (DoD)
- [ ] `CreateContractRequest`, 성공/실패 Response DTO가 정의되었는가?
- [ ] `ContractStatus` 열거형 및 State Machine 전이 규칙이 정의되었는가?
- [ ] `createContractSchema` Zod 스키마가 작성되었는가?
- [ ] 에러 코드 및 HTTP 매핑이 정의되었는가?
- [ ] State Machine 전이 규칙 단위 테스트가 통과하는가?
- [ ] ESLint / TypeScript 경고 0건인가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-005 | `CONTRACT` 테이블 스키마 (status ENUM 6종, FK 관계) | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| API-004 | `updateEscrowStatus` — 예치 상태 변경 (State Machine 의존) |
| API-005 | `confirmRelease` — 방출 확인 (State Machine 의존) |
| API-006 | 분쟁 접수 (State Machine 의존) |
| API-008 | 검수 승인/거절 (State Machine 의존) |
| FC-005 | 계약 생성 Command 로직 |
| UI-005 | 에스크로 결제 흐름 UI |
