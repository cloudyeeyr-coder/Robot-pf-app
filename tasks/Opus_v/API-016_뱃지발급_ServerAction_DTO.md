---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-016: Badge 도메인 — 뱃지 발급 (issueBadge) Server Action DTO, 만료일 규칙, 에러 코드 정의"
labels: 'feature, backend, api-contract, badge, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-016] 뱃지 발급 (`issueBadge`) Server Action DTO, 만료일 규칙, 에러 코드 정의
- 목적: 로봇 제조사가 SI 파트너에게 **제조사 인증 뱃지를 발급**하는 Server Action의 **Request/Response DTO**, **만료일 산정 규칙**, **에러 코드**를 정의한다. 뱃지 시스템은 Brand-Agnostic 개방형 구조(≥3사 동시 지원)를 따르며, 발급 후 SI 프로필 반영 ≤ 1시간을 달성해야 한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-013`](../../docs/06_SRS-v1.md) — 제조사 인증 뱃지 발급
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-017`](../../docs/06_SRS-v1.md) — Brand-Agnostic 뱃지 구조 (≥3사)
- API Overview: [`06_SRS-v1.md#3.3 API-10`](../../docs/06_SRS-v1.md) — 뱃지 발급/관리
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.4`](../../docs/06_SRS-v1.md) — 제조사 인증 뱃지 발급 흐름
- 데이터 모델: [`06_SRS-v1.md#6.2.7 BADGE`](../../docs/06_SRS-v1.md)
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-016`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Request DTO 정의
- [ ] `IssueBadgeRequest` 타입 정의 (`lib/contracts/badge/issue-badge.ts`)
  ```typescript
  export interface IssueBadgeRequest {
    manufacturerId: string;        // 발급 제조사 ID (cuid)
    siPartnerId: string;           // 대상 SI 파트너 ID (cuid)
    validityMonths?: number;       // 유효 기간 (개월, 기본 12, 최소 1, 최대 36)
    note?: string;                 // 발급 사유 메모 (선택, 최대 500자)
  }
  ```

### 2단계: Zod 유효성 스키마
- [ ] `issueBadgeSchema` 작성
  ```typescript
  export const issueBadgeSchema = z.object({
    manufacturerId: z.string().min(1, '제조사 ID를 입력해주세요'),
    siPartnerId: z.string().min(1, 'SI 파트너 ID를 입력해주세요'),
    validityMonths: z.number().int().min(1).max(36).default(12),
    note: z.string().max(500).optional(),
  });
  ```

### 3단계: 만료일 산정 규칙 정의
- [ ] 만료일 계산 로직
  ```typescript
  export function calculateBadgeExpiry(
    issuedAt: Date,
    validityMonths: number
  ): Date {
    const expiresAt = new Date(issuedAt);
    expiresAt.setMonth(expiresAt.getMonth() + validityMonths);
    return expiresAt;
  }

  export const BADGE_VALIDITY_RULES = {
    defaultMonths: 12,
    minMonths: 1,
    maxMonths: 36,
    expiryWarningDays: 7,   // 만료 D-7일 알림 (CRON-002)
  };
  ```

### 4단계: Response DTO 정의
- [ ] 성공 응답 DTO
  ```typescript
  export interface IssueBadgeSuccessResponse {
    success: true;
    data: {
      badgeId: string;
      manufacturerId: string;
      manufacturerName: string;
      siPartnerId: string;
      siCompanyName: string;
      issuedAt: string;           // YYYY-MM-DD
      expiresAt: string;          // YYYY-MM-DD
      isActive: boolean;          // true
      profileReflectionEta: string; // SI 프로필 반영 예상 시간 (≤ 1시간)
    };
  }
  ```

### 5단계: 에러 코드 정의
- [ ] `IssueBadgeErrorCode` 정의
  ```typescript
  export enum IssueBadgeErrorCode {
    VALIDATION_ERROR      = 'BDG_016_VALIDATION',
    MANUFACTURER_NOT_FOUND= 'BDG_016_MFR_NOT_FOUND',
    SI_NOT_FOUND          = 'BDG_016_SI_NOT_FOUND',
    SI_NOT_ACTIVE         = 'BDG_016_SI_NOT_ACTIVE',
    DUPLICATE_BADGE       = 'BDG_016_DUPLICATE',       // 동일 제조사-SI 활성 뱃지 존재
    NOT_MANUFACTURER_ROLE = 'BDG_016_NOT_MANUFACTURER',
    UNAUTHORIZED          = 'BDG_016_UNAUTHORIZED',
    INTERNAL_ERROR        = 'BDG_016_INTERNAL',
  }
  ```
  | 에러 코드 | HTTP | 설명 |
  |:---|:---:|:---|
  | `BDG_016_DUPLICATE` | 409 | 동일 제조사→SI 간 활성 뱃지 중복 |
  | `BDG_016_SI_NOT_ACTIVE` | 400 | SI 파트너가 Admin 승인 전 |
  | `BDG_016_NOT_MANUFACTURER` | 403 | 제조사 역할이 아닌 사용자 |

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 뱃지 발급**
- **Given:** 제조사가 로그인하고 활성 SI 파트너 선택
- **When:** `issueBadge`를 호출함
- **Then:** BADGE INSERT, `is_active=true`, `expires_at` 산정, SI 프로필 반영 ≤ 1시간

**Scenario 2: 동일 제조사-SI 중복 뱃지 발급 시도**
- **Given:** 이미 해당 제조사→SI 활성 뱃지 존재
- **When:** 동일 조합으로 `issueBadge` 호출
- **Then:** `BDG_016_DUPLICATE` 에러와 409 반환

**Scenario 3: Brand-Agnostic 다중 뱃지 (≥3사)**
- **Given:** SI 파트너가 제조사 A, B 뱃지를 보유
- **When:** 제조사 C가 뱃지를 발급
- **Then:** 3개 제조사 뱃지가 동시에 활성 상태로 존재

**Scenario 4: 만료일 산정 검증 (12개월 기본)**
- **Given:** `validityMonths` 미지정 (기본값 12)
- **When:** 2026-04-24 발급
- **Then:** `expiresAt`이 2027-04-24

## :gear: Technical & Non-Functional Constraints
- **구현 방식:** Next.js Server Action — CON-12
- **권한:** 제조사(`manufacturer`) 역할만 발급 가능
- **Brand-Agnostic:** 동일 SI에 다수 제조사 뱃지 동시 보유 가능 — REQ-FUNC-017, CON-03
- **성능:** 뱃지 반영 지연 ≤ 1시간 — REQ-FUNC-013

## :checkered_flag: Definition of Done (DoD)
- [ ] Request/Response DTO가 정의되었는가?
- [ ] 만료일 산정 규칙 (`calculateBadgeExpiry`) 이 정의되었는가?
- [ ] `BADGE_VALIDITY_RULES` 상수가 정의되었는가?
- [ ] 에러 코드 및 HTTP 매핑이 정의되었는가?
- [ ] ESLint / TypeScript 경고 0건인가?

## :construction: Dependencies & Blockers
### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-008 | `BADGE` 테이블 스키마 | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| API-017 | `revokeBadge` — 뱃지 철회 |
| FC-016 | 뱃지 발급 Command 로직 |
| TEST-013 | 뱃지 발급 테스트 |
| CRON-002 | 뱃지 만료 D-7 알림 |
| UI-009 | 제조사 포털 — 뱃지 발급 UI |
