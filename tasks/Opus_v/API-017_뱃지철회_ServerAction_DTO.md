---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-017: Badge 도메인 — 뱃지 철회 (revokeBadge) Server Action DTO, 비활성화 규칙 정의"
labels: 'feature, backend, api-contract, badge, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [API-017] 뱃지 철회 (`revokeBadge`) Server Action DTO 및 비활성화 규칙 정의
- 목적: 로봇 제조사가 기존에 발급한 인증 뱃지를 **철회(비활성화)** 하는 Server Action의 **Request/Response DTO**, **비활성화 처리 규칙**, **에러 코드**를 정의한다. 철회 시 SI 프로필에서 ≤ 10분 이내 비노출 처리되어야 하며, `revoked_at` 타임스탬프가 기록된다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-014`](../../docs/06_SRS-v1.md) — 뱃지 만료/철회 시 자동 비노출
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #15`](../../docs/06_SRS-v1.md) — `action: revokeBadge`
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.4`](../../docs/06_SRS-v1.md) — 뱃지 철회 흐름
- 데이터 모델: [`06_SRS-v1.md#6.2.7 BADGE`](../../docs/06_SRS-v1.md) — is_active, revoked_at
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-017`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Request DTO 정의
- [ ] `RevokeBadgeRequest` 타입 정의 (`lib/contracts/badge/revoke-badge.ts`)
  ```typescript
  export interface RevokeBadgeRequest {
    badgeId: string;               // 철회 대상 뱃지 ID (cuid)
    revocationReason: string;      // 철회 사유 (1~500자)
  }
  ```

### 2단계: Zod 유효성 스키마
- [ ] `revokeBadgeSchema` 작성
  ```typescript
  export const revokeBadgeSchema = z.object({
    badgeId: z.string().min(1, '뱃지 ID를 입력해주세요'),
    revocationReason: z.string()
      .min(1, '철회 사유를 입력해주세요')
      .max(500, '철회 사유는 500자 이내로 입력해주세요'),
  });
  ```

### 3단계: 비활성화 처리 규칙 정의
- [ ] 철회 시 동작 규칙
  ```typescript
  export const BADGE_REVOCATION_RULES = {
    // BADGE UPDATE: is_active = false, revoked_at = now()
    setInactive: true,
    recordRevokedAt: true,
    // SI 프로필 비노출: ≤ 10분 이내 반영
    profileReflectionMaxMinutes: 10,
    // 알림: SI 파트너에게 철회 알림 발송
    notifySiPartner: true,
    // 뱃지 철회는 비가역적 (동일 제조사가 재발급은 가능)
    irreversible: true,
  };
  ```

### 4단계: Response DTO 정의
- [ ] 성공 응답 DTO
  ```typescript
  export interface RevokeBadgeSuccessResponse {
    success: true;
    data: {
      badgeId: string;
      manufacturerName: string;
      siCompanyName: string;
      revokedAt: string;           // ISO 8601
      isActive: false;
      profileReflectionEta: string; // "10분 이내 프로필에서 비노출 처리됩니다"
    };
  }
  ```

### 5단계: 에러 코드 정의
- [ ] `RevokeBadgeErrorCode` 정의
  ```typescript
  export enum RevokeBadgeErrorCode {
    VALIDATION_ERROR      = 'BDG_017_VALIDATION',
    BADGE_NOT_FOUND       = 'BDG_017_NOT_FOUND',
    BADGE_ALREADY_REVOKED = 'BDG_017_ALREADY_REVOKED',
    NOT_BADGE_ISSUER      = 'BDG_017_NOT_ISSUER',      // 발급 제조사가 아님
    UNAUTHORIZED          = 'BDG_017_UNAUTHORIZED',
    INTERNAL_ERROR        = 'BDG_017_INTERNAL',
  }
  ```
  | 에러 코드 | HTTP | 설명 |
  |:---|:---:|:---|
  | `BDG_017_ALREADY_REVOKED` | 409 | 이미 철회된 뱃지 재철회 |
  | `BDG_017_NOT_ISSUER` | 403 | 본인이 발급한 뱃지가 아님 |

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 뱃지 철회**
- **Given:** 활성 상태의 뱃지(`is_active=true`)가 존재하고, 발급 제조사가 로그인
- **When:** `revokeBadge`를 호출함
- **Then:** `is_active=false`, `revoked_at` 기록, SI 프로필 비노출 ≤ 10분

**Scenario 2: 이미 철회된 뱃지 재철회**
- **Given:** `is_active=false`, `revoked_at IS NOT NULL`인 뱃지
- **When:** `revokeBadge`를 호출함
- **Then:** `BDG_017_ALREADY_REVOKED` 에러와 409 반환

**Scenario 3: 발급 제조사가 아닌 사용자의 철회 시도**
- **Given:** 다른 제조사의 사용자가 로그인
- **When:** 타 제조사가 발급한 뱃지에 `revokeBadge` 호출
- **Then:** `BDG_017_NOT_ISSUER` 에러와 403 반환

## :gear: Technical & Non-Functional Constraints
- **구현 방식:** Next.js Server Action — CON-12
- **권한:** 해당 뱃지를 발급한 제조사(`manufacturerId` 매칭)만 철회 가능
- **성능:** SI 프로필 비노출 반영 ≤ 10분 — REQ-FUNC-014
- **비가역성:** 철회된 뱃지는 복원 불가, 동일 조합 재발급은 가능

## :checkered_flag: Definition of Done (DoD)
- [ ] Request/Response DTO가 정의되었는가?
- [ ] `BADGE_REVOCATION_RULES` 비활성화 규칙이 정의되었는가?
- [ ] 에러 코드 및 HTTP 매핑이 정의되었는가?
- [ ] ESLint / TypeScript 경고 0건인가?

## :construction: Dependencies & Blockers
### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-008 | `BADGE` 테이블 스키마 (is_active, revoked_at) | 필수 |
| API-016 | `issueBadge` DTO — 뱃지 구조 정의 | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| FC-017 | 뱃지 철회 Command 로직 |
| TEST-014 | 뱃지 만료/철회 테스트 |
| UI-009 | 제조사 포털 — 뱃지 철회 UI |
