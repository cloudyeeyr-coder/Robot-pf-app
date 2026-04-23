---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-005: Escrow 도메인 — 자금 방출 확인 (confirmRelease) Server Action DTO, 선행 조건(검수 승인 완료) 정의"
labels: 'feature, backend, api-contract, escrow, admin, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-005] 자금 방출 확인 (`confirmRelease`) Server Action DTO 및 선행 조건 정의
- 목적: Admin이 SI 파트너 계좌로 수기 송금을 완료한 후 에스크로 상태를 `released`로 변경하는 Server Action의 **Request/Response DTO**, **선행 조건(검수 승인 완료 필수)**, **에러 코드**를 정의한다. 이 액션은 에스크로 생애주기의 최종 단계로, 계약 상태를 `completed`로 전환하고 SI에게 대금 지급 알림을 발송하는 트리거 역할을 한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-002`](../../docs/06_SRS-v1.md) — 검수 합격 후 Admin 방출 프로세스
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #1`](../../docs/06_SRS-v1.md) — `action: confirmRelease` (updateEscrowStatus 내 방출 모드)
- 데이터 모델: [`06_SRS-v1.md#6.2.5 ESCROW_TX`](../../docs/06_SRS-v1.md) — ESCROW_TX 테이블
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.1`](../../docs/06_SRS-v1.md) — 에스크로 자금 방출 흐름
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-005`](../07_TASK-LIST-v1.md)
- 선행 DTO: API-003 (ContractStatus State Machine), API-004 (에스크로 예치)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Request DTO 정의
- [ ] `ConfirmReleaseRequest` 타입 정의 (`lib/contracts/escrow/confirm-release.ts`)
  ```typescript
  export interface ConfirmReleaseRequest {
    escrowTxId: string;          // 에스크로 TX ID (cuid)
    adminMemo: string;           // Admin 메모 (송금 증빙, 1~1000자)
    transferReference?: string;  // 이체 참조번호 (선택)
    releasedAmount?: number;     // 실제 방출 금액 (선택, 검증용)
  }
  ```

### 2단계: Zod 유효성 스키마 정의
- [ ] `confirmReleaseSchema` 작성
  ```typescript
  export const confirmReleaseSchema = z.object({
    escrowTxId: z.string()
      .min(1, '에스크로 TX ID를 입력해주세요'),
    adminMemo: z.string()
      .min(1, '방출 사유 및 증빙 메모를 입력해주세요')
      .max(1000, '메모는 1000자 이내로 입력해주세요'),
    transferReference: z.string()
      .max(100, '이체 참조번호는 100자 이내로 입력해주세요')
      .optional(),
    releasedAmount: z.number()
      .positive('방출 금액은 0보다 커야 합니다')
      .optional(),
  });
  ```

### 3단계: Response DTO 정의
- [ ] 성공 응답 DTO
  ```typescript
  export interface ConfirmReleaseSuccessResponse {
    success: true;
    data: {
      escrowTxId: string;
      contractId: string;
      state: 'released';
      releasedAt: string;            // 방출 완료 시각 (ISO 8601)
      contractStatus: 'completed';   // 계약 최종 완료 상태
    };
  }
  ```

### 4단계: 선행 조건(Pre-conditions) 정의
- [ ] 방출 실행 가능 조건 체크리스트 문서화
  ```typescript
  export interface ConfirmReleasePreconditions {
    // 1. ESCROW_TX.state === 'held' (에스크로가 예치 상태)
    escrowState: 'held';
    // 2. CONTRACT.status === 'release_pending' (검수 승인 완료)
    contractStatus: 'release_pending';
    // 3. Admin 역할 + MFA 인증
    adminAuthorized: true;
    // 4. 검수 승인 기록 존재 (inspecting → release_pending 전이 이력)
    inspectionApproved: true;
  }
  ```
- [ ] 선행 조건 불충족 시 에러 매핑:
  - 에스크로가 `held`가 아님 → `ESC_005_INVALID_ESCROW_STATE`
  - 계약이 `release_pending`이 아님 → `ESC_005_INSPECTION_NOT_APPROVED`
  - 검수 승인 이력 없음 → `ESC_005_INSPECTION_NOT_APPROVED`

### 5단계: 에러 코드 체계 정의
- [ ] `ConfirmReleaseErrorCode` 정의
  ```typescript
  export enum ConfirmReleaseErrorCode {
    VALIDATION_ERROR          = 'ESC_005_VALIDATION',
    ESCROW_NOT_FOUND          = 'ESC_005_ESCROW_NOT_FOUND',
    INVALID_ESCROW_STATE      = 'ESC_005_INVALID_ESCROW_STATE',
    INSPECTION_NOT_APPROVED   = 'ESC_005_INSPECTION_NOT_APPROVED',
    AMOUNT_MISMATCH           = 'ESC_005_AMOUNT_MISMATCH',
    UNAUTHORIZED              = 'ESC_005_UNAUTHORIZED',
    FORBIDDEN                 = 'ESC_005_FORBIDDEN',
    INTERNAL_ERROR            = 'ESC_005_INTERNAL',
  }
  ```
  | 에러 코드 | HTTP Status | 설명 |
  |:---|:---:|:---|
  | `ESC_005_VALIDATION` | 400 | 입력값 유효성 실패 |
  | `ESC_005_ESCROW_NOT_FOUND` | 404 | 에스크로 TX 미존재 |
  | `ESC_005_INVALID_ESCROW_STATE` | 400 | 에스크로 상태가 `held`가 아님 |
  | `ESC_005_INSPECTION_NOT_APPROVED` | 400 | 검수 승인 미완료 (계약 상태 ≠ `release_pending`) |
  | `ESC_005_AMOUNT_MISMATCH` | 400 | 방출 금액 ≠ 에스크로 예치 금액 |
  | `ESC_005_UNAUTHORIZED` | 401 | 미인증 |
  | `ESC_005_FORBIDDEN` | 403 | Admin 아님 |
  | `ESC_005_INTERNAL` | 500 | 서버 오류 |

### 6단계: Server Action 시그니처 및 테스트
- [ ] Server Action 함수 시그니처 확정
  ```typescript
  'use server';
  export async function confirmRelease(
    prevState: ConfirmReleaseResponse | null,
    formData: FormData
  ): Promise<ConfirmReleaseResponse> {
    // 1. Admin 권한 + MFA 검증
    // 2. 유효성 검증
    // 3. ESCROW_TX 조회 (state === 'held' 확인)
    // 4. CONTRACT 조회 (status === 'release_pending' 확인)
    // 5. Prisma 트랜잭션:
    //    - ESCROW_TX UPDATE (state=released, released_at=now())
    //    - CONTRACT UPDATE (status=completed)
    // 6. SI 파트너에게 "대금 지급 완료" 알림 발송
    // 7. 성공/실패 응답 반환
  }
  ```
- [ ] 단위 테스트 작성 (유효 4건 + 무효 6건)

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 검수 승인 후 Admin 자금 방출 확인**
- **Given:** `release_pending` 상태의 계약과 `held` 상태의 ESCROW_TX가 존재함
- **When:** Admin이 `adminMemo`를 포함하여 `confirmRelease`를 호출함
- **Then:** ESCROW_TX `state=released`, `released_at` 기록, CONTRACT `status=completed` 전환

**Scenario 2: 검수 미승인 상태에서 방출 시도**
- **Given:** CONTRACT 상태가 `inspecting` (검수 승인 전)이고, ESCROW_TX 상태가 `held`
- **When:** `confirmRelease`를 호출함
- **Then:** `ESC_005_INSPECTION_NOT_APPROVED` 에러 코드와 400 상태 반환

**Scenario 3: 이미 방출 완료된 에스크로에 중복 방출 시도**
- **Given:** ESCROW_TX 상태가 이미 `released`
- **When:** `confirmRelease`를 호출함
- **Then:** `ESC_005_INVALID_ESCROW_STATE` 에러 코드와 400 상태 반환

**Scenario 4: 비Admin 사용자가 방출 시도**
- **Given:** `buyer` 역할의 사용자가 로그인됨
- **When:** `confirmRelease`를 호출함
- **Then:** `ESC_005_FORBIDDEN` 에러 코드와 403 상태 반환

## :gear: Technical & Non-Functional Constraints

### 아키텍처
- **구현 방식:** Next.js Server Action — CON-12
- **권한:** Admin 전용 (RBAC: `role === 'admin'` + MFA) — REQ-NF-016
- **트랜잭션:** ESCROW_TX UPDATE + CONTRACT UPDATE 원자적 실행 (Prisma `$transaction`)
- **State Machine:** API-003에서 정의된 `release_pending → completed` 전이 규칙 참조

### 보안
- `released_at`, `admin_memo` 5년 보존 — CON-08
- 방출 금액 서버 로그 마스킹

### 안정성
- 에스크로 결제 오류율 < 0.1% — REQ-NF-008

## :checkered_flag: Definition of Done (DoD)
- [ ] Request/Response DTO가 정의되었는가?
- [ ] 선행 조건(Pre-conditions) 4항목이 문서화되었는가?
- [ ] 에러 코드 및 HTTP 매핑이 정의되었는가?
- [ ] Zod 스키마 단위 테스트가 통과하는가?
- [ ] ESLint / TypeScript 경고 0건인가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-006 | `ESCROW_TX` 테이블 스키마 | 필수 |
| API-003 | ContractStatus State Machine 정의 | 필수 |
| API-004 | `updateEscrowStatus` — 에스크로 예치 (held 상태 전제) | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| FC-009 | Admin 자금 방출 확인 Command 로직 |
| TEST-006 | `confirmRelease` 단위 테스트 |
