---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DB-003: SI_PARTNER 테이블 스키마 및 마이그레이션"
labels: 'feature, backend, db, auth, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [DB-003] `SI_PARTNER` (SI 파트너) 테이블 스키마 및 마이그레이션 작성
- 목적: 로봇 시스템 설계·시공·통합을 담당하는 **SI 파트너(System Integrator)** 기업 정보를 저장하는 핵심 사용자 엔티티를 정의한다. 검색/필터링(FQ-001, FQ-003), 프로필 상세 조회(FQ-002), 뱃지 발급(DB-008), 파트너 제안(DB-013), 계약 체결(DB-005)의 FK 참조 대상이다. **tier ENUM(Silver/Gold/Diamond)** 을 통해 SI 등급 제도를 확립하고, **`success_rate`, `financial_grade`** 필드로 수요기업의 의사결정(기안용 리포트, FR-REQ-009/010)에 필요한 신뢰도 정보를 제공한다. 재무 등급은 **운영팀이 사전 업데이트한 정적 데이터**를 서빙하는 구조로 외부 API 의존성을 제거한다 (CON-02).

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.2 SI_PARTNER`](../06_SRS-v1.md) — SI 파트너 테이블 스키마 정의
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-028`](../06_SRS-v1.md) — SI 파트너 회원가입 및 프로필 등록
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-009`](../06_SRS-v1.md) — SI 프로필 상세 (재무등급·시공성공률·리뷰·뱃지 통합)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-029`](../06_SRS-v1.md) — SI 파트너 검색 (지역·브랜드·역량 태그 필터링)
- SRS 문서: [`06_SRS-v1.md#6.3.4`](../06_SRS-v1.md) — SI 재무 등급 조회 및 캐시 상세 흐름 (운영팀 사전 DB 업데이트 기반)
- SRS 문서: [`06_SRS-v1.md#CON-02`](../06_SRS-v1.md) — 외부 신용평가 API 연동 Phase 2 이후 적용
- SRS 문서: [`06_SRS-v1.md#6.2.12 ER Diagram`](../06_SRS-v1.md) — SI_PARTNER 관계 (CONTRACT/BADGE/SI_PROFILE/PARTNER_PROPOSAL)
- 태스크 리스트: [`07_TASK-LIST-v1.md#DB-003`](../TASKS/07_TASK-LIST-v1.md)
- 연동 API: `API-002` (signupSiPartner), `API-013` (SI 검색), `API-014` (SI 프로필 상세), `API-015` (기안용 리포트 PDF)
- 연동 DB: `DB-008` (BADGE), `DB-009` (SI_PROFILE), `DB-013` (PARTNER_PROPOSAL), `DB-005` (CONTRACT)
- 선행 태스크: `DB-001` (Prisma ORM 초기 설정)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Prisma 모델 정의 (`prisma/schema.prisma`)
- [ ] `SiTier` enum 정의:
  ```prisma
  enum SiTier {
    Silver
    Gold
    Diamond
  }
  ```
- [ ] `SiPartner` 모델 정의 (SRS 6.2.2 10개 필드 반영):
  ```prisma
  model SiPartner {
    id                        String    @id @default(cuid())
    companyName               String    @db.VarChar(255)
    bizRegistrationNo         String    @unique @db.VarChar(20)
    tier                      SiTier
    successRate               Float     // 0 ≤ successRate ≤ 100 (application-level 검증)
    financialGrade            String?   @db.VarChar(10)      // NICE 재무 등급 캐시 (운영팀 수동 업데이트)
    financialGradeUpdatedAt   DateTime?                       // 재무 등급 최종 갱신 일시
    region                    String    @db.VarChar(100)
    createdAt                 DateTime  @default(now())
    updatedAt                 DateTime  @updatedAt

    // 역방향 관계 (DB-005, DB-008, DB-009, DB-013에서 FK 설정)
    contracts                 Contract[]
    badges                    Badge[]
    siProfile                 SiProfile?
    partnerProposals          PartnerProposal[]

    @@index([region])
    @@index([tier])
    @@index([successRate(sort: Desc)])
    @@map("si_partner")
  }
  ```
- [ ] `successRate` 필드에 대한 **application-level 검증** 강제 문서화 — Prisma 자체에는 check constraint 미지원, FC/API 레이어에서 Zod로 `z.number().min(0).max(100)` 검증 필수 (API-002에서 구현)

### 2단계: 인덱스 전략 수립
- [ ] `bizRegistrationNo` → `@unique` (중복 가입 차단)
- [ ] `region` → `@@index([region])` — FQ-001 지역 기반 검색 대응
- [ ] `tier` → `@@index([tier])` — 등급 필터 대응
- [ ] `successRate` → `@@index([successRate(sort: Desc)])` — 성공률 내림차순 정렬 대응
- [ ] 복합 인덱스 검토: `@@index([region, tier])` (검색 결합 쿼리 패턴이 자주 발생할 경우 FQ-001 완성 후 재평가)

### 3단계: Migration 파일 생성 및 검증
- [ ] `pnpm prisma migrate dev --name add_si_partner` 실행 → 마이그레이션 SQL 생성
- [ ] 생성된 SQL 검토:
  - `CREATE TYPE "SiTier" AS ENUM ('Silver', 'Gold', 'Diamond');`
  - `CREATE TABLE "si_partner" (...)` 구문의 NOT NULL/UNIQUE/NULLABLE 제약 정확성 확인
  - `financial_grade`, `financial_grade_updated_at` → NULLABLE 확인 (SRS 명세)
  - 인덱스 생성 확인 (region, tier, success_rate)
- [ ] `pnpm prisma generate` → `SiPartner`, `SiTier` 타입 export 검증

### 4단계: 재무 등급 업데이트 운영 프로세스 문서화
- [ ] `/docs/si-financial-grade-ops.md` 작성 — 운영팀 수동 업데이트 표준 절차
  - 업데이트 주기 (권장: 분기 1회)
  - 업데이트 시 `financialGradeUpdatedAt` 반드시 동시 갱신 (갱신일 표시 UX에 노출됨 — REQ-FUNC-009)
  - 대량 업데이트 시 Admin 전용 스크립트/엔드포인트 경로
- [ ] SRS 6.3.4 시퀀스 다이어그램 참조 링크 포함

### 5단계: TypeScript 타입 유틸 작성 (`/lib/types/si-partner.ts`)
- [ ] Prisma 타입 re-export:
  ```ts
  import type { SiPartner as PrismaSiPartner, SiTier } from '@prisma/client'
  export type SiPartner = PrismaSiPartner
  export type { SiTier }
  export const SI_TIER_VALUES = ['Silver', 'Gold', 'Diamond'] as const
  export const TIER_PRIORITY: Record<SiTier, number> = { Diamond: 3, Gold: 2, Silver: 1 }
  ```
- [ ] 검색 결과용 DTO 타입 초안 (API-013에서 최종 확정):
  ```ts
  export type SiPartnerSearchResult = Pick<SiPartner, 'id' | 'companyName' | 'tier' | 'successRate' | 'region' | 'financialGrade'>
  ```

### 6단계: 간이 Integration 검증 스크립트 작성
- [ ] `scripts/verify-si-partner-schema.ts` (PR 머지 전 제거):
  - 정상 INSERT + NULL 재무등급 1건 → 성공
  - 동일 `bizRegistrationNo` 중복 INSERT → `P2002` 발생
  - `successRate = 150` 값 INSERT → 스키마상 허용되나 **application 검증에서 차단되어야 함을 주석으로 명시**
  - `tier = 'Platinum'` (enum에 없는 값) → 컴파일 에러

### 7단계: 문서 업데이트
- [ ] `/docs/erd.md`에 SiPartner 엔티티 반영
- [ ] 관련 태스크(DB-008/009/013) 담당자에게 FK 참조 준비 완료 공유

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상적인 SI 파트너 레코드 생성 (재무등급 초기값 NULL)**
- **Given:** 신규 가입한 SI 파트너 정보 (`tier: "Silver"`, `successRate: 0`, `financialGrade: null`, `region: "서울"`)
- **When:** `prisma.siPartner.create({ data: {...} })` 호출
- **Then:** 레코드가 성공 생성되고, `financialGrade`와 `financialGradeUpdatedAt`이 NULL 상태로 저장된다. (운영팀이 추후 수동 업데이트)

**Scenario 2: 사업자등록번호 중복 제약 위반**
- **Given:** `bizRegistrationNo: "111-22-33333"`인 SI 파트너가 이미 존재함
- **When:** 동일 번호로 새 레코드 생성 시도
- **Then:** `P2002` Unique constraint violation 에러가 발생하고, 트랜잭션 롤백된다.

**Scenario 3: tier ENUM 제약 검증**
- **Given:** `SiTier` enum이 `Silver`, `Gold`, `Diamond`만 허용
- **When:** `tier: "Platinum"` 등 미정의 값 INSERT 시도
- **Then:** TypeScript 컴파일 에러 또는 Prisma Validation Error 발생.

**Scenario 4: 재무등급 운영팀 수동 업데이트**
- **Given:** 기존 SI 파트너 레코드 (`financialGrade: null`)
- **When:** Admin이 `prisma.siPartner.update({ where: {id}, data: { financialGrade: 'A+', financialGradeUpdatedAt: new Date() } })` 호출
- **Then:** `financialGrade`가 `'A+'`로 갱신되고, `financialGradeUpdatedAt` 타임스탬프가 현재 시각으로 기록된다. (FQ-002에서 "갱신일 YYYY-MM-DD" 표시 근거)

**Scenario 5: 역방향 관계 include 쿼리 동작**
- **Given:** DB-008(Badge), DB-009(SiProfile), DB-013(PartnerProposal) 스키마가 후속 구현됨
- **When:** `prisma.siPartner.findUnique({ where: { id }, include: { badges: true, siProfile: true, partnerProposals: true, contracts: true } })` 실행
- **Then:** 타입 오류 없이 쿼리가 작성되고, 관계 데이터가 함께 조회된다.

**Scenario 6: 성공률 기반 정렬 쿼리 성능**
- **Given:** SI 파트너 120개사(REQ-NF-021 상한) 시드 데이터
- **When:** `prisma.siPartner.findMany({ where: { tier: 'Gold' }, orderBy: { successRate: 'desc' }, take: 20 })` 실행
- **Then:** 인덱스 활용으로 응답 시간 p95 ≤ 100ms 달성. (FQ-001의 p95 ≤ 1초 목표에 여유 확보)

**Scenario 7: 인덱스 생성 검증**
- **Given:** 마이그레이션 완료된 PostgreSQL DB
- **When:** `\d si_partner` 실행
- **Then:** PK(id), UNIQUE(biz_registration_no), INDEX(region), INDEX(tier), INDEX(success_rate DESC) 5개 이상의 인덱스 존재 확인.

## :gear: Technical & Non-Functional Constraints

### 스키마 설계
- **필드 수 준수:** SRS 6.2.2에 명시된 10개 필드 정확히 반영
- **NULLABLE 정책:**
  - `financialGrade`, `financialGradeUpdatedAt`: NULLABLE (신규 가입 직후 운영팀 업데이트 전까지 NULL 상태 허용)
  - 나머지 필드: NOT NULL
- **타입 매핑:**
  - `FLOAT` → Prisma `Float` (SQLite/PostgreSQL 모두 `Double`로 처리, 금융 계산 아닌 백분율이므로 Decimal 미사용)
  - `VARCHAR(10)` (`financialGrade`): "A+", "BB-" 등 8자 이내 등급 표기 예상
- **네이밍:** `camelCase` (Prisma) ↔ `snake_case` (DB) 매핑 강제 (`@map` / `@@map`)

### 성능
- `region + tier` 결합 검색 p95 ≤ 500ms (FQ-001 p95 ≤ 1초 목표의 50% 수준)
- `successRate` 정렬 쿼리 p95 ≤ 200ms (인덱스 활용 전제)
- 테이블 최대 규모: **SI 파트너 120개사** (REQ-NF-021) — 현재 인덱스 구성으로 충분

### 안정성
- `bizRegistrationNo` UNIQUE 제약 DB-level 강제
- `successRate` 범위 검증은 **FC-002/API-002의 application 레벨 책임** — 스키마 레벨 검증 한계 명시 (Prisma가 check constraint 미지원)
- 재무 등급 업데이트는 Admin 권한 전용 엔드포인트에서만 가능 (RBAC — API-027 연계)

### 보안
- 재무 등급(`financialGrade`)은 SI 파트너 본인에게도 조회 가능한 공개 정보이나, 수정 권한은 **Admin 단독**
- 사업자등록번호는 수요기업(Buyer) 공개 뷰에서 마스킹 여부 검토 (검색 결과/프로필 상세에서 표시 정책은 UX 결정 — UI-004 참조)
- 개인정보 파기: 탈퇴 후 30일 보존 (REQ-NF-012)

### 유지보수성
- `SiTier` enum 확장 시 마이그레이션 분리 수행 (뱃지 제도 개편 시점에 재평가)
- 재무 등급 체계(A+, A, B+ 등)는 NICE 등급 체계를 따르되, 향후 외부 API 연동(Phase 2) 시 필드 의미가 자동화된 실시간 값으로 전환될 수 있음 — Migration-safe 설계 유지

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~7)를 충족하는가?
- [ ] `prisma/schema.prisma`에 `SiTier` enum + `SiPartner` 모델이 SRS 6.2.2 명세대로 정의되었는가?
- [ ] 마이그레이션 SQL 파일이 생성 및 커밋되었는가?
- [ ] `financialGrade`, `financialGradeUpdatedAt`이 NULLABLE로 정의되어 있는가?
- [ ] `bizRegistrationNo` UNIQUE 제약이 DB-level에서 강제되는가?
- [ ] `region`, `tier`, `successRate` 인덱스가 생성되었는가?
- [ ] `@prisma/client`가 재생성되어 `SiPartner`, `SiTier` 타입이 정상 export되는가?
- [ ] 로컬 SQLite와 Supabase PostgreSQL 양쪽에서 마이그레이션이 성공하는가?
- [ ] `/lib/types/si-partner.ts`에 Public DTO 타입이 정의되었는가?
- [ ] `/docs/si-financial-grade-ops.md` 운영 프로세스 문서가 작성되었는가?
- [ ] ESLint / TypeScript 컴파일 경고 0건인가?
- [ ] PR 머지 전 임시 검증 스크립트가 제거되었는가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-001 | Prisma ORM 초기 설정 및 SQLite/PostgreSQL 이중 환경 구성 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| DB-005 | `CONTRACT` — `si_partner_id` FK 참조 |
| DB-008 | `BADGE` — `si_partner_id` FK 참조 (뱃지 보유 SI 식별) |
| DB-009 | `SI_PROFILE` — `si_partner_id` FK 참조 (1:1 관계) |
| DB-013 | `PARTNER_PROPOSAL` — `si_partner_id` FK 참조 |
| MOCK-001 | Prisma Seed — SI 파트너 20개사 샘플 데이터 |
| API-002 | `signupSiPartner` Server Action DTO |
| API-013 | SI 검색/필터 Server Component 인터페이스 |
| API-014 | SI 프로필 상세 Response DTO |
| API-027 | NextAuth RBAC — `si_partner` 역할 식별 |
| FC-002 | SI 파트너 회원가입 Command |
| FQ-001 | SI 파트너 검색 Server Component (지역·브랜드·역량 태그 필터) |
| FQ-002 | SI 프로필 상세 조회 Server Component |
| UI-002 | SI 파트너 회원가입 페이지 |
| UI-003 | SI 검색 결과 목록 페이지 |
| UI-004 | SI 프로필 상세 페이지 |

### 참고사항
- **Class Diagram 참조:** SRS 6.2.13에는 `PARTNER_PROPOSAL`이 별도 정의되어 있으나, 6.2.12 ER Diagram에는 누락 — DB-013에서 보완 예정
- **`successRate` 초기값 정책:** 신규 가입 SI의 성공률을 0으로 할지, NULL을 허용할지 FC-002/API-002에서 확정 필요. 본 스키마는 NOT NULL로 정의했으므로 **기본값 0 초기화 정책** 권장
- **`tier` 자동 산정 vs 수동 부여:** MVP에서는 Admin 검토 후 수동 부여(기본 `Silver`)가 현실적. 자동 산정 로직(success_rate + 뱃지 수 조합)은 Phase 2 검토
- **재무 등급 갱신 주기:** SRS 6.3.4 기준 "운영팀이 주기적으로 수동 업데이트" — 구체적 주기는 운영 SOP에서 정의 (월 1회 / 분기 1회 등)
