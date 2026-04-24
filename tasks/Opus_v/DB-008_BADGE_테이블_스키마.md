---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DB-008: BADGE 테이블 스키마 및 마이그레이션 (FK→MANUFACTURER, FK→SI_PARTNER, is_active, expires_at)"
labels: 'feature, backend, db, badge, partnership, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [DB-008] `BADGE` (제조사 인증 뱃지) 테이블 스키마 및 마이그레이션 작성
- 목적: **F-04 제조사 인증 뱃지 시스템의 핵심 엔티티**. 제조사(Manufacturer)가 SI 파트너(SiPartner)의 기술 역량을 인증하여 발급하는 디지털 인증 마크를 저장한다. 수요기업이 SI를 탐색할 때 **"뱃지 보유 SI 필터"(REQ-FUNC-015)** 의 기반 데이터이며, **Brand-Agnostic 정책(REQ-NF-022, REQ-FUNC-017)** 에 따라 한 SI가 여러 제조사 뱃지를 동시 보유 가능한 N:M 구조(Join Table)다. `issued_at`/`expires_at`/`is_active`/`revoked_at` 4개 필드로 **발급→활성→만료/철회**의 생명주기를 관리하며, CRON-002(D-7 만료 알림)와 CRON-003(만료일 도래 자동 비활성화)의 핵심 대상 테이블이다. 파트너 제안 수락 시(REQ-FUNC-030) 자동 발급되는 연계 플로우의 종점이다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.7 BADGE`](../06_SRS-v1.md) — 뱃지 테이블 스키마 정의 (9개 필드)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-013`](../06_SRS-v1.md) — 뱃지 발급 (SI 프로필 반영 ≤ 1시간)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-014`](../06_SRS-v1.md) — 뱃지 철회 (즉시 비활성화 ≤ 10분)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-015`](../06_SRS-v1.md) — 뱃지 보유 SI 필터 (미인증 SI 혼입률 0%)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-016`](../06_SRS-v1.md) — 뱃지 만료 D-7 알림
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-017`](../06_SRS-v1.md) — Brand-Agnostic (복수 제조사 뱃지 동시 보유 허용)
- SRS 문서: [`06_SRS-v1.md#REQ-NF-022`](../06_SRS-v1.md) — Brand-Agnostic 호환성 DB 구조 (신규 제조사 스키마 변경 없이 확장)
- SRS 문서: [`06_SRS-v1.md#6.3.2`](../06_SRS-v1.md) — 파트너 제안 → 뱃지 자동 발급 시퀀스
- SRS 문서: [`06_SRS-v1.md#6.2.13 Class Diagram (Badge)`](../06_SRS-v1.md) — `issue`, `revoke`, `isExpired`, `deactivate` 도메인 메서드
- 태스크 리스트: [`07_TASK-LIST-v1.md#DB-008`](../TASKS/07_TASK-LIST-v1.md)
- 연동 API: `API-016` (issueBadge), `API-017` (revokeBadge), `API-019` (respondProposal — 수락 시 뱃지 자동 발급)
- 연동 DB: `DB-003` (SI_PARTNER 상위), `DB-004` (MANUFACTURER 상위), `DB-013` (PARTNER_PROPOSAL — 수락 시 Badge 생성)
- 연동 Cron: `CRON-002` (D-7 만료 알림), `CRON-003` (만료일 도래 자동 비활성화)
- 선행 태스크: `DB-003` (SI_PARTNER), `DB-004` (MANUFACTURER)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Prisma 모델 정의 (`prisma/schema.prisma`)
- [ ] `Badge` 모델 정의 (SRS 6.2.7 9개 필드 반영):
  ```prisma
  model Badge {
    id                String         @id @default(cuid())
    manufacturerId    String
    siPartnerId       String
    manufacturerName  String         @db.VarChar(255)        // 비정규화 (조회 성능 + 제조사명 변경 시 발급 시점 기록 보존)
    issuedAt          DateTime       @db.Date
    expiresAt         DateTime       @db.Date
    isActive          Boolean        @default(true)
    revokedAt         DateTime?                               // 철회 시각 (NULL = 미철회)
    createdAt         DateTime       @default(now())

    // FK Relations
    manufacturer      Manufacturer   @relation(fields: [manufacturerId], references: [id], onDelete: Restrict)
    siPartner         SiPartner      @relation(fields: [siPartnerId], references: [id], onDelete: Restrict)

    @@index([siPartnerId, isActive])                          // FQ-003 핵심 쿼리: SI별 활성 뱃지 조회
    @@index([manufacturerId, isActive])                       // FQ-006 제조사 대시보드
    @@index([expiresAt, isActive])                            // CRON-002, CRON-003 핵심 쿼리
    @@index([isActive])                                       // 전역 활성 필터
    @@map("badge")
  }
  ```
- [ ] **UNIQUE 제약 검토:**
  - 옵션 A (현 채택): **UNIQUE 없음** — 한 제조사가 같은 SI에게 뱃지 재발급(갱신) 시 신규 레코드 INSERT + 구 뱃지 `is_active=false` 전환. 이력 추적 가능
  - 옵션 B (대안): `@@unique([manufacturerId, siPartnerId, isActive])` (부분 UNIQUE) — 활성 뱃지 중복 방지
  - → **옵션 A 채택 이유:** 갱신 시나리오와 철회 후 재발급 시나리오 모두 자연스럽게 이력으로 남음. 중복 활성은 **FC-016에서 기존 활성 뱃지 비활성화 후 신규 INSERT** 로 강제
- [ ] `manufacturerName` **비정규화 필드** 유지:
  - SRS 6.2.7 명시 (`VARCHAR(255), NOT NULL`)
  - 이점: SI 검색/프로필 렌더링 시 Manufacturer JOIN 불필요, 제조사명 변경 시에도 발급 시점 기록 보존
  - 주의: 제조사명 변경 시 동기화 정책 결정 필요 (→ 9단계 문서화)

### 2단계: 인덱스 전략 수립
- [ ] `[siPartnerId, isActive]` → **FQ-003 핵심 쿼리** 최적화: "SI의 현재 활성 뱃지 목록"
  - `SELECT * FROM badge WHERE si_partner_id = ? AND is_active = true`
- [ ] `[manufacturerId, isActive]` → FQ-006 제조사 대시보드: "내가 발급한 활성 뱃지 목록"
- [ ] `[expiresAt, isActive]` → **CRON-002/003 핵심 쿼리**:
  - CRON-002: `WHERE is_active = true AND expires_at BETWEEN NOW() AND NOW() + 7d`
  - CRON-003: `WHERE is_active = true AND expires_at < NOW()`
- [ ] `isActive` 단독 인덱스 → 전역 집계 쿼리 대응

### 3단계: Migration 파일 생성 및 검증
- [ ] `pnpm prisma migrate dev --name add_badge` 실행
- [ ] 생성된 SQL 검토:
  - `CREATE TABLE "badge" (...)`:
    - `issued_at DATE NOT NULL`, `expires_at DATE NOT NULL` (시간 불필요, 날짜 단위)
    - `is_active BOOLEAN NOT NULL DEFAULT TRUE`
    - `revoked_at TIMESTAMP NULL`
    - `manufacturer_name VARCHAR(255) NOT NULL`
  - FK 2개: `ON DELETE RESTRICT` 양쪽 모두 적용
  - 4개 인덱스 생성 확인
- [ ] `pnpm prisma generate` → `Badge` 타입 export 검증

### 4단계: 뱃지 생명주기 유틸리티 작성 (`/lib/badge/lifecycle.ts`)
- [ ] 만료 판정 / 활성 판정 헬퍼:
  ```ts
  import type { Badge } from '@prisma/client'

  export const DEFAULT_VALIDITY_MONTHS = 12  // 뱃지 기본 유효기간 (API-016에서 기본값으로 사용)
  export const EXPIRY_WARNING_DAYS = 7       // D-7 만료 알림 기준 (CRON-002)

  export function isExpired(badge: Pick<Badge, 'expiresAt'>, now: Date = new Date()): boolean {
    return badge.expiresAt < now
  }

  export function isDisplayable(badge: Pick<Badge, 'isActive' | 'expiresAt' | 'revokedAt'>, now: Date = new Date()): boolean {
    // SI 프로필/검색에 표시 가능한 뱃지 조건
    return badge.isActive && !badge.revokedAt && badge.expiresAt >= now
  }

  export function calculateExpiryDate(issuedAt: Date, months: number = DEFAULT_VALIDITY_MONTHS): Date {
    const d = new Date(issuedAt)
    d.setMonth(d.getMonth() + months)
    return d
  }

  export function isNearExpiry(badge: Pick<Badge, 'expiresAt' | 'isActive'>, now: Date = new Date()): boolean {
    if (!badge.isActive) return false
    const warningThreshold = new Date(now)
    warningThreshold.setDate(warningThreshold.getDate() + EXPIRY_WARNING_DAYS)
    return badge.expiresAt <= warningThreshold && badge.expiresAt >= now
  }
  ```
- [ ] 단위 테스트: 경계값(만료 당일 00:00, 만료 1초 전/후) 검증

### 5단계: 뱃지 발급/철회 비즈니스 규칙 문서화 (`/docs/badge-lifecycle.md`)
- [ ] 발급 규칙:
  - 제조사는 **Admin 또는 Manufacturer 포털에서 직접 발급** 가능 (API-016)
  - 파트너 제안(DB-013) 수락 시 **자동 발급** (API-019 → FC-019)
  - 기본 유효기간 12개월 (사용자 지정 가능, 최대 36개월 등 정책 확정 필요 — API-016에서 검증)
  - 동일 (Manufacturer, SiPartner) 조합 활성 뱃지가 이미 있으면 **기존 비활성화 후 신규 INSERT** (트랜잭션)
- [ ] 철회 규칙:
  - 제조사가 수동 철회 → `isActive=false`, `revokedAt=NOW()` 기록
  - 즉시 SI 프로필/검색에서 비노출 (REQ-FUNC-014, 반영 ≤ 10분)
- [ ] 만료 규칙:
  - CRON-003 (일 1회 또는 1시간 1회 배치) → 만료일 도래 시 `isActive=false` (revokedAt은 NULL 유지 — 철회와 구분)
  - CRON-002 (일 1회) → 만료 D-7일에 해당 SI에게 알림

### 6단계: TypeScript 타입 유틸 작성 (`/lib/types/badge.ts`)
- [ ] Prisma 타입 re-export + 도메인 DTO:
  ```ts
  import type { Badge as PrismaBadge } from '@prisma/client'
  export type Badge = PrismaBadge

  // SI 프로필/검색 결과에 표시되는 공개 DTO
  export type BadgePublic = Pick<Badge, 'id' | 'manufacturerName' | 'issuedAt' | 'expiresAt'>

  // 제조사 대시보드 관리용 DTO (FQ-006)
  export type BadgeAdminView = Pick<
    Badge,
    'id' | 'manufacturerId' | 'siPartnerId' | 'manufacturerName' |
    'issuedAt' | 'expiresAt' | 'isActive' | 'revokedAt'
  >

  // 뱃지 상태 라벨 (UI용)
  export type BadgeStatus = 'active' | 'expired' | 'revoked'

  export function getBadgeStatus(badge: Pick<Badge, 'isActive' | 'expiresAt' | 'revokedAt'>): BadgeStatus {
    if (badge.revokedAt) return 'revoked'
    if (badge.expiresAt < new Date()) return 'expired'
    return 'active'
  }
  ```

### 7단계: 간이 Integration 검증 스크립트
- [ ] `scripts/verify-badge-schema.ts` (PR 머지 전 제거):
  - Manufacturer/SiPartner 시드 후 Badge INSERT (`manufacturer_name="UR"`, `issuedAt=today`, `expiresAt=+12m`, `isActive=true`) → 성공
  - 존재하지 않는 manufacturerId/siPartnerId FK → `P2003` 확인
  - 같은 SI에게 2개 제조사가 각각 뱃지 발급 → **둘 다 성공** (Brand-Agnostic 검증, REQ-FUNC-017)
  - 철회 시뮬레이션: `isActive=false, revokedAt=NOW()` UPDATE → 성공, `getBadgeStatus` === 'revoked' 확인
  - 만료일 지난 뱃지 조회 → `isExpired` === true, `isDisplayable` === false
  - CRON-003 시뮬레이션 쿼리: `WHERE is_active = true AND expires_at < NOW()` → 인덱스 활용 확인

### 8단계: 문서 업데이트
- [ ] `/docs/erd.md`에 Badge 엔티티 반영
- [ ] `/docs/badge-lifecycle.md` 발급/철회/만료 규칙 확정
- [ ] `/docs/badge-denormalization-policy.md` `manufacturerName` 비정규화 동기화 정책 명시:
  - 제조사명 변경 시 기존 뱃지 `manufacturerName` 업데이트 여부 결정 (권장: **미업데이트 — 발급 시점 기록 보존**)
  - 업데이트가 필요하면 별도 Admin 스크립트 제공
- [ ] 후행 태스크 담당자(DB-013, API-016/017/019, FQ-003) 에게 스키마 준비 완료 공유

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상적인 뱃지 발급 (제조사 → SI)**
- **Given:** Manufacturer M1, SiPartner S1 레코드 존재
- **When:** `prisma.badge.create({ data: { manufacturerId: 'M1', siPartnerId: 'S1', manufacturerName: 'UR', issuedAt: today, expiresAt: today+12m, isActive: true } })` 호출
- **Then:** 레코드 생성 성공, `getBadgeStatus` === 'active', `isDisplayable` === true.

**Scenario 2: Brand-Agnostic 복수 제조사 뱃지 동시 보유 (REQ-FUNC-017)**
- **Given:** SiPartner S1이 이미 Manufacturer M1 뱃지 보유
- **When:** 다른 Manufacturer M2가 동일 S1에게 뱃지 발급 시도
- **Then:** 두 번째 뱃지도 성공 생성. S1은 M1, M2 뱃지를 동시 보유. (FQ-003에서 2개 모두 조회됨)

**Scenario 3: FK 제약 — 존재하지 않는 제조사 참조 거부**
- **Given:** 존재하지 않는 `manufacturerId`
- **When:** Badge INSERT 시도
- **Then:** `P2003` Foreign key constraint violation 발생.

**Scenario 4: 뱃지 철회 (제조사 수동 철회)**
- **Given:** 활성 뱃지 (isActive=true, revokedAt=null)
- **When:** `prisma.badge.update({ where: { id }, data: { isActive: false, revokedAt: new Date() } })`
- **Then:** `isActive=false`, `revokedAt` 타임스탬프 기록. `getBadgeStatus` === 'revoked', `isDisplayable` === false.

**Scenario 5: 뱃지 만료 자동 비활성화 (CRON-003)**
- **Given:** 활성 뱃지 (isActive=true, expiresAt=yesterday)
- **When:** CRON-003이 `prisma.badge.updateMany({ where: { isActive: true, expiresAt: { lt: now } }, data: { isActive: false } })` 실행
- **Then:** `isActive=false`로 전환, `revokedAt`은 NULL 유지 (철회가 아닌 만료로 구분). `getBadgeStatus` === 'expired'.

**Scenario 6: D-7 만료 예정 뱃지 감지 (CRON-002 쿼리)**
- **Given:** 뱃지 100건 (다양한 expiresAt 분포), 5건이 `expiresAt BETWEEN now AND now+7d`
- **When:** `prisma.badge.findMany({ where: { isActive: true, expiresAt: { gte: now, lte: now + 7d } } })` 실행
- **Then:** `[expiresAt, isActive]` 인덱스 활용으로 p95 ≤ 200ms, 정확히 5건 반환.

**Scenario 7: FQ-003 뱃지 보유 SI 필터 (미인증 혼입 0%)**
- **Given:** SI 파트너 20개사, 이 중 10개사만 활성 뱃지 보유
- **When:** FQ-003 쿼리 `WHERE si_partner_id IN (SELECT si_partner_id FROM badge WHERE is_active = true)` 실행
- **Then:** 정확히 10개사만 반환, **미인증 SI 혼입률 0%** (REQ-FUNC-015 요구사항 충족).

**Scenario 8: 제조사 삭제 시 Restrict 차단**
- **Given:** Manufacturer M1이 발급한 Badge가 1건 이상 존재
- **When:** `prisma.manufacturer.delete({ where: { id: 'M1' } })` 시도
- **Then:** `P2003` Restrict 에러, Manufacturer 삭제 차단 (뱃지 이력 보존).

**Scenario 9: 제조사명 변경 시 비정규화 필드 유지 정책**
- **Given:** Badge의 `manufacturerName='UR'`, Manufacturer의 `brandName`이 'Universal Robots'로 변경됨
- **When:** Badge 레코드 조회
- **Then:** `manufacturerName`은 여전히 'UR' (발급 시점 기록 보존). 필요 시 Admin 스크립트로 명시적 동기화.

**Scenario 10: 인덱스 생성 검증**
- **Given:** 마이그레이션 완료된 PostgreSQL DB
- **When:** `\d badge` 실행
- **Then:** PK(id), COMPOSITE(si_partner_id, is_active), COMPOSITE(manufacturer_id, is_active), COMPOSITE(expires_at, is_active), INDEX(is_active) 5개 이상 존재.

## :gear: Technical & Non-Functional Constraints

### 스키마 설계
- **필드 수 준수:** SRS 6.2.7에 명시된 9개 필드 정확히 반영
- **Brand-Agnostic N:M 구조:** `(manufacturerId, siPartnerId)` UNIQUE 제약 미적용 — 복수 제조사 뱃지 동시 보유 허용 (REQ-FUNC-017)
- **비정규화 필드:** `manufacturerName` 유지 (SRS 명시) — 조회 성능 + 발급 시점 기록 보존
- **Cascade 정책:** Manufacturer/SiPartner 양쪽 모두 `Restrict` — 뱃지 이력 보존
- **타입 매핑:**
  - `DATE` (issuedAt, expiresAt) → `@db.Date` (시간 정보 불필요)
  - `TIMESTAMP` (revokedAt) → `DateTime?` (철회 시각은 시/분/초까지 기록)

### 성능
- **FQ-003 (SI별 활성 뱃지 조회):** p95 ≤ 100ms — 복합 인덱스 `[siPartnerId, isActive]`
- **CRON-002/003 만료 배치 쿼리:** p95 ≤ 200ms — 복합 인덱스 `[expiresAt, isActive]`
- **FQ-001 (뱃지 보유 SI 필터 적용 검색):** p95 ≤ 1초 (REQ-FUNC-015 목표)
- **예상 규모:** SI 120개사 × 제조사 3~5사 × 1~2회 갱신 = **연 최대 1,200건**, 3년 4,000건 — 현 인덱스로 충분
- **SI 프로필 반영 ≤ 1시간 (REQ-FUNC-013):** MVP에서는 **즉시 반영** (트리거 없이 조회 시점에 JOIN) — 캐시 도입 Phase 2

### 안정성 (REQ-FUNC-015: 미인증 혼입률 0%)
- 활성 뱃지 판정 기준 **단일 소스**: `isDisplayable()` 함수만 사용 — FQ-001/003, UI-003에서 공유
- 뱃지 상태 변경(발급/철회/만료)은 **반드시 FC-016/017 또는 CRON-003 경로로만** — 직접 Prisma 호출 금지 (PR 리뷰 체크리스트)
- 파트너 제안 수락 시 뱃지 자동 발급은 **트랜잭션으로 PartnerProposal.status 변경과 원자적 처리** (FC-019)

### 보안 및 규제
- 뱃지 정보는 **공개 데이터** (SI 프로필/검색 결과에서 노출) — 민감 필드 없음
- 철회 이력(`revokedAt`)은 신뢰도 지표 → 감사 목적으로 물리 삭제 금지

### 유지보수성 (REQ-NF-022 Brand-Agnostic)
- **신규 제조사 추가 = Manufacturer 테이블 INSERT + 이 테이블에 참조만 추가** → 스키마 변경 불필요 (Brand-Agnostic 달성)
- 뱃지 유형 다양화(예: 시공력 뱃지, AS 뱃지) 검토 시 `badge_type ENUM` 필드 추가 마이그레이션 — Phase 2
- `manufacturerName` 비정규화 동기화 정책은 문서화로 명확화

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~10)를 충족하는가?
- [ ] `prisma/schema.prisma`에 `Badge` 모델이 SRS 6.2.7 명세대로 9개 필드 정의되었는가?
- [ ] FK 2개(manufacturerId, siPartnerId)에 `onDelete: Restrict` 정책이 적용되었는가?
- [ ] `(manufacturerId, siPartnerId)` UNIQUE 제약이 **없음**을 확인하여 Brand-Agnostic이 보장되는가?
- [ ] 4개 이상의 인덱스가 생성되었는가? (특히 `[expiresAt, isActive]`, `[siPartnerId, isActive]` 복합 인덱스)
- [ ] `@prisma/client`가 재생성되어 `Badge` 타입이 정상 export되는가?
- [ ] 로컬 SQLite와 Supabase PostgreSQL 양쪽에서 마이그레이션이 성공하는가?
- [ ] `/lib/badge/lifecycle.ts` 생명주기 유틸리티 및 단위 테스트 통과?
- [ ] `/lib/types/badge.ts` Public/Admin DTO 및 `getBadgeStatus` 헬퍼 구현?
- [ ] `/docs/badge-lifecycle.md` 및 `/docs/badge-denormalization-policy.md` 문서 작성?
- [ ] ESLint / TypeScript 컴파일 경고 0건?
- [ ] PR 머지 전 임시 검증 스크립트 제거?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-003 | `SI_PARTNER` 테이블 — `si_partner_id` FK 참조 대상 | 필수 |
| DB-004 | `MANUFACTURER` 테이블 — `manufacturer_id` FK 참조 대상 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| DB-013 | `PARTNER_PROPOSAL` — 수락 시 Badge INSERT 트리거 (API-019/FC-019 연계) |
| MOCK-003 | Prisma Seed — 뱃지 15건 (3 제조사 × 5 SI, 활성/만료/철회 혼합) |
| API-016 | `issueBadge` Server Action DTO (만료일 기본값 12개월) |
| API-017 | `revokeBadge` Server Action DTO |
| API-019 | `respondProposal` — 수락 시 Badge 자동 발급 |
| FC-016 | 뱃지 발급 Command |
| FC-017 | 뱃지 철회 Command |
| FQ-003 | 뱃지 보유 SI 필터 Server Component (미인증 혼입률 0% 검증) |
| FQ-006 | 제조사 대시보드 — 파트너 현황 |
| CRON-002 | 뱃지 만료 D-7일 스캔 및 알림 |
| CRON-003 | 뱃지 만료일 도래 자동 비활성화 |
| UI-004 | SI 프로필 상세 페이지 — 뱃지 표시 |
| UI-009 | 제조사 포털 — 뱃지 발급/철회 UI |

### 참고사항
- **UNIQUE 제약 미도입 결정:** Brand-Agnostic 원칙(REQ-FUNC-017) 준수를 위해 `(manufacturerId, siPartnerId)` UNIQUE 미도입. 동일 조합 활성 중복 방지는 **FC-016 application-level 처리**로 해결 (기존 활성 뱃지 비활성화 후 신규 INSERT)
- **만료 vs 철회 구분:** `revokedAt IS NULL + isActive=false = 만료`, `revokedAt IS NOT NULL = 철회` — `getBadgeStatus` 헬퍼에서 명확히 구분
- **비정규화 동기화 리스크:** `manufacturerName` 필드가 Manufacturer 테이블과 비동기 가능 — 운영 정책으로 "발급 시점 기록 보존" 확정 (사용자 경험상 문제 없음, 오히려 이력 정확성 확보)
- **뱃지 갱신 UX:** 만료 시 자동 갱신 없음 — 제조사가 **명시적 재발급** 필요 (Phase 2에서 자동 갱신 여부 검토)
- **Phase 2 확장 여지:** 뱃지 유형 다변화(`badge_type`), 뱃지 스코어 부여(`score`), 뱃지 획득 조건(`criteria`) 필드 추가 가능
- **CRON-002/003 주기:** SRS 명시 없음 — MVP에서는 **일 1회(02:00 KST)** 실행 권장, 필요 시 시간당 1회로 조정
