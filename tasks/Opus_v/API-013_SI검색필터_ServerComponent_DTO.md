---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-013: Search 도메인 — SI 파트너 검색/필터 Server Component 쿼리 인터페이스 정의 (지역, 브랜드, 역량 태그, 페이지네이션)"
labels: 'feature, backend, api-contract, si-search, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-013] SI 파트너 검색/필터 Server Component 쿼리 인터페이스 정의
- 목적: 수요기업 및 제조사가 SI 파트너를 **지역·브랜드·역량 태그 기반으로 검색·필터링**하는 Server Component의 **쿼리 파라미터 인터페이스**, **Response DTO (목록형)**, **페이지네이션 규칙**, **정렬 옵션**을 정의한다. 검색 API 응답 p95 ≤ 1초를 달성해야 하는 핵심 성능 요구사항이 적용된다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-029`](../../docs/06_SRS-v1.md) — SI 파트너 검색 및 필터링
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-015`](../../docs/06_SRS-v1.md) — 뱃지 보유 SI 필터, 미인증 혼입률 0%
- API Overview: [`06_SRS-v1.md#3.3 API-07`](../../docs/06_SRS-v1.md) — SI 검색 및 필터 (p95 ≤ 1초)
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.2`](../../docs/06_SRS-v1.md) — SI 파트너 검색 흐름
- 데이터 모델: [`06_SRS-v1.md#6.2.2 SI_PARTNER`](../../docs/06_SRS-v1.md), [`6.2.8 SI_PROFILE`](../../docs/06_SRS-v1.md), [`6.2.7 BADGE`](../../docs/06_SRS-v1.md)
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-013`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 검색 쿼리 파라미터 인터페이스 정의
- [ ] `SiSearchQuery` 타입 정의 (`lib/contracts/search/si-search.ts`)
  ```typescript
  export interface SiSearchQuery {
    // === 필터 조건 ===
    region?: string;                  // 지역 (시/도)
    brand?: string;                   // 제조사 브랜드 (뱃지 기반 필터)
    capabilityTags?: string[];        // 역량 태그 (AND 조건)
    hasBadge?: boolean;               // 뱃지 보유 여부 필터
    minSuccessRate?: number;          // 최소 시공 성공률 (0~100)
    tier?: SiPartnerTier;             // SI 등급 필터

    // === 페이지네이션 ===
    page?: number;                    // 페이지 번호 (1부터 시작, 기본 1)
    pageSize?: number;                // 페이지 크기 (기본 20, 최대 50)

    // === 정렬 ===
    sortBy?: SiSearchSortField;       // 정렬 기준
    sortOrder?: 'asc' | 'desc';       // 정렬 방향 (기본 desc)

    // === 키워드 ===
    keyword?: string;                 // 회사명 키워드 검색
  }

  export enum SiSearchSortField {
    SUCCESS_RATE = 'success_rate',
    BADGE_COUNT  = 'badge_count',
    RATING       = 'avg_rating',
    CREATED_AT   = 'created_at',
  }

  export type SiPartnerTier = 'Silver' | 'Gold' | 'Diamond';
  ```

### 2단계: Zod 유효성 스키마 정의
- [ ] `siSearchQuerySchema` 작성
  ```typescript
  export const siSearchQuerySchema = z.object({
    region: z.string().optional(),
    brand: z.string().optional(),
    capabilityTags: z.array(z.string()).max(10).optional(),
    hasBadge: z.boolean().optional(),
    minSuccessRate: z.number().min(0).max(100).optional(),
    tier: z.enum(['Silver', 'Gold', 'Diamond']).optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(50).default(20),
    sortBy: z.nativeEnum(SiSearchSortField).default(SiSearchSortField.SUCCESS_RATE),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    keyword: z.string().max(100).optional(),
  });
  ```

### 3단계: Response DTO 정의 (목록형)
- [ ] 검색 결과 아이템 DTO
  ```typescript
  export interface SiSearchResultItem {
    id: string;                       // SI_PARTNER PK
    companyName: string;
    region: string;
    tier: SiPartnerTier;
    successRate: number;              // 시공 성공률 (%)
    avgRating: number | null;         // 평균 평점 (0~5)
    completedProjects: number;
    capabilityTags: string[];
    badges: {                         // 보유 뱃지 목록
      manufacturerName: string;
      issuedAt: string;
      isActive: boolean;
    }[];
    badgeCount: number;               // 활성 뱃지 수
    profileUpdatedAt: string;         // 프로필 갱신일
  }
  ```
- [ ] 페이지네이션 메타 DTO
  ```typescript
  export interface PaginationMeta {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }
  ```
- [ ] 통합 Response DTO
  ```typescript
  export interface SiSearchResponse {
    success: true;
    data: {
      items: SiSearchResultItem[];
      pagination: PaginationMeta;
      appliedFilters: Partial<SiSearchQuery>;  // 적용된 필터 반영
    };
  }
  ```

### 4단계: 뱃지 필터 정합성 규칙
- [ ] `hasBadge=true` 필터 시 미인증 SI 혼입률 = 0% 보장 규칙
  ```typescript
  // hasBadge=true 시 쿼리 조건:
  // BADGE.is_active = true AND BADGE.expires_at > NOW()
  // → 만료·철회된 뱃지 보유자는 결과에서 제외
  ```

### 5단계: 에러 코드 정의
- [ ] `SiSearchErrorCode` 정의
  ```typescript
  export enum SiSearchErrorCode {
    VALIDATION_ERROR = 'SEARCH_013_VALIDATION',
    INVALID_FILTER   = 'SEARCH_013_INVALID_FILTER',
    INTERNAL_ERROR   = 'SEARCH_013_INTERNAL',
  }
  ```

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 지역·역량 필터 조합 검색**
- **Given:** SI 파트너 20개사가 등록됨
- **When:** `region: "서울"`, `capabilityTags: ["용접"]`으로 검색
- **Then:** 결과 반환 ≤ 1초 (p95), 결과에 뱃지·성공률·지역 명시

**Scenario 2: 뱃지 보유 필터 적용 시 미인증 SI 혼입 0%**
- **Given:** 뱃지 보유 SI 5개, 미보유 SI 15개
- **When:** `hasBadge: true`로 필터링
- **Then:** 결과에 뱃지 미보유 SI 0건 (혼입률 0%)

**Scenario 3: 빈 결과 시 안내**
- **Given:** 해당 필터 조건에 부합하는 SI 파트너가 없음
- **When:** 검색 실행
- **Then:** `items: []`, `totalItems: 0` 반환 (에러가 아닌 빈 배열)

**Scenario 4: 페이지네이션 동작**
- **Given:** 검색 결과 총 35건, `pageSize: 20`
- **When:** `page: 2` 요청
- **Then:** 15건 반환, `hasNextPage: false`, `hasPreviousPage: true`

## :gear: Technical & Non-Functional Constraints
- **구현 방식:** Server Component + Prisma 직접 쿼리 (읽기 전용) — CON-12
- **성능:** 검색 응답 p95 ≤ 1초 — REQ-NF-002. 인덱스 전략(region, capability_tags) 수립 필수
- **보안:** 검색 결과는 인증 불필요 (공개 검색), 단 상세 연락처는 프로필 상세에서만 노출

## :checkered_flag: Definition of Done (DoD)
- [ ] `SiSearchQuery`, `SiSearchResultItem`, `PaginationMeta` 타입이 정의되었는가?
- [ ] 뱃지 필터 정합성 규칙(혼입률 0%)이 문서화되었는가?
- [ ] Zod 스키마 단위 테스트가 통과하는가?
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
| FQ-001 | SI 파트너 검색 Server Component 구현 |
| FQ-003 | 뱃지 보유 SI 필터 구현 |
| TEST-028 | SI 검색 필터링 통합 테스트 |
| UI-003 | SI 파트너 검색 결과 목록 페이지 |
