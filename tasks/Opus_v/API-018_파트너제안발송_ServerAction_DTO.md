---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-018: Partnership 도메인 — 파트너 제안 발송 (sendPartnerProposal) Server Action DTO, 응답 기한(5영업일) 규칙, 에러 코드 정의"
labels: 'feature, backend, api-contract, badge, partnership, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-018] 파트너 제안 발송 (`sendPartnerProposal`) Server Action DTO, 응답 기한(5영업일) 규칙, 에러 코드 정의
- 목적: 로봇 제조사가 특정 SI 파트너에게 **'파트너 제안'을 발송**하는 Server Action의 **Request/Response DTO**, **응답 기한(5영업일) 규칙**, **D+3 리마인더 / D+5 만료 자동 처리 규칙**, **에러 코드**를 정의한다. 파트너 제안은 뱃지 발급의 전단계 프로세스로, SI의 수락 시 공식 인증 뱃지가 자동 발급된다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-030`](../../docs/06_SRS-v1.md) — 파트너 제안 발송/수락/거절
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-032`](../../docs/06_SRS-v1.md) — D+3 리마인더, D+5 만료 처리
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #20`](../../docs/06_SRS-v1.md) — `action: sendPartnerProposal`
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.4`](../../docs/06_SRS-v1.md) — 파트너 제안 흐름
- 데이터 모델: `DB-013` (PARTNER_PROPOSAL 테이블) — SRS Class Diagram 참조
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-018`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Request DTO 정의
- [ ] `SendPartnerProposalRequest` 타입 정의 (`lib/contracts/partnership/send-proposal.ts`)
  ```typescript
  export interface SendPartnerProposalRequest {
    manufacturerId: string;        // 제안 발송 제조사 ID
    siPartnerId: string;           // 대상 SI 파트너 ID
    proposalMessage?: string;      // 제안 메시지 (선택, 최대 1000자)
    proposedBadgeValidityMonths?: number; // 제안 뱃지 유효 기간 (기본 12개월)
  }
  ```

### 2단계: Zod 유효성 스키마
- [ ] `sendPartnerProposalSchema` 작성
  ```typescript
  export const sendPartnerProposalSchema = z.object({
    manufacturerId: z.string().min(1, '제조사 ID를 입력해주세요'),
    siPartnerId: z.string().min(1, 'SI 파트너 ID를 입력해주세요'),
    proposalMessage: z.string().max(1000).optional(),
    proposedBadgeValidityMonths: z.number().int().min(1).max(36).default(12),
  });
  ```

### 3단계: 응답 기한 규칙 정의
- [ ] 제안 기한 및 자동 처리 규칙
  ```typescript
  export const PROPOSAL_DEADLINE_RULES = {
    responseDays: 5,             // 응답 기한: 5영업일
    reminderDay: 3,              // D+3일에 자동 리마인더 1회 발송 (CRON-004)
    expirationDay: 5,            // D+5일에 자동 만료 처리 (CRON-005)
    maxPendingPerSi: 3,          // 동일 SI에 대한 동시 진행 중 제안 최대 3건
  };
  ```
- [ ] 제안 상태 ENUM 정의
  ```typescript
  export enum ProposalStatus {
    PENDING  = 'pending',    // 대기 중
    ACCEPTED = 'accepted',   // 수락됨 → 뱃지 자동 발급
    REJECTED = 'rejected',   // 거절됨
    EXPIRED  = 'expired',    // D+5 미응답 만료
  }
  ```
- [ ] 제안 생애주기 규칙
  ```
  [발송] → status=pending, deadline=now()+5영업일
         → SI에게 알림 발송 (≤ 3초)
  
  [D+3]  → CRON-004: 미응답 시 리마인더 1회 발송
  
  [D+5]  → CRON-005: status=expired 자동 전환
         → 제조사에게 "미응답 종료" 알림
         → 대안 SI 3개사 자동 추천 (≤ 1분)
  
  [수락]  → status=accepted → 뱃지 자동 발급 (API-016 연계)
  [거절]  → status=rejected → 제조사 알림
  ```

### 4단계: Response DTO 정의
- [ ] 성공 응답 DTO
  ```typescript
  export interface SendProposalSuccessResponse {
    success: true;
    data: {
      proposalId: string;
      manufacturerName: string;
      siCompanyName: string;
      status: 'pending';
      sentAt: string;
      deadline: string;             // 응답 기한 (YYYY-MM-DD)
      reminderDate: string;         // D+3 리마인더 예정일
      siNotified: boolean;          // SI 알림 발송 여부
    };
  }
  ```

### 5단계: 에러 코드 정의
- [ ] `SendProposalErrorCode` 정의
  ```typescript
  export enum SendProposalErrorCode {
    VALIDATION_ERROR         = 'PTR_018_VALIDATION',
    MANUFACTURER_NOT_FOUND   = 'PTR_018_MFR_NOT_FOUND',
    SI_NOT_FOUND             = 'PTR_018_SI_NOT_FOUND',
    SI_NOT_ACTIVE            = 'PTR_018_SI_NOT_ACTIVE',
    DUPLICATE_PENDING        = 'PTR_018_DUPLICATE_PENDING',
    ALREADY_PARTNER          = 'PTR_018_ALREADY_PARTNER',
    MAX_PENDING_EXCEEDED     = 'PTR_018_MAX_PENDING',
    NOT_MANUFACTURER_ROLE    = 'PTR_018_NOT_MANUFACTURER',
    UNAUTHORIZED             = 'PTR_018_UNAUTHORIZED',
    INTERNAL_ERROR           = 'PTR_018_INTERNAL',
  }
  ```
  | 에러 코드 | HTTP | 설명 |
  |:---|:---:|:---|
  | `PTR_018_DUPLICATE_PENDING` | 409 | 동일 제조사→SI 진행 중 제안 존재 |
  | `PTR_018_ALREADY_PARTNER` | 409 | 이미 활성 뱃지(파트너십) 보유 |
  | `PTR_018_MAX_PENDING` | 400 | 동일 SI에 대한 pending 제안 초과 |

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 파트너 제안 발송**
- **Given:** 제조사가 활성 SI 파트너를 선택
- **When:** `sendPartnerProposal`을 호출함
- **Then:** PROPOSAL INSERT (status=pending), deadline=D+5, SI에게 알림 ≤ 3초

**Scenario 2: 동일 제조사→SI 중복 제안**
- **Given:** 해당 제조사→SI 간 pending 상태 제안이 이미 존재
- **When:** 동일 조합으로 제안 발송 시도
- **Then:** `PTR_018_DUPLICATE_PENDING` 에러와 409 반환

**Scenario 3: 이미 파트너(뱃지 보유)인 SI에 제안**
- **Given:** 해당 제조사→SI 간 활성 뱃지 존재
- **When:** 제안 발송 시도
- **Then:** `PTR_018_ALREADY_PARTNER` 에러와 409 반환

## :gear: Technical & Non-Functional Constraints
- **구현 방식:** Next.js Server Action — CON-12
- **권한:** 제조사 역할만 발송 가능
- **알림:** 제안 발송 ≤ 3초 — REQ-FUNC-030
- **배치 연계:** D+3 리마인더(CRON-004), D+5 만료(CRON-005)

## :checkered_flag: Definition of Done (DoD)
- [ ] Request/Response DTO가 정의되었는가?
- [ ] `ProposalStatus` ENUM 및 `PROPOSAL_DEADLINE_RULES` 규칙이 정의되었는가?
- [ ] 제안 생애주기(pending → accepted/rejected/expired) 규칙이 문서화되었는가?
- [ ] 에러 코드 및 HTTP 매핑이 정의되었는가?
- [ ] ESLint / TypeScript 경고 0건인가?

## :construction: Dependencies & Blockers
### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-013 | `PARTNER_PROPOSAL` 테이블 스키마 | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| API-019 | `respondProposal` — 수락/거절 (제안 존재 전제) |
| FC-018 | 파트너 제안 발송 Command 로직 |
| CRON-004 | D+3 리마인더 배치 |
| CRON-005 | D+5 만료 + 대안 SI 추천 배치 |
| TEST-017 | 파트너 제안 수락/거절/만료 GWT 테스트 |
| UI-009 | 제조사 포털 — 파트너 제안 UI |
