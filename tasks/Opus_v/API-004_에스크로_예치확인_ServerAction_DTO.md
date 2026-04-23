---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-004: Escrow 도메인 — Admin 에스크로 예치 확인 (updateEscrowStatus) Server Action DTO, Admin 권한 검증 규칙 정의"
labels: 'feature, backend, api-contract, escrow, admin, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-004] Admin 에스크로 예치 확인 (`updateEscrowStatus`) Server Action DTO 및 Admin 권한 검증 규칙 정의
- 목적: Admin이 수요기업의 무통장 입금을 확인한 후 에스크로 상태를 `held`로 변경하는 Server Action의 **Request/Response DTO**, **Admin 권한 검증 규칙**, **에러 코드**를 정의한다. 이 액션은 MVP의 핵심 자금 보호 메커니즘으로, Admin만 실행 가능하며 `admin_verified_at` 타임스탬프와 `admin_memo`를 필수 기록한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-001`](../../docs/06_SRS-v1.md) — 에스크로 결제 시스템 (Admin 수동 확인)
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #1`](../../docs/06_SRS-v1.md) — `action: updateEscrowStatus` Server Action
- 데이터 모델: [`06_SRS-v1.md#6.2.5 ESCROW_TX`](../../docs/06_SRS-v1.md) — 에스크로 거래 테이블 스키마
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.1`](../../docs/06_SRS-v1.md) — 에스크로 결제 및 자금 방출 흐름
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-004`](../07_TASK-LIST-v1.md)
- 선행 DTO: API-003 (`ContractStatus` State Machine, 계약 상태 전이 규칙)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Request DTO 정의
- [ ] `UpdateEscrowStatusRequest` 타입 정의 (`lib/contracts/escrow/update-escrow-status.ts`)
  ```typescript
  export interface UpdateEscrowStatusRequest {
    contractId: string;          // 대상 계약 ID (cuid)
    amount: number;              // 확인된 입금 금액 (양수, > 0)
    adminMemo: string;           // Admin 메모 (입금자명, 증빙 정보 등, 1~1000자)
    depositorName?: string;      // 입금자명 (선택)
    depositedAt?: string;        // 실제 입금 시각 (ISO 8601, 선택)
  }
  ```

### 2단계: Zod 유효성 스키마 정의
- [ ] `updateEscrowStatusSchema` 작성
  ```typescript
  export const updateEscrowStatusSchema = z.object({
    contractId: z.string()
      .min(1, '계약 ID를 입력해주세요'),
    amount: z.number()
      .positive('입금 금액은 0보다 커야 합니다'),
    adminMemo: z.string()
      .min(1, '관리자 메모를 입력해주세요')
      .max(1000, '메모는 1000자 이내로 입력해주세요'),
    depositorName: z.string()
      .max(100, '입금자명은 100자 이내로 입력해주세요')
      .optional(),
    depositedAt: z.string()
      .datetime({ message: '올바른 날짜/시간 형식(ISO 8601)을 입력해주세요' })
      .optional(),
  });
  ```

### 3단계: Response DTO 정의
- [ ] 성공 응답 DTO
  ```typescript
  export interface UpdateEscrowStatusSuccessResponse {
    success: true;
    data: {
      escrowTxId: string;           // 생성된 ESCROW_TX PK
      contractId: string;
      state: 'held';                // 에스크로 상태
      amount: number;
      adminVerifiedAt: string;      // Admin 확인 시각 (ISO 8601)
      heldAt: string;               // 예치 완료 시각 (ISO 8601)
    };
  }
  ```

### 4단계: Admin 권한 검증 규칙 정의
- [ ] Admin 권한 검증 체크리스트 정의
  ```typescript
  export interface AdminAuthorizationRule {
    // 1. 세션 확인: 로그인된 사용자인가?
    requireAuthenticated: true;
    // 2. 역할 확인: role === 'admin' 인가?
    requiredRole: 'admin';
    // 3. MFA 확인: TOTP MFA가 활성화되어 있는가? (REQ-NF-016)
    requireMfa: true;
  }
  ```
- [ ] 권한 검증 실패 시 에러 응답 정의:
  - 미인증 → 401 Unauthorized
  - 비Admin 역할 → 403 Forbidden
  - MFA 미활성 → 403 Forbidden (`MFA_REQUIRED`)

### 5단계: 에러 코드 체계 정의
- [ ] `UpdateEscrowStatusErrorCode` 정의
  ```typescript
  export enum UpdateEscrowStatusErrorCode {
    VALIDATION_ERROR      = 'ESC_004_VALIDATION',
    CONTRACT_NOT_FOUND    = 'ESC_004_CONTRACT_NOT_FOUND',
    INVALID_STATUS        = 'ESC_004_INVALID_STATUS',     // 계약이 'pending' 상태가 아님
    AMOUNT_MISMATCH       = 'ESC_004_AMOUNT_MISMATCH',    // 입금 금액과 계약 금액 불일치
    ESCROW_ALREADY_EXISTS = 'ESC_004_ESCROW_EXISTS',      // 이미 에스크로 TX 존재
    UNAUTHORIZED          = 'ESC_004_UNAUTHORIZED',
    FORBIDDEN             = 'ESC_004_FORBIDDEN',
    MFA_REQUIRED          = 'ESC_004_MFA_REQUIRED',
    INTERNAL_ERROR        = 'ESC_004_INTERNAL',
  }
  ```
  | 에러 코드 | HTTP Status | 설명 |
  |:---|:---:|:---|
  | `ESC_004_VALIDATION` | 400 | 입력값 유효성 실패 |
  | `ESC_004_CONTRACT_NOT_FOUND` | 404 | 계약 미존재 |
  | `ESC_004_INVALID_STATUS` | 400 | 계약 상태가 `pending`이 아님 (State Machine 위반) |
  | `ESC_004_AMOUNT_MISMATCH` | 400 | 입금액 ≠ 계약 총액 |
  | `ESC_004_ESCROW_EXISTS` | 409 | 해당 계약에 이미 에스크로 TX 존재 (UNIQUE 제약) |
  | `ESC_004_UNAUTHORIZED` | 401 | 미인증 |
  | `ESC_004_FORBIDDEN` | 403 | Admin 역할 아님 |
  | `ESC_004_MFA_REQUIRED` | 403 | MFA 미활성 |
  | `ESC_004_INTERNAL` | 500 | 서버 오류 |

### 6단계: Server Action 시그니처 및 테스트
- [ ] Server Action 함수 시그니처 확정
  ```typescript
  'use server';
  export async function updateEscrowStatus(
    prevState: UpdateEscrowStatusResponse | null,
    formData: FormData
  ): Promise<UpdateEscrowStatusResponse> {
    // 1. Admin 권한 검증 (role + MFA)
    // 2. FormData → 객체 변환
    // 3. updateEscrowStatusSchema.safeParse() 유효성 검증
    // 4. CONTRACT 조회 (status === 'pending' 확인)
    // 5. 금액 일치 확인 (amount === contract.totalAmount)
    // 6. Prisma 트랜잭션:
    //    - ESCROW_TX INSERT (state=held, admin_verified_at=now(), held_at=now())
    //    - CONTRACT UPDATE (status=escrow_held)
    // 7. 보증서 자동 발급 트리거 (≤ 1분) — 비동기 호출
    // 8. 수요기업에게 "예치 완료" 알림 발송
    // 9. 성공/실패 응답 반환
  }
  ```
- [ ] 단위 테스트 작성 (유효 5건 + 무효 8건)

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: Admin이 유효한 입금을 확인하여 에스크로 예치 처리**
- **Given:** `pending` 상태의 계약과 Admin 역할 사용자가 주어짐
- **When:** 계약 금액과 일치하는 `amount`와 `adminMemo`를 포함하여 `updateEscrowStatus`를 호출함
- **Then:** ESCROW_TX가 `state=held`로 생성되고, CONTRACT 상태가 `escrow_held`로 전환, `adminVerifiedAt` 타임스탬프 기록

**Scenario 2: 비Admin 사용자가 예치 확인 시도**
- **Given:** `buyer` 역할의 사용자가 로그인되어 있음
- **When:** `updateEscrowStatus` Server Action을 호출함
- **Then:** `ESC_004_FORBIDDEN` 에러 코드와 403 상태 반환

**Scenario 3: 이미 에스크로 TX가 존재하는 계약에 중복 예치 시도**
- **Given:** `escrow_held` 상태이며 ESCROW_TX가 이미 존재하는 계약이 주어짐
- **When:** 해당 계약에 대해 `updateEscrowStatus`를 호출함
- **Then:** `ESC_004_ESCROW_EXISTS` 에러 코드와 409 상태 반환

**Scenario 4: 입금 금액과 계약 금액 불일치**
- **Given:** 계약 총액이 10,000,000원이고, Admin이 확인한 `amount`가 5,000,000원
- **When:** `updateEscrowStatus`를 호출함
- **Then:** `ESC_004_AMOUNT_MISMATCH` 에러 코드와 400 상태, 불일치 상세 메시지 반환

**Scenario 5: Admin 메모 미입력 시 유효성 에러**
- **Given:** `adminMemo`가 빈 문자열인 입력이 주어짐
- **When:** `updateEscrowStatusSchema.safeParse(input)`를 실행함
- **Then:** `success: false`, `adminMemo` 필드에 에러 메시지 포함

## :gear: Technical & Non-Functional Constraints

### 아키텍처
- **구현 방식:** Next.js Server Action — CON-12
- **권한:** Admin 전용 액션 (RBAC: `role === 'admin'`) — REQ-NF-016
- **트랜잭션:** ESCROW_TX INSERT + CONTRACT STATUS UPDATE는 단일 Prisma `$transaction` 내에서 원자적 실행

### 성능
- Server Action 전체 응답 p95 ≤ 500ms

### 보안
- Admin MFA(TOTP) 활성화 필수 확인 — REQ-NF-016
- 결제 금액 서버 로그 마스킹 처리
- `admin_verified_at`, `admin_memo` 5년 보존 — CON-08

### 안정성
- 에스크로 결제 오류율 < 0.1% — REQ-NF-008
- ESCROW_TX → CONTRACT FK 관계로 인한 Orphan 레코드 방지

## :checkered_flag: Definition of Done (DoD)
- [ ] Request/Response DTO가 정의되었는가?
- [ ] Admin 권한 검증 규칙 (role + MFA) 이 문서화되었는가?
- [ ] `UpdateEscrowStatusErrorCode` 에러 코드 및 HTTP 매핑이 정의되었는가?
- [ ] Zod 스키마 단위 테스트가 통과하는가?
- [ ] State Machine 전이 규칙(`pending → escrow_held`)이 API-003과 일관성을 유지하는가?
- [ ] ESLint / TypeScript 경고 0건인가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-006 | `ESCROW_TX` 테이블 스키마 (state ENUM, UNIQUE FK→CONTRACT) | 필수 |
| API-003 | `createContract` DTO — ContractStatus State Machine 정의 의존 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| FC-006 | Admin 에스크로 예치 확인 Command 로직 |
| FC-014 | 보증서 자동 발급 — 예치 완료 트리거 |
| API-005 | `confirmRelease` — 방출 확인 (에스크로 TX 존재 전제) |
| FQ-007 | Admin 대시보드 에스크로 거래 목록 조회 |
