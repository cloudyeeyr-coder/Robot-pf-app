---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-007: Escrow 도메인 — 에스크로 TX 상태 조회 (GET /api/escrow/[txId]/status) Route Handler Response DTO 정의"
labels: 'feature, backend, api-contract, escrow, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [API-007] 에스크로 TX 상태 조회 (`GET /api/escrow/[txId]/status`) Route Handler Response DTO 정의
- 목적: 에스크로 거래의 현재 상태(`held` / `released` / `refunded`)를 조회하는 Route Handler의 **Response DTO**를 정의한다. 수요기업 및 SI 파트너가 거래 진행 상황을 실시간으로 확인할 수 있는 읽기 전용 API로, 복잡도가 낮은(L) 조회 전용 엔드포인트이다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-001`](../../docs/06_SRS-v1.md) — 에스크로 결제 시스템
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #3`](../../docs/06_SRS-v1.md) — `GET /api/escrow/[txId]/status` Route Handler
- 데이터 모델: [`06_SRS-v1.md#6.2.5 ESCROW_TX`](../../docs/06_SRS-v1.md) — ESCROW_TX 테이블 스키마
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-007`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: URL 파라미터 스키마 정의
- [ ] 경로 파라미터 유효성 검증 (`lib/contracts/escrow/get-escrow-status.ts`)
  ```typescript
  export const escrowStatusParamsSchema = z.object({
    txId: z.string()
      .min(1, '에스크로 TX ID가 필요합니다'),
  });
  ```

### 2단계: Response DTO 정의
- [ ] 성공 응답 DTO
  ```typescript
  export interface GetEscrowStatusResponse {
    success: true;
    data: {
      escrowTxId: string;
      contractId: string;
      state: EscrowState;            // 'held' | 'released' | 'refunded'
      amount: number;
      heldAt: string | null;         // 예치 완료 시각 (ISO 8601)
      releasedAt: string | null;     // 방출 완료 시각
      refundedAt: string | null;     // 환불 완료 시각
      adminVerifiedAt: string | null;
      contractStatus: string;        // 연결된 계약의 현재 상태
      createdAt: string;
    };
  }

  export enum EscrowState {
    HELD     = 'held',
    RELEASED = 'released',
    REFUNDED = 'refunded',
  }
  ```
- [ ] 에러 응답 DTO
  ```typescript
  export interface GetEscrowStatusErrorResponse {
    success: false;
    error: {
      code: GetEscrowStatusErrorCode;
      message: string;
    };
  }
  ```

### 3단계: 에러 코드 정의
- [ ] `GetEscrowStatusErrorCode` 정의
  ```typescript
  export enum GetEscrowStatusErrorCode {
    INVALID_TX_ID     = 'ESC_007_INVALID_TX_ID',
    TX_NOT_FOUND      = 'ESC_007_TX_NOT_FOUND',
    NOT_AUTHORIZED     = 'ESC_007_NOT_AUTHORIZED',   // 계약 당사자가 아님
    UNAUTHORIZED      = 'ESC_007_UNAUTHORIZED',
    INTERNAL_ERROR    = 'ESC_007_INTERNAL',
  }
  ```
  | 에러 코드 | HTTP Status | 설명 |
  |:---|:---:|:---|
  | `ESC_007_INVALID_TX_ID` | 400 | 유효하지 않은 TX ID 형식 |
  | `ESC_007_TX_NOT_FOUND` | 404 | 에스크로 TX 미존재 |
  | `ESC_007_NOT_AUTHORIZED` | 403 | 해당 거래의 계약 당사자가 아님 |
  | `ESC_007_UNAUTHORIZED` | 401 | 미인증 |
  | `ESC_007_INTERNAL` | 500 | 서버 오류 |

### 4단계: Route Handler 시그니처 및 테스트
- [ ] Route Handler 정의 (`app/api/escrow/[txId]/status/route.ts`)
  ```typescript
  export async function GET(
    request: Request,
    { params }: { params: { txId: string } }
  ): Promise<Response> {
    // 1. 인증 확인
    // 2. txId 유효성 검증
    // 3. ESCROW_TX 조회 (include: contract)
    // 4. 계약 당사자 확인 (buyer 또는 si_partner 또는 admin)
    // 5. Response DTO 구성 후 반환
  }
  ```
- [ ] 단위 테스트 작성 (유효 3건 + 무효 4건)

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 유효한 에스크로 TX 상태 조회**
- **Given:** `held` 상태의 ESCROW_TX가 존재하고, 해당 계약의 수요기업이 로그인됨
- **When:** `GET /api/escrow/{txId}/status`를 호출함
- **Then:** 200 OK, `data.state`가 `'held'`, `data.heldAt`에 타임스탬프, `data.amount`에 예치 금액 포함

**Scenario 2: 존재하지 않는 TX ID 조회**
- **Given:** DB에 존재하지 않는 `txId`가 주어짐
- **When:** `GET /api/escrow/{txId}/status`를 호출함
- **Then:** `ESC_007_TX_NOT_FOUND` 에러 코드와 404 상태 반환

**Scenario 3: 계약 당사자가 아닌 사용자의 조회 시도**
- **Given:** 해당 계약과 무관한 사용자가 로그인됨
- **When:** `GET /api/escrow/{txId}/status`를 호출함
- **Then:** `ESC_007_NOT_AUTHORIZED` 에러 코드와 403 상태 반환

## :gear: Technical & Non-Functional Constraints

### 아키텍처
- **구현 방식:** Next.js Route Handler (`GET /api/escrow/[txId]/status`) — CON-12
- **읽기 전용:** 데이터 변경 없는 조회 API

### 성능
- 응답 p95 ≤ 300ms (단순 PK 기반 조회)

### 보안
- 계약 당사자(buyer/si_partner) 또는 Admin만 조회 가능
- 금액 정보는 인가된 사용자에게만 노출

## :checkered_flag: Definition of Done (DoD)
- [ ] Response DTO (`GetEscrowStatusResponse`)가 정의되었는가?
- [ ] `EscrowState` 열거형이 정의되었는가?
- [ ] 에러 코드 및 HTTP 매핑이 정의되었는가?
- [ ] URL 파라미터 유효성 스키마가 작성되었는가?
- [ ] 단위 테스트가 통과하는가?
- [ ] ESLint / TypeScript 경고 0건인가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-006 | `ESCROW_TX` 테이블 스키마 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| FQ-004 | 에스크로 TX 상태 조회 — Route Handler 구현 |
| UI-005 | 에스크로 결제 흐름 UI — 상태 표시 |
