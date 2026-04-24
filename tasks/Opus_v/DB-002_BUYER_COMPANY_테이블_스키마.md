---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DB-002: BUYER_COMPANY 테이블 스키마 및 마이그레이션"
labels: 'feature, backend, db, auth, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [DB-002] `BUYER_COMPANY` (수요 기업) 테이블 스키마 및 마이그레이션 작성
- 목적: 로봇 도입을 희망하는 **수요 기업(SME, Buyer)** 의 기본 정보를 저장하는 핵심 사용자 엔티티를 정의한다. 회원가입(UI-001, API-001, FC-001), 계약 생성(DB-005), O2O 예약(DB-010), 견적 리드(DB-012)의 Foreign Key 참조 대상이 되며, 사업자등록번호 UNIQUE 제약을 통해 **중복 가입 원천 차단** 및 409 Conflict 응답의 근거를 제공한다. AOS-DOS 세그먼트(Q1~Q4) 분류 ENUM으로 운영팀의 타겟 마케팅·분석 기반을 마련한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.1 BUYER_COMPANY`](../06_SRS-v1.md) — 수요 기업 테이블 스키마 정의 (10개 필드)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-027`](../06_SRS-v1.md) — 수요 기업 회원가입 및 온보딩 프로세스
- SRS 문서: [`06_SRS-v1.md#6.2.12 ER Diagram`](../06_SRS-v1.md) — BUYER_COMPANY 관계 (CONTRACT/O2O_BOOKING/QUOTE_LEAD와의 1:N)
- ORM 매핑 규약: [`06_SRS-v1.md#6.2 ORM 매핑 노트`](../06_SRS-v1.md) — Prisma Schema 예시 포함
- 태스크 리스트: [`07_TASK-LIST-v1.md#DB-002`](../TASKS/07_TASK-LIST-v1.md)
- 연동 API: `API-001` (signupBuyer Server Action DTO)
- 연동 로직: `FC-001` (수요기업 회원가입 Command), `UI-001` (수요기업 회원가입 페이지)
- 선행 태스크: `DB-001` (Prisma ORM 초기 설정)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Prisma 모델 정의 (`prisma/schema.prisma`)
- [ ] `Segment` enum 정의:
  ```prisma
  enum Segment {
    Q1
    Q2
    Q3
    Q4
  }
  ```
- [ ] `BuyerCompany` 모델 정의 (SRS 6.2.1 10개 필드 전량 반영):
  ```prisma
  model BuyerCompany {
    id                 String    @id @default(cuid())
    companyName        String    @db.VarChar(255)
    bizRegistrationNo  String    @unique @db.VarChar(20)
    region             String    @db.VarChar(100)
    segment            Segment
    contactName        String    @db.VarChar(100)
    contactEmail       String    @db.VarChar(255)
    contactPhone       String    @db.VarChar(20)
    createdAt          DateTime  @default(now())
    updatedAt          DateTime  @updatedAt

    // 역방향 관계 (DB-005, DB-010, DB-012에서 FK 설정)
    contracts          Contract[]
    o2oBookings        O2oBooking[]
    quoteLeads         QuoteLead[]

    @@index([region])
    @@index([segment])
    @@map("buyer_company")
  }
  ```
- [ ] 필드별 DB-level 제약 주석 추가 (SRS 조항 맵핑: `biz_registration_no UNIQUE`, `company_name NOT NULL` 등)
- [ ] 테이블명 `@@map("buyer_company")`로 스네이크 케이스 강제 (PostgreSQL 컨벤션 준수)

### 2단계: 인덱스 전략 수립
- [ ] `bizRegistrationNo` → `@unique` (단일 컬럼 유니크 인덱스, 409 Conflict 검증용)
- [ ] `region` → `@@index([region])` (FQ-007 등 지역 기반 조회 쿼리 대응)
- [ ] `segment` → `@@index([segment])` (운영팀 세그먼트별 통계 대응)
- [ ] `createdAt` → 필요 시 `@@index([createdAt(sort: Desc)])` 추가 검토 (관리자 대시보드 최신순 정렬)

### 3단계: Migration 파일 생성 및 검증
- [ ] `pnpm prisma migrate dev --name add_buyer_company` 실행 → `prisma/migrations/YYYYMMDDhhmmss_add_buyer_company/migration.sql` 생성
- [ ] 생성된 SQL 검토:
  - `CREATE TYPE "Segment" AS ENUM ('Q1', 'Q2', 'Q3', 'Q4');`
  - `CREATE TABLE "buyer_company" (...)` 구문에 모든 NOT NULL, UNIQUE, DEFAULT 제약 반영 확인
  - 인덱스 `CREATE INDEX "buyer_company_region_idx" ON "buyer_company"("region");` 등 생성 확인
- [ ] `@prisma/client` 재생성: `pnpm prisma generate` → `BuyerCompany`, `Segment` 타입 export 확인

### 4단계: TypeScript 타입 유틸 작성 (`/lib/types/buyer.ts`)
- [ ] Prisma 자동 생성 타입 활용 기본 re-export:
  ```ts
  import type { BuyerCompany as PrismaBuyerCompany, Segment } from '@prisma/client'
  export type BuyerCompany = PrismaBuyerCompany
  export type { Segment }
  export const SEGMENT_VALUES = ['Q1', 'Q2', 'Q3', 'Q4'] as const
  ```
- [ ] API 응답용 Public DTO 타입 정의 (PII 필드 마스킹 변형 포함, API-001에서 본격 활용):
  ```ts
  export type BuyerCompanyPublic = Omit<BuyerCompany, 'contactEmail' | 'contactPhone'>
  ```

### 5단계: 간이 Integration 검증 스크립트 작성
- [ ] `scripts/verify-buyer-schema.ts` 임시 스크립트 작성 (PR 머지 전 제거):
  - 정상 INSERT 1건 → 성공
  - 동일 `bizRegistrationNo`로 중복 INSERT → `P2002` Unique constraint violation 발생 확인
  - 유효하지 않은 `segment` 값(`Q5`) INSERT → 타입 에러 또는 DB 레벨 reject 확인
- [ ] 검증 완료 후 스크립트 제거, 본격 테스트는 TEST-026에서 수행

### 6단계: 문서 업데이트
- [ ] `/docs/erd.md` 또는 `/docs/db-schema.md`에 BuyerCompany 엔티티 반영
- [ ] `prisma/migrations/` 디렉토리의 SQL 파일이 PR에 포함되었는지 최종 확인

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상적인 수요 기업 레코드 생성**
- **Given:** Prisma 마이그레이션이 완료된 상태의 DB
- **When:** 모든 필수 필드를 채워 `prisma.buyerCompany.create({ data: {...} })`를 호출함 (예: `bizRegistrationNo: "123-45-67890"`, `segment: "Q1"`)
- **Then:** 레코드가 성공적으로 생성되고, `id` (cuid), `createdAt`, `updatedAt`이 자동 채워진다.

**Scenario 2: 사업자등록번호 중복 제약 위반**
- **Given:** `bizRegistrationNo: "123-45-67890"`인 기업이 이미 존재함
- **When:** 동일한 `bizRegistrationNo`로 새 레코드 생성을 시도함
- **Then:** Prisma가 `P2002` Unique constraint violation 에러를 발생시키고, 트랜잭션이 롤백된다. (API-001/FC-001에서 이 에러를 409 Conflict로 변환)

**Scenario 3: 잘못된 segment ENUM 값 거부**
- **Given:** Prisma Client가 `Segment` enum 타입으로 컴파일됨
- **When:** `segment: "Q5"` 등 정의되지 않은 값으로 레코드 생성을 시도함
- **Then:** TypeScript 컴파일 에러 발생 (정적 검증) 또는 런타임 Prisma Validation Error 발생 (동적 입력 시).

**Scenario 4: NOT NULL 제약 검증**
- **Given:** Prisma 스키마에 `companyName`, `bizRegistrationNo`, `region`, `segment`, `contactName`, `contactEmail`, `contactPhone`이 모두 NOT NULL로 정의됨
- **When:** 이 중 하나의 필드를 누락하고 INSERT 시도
- **Then:** TypeScript 타입 에러 또는 Prisma 런타임 검증 에러 발생.

**Scenario 5: 인덱스 생성 확인**
- **Given:** 마이그레이션이 완료된 PostgreSQL DB
- **When:** `\d buyer_company` (psql) 또는 `SELECT * FROM pg_indexes WHERE tablename = 'buyer_company';` 실행
- **Then:** PK(id), UNIQUE(biz_registration_no), INDEX(region), INDEX(segment) 4개 이상의 인덱스가 존재한다.

**Scenario 6: 역방향 관계(Reverse Relation) 참조 가능성**
- **Given:** DB-005(CONTRACT), DB-010(O2O_BOOKING), DB-012(QUOTE_LEAD) 스키마가 후속으로 추가될 예정
- **When:** 각 테이블에서 `buyerCompanyId` FK를 통해 Prisma Relation이 정의됨
- **Then:** `prisma.buyerCompany.findUnique({ where: { id }, include: { contracts: true, o2oBookings: true, quoteLeads: true } })` 쿼리가 타입 오류 없이 작성 가능하다.

## :gear: Technical & Non-Functional Constraints

### 스키마 설계
- **필드 수 준수:** SRS 6.2.1에 명시된 10개 필드 (id, company_name, biz_registration_no, region, segment, contact_name, contact_email, contact_phone, created_at, updated_at) 정확히 반영
- **네이밍 컨벤션:**
  - Prisma 모델 필드: `camelCase` (예: `bizRegistrationNo`)
  - DB 컬럼: `snake_case` (예: `biz_registration_no`) — `@map()` 활용
  - 테이블명: `snake_case` (예: `buyer_company`) — `@@map()` 활용
- **타입 매핑:**
  - `VARCHAR(N)` → Prisma `String @db.VarChar(N)` (PostgreSQL 한정, SQLite는 길이 제약 미적용)
  - `ENUM` → Prisma `enum Segment`
  - `TIMESTAMP` → `DateTime @default(now())` / `@updatedAt`
  - `UUID` → `String @id @default(cuid())` (DB-001 규약 준수)

### 성능
- `bizRegistrationNo` 유니크 조회 p95 ≤ 50ms (회원가입 409 검증용)
- `region`, `segment` 필터링 조회 p95 ≤ 200ms (뱃지 검색/관리자 집계 대응)
- 테이블 확장성: **수요 기업 300개사 규모** 대응 (REQ-NF-021) — MVP 규모에서 인덱스 전략으로 충분

### 안정성
- `bizRegistrationNo` UNIQUE 제약은 DB-level로 강제되어야 함 (애플리케이션 레벨 검증만으로 불충분 — race condition 방지)
- 마이그레이션 스크립트는 idempotent하지 않으므로, 환경별 적용 순서 엄격 관리 (로컬 → Preview → Production)

### 보안 (PII 보호)
- `contactEmail`, `contactPhone`은 개인정보로 분류 — 로그 출력 시 **마스킹 처리 필수** (FC-001 및 로깅 레이어에서 강제)
- DB 레벨 암호화는 Supabase 기본 TDE(Transparent Data Encryption) 의존
- 개인정보 파기 정책: 탈퇴 후 30일 보존 후 파기 (REQ-NF-012) — 향후 소프트 삭제 플래그 추가 검토

### 유지보수성
- Segment ENUM 확장 시 마이그레이션 필요 — 새 세그먼트 추가는 운영팀 검토 후 별도 마이그레이션으로 분리

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~6)를 충족하는가?
- [ ] `prisma/schema.prisma`에 `Segment` enum + `BuyerCompany` 모델이 SRS 6.2.1 명세대로 정의되었는가?
- [ ] 마이그레이션 SQL 파일(`prisma/migrations/*_add_buyer_company/migration.sql`)이 생성되고 커밋되었는가?
- [ ] `@prisma/client`가 재생성되어 `BuyerCompany`, `Segment` 타입이 정상 export되는가?
- [ ] 로컬 SQLite와 Supabase PostgreSQL 양쪽에서 마이그레이션이 성공하는가?
- [ ] `bizRegistrationNo` UNIQUE 제약이 DB-level에서 강제됨을 검증했는가? (동일 값 중복 INSERT → `P2002`)
- [ ] `region`, `segment` 인덱스가 생성되었음을 `pg_indexes` 조회로 확인했는가?
- [ ] `/lib/types/buyer.ts`에 Public DTO 타입이 정의되었는가?
- [ ] ESLint / TypeScript 컴파일 경고가 0건인가?
- [ ] PR 머지 전 임시 검증 스크립트(`scripts/verify-buyer-schema.ts`)가 제거되었는가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-001 | Prisma ORM 초기 설정 및 SQLite/PostgreSQL 이중 환경 구성 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| DB-005 | `CONTRACT` 테이블 — `buyer_company_id` FK 참조 |
| DB-010 | `O2O_BOOKING` 테이블 — `buyer_company_id` FK 참조 |
| DB-012 | `QUOTE_LEAD` 테이블 — `buyer_company_id` FK 참조 (nullable) |
| MOCK-001 | Prisma Seed — 수요기업 10개사 샘플 데이터 생성 |
| API-001 | `signupBuyer` Server Action DTO — 본 스키마 기반 Zod 스키마 도출 |
| FC-001 | 수요기업 회원가입 Command 로직 |
| UI-001 | 수요기업 회원가입 페이지 — 본 스키마 필드 기반 폼 구성 |
| API-027 | NextAuth.js/Supabase Auth RBAC — `buyer` 역할 식별 |

### 참고사항
- **비즈니스 확장 여지:** 사업자등록번호 실제 유효성(국세청 API) 검증은 Phase 2 범위 — MVP에서는 포맷만 검증 (UI-001)
- **세그먼트 분류:** Q1~Q4는 AOS-DOS 기회 점수 기반 분류 — 운영팀이 수동 설정하거나 기본값 `Q4` 부여 후 재조정하는 방안 검토 필요 (API-001에서 확정)
- **인덱스 튜닝:** 가입자 1,000건 미만에서는 현재 인덱스로 충분. 300개사 초과 후 `EXPLAIN ANALYZE` 기반 재평가 (NFR-008 연계)
