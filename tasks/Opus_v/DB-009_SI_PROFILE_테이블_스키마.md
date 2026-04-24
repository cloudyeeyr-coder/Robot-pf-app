---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DB-009: SI_PROFILE 테이블 스키마 및 마이그레이션 (JSONB review_summary, capability_tags TEXT[]→Json)"
labels: 'feature, backend, db, profile, search, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [DB-009] `SI_PROFILE` (SI 프로필) 테이블 스키마 및 마이그레이션 작성
- 목적: SI 파트너의 **확장 프로필 데이터**(리뷰 요약, 평점, 역량 태그, 프로젝트 이력)를 저장하는 엔티티. SI_PARTNER 테이블(DB-003, 정적 기본 정보)과 **1:1 UNIQUE 관계**로 분리하여, 검색·리뷰 업데이트 등 **변동이 잦은 프로필 데이터를 독립 관리**한다. F-03(SI 투명 평판 뷰어)의 핵심 데이터 소스이며, SI 검색 필터(FQ-001: 역량 태그 기반)와 SI 프로필 상세(FQ-002: 리뷰·평점·프로젝트 수 표시)의 근간이다. `review_summary`와 `capability_tags`는 SRS에서 각각 JSONB와 TEXT[]로 명시되었으나, **SQLite 호환성을 위해 둘 다 Prisma `Json` 타입으로 매핑**(DB-001 매핑 규약 준수)한다. 시공 성공률은 DB-003의 `successRate`와 이중 관리되지 않도록 **완료/실패 프로젝트 수를 원천 데이터로 보유**하고 성공률은 파생 계산한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.8 SI_PROFILE`](../06_SRS-v1.md) — SI 프로필 테이블 스키마 정의 (7개 필드)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-009`](../06_SRS-v1.md) — SI 프로필 상세 (재무등급·시공성공률·리뷰·뱃지 통합 표시)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-010`](../06_SRS-v1.md) — 기안용 리포트 PDF (재무·기술·인증·리뷰 4섹션)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-029`](../06_SRS-v1.md) — SI 파트너 검색 (지역·브랜드·**역량 태그** 필터링, p95 ≤ 1초)
- SRS 문서: [`06_SRS-v1.md#6.2 ORM 매핑 노트`](../06_SRS-v1.md) — JSONB/TEXT[] → Prisma `Json` 매핑 규약
- SRS 문서: [`06_SRS-v1.md#6.2.13 Class Diagram (SiProfile)`](../06_SRS-v1.md) — `getFullProfile`, `updateReviewSummary`, `recalculateRating`, `matchesTags` 도메인 메서드
- 태스크 리스트: [`07_TASK-LIST-v1.md#DB-009`](../TASKS/07_TASK-LIST-v1.md)
- 연동 API: `API-013` (SI 검색), `API-014` (SI 프로필 상세), `API-015` (기안용 리포트 PDF)
- 연동 DB: `DB-003` (SI_PARTNER 1:1 상위)
- 연동 Mock: `MOCK-004` (SI 프로필 20건 시드)
- 선행 태스크: `DB-003` (SI_PARTNER)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: `review_summary` JSONB 스키마 정의
- [ ] `review_summary` JSON 구조 TypeScript 타입 정의 (`/lib/types/si-profile.ts`):
  ```ts
  export type ReviewSummary = {
    totalReviews: number                 // 전체 리뷰 수
    recentReviews?: ReviewEntry[]        // 최근 리뷰 (표시용, 최대 5건)
    sentimentBreakdown?: {               // 감성 분석 (Phase 2에서 LLM 활용 가능)
      positive: number
      neutral: number
      negative: number
    }
    topKeywords?: string[]               // 빈출 키워드 (Phase 2)
    updatedAt?: string                   // ISO 8601 문자열
  }

  export type ReviewEntry = {
    id: string
    buyerCompanyName?: string            // 익명 처리 옵션 (표시용은 마스킹: "ABC기업")
    rating: number                       // 1~5
    text: string
    projectCategory?: string             // e.g., "용접 로봇 시공"
    createdAt: string                    // ISO 8601
  }
  ```
- [ ] Zod 런타임 검증 스키마 작성 (API-014/MOCK-004에서 활용):
  ```ts
  export const reviewSummarySchema = z.object({
    totalReviews: z.number().int().min(0),
    recentReviews: z.array(z.object({
      id: z.string(),
      buyerCompanyName: z.string().optional(),
      rating: z.number().min(1).max(5),
      text: z.string().max(2000),
      projectCategory: z.string().optional(),
      createdAt: z.string().datetime(),
    })).max(5).optional(),
    // ... 생략
  })
  ```

### 2단계: `capability_tags` 배열 구조 정의
- [ ] `capability_tags`는 SRS에서 TEXT[]로 명시되었으나 **Prisma `Json` 타입으로 매핑** (SQLite 배열 미지원, DB-001 규약)
- [ ] 태그 표준 사전 관리 문서 작성 (`/docs/si-capability-tags.md`):
  - 예시 태그 카테고리: 로봇 유형("용접", "협동로봇", "AGV"), 산업("자동차", "반도체", "식품"), 기술("비전시스템", "PLC", "HMI")
  - 태그는 **소문자 + 하이픈** 컨벤션 (e.g., `"collaborative-robot"`, `"automotive"`)
  - MVP: 자유 입력 허용 + 표준 사전 제공 (자동완성 UI)
  - Phase 2: 태그 정규화 (Admin 검수)
- [ ] TypeScript 타입:
  ```ts
  export type CapabilityTags = string[]
  export const capabilityTagsSchema = z.array(z.string().min(1).max(50)).max(30)  // 최대 30개 태그
  ```

### 3단계: Prisma 모델 정의 (`prisma/schema.prisma`)
- [ ] `SiProfile` 모델 정의 (SRS 6.2.8 7개 필드 반영):
  ```prisma
  model SiProfile {
    id                   String      @id @default(cuid())
    siPartnerId          String      @unique                      // 1:1 관계 강제
    reviewSummary        Json?                                     // JSONB (PostgreSQL) / TEXT (SQLite)
    avgRating            Float?                                    // 0.0 ~ 5.0 (application 검증)
    completedProjects    Int         @default(0)
    failedProjects       Int         @default(0)
    capabilityTags       Json?                                     // TEXT[] → Json 매핑
    updatedAt            DateTime    @updatedAt

    // FK Relations
    siPartner            SiPartner   @relation(fields: [siPartnerId], references: [id], onDelete: Cascade)

    @@index([avgRating(sort: Desc)])                                // 평점 내림차순 정렬
    @@index([completedProjects(sort: Desc)])                        // 시공 실적 정렬
    @@map("si_profile")
  }
  ```
- [ ] **UNIQUE FK 핵심:** `siPartnerId @unique` — 1 SI = 1 프로필 강제 (SRS 6.2.8 명시)
- [ ] **Cascade 정책:** `onDelete: Cascade` — SiPartner 삭제 시 프로필도 함께 삭제 (1:1 관계에서 자연스러움). 단, SiPartner 자체가 `onDelete: Restrict`로 삭제 차단되므로 실제로는 발생하지 않음. 이중 방어선 역할
- [ ] `avgRating` 범위 검증은 **application-level** (Zod `.min(0).max(5)`) — Prisma check 미지원
- [ ] `createdAt` 필드는 SRS 6.2.8에 **없음** — 스키마에 추가하지 않음 (SiPartner.createdAt으로 대체, 1:1 관계)

### 4단계: 인덱스 전략 수립
- [ ] `siPartnerId` → `@unique` (1:1 관계 강제 + FK 조회 성능)
- [ ] `avgRating(sort: Desc)` → FQ-001 평점 기반 정렬
- [ ] `completedProjects(sort: Desc)` → 실적 기반 정렬
- [ ] **JSONB 인덱스 검토 (PostgreSQL 전용):**
  - `capability_tags` GIN 인덱스 — 태그 기반 검색 성능의 핵심
  - Prisma 자체로는 GIN 인덱스 자동 생성 불가 → **raw SQL migration 추가 검토 필요**
  - 본 태스크에서는 **일반 인덱스만 선언**하고, GIN 인덱스는 NFR-008(검색 성능) 또는 FQ-001 구현 시점에 raw migration 추가 (태그 검색 쿼리 패턴 확정 후)

### 5단계: Migration 파일 생성 및 검증
- [ ] `pnpm prisma migrate dev --name add_si_profile` 실행
- [ ] 생성된 SQL 검토:
  - `CREATE TABLE "si_profile" (...)`:
    - `review_summary JSONB`, `capability_tags JSONB` (PostgreSQL에서 Prisma `Json`은 `JSONB`로 매핑됨)
    - `SQLite`에서는 `TEXT`로 매핑 (Prisma가 자동 직렬화)
    - `avg_rating DOUBLE PRECISION` (Float 매핑)
    - `completed_projects INT DEFAULT 0`, `failed_projects INT DEFAULT 0`
  - `CREATE UNIQUE INDEX "si_profile_si_partner_id_key" ON "si_profile"("si_partner_id");` 확인
  - FK `ON DELETE CASCADE` 확인
- [ ] `pnpm prisma generate` → `SiProfile` 타입 export 검증

### 6단계: 성공률 파생 계산 유틸리티 작성 (`/lib/si-profile/success-rate.ts`)
- [ ] **SiPartner.successRate와 이중 관리 방지:**
  ```ts
  export function calculateSuccessRate(completed: number, failed: number): number {
    const total = completed + failed
    if (total === 0) return 0
    return Math.round((completed / total) * 10000) / 100  // 소수점 2자리
  }

  // SiPartner.successRate 동기화 헬퍼 (FC-003 등에서 활용)
  export async function syncSuccessRateToSiPartner(prisma: PrismaClient, siPartnerId: string): Promise<void> {
    const profile = await prisma.siProfile.findUnique({ where: { siPartnerId } })
    if (!profile) return
    const rate = calculateSuccessRate(profile.completedProjects, profile.failedProjects)
    await prisma.siPartner.update({ where: { id: siPartnerId }, data: { successRate: rate } })
  }
  ```
- [ ] **결정 사항:** `SiPartner.successRate`는 **파생 값**으로 간주, 본 프로필 필드가 **원천 데이터(Source of Truth)**. 프로젝트 완료/실패 INSERT 시 반드시 동기화 — FC 계열 로직에서 트랜잭션으로 처리
- [ ] 주기적 무결성 검증 스크립트(`/scripts/verify-success-rate-sync.ts`) 제안 — Admin이 월 1회 실행

### 7단계: TypeScript 타입 유틸 작성 (`/lib/types/si-profile.ts`)
- [ ] Prisma 타입 re-export + 도메인 DTO (이미 1단계에서 일부 작성, 통합):
  ```ts
  import type { SiProfile as PrismaSiProfile } from '@prisma/client'
  export type SiProfile = Omit<PrismaSiProfile, 'reviewSummary' | 'capabilityTags'> & {
    reviewSummary: ReviewSummary | null
    capabilityTags: CapabilityTags | null
  }

  // 검색 결과 카드용 DTO (FQ-001)
  export type SiProfileSearchCard = {
    siPartnerId: string
    avgRating: number | null
    completedProjects: number
    capabilityTags: CapabilityTags | null
  }

  // 프로필 상세 페이지용 DTO (FQ-002)
  export type SiProfileDetail = SiProfile & {
    successRate: number  // 파생 계산 값
  }

  export function matchesTags(profile: Pick<SiProfile, 'capabilityTags'>, queryTags: string[]): boolean {
    if (!profile.capabilityTags || queryTags.length === 0) return true
    const profileTagSet = new Set(profile.capabilityTags)
    return queryTags.every(tag => profileTagSet.has(tag))
  }
  ```
- [ ] **JSON 필드 타입 안전성 주의:** Prisma의 `Json` 타입은 `Prisma.JsonValue`로 반환되므로, DB 조회 후 **Zod 파싱** 또는 **명시적 타입 캐스팅** 필수 — API-014 구현 시 준수

### 8단계: 간이 Integration 검증 스크립트
- [ ] `scripts/verify-si-profile-schema.ts` (PR 머지 전 제거):
  - SiPartner 시드 후 SiProfile INSERT (`reviewSummary: { totalReviews: 10, ... }`, `capabilityTags: ["welding", "automotive"]`) → 성공 (PostgreSQL)
  - 동일 siPartnerId로 2번째 SiProfile INSERT → `P2002` UNIQUE violation 확인
  - 존재하지 않는 siPartnerId FK → `P2003` 확인
  - SQLite 환경에서 `reviewSummary` 저장 → TEXT 직렬화 확인, 조회 시 JSON 파싱 동작 검증
  - `matchesTags(profile, ["welding"])` → true, `matchesTags(profile, ["food"])` → false 검증
  - `calculateSuccessRate(19, 1)` → 95.00 검증

### 9단계: 문서 업데이트
- [ ] `/docs/erd.md`에 SiProfile 엔티티 반영
- [ ] `/docs/si-capability-tags.md` 태그 표준 사전 초안 작성
- [ ] `/docs/si-success-rate-sync.md` 성공률 동기화 정책 명시 (SiPartner ↔ SiProfile 이중 관리 방지)
- [ ] `/docs/jsonb-usage-guide.md` JSON 필드 사용 가이드 (타입 캐스팅, Zod 파싱 패턴)
- [ ] 후행 태스크 담당자(API-013/014/015, FQ-001/002, MOCK-004) 에게 스키마 준비 완료 공유

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상적인 SI 프로필 생성**
- **Given:** SiPartner S1 레코드 존재, 아직 SiProfile 없음
- **When:** `prisma.siProfile.create({ data: { siPartnerId: 'S1', reviewSummary: { totalReviews: 0 }, avgRating: null, completedProjects: 0, failedProjects: 0, capabilityTags: [] } })` 호출
- **Then:** 레코드 생성 성공, 1:1 관계 확립.

**Scenario 2: 1:1 UNIQUE 관계 강제**
- **Given:** SiPartner S1에 이미 SiProfile이 존재
- **When:** 동일 siPartnerId로 두 번째 SiProfile INSERT 시도
- **Then:** `P2002` Unique constraint violation 발생.

**Scenario 3: 존재하지 않는 SiPartner FK 거부**
- **Given:** 유효하지 않은 siPartnerId
- **When:** SiProfile INSERT 시도
- **Then:** `P2003` Foreign key constraint violation 발생.

**Scenario 4: JSONB 필드 저장 및 조회 (PostgreSQL)**
- **Given:** Supabase PostgreSQL 환경
- **When:** `reviewSummary: { totalReviews: 5, recentReviews: [...] }` 저장 후 조회
- **Then:** `Prisma.JsonValue` 타입으로 반환, Zod 파싱 시 `ReviewSummary` 타입으로 안전하게 변환됨.

**Scenario 5: Json 필드 직렬화 (SQLite)**
- **Given:** 로컬 SQLite 환경
- **When:** `capabilityTags: ["welding", "automotive"]` 저장 후 조회
- **Then:** 저장 시 JSON 문자열로 직렬화, 조회 시 배열로 역직렬화. 개발자가 의식할 필요 없이 Prisma가 자동 처리.

**Scenario 6: 성공률 파생 계산**
- **Given:** SiProfile (completedProjects=19, failedProjects=1)
- **When:** `calculateSuccessRate(19, 1)` 호출
- **Then:** 95.00 반환. FC 로직에서 이 값으로 SiPartner.successRate 동기화.

**Scenario 7: 역량 태그 매칭 (FQ-001 검색)**
- **Given:** SiProfile.capabilityTags = `["welding", "automotive", "collaborative-robot"]`
- **When:** `matchesTags(profile, ["welding", "automotive"])` 호출
- **Then:** true 반환 (AND 조건: 쿼리 태그 모두 포함).
- **When:** `matchesTags(profile, ["food"])` 호출
- **Then:** false 반환.

**Scenario 8: SiPartner 삭제 시 Cascade (이론적 시나리오)**
- **Given:** SiPartner의 `onDelete: Restrict` 정책상 실제로는 삭제 차단됨. 하지만 만약 우회 삭제가 발생한다면
- **When:** SiPartner 삭제 (직접 SQL 등 비정상 경로)
- **Then:** 연결된 SiProfile도 Cascade 삭제 (고아 레코드 방지 이중 방어선).

**Scenario 9: 검색 성능 — 평점 기반 정렬**
- **Given:** SiProfile 120건 (avgRating 분포)
- **When:** `prisma.siProfile.findMany({ orderBy: { avgRating: 'desc' }, take: 20 })` 실행
- **Then:** `avgRating` DESC 인덱스 활용, p95 ≤ 200ms.

**Scenario 10: 인덱스 생성 검증**
- **Given:** 마이그레이션 완료된 PostgreSQL DB
- **When:** `\d si_profile` 실행
- **Then:** PK(id), UNIQUE(si_partner_id), INDEX(avg_rating DESC), INDEX(completed_projects DESC) 4개 이상 존재.

## :gear: Technical & Non-Functional Constraints

### 스키마 설계
- **필드 수 준수:** SRS 6.2.8에 명시된 7개 필드 반영 (id, si_partner_id, review_summary, avg_rating, completed_projects, failed_projects, capability_tags, updated_at) — 주의: SRS 명세상 `created_at` 없음, `updatedAt`만 존재
- **UNIQUE FK 핵심:** `siPartnerId @unique` — 1:1 관계 강제
- **Cascade 정책:** `onDelete: Cascade` (이중 방어, 실제로는 SiPartner의 Restrict로 차단)
- **JSON 타입 매핑 (DB-001 규약):**
  - `JSONB` → Prisma `Json` (PostgreSQL JSONB, SQLite 문자열)
  - `TEXT[]` → Prisma `Json` (SQLite 배열 미지원 대응)
- **DEFAULT 값:**
  - `completedProjects: 0`, `failedProjects: 0` — 신규 프로필 안전한 초기값
  - `avgRating`: NULLABLE (리뷰 0건일 때 NULL, 0으로 초기화하면 집계 왜곡)

### 성능
- **FQ-001 검색 (역량 태그 필터):** p95 ≤ 1초 (REQ-FUNC-029)
- **FQ-002 프로필 상세:** p95 ≤ 2초 (REQ-FUNC-009)
- **평점/실적 정렬:** p95 ≤ 200ms (정렬 인덱스 활용)
- **JSONB 태그 검색 성능 주의:**
  - PostgreSQL GIN 인덱스 없이 태그 검색은 순차 스캔 → 대규모 확장 시 성능 저하
  - **MVP 규모(120개사)에서는 순차 스캔으로도 충분** (1초 이내)
  - 확장 시 raw SQL migration으로 `CREATE INDEX ... USING GIN (capability_tags jsonb_path_ops)` 추가

### 안정성
- JSON 필드는 **Zod 파싱 필수** — 스키마 외 구조가 들어가는 것을 막아 런타임 에러 예방
- SiPartner.successRate와 SiProfile.completed/failedProjects **이중 관리 방지**:
  - 원천: SiProfile의 프로젝트 수
  - 파생: SiPartner.successRate
  - 업데이트 시 반드시 `syncSuccessRateToSiPartner` 트랜잭션 사용

### 보안
- `review_summary`에 리뷰어 개인정보 포함 가능 — **Buyer Company 익명화 처리** (UI-004 표시 시 마스킹)
- `capability_tags`는 공개 데이터
- 리뷰 원본 본문은 Phase 2에서 별도 `REVIEW` 테이블로 분리 검토 (MVP는 요약 JSON에 집약)

### 유지보수성
- JSON 스키마 변경 시 **마이그레이션 불필요** (Prisma `Json` 타입 유연성) — 단, 기존 데이터 후처리 스크립트 필요할 수 있음
- 역량 태그 표준화는 Phase 2에서 Admin 검수 프로세스로 강화

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~10)를 충족하는가?
- [ ] `prisma/schema.prisma`에 `SiProfile` 모델이 SRS 6.2.8 명세대로 정의되었는가?
- [ ] `siPartnerId`에 UNIQUE 제약으로 1:1 관계가 DB-level 강제되는가?
- [ ] `reviewSummary`, `capabilityTags`가 Prisma `Json` 타입으로 정의되었는가?
- [ ] `avgRating` NULLABLE, `completedProjects`/`failedProjects` DEFAULT 0 정책이 적용되었는가?
- [ ] FK Cascade 정책 `onDelete: Cascade`가 적용되었는가?
- [ ] 3개 이상의 인덱스(UNIQUE siPartnerId, avgRating DESC, completedProjects DESC)가 생성되었는가?
- [ ] `@prisma/client`가 재생성되어 `SiProfile` 타입이 정상 export되는가?
- [ ] 로컬 SQLite와 Supabase PostgreSQL 양쪽에서 마이그레이션이 성공하고 JSON 필드가 정상 동작하는가?
- [ ] `/lib/types/si-profile.ts` ReviewSummary / CapabilityTags TypeScript 타입 및 Zod 스키마 정의?
- [ ] `/lib/si-profile/success-rate.ts` 성공률 계산 및 SiPartner 동기화 유틸 구현 및 단위 테스트 통과?
- [ ] `/docs/si-capability-tags.md` 태그 표준 사전 초안 작성?
- [ ] `/docs/si-success-rate-sync.md` 동기화 정책 문서?
- [ ] `/docs/jsonb-usage-guide.md` JSON 필드 사용 가이드?
- [ ] ESLint / TypeScript 컴파일 경고 0건?
- [ ] PR 머지 전 임시 검증 스크립트 제거?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-003 | `SI_PARTNER` 테이블 — `si_partner_id` FK 참조 대상 (1:1) | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| MOCK-004 | Prisma Seed — SI 프로필 20건 (역량 태그, 리뷰 요약, 평점, 완료/실패 프로젝트 수) |
| API-002 | SI 파트너 회원가입 — 가입 시 SiProfile 동시 INSERT (빈 초기 프로필) |
| API-013 | SI 검색/필터 Server Component 쿼리 (지역·브랜드·역량 태그) |
| API-014 | SI 프로필 상세 Response DTO (재무등급·시공성공률·리뷰·뱃지·갱신일) |
| API-015 | 기안용 리포트 PDF Route Handler (재무·기술·인증·리뷰 4섹션) |
| FQ-001 | SI 파트너 검색 Server Component (p95 ≤ 1초) |
| FQ-002 | SI 프로필 상세 조회 Server Component (p95 ≤ 2초) |
| UI-003 | SI 파트너 검색 결과 목록 페이지 |
| UI-004 | SI 프로필 상세 페이지 |

### 참고사항
- **SiPartner vs SiProfile 역할 분리 원칙:**
  - SiPartner = **정적 기본 정보** (회사명, 사업자번호, 등급, 지역, 재무등급 캐시)
  - SiProfile = **변동성 높은 확장 정보** (리뷰 요약, 평점, 프로젝트 수, 역량 태그)
  - 이 분리는 **읽기/쓰기 패턴 분리** 효과: 검색 조인 비용 vs 업데이트 빈도 차이 활용
- **successRate 이중 관리 리스크 완화:**
  - SiPartner의 successRate는 **검색/정렬용 denormalized 캐시**
  - SiProfile의 completed/failedProjects는 **원천 데이터**
  - 업데이트 시 반드시 `syncSuccessRateToSiPartner` 호출 — PR 리뷰 체크리스트
  - 또는 향후 successRate 필드를 SiPartner에서 제거하고 JOIN으로만 계산하는 방안 검토 (성능 테스트 후 결정)
- **JSONB GIN 인덱스 타이밍:** MVP 출시 시점에는 불필요 (순차 스캔 < 1초). 사용자 증가 후 FQ-001 성능 저하 감지 시 raw migration 추가
- **Phase 2 확장:** `REVIEW` 엔티티 분리, 태그 정규화 Admin 검수, 역량 태그 점수화, 리뷰 LLM 감성 분석
- **createdAt 미정의:** SRS 6.2.8 명세에 따라 `created_at` 없음. SiPartner.createdAt으로 대체 (1:1 관계에서 자연스러움)
