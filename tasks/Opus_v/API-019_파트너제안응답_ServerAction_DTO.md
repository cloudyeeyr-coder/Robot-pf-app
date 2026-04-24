---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-019: Partnership 도메인 — 파트너 제안 응답 (respondProposal) Server Action DTO, 수락 시 뱃지 자동 발급 연계 규칙 정의"
labels: 'feature, backend, api-contract, badge, partnership, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-019] 파트너 제안 응답 (`respondProposal`) Server Action DTO 및 수락 시 뱃지 자동 발급 연계 규칙 정의
- 목적: SI 파트너가 제조사로부터 수신한 파트너 제안에 **수락(accept)** 또는 **거절(reject)** 응답을 수행하는 Server Action의 DTO, 수락 시 뱃지 자동 발급 연계 규칙, 에러 코드를 정의한다. 수락 시 `issueBadge`(API-016) 로직이 자동 호출되어 인증 뱃지가 즉시 생성된다.

## :link: References (Spec & Context)
- SRS: [`06_SRS-v1.md#REQ-FUNC-030`](../../docs/06_SRS-v1.md) — 파트너 제안 수락/거절
- SRS: [`06_SRS-v1.md#REQ-FUNC-013`](../../docs/06_SRS-v1.md) — 뱃지 자동 발급
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #21`](../../docs/06_SRS-v1.md) — `action: respondProposal`
- 데이터 모델: `DB-013` (PARTNER_PROPOSAL), [`06_SRS-v1.md#6.2.7 BADGE`](../../docs/06_SRS-v1.md)
- 선행 DTO: API-018 (ProposalStatus ENUM), API-016 (issueBadge 인터페이스)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 응답 판정 타입 및 Request DTO
- [ ] `ProposalVerdict` ENUM 및 `RespondProposalRequest` 정의
  ```typescript
  export enum ProposalVerdict {
    ACCEPT = 'accept',
    REJECT = 'reject',
  }

  export interface RespondProposalRequest {
    proposalId: string;
    verdict: ProposalVerdict;
    rejectionReason?: string;   // 거절 시 필수 (1~500자)
    acceptanceNote?: string;    // 수락 메모 (선택, 최대 500자)
  }
  ```

### 2단계: Zod 스키마 (조건부 검증)
- [ ] `respondProposalSchema` — 거절 시 `rejectionReason` 필수
  ```typescript
  export const respondProposalSchema = z.object({
    proposalId: z.string().min(1, '제안 ID를 입력해주세요'),
    verdict: z.nativeEnum(ProposalVerdict),
    rejectionReason: z.string().min(1).max(500).optional(),
    acceptanceNote: z.string().max(500).optional(),
  }).superRefine((data, ctx) => {
    if (data.verdict === ProposalVerdict.REJECT && !data.rejectionReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '거절 시 거절 사유를 반드시 입력해주세요',
        path: ['rejectionReason'],
      });
    }
  });
  ```

### 3단계: 수락 → 뱃지 자동 발급 연계 규칙
- [ ] 워크플로우 정의
  ```
  [수락] → Prisma $transaction:
           1. PROPOSAL UPDATE (status=accepted, responded_at=now())
           2. BADGE INSERT (is_active=true, expires_at 산정)
         → 제조사 알림 (수락 + 뱃지 확인)
         → SI 프로필 반영 ≤ 1시간

  [거절] → PROPOSAL UPDATE (status=rejected, responded_at, rejection_reason)
         → 제조사에게 거절 사유 알림
  ```
- [ ] 트랜잭션 원자성: PROPOSAL + BADGE 동시 처리, 실패 시 전체 롤백

### 4단계: Response DTO
- [ ] 수락 성공 응답
  ```typescript
  export interface AcceptProposalSuccessResponse {
    success: true;
    data: {
      proposalId: string;
      status: 'accepted';
      respondedAt: string;
      badge: { badgeId: string; manufacturerName: string; issuedAt: string; expiresAt: string; };
      message: string;
    };
  }
  ```
- [ ] 거절 성공 응답
  ```typescript
  export interface RejectProposalSuccessResponse {
    success: true;
    data: {
      proposalId: string;
      status: 'rejected';
      respondedAt: string;
      rejectionReason: string;
      message: string;
    };
  }
  ```

### 5단계: 에러 코드
- [ ] `RespondProposalErrorCode` 정의
  ```typescript
  export enum RespondProposalErrorCode {
    VALIDATION_ERROR        = 'PTR_019_VALIDATION',
    PROPOSAL_NOT_FOUND      = 'PTR_019_NOT_FOUND',         // 404
    PROPOSAL_NOT_PENDING    = 'PTR_019_NOT_PENDING',        // 409 (이미 응답/만료)
    NOT_TARGET_SI           = 'PTR_019_NOT_TARGET_SI',      // 403
    REJECTION_REASON_MISSING= 'PTR_019_REJECTION_REASON',   // 400
    BADGE_ISSUE_FAILED      = 'PTR_019_BADGE_FAILED',       // 500 (롤백)
    UNAUTHORIZED            = 'PTR_019_UNAUTHORIZED',        // 401
    INTERNAL_ERROR          = 'PTR_019_INTERNAL',            // 500
  }
  ```

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 수락 시 뱃지 자동 발급**
- **Given:** pending 상태의 파트너 제안, 대상 SI 로그인
- **When:** `verdict: 'accept'`로 호출
- **Then:** PROPOSAL status=accepted, BADGE 자동 생성, 제조사 알림, 프로필 반영 ≤ 1시간

**Scenario 2: 거절 시 사유 포함**
- **Given:** pending 제안
- **When:** `verdict: 'reject'`, `rejectionReason` 포함 호출
- **Then:** PROPOSAL status=rejected, 제조사에게 사유 알림

**Scenario 3: 거절 시 사유 누락**
- **Given:** `verdict: 'reject'`, `rejectionReason` 미입력
- **When:** 유효성 검증
- **Then:** `rejectionReason` 에러 메시지 반환

**Scenario 4: 만료된 제안에 응답**
- **Given:** status=expired 제안
- **When:** 응답 시도
- **Then:** `PTR_019_NOT_PENDING` 에러 409

**Scenario 5: 대상 SI가 아닌 사용자**
- **Given:** 다른 SI 로그인
- **When:** 응답 시도
- **Then:** `PTR_019_NOT_TARGET_SI` 에러 403

## :gear: Technical & Non-Functional Constraints
- **구현:** Next.js Server Action — CON-12
- **트랜잭션:** PROPOSAL UPDATE + BADGE INSERT → Prisma `$transaction`
- **조건부 유효성:** Zod `.superRefine()` — 거절 시 rejectionReason 필수
- **성능:** p95 ≤ 500ms
- **보안:** 대상 SI 본인만 응답 가능, 응답 후 비가역적

## :checkered_flag: Definition of Done (DoD)
- [ ] Request/Response DTO (수락/거절 분기) 정의 완료
- [ ] 수락→뱃지 자동 발급 트랜잭션 규칙 문서화 완료
- [ ] Zod `.superRefine()` 조건부 검증 구현
- [ ] 에러 코드 및 HTTP 매핑 정의
- [ ] ESLint / TypeScript 경고 0건

## :construction: Dependencies & Blockers
### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-013 | `PARTNER_PROPOSAL` 테이블 | 필수 |
| DB-008 | `BADGE` 테이블 | 필수 |
| API-018 | `sendPartnerProposal` DTO (ProposalStatus) | 필수 |
| API-016 | `issueBadge` DTO (뱃지 발급 인터페이스) | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| FC-019 | 파트너 제안 응답 Command 로직 |
| TEST-017 | 파트너 제안 수락/거절/만료 GWT 테스트 |
| TEST-015 | 뱃지 수락 자동 발급 테스트 |
| UI-010 | SI 포털 — 제안 수락/거절 UI |
