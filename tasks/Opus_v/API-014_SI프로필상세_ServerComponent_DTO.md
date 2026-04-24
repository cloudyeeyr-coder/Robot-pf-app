---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-014: Profile 도메인 — SI 프로필 상세 조회 Server Component Response DTO (재무등급, 시공성공률, 리뷰, 뱃지, 갱신일) 정의"
labels: 'feature, backend, api-contract, si-profile, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-014] SI 프로필 상세 조회 Server Component Response DTO 정의
- 목적: SI 파트너 프로필 상세 페이지에서 **재무 등급(운영팀 DB 기반)·시공 성공률·고객 리뷰·제조사 뱃지**를 통합 표시하기 위한 Server Component의 **Response DTO**, **데이터 결합 규칙**, **갱신일 표시 규격**을 정의한다. 로딩 시간 p95 ≤ 2초를 달성해야 하며, 갱신일이 반드시 YYYY-MM-DD 형식으로 표시되어야 한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-009`](../../docs/06_SRS-v1.md) — SI 프로필 통합 표시, 갱신일 표시
- API Overview: [`06_SRS-v1.md#3.3 API-07`](../../docs/06_SRS-v1.md) — SI 프로필 상세 조회
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.2`](../../docs/06_SRS-v1.md) — SI 프로필 상세 조회 흐름
- 데이터 모델: [`06_SRS-v1.md#6.2.2`](../../docs/06_SRS-v1.md) (SI_PARTNER), [`6.2.8`](../../docs/06_SRS-v1.md) (SI_PROFILE), [`6.2.7`](../../docs/06_SRS-v1.md) (BADGE)
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-014`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 쿼리 파라미터 정의
- [ ] `SiProfileDetailQuery` 정의 (`lib/contracts/profile/si-profile-detail.ts`)
  ```typescript
  export interface SiProfileDetailQuery {
    siPartnerId: string;  // SI 파트너 ID (cuid)
  }
  ```

### 2단계: Response DTO 정의 (통합 뷰)
- [ ] `SiProfileDetailResponse` 타입 정의
  ```typescript
  export interface SiProfileDetailResponse {
    success: true;
    data: {
      // === 기본 정보 (SI_PARTNER) ===
      id: string;
      companyName: string;
      region: string;
      tier: 'Silver' | 'Gold' | 'Diamond';

      // === 재무 등급 (운영팀 사전 DB 업데이트 기반) ===
      financialGrade: string | null;         // NICE 재무 등급
      financialGradeUpdatedAt: string | null;// 갱신일 (YYYY-MM-DD)

      // === 시공 실적 ===
      successRate: number;                   // 시공 성공률 (%)
      completedProjects: number;
      failedProjects: number;

      // === 리뷰 (SI_PROFILE.review_summary JSONB) ===
      avgRating: number | null;              // 평균 평점 (0~5)
      reviewSummary: ReviewSummary | null;

      // === 역량 태그 ===
      capabilityTags: string[];

      // === 제조사 인증 뱃지 (BADGE) ===
      badges: BadgeInfo[];

      // === 메타 ===
      profileUpdatedAt: string;              // 프로필 갱신일 (YYYY-MM-DD)
      memberSince: string;                   // 가입일 (YYYY-MM-DD)
    };
  }

  export interface ReviewSummary {
    totalReviews: number;
    averageScore: number;
    highlights: string[];       // 리뷰 하이라이트 (최대 5건)
    recentReviews: {
      rating: number;
      comment: string;
      reviewerCompany: string;
      createdAt: string;
    }[];
  }

  export interface BadgeInfo {
    id: string;
    manufacturerName: string;
    issuedAt: string;           // YYYY-MM-DD
    expiresAt: string;          // YYYY-MM-DD
    isActive: boolean;
  }
  ```

### 3단계: 데이터 결합 규칙 문서화
- [ ] Server Component에서 3개 테이블 JOIN 전략
  ```typescript
  // Prisma 쿼리 전략:
  // prisma.siPartner.findUnique({
  //   where: { id: siPartnerId },
  //   include: {
  //     siProfile: true,           // 1:1 관계
  //     badges: {                  // 1:N 관계
  //       where: { isActive: true },
  //       orderBy: { issuedAt: 'desc' },
  //     },
  //   },
  // });
  ```
- [ ] 재무 등급 갱신일 표시 규칙:
  - `financialGradeUpdatedAt`이 NULL → "미갱신" 표시
  - 갱신일이 6개월 이상 경과 → "갱신 필요" 경고 표시

### 4단계: 에러 코드 정의
- [ ] `SiProfileDetailErrorCode` 정의
  ```typescript
  export enum SiProfileDetailErrorCode {
    PARTNER_NOT_FOUND = 'PROFILE_014_NOT_FOUND',
    PROFILE_INCOMPLETE = 'PROFILE_014_INCOMPLETE',
    INTERNAL_ERROR     = 'PROFILE_014_INTERNAL',
  }
  ```

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 프로필 통합 로딩**
- **Given:** 수요기업이 SI 프로필 상세 페이지에 접근
- **When:** 페이지를 로드함
- **Then:** 재무등급·시공성공률·리뷰·뱃지가 통합 로딩, p95 ≤ 2초, 갱신일 YYYY-MM-DD 표시

**Scenario 2: 다수 제조사 뱃지 동시 표시**
- **Given:** SI 파트너가 3개 제조사 뱃지를 보유
- **When:** 프로필을 조회함
- **Then:** `badges` 배열에 3개 제조사 뱃지가 모두 포함 (Brand-Agnostic)

**Scenario 3: 존재하지 않는 SI 파트너 조회**
- **Given:** 존재하지 않는 `siPartnerId`
- **When:** 조회 요청
- **Then:** `PROFILE_014_NOT_FOUND` 에러와 404 반환

## :gear: Technical & Non-Functional Constraints
- **구현 방식:** Server Component + Prisma 직접 쿼리 (읽기 전용)
- **성능:** 로딩 p95 ≤ 2초 (3테이블 JOIN). 인덱스: `si_partner_id` (SI_PROFILE, BADGE)
- **데이터:** 재무 등급은 운영팀 사전 DB 업데이트 기반 정적 데이터 — CON-02

## :checkered_flag: Definition of Done (DoD)
- [ ] `SiProfileDetailResponse`, `ReviewSummary`, `BadgeInfo` 타입이 정의되었는가?
- [ ] 데이터 결합 규칙(3테이블 JOIN 전략)이 문서화되었는가?
- [ ] 갱신일 표시 규칙이 정의되었는가?
- [ ] ESLint / TypeScript 경고 0건인가?

## :construction: Dependencies & Blockers
### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-003 | `SI_PARTNER` 테이블 스키마 | 필수 |
| DB-009 | `SI_PROFILE` 테이블 스키마 | 필수 |
| DB-008 | `BADGE` 테이블 스키마 | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| FQ-002 | SI 프로필 상세 조회 Server Component 구현 |
| API-015 | 기안용 리포트 PDF — 프로필 데이터 의존 |
| TEST-011 | SI 프로필 조회 테스트 |
| UI-004 | SI 프로필 상세 페이지 |
