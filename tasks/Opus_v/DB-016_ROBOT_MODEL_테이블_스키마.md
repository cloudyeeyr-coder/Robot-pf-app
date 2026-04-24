---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DB-016: ROBOT_MODEL 테이블 스키마 및 마이그레이션 (모델코드, 제조사 FK, 가격 정보) — RaaS 계산 엔진 기반"
labels: 'feature, backend, db, raas, master-data, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [DB-016] `ROBOT_MODEL` (로봇 모델 마스터 데이터) 테이블 스키마 및 마이그레이션 작성
- 목적: **F-05 RaaS 비용 비교 계산 엔진(REQ-FUNC-018)의 기반 마스터 데이터**. 사용자가 RaaS 계산기에 입력한 로봇 모델·수량·기간에 대해 **일시불·리스·RaaS 3옵션 비용을 내부 DB 기반으로 계산**하려면, 각 로봇 모델의 정가·월리스료·RaaS 월구독료 등 가격 정보가 마스터 테이블에 사전 등록되어 있어야 한다. **REQ-FUNC-021 "존재하지 않는 모델 코드 입력 시 유사 모델 3건 추천"** 요건의 검색 대상이기도 하다. Manufacturer(DB-004) FK로 제조사별 제품 라인업을 관리하며, **운영팀이 Admin 경로로 수동 등록·업데이트**한다. **SRS 6.2에 엔티티 정의가 없는 보완 엔티티** — 07_TASK-LIST-v1.md 참고 사항에 "RaaS 계산 엔진 기반 데이터 마스터"로 근거가 명시됨.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-018`](../06_SRS-v1.md) — 로봇 모델·수량·계약 기간 입력 시 일시불·리스·RaaS 3옵션 **내부 DB 기반** 자동 계산
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-021`](../06_SRS-v1.md) — 존재하지 않는 모델 코드 → 인라인 에러 + **유사 모델 3건 자동 추천**
- SRS 문서: [`06_SRS-v1.md#6.2 외부/내부 API`](../00_PRD-v1.md) — "RaaS 계산 엔진: 내부, 로봇 모델·수량·기간 → 3옵션 비교 JSON"
- SRS 문서: [`06_SRS-v1.md#CON-03, REQ-NF-022`](../06_SRS-v1.md) — Brand-Agnostic 호환성 구조, 신규 제조사 추가 시 스키마 변경 없이 확장
- **SRS 보완 근거:** 07_TASK-LIST-v1.md 참고 사항 — "ROBOT_MODEL (DB-016): RaaS 계산 엔진(REQ-FUNC-018) 기반 데이터 마스터"
- 태스크 리스트: [`07_TASK-LIST-v1.md#DB-016`](../TASKS/07_TASK-LIST-v1.md)
- 연동 API: `API-020` (calculateRaasOptions), `API-022` (requestManualQuote — 모델명 자유 입력이므로 FK 미연결)
- 연동 로직: `FC-020` (RaaS 3옵션 계산), `FC-028` (유사 모델 추천)
- 연동 DB: `DB-004` (MANUFACTURER)
- 연동 Mock: `MOCK-006` (로봇 모델 마스터 10건 시드)
- 선행 태스크: `DB-004` (MANUFACTURER)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 가격 구조 및 타입 정의
- [ ] 가격 필드 설계 원칙:
  - `list_price`: 제조사 공식 정가 (일시불 계산 기준)
  - `lease_monthly_price`: 리스 월 납입금 (별도 파트너사 표준값 반영)
  - `raas_monthly_price`: RaaS 구독 월 요금 (플랫폼 협의 가격)
  - `currency`: 원화(KRW) 고정, Phase 2 다국가 확장 대비 필드 유지
- [ ] `RobotCategory` ENUM (로봇 유형 분류 — FC-028 유사 모델 추천 근거):
  ```prisma
  enum RobotCategory {
    collaborative     // 협동로봇
    articulated       // 다관절로봇
    scara             // SCARA
    delta             // Delta
    agv               // 자율이동로봇
    amr               // AMR
    welding           // 용접 전용
    other
  }
  ```

### 2단계: Prisma 모델 정의 (`prisma/schema.prisma`)
- [ ] `RobotModel` 모델:
  ```prisma
  model RobotModel {
    id                  String         @id @default(cuid())
    modelCode           String         @unique @db.VarChar(100)    // 고유 모델 코드 (예: "UR10e", "M0609")
    modelName           String         @db.VarChar(255)            // 사용자 친화 표시명
    manufacturerId      String
    category            RobotCategory
    payloadKg           Float?                                      // 가반하중 (kg) — 유사 모델 추천 근거
    reachMm             Float?                                      // 작업 반경 (mm) — 유사 모델 추천 근거
    listPrice           Decimal        @db.Decimal(15, 2)          // 정가 (KRW)
    leaseMonthlyPrice   Decimal?       @db.Decimal(15, 2)          // 리스 월납 (KRW) — 미공시 시 NULL
    raasMonthlyPrice    Decimal?       @db.Decimal(15, 2)          // RaaS 월구독 (KRW) — 미공시 시 NULL
    currency            String         @default("KRW") @db.VarChar(3)
    specifications      Json?                                       // 기타 스펙 (자유 구조, 확장성 확보)
    isActive            Boolean        @default(true)               // 단종 모델은 비활성화 (계산 엔진 제외)
    createdAt           DateTime       @default(now())
    updatedAt           DateTime       @updatedAt

    // FK Relations
    manufacturer        Manufacturer   @relation(fields: [manufacturerId], references: [id], onDelete: Restrict)

    @@index([modelCode])
    @@index([manufacturerId, isActive])
    @@index([category, isActive])
    @@index([payloadKg])                                            // 유사 모델 추천 범위 쿼리
    @@map("robot_model")
  }
  ```
- [ ] **`modelCode @unique` 핵심:** 사용자 입력(FC-020)의 조회 키, 대소문자 정규화는 application-level (FC-020/028에서 `.toUpperCase()` 또는 소문자 통일)
- [ ] **Decimal 정밀도:** 가격은 `DECIMAL(15,2)` — 재무 정확성 보장 (DB-005/006과 일관)

### 3단계: 인덱스 전략
- [ ] `modelCode @unique` — 사용자 입력 모델 코드 조회 (FC-020)
- [ ] `[manufacturerId, isActive]` — 제조사별 활성 모델 목록 (Admin 포털, 검색 UI)
- [ ] `[category, isActive]` — **FC-028 유사 모델 추천 핵심**: 동일 카테고리 내 `payloadKg`/`reachMm` 유사값 검색
- [ ] `payloadKg` — 범위 쿼리 (예: `WHERE payload_kg BETWEEN X-2 AND X+2`)

### 4단계: Migration 및 유사 모델 추천 유틸
- [ ] `pnpm prisma migrate dev --name add_robot_model` 실행, SQL 검토:
  - `model_code VARCHAR(100) UNIQUE NOT NULL`
  - 3개 가격 필드 DECIMAL(15,2) + currency VARCHAR(3) DEFAULT 'KRW'
  - `specifications JSONB` NULLABLE
  - `is_active BOOLEAN DEFAULT TRUE`
  - FK `ON DELETE RESTRICT`
  - 4개 인덱스 생성 확인
- [ ] **FC-028 유사 모델 추천 유틸 `/lib/robot-model/similar-finder.ts`:**
  ```ts
  // 입력 모델 코드가 존재하지 않을 때 유사 모델 3건 추천
  export async function findSimilarModels(
    prisma: PrismaClient,
    queryCode: string,
    limit: number = 3,
  ): Promise<RobotModel[]> {
    // 1순위: 모델 코드 prefix/fuzzy 매칭 (e.g., "UR10" 입력 → "UR10e" 추천)
    // 2순위: 카테고리 + payloadKg 유사값
    // 3순위: 제조사가 같은 활성 모델
    // 구현 상세는 FC-028에서 확정
  }
  ```
- [ ] **유사도 계산 로직 결정:**
  - 옵션 A: SQL ILIKE + 숫자 범위 (간단, MVP 충분)
  - 옵션 B: PostgreSQL `pg_trgm` + GIN 인덱스 (정교, Phase 2 검토)
  - → **옵션 A 채택** — 마스터 테이블 규모가 작아(수십~수백 건) 성능 이슈 없음

### 5단계: TypeScript 타입 유틸 (`/lib/types/robot-model.ts`)
- [ ] Prisma 타입 + DTO:
  ```ts
  import type { RobotModel as PrismaRobotModel, RobotCategory } from '@prisma/client'
  export type RobotModel = PrismaRobotModel
  export type { RobotCategory }

  // FC-020 RaaS 계산 입력용
  export type RobotModelPricing = Pick<
    RobotModel,
    'id' | 'modelCode' | 'modelName' | 'listPrice' | 'leaseMonthlyPrice' | 'raasMonthlyPrice' | 'currency'
  >

  // FC-028 유사 모델 추천 결과용
  export type SimilarModelCandidate = Pick<
    RobotModel,
    'modelCode' | 'modelName' | 'category' | 'payloadKg' | 'reachMm'
  > & { similarityScore?: number }
  ```

### 6단계: 간이 Integration 검증 및 Admin 운영 문서
- [ ] `scripts/verify-robot-model-schema.ts` (PR 머지 전 제거):
  - Manufacturer 시드 후 RobotModel INSERT → 성공
  - 동일 modelCode 중복 INSERT → `P2002` UNIQUE violation
  - 존재하지 않는 manufacturerId FK → `P2003`
  - `isActive=false` 모델 조회 필터링 확인
  - 유사 모델 추천 쿼리 시뮬레이션: `WHERE category='collaborative' AND payload_kg BETWEEN 8 AND 12 AND is_active=true` → 인덱스 활용
- [ ] `/docs/erd.md` 반영
- [ ] `/docs/robot-model-admin-ops.md` — Admin 운영 절차:
  - 등록 시 modelCode 표준화 규칙 (대소문자 혼용, 하이픈/공백 처리)
  - 가격 업데이트 주기 (권장: 분기 1회)
  - 단종 모델은 `isActive=false` 전환, 삭제 금지 (기존 견적 리드 참조 무결성 보호)
- [ ] `/docs/robot-model-similarity-policy.md` — FC-028 유사 모델 추천 알고리즘 의사결정

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상적인 로봇 모델 등록**
- **Given:** Manufacturer M1 존재
- **When:** `prisma.robotModel.create({ data: { modelCode: 'UR10e', modelName: 'Universal Robots UR10e', manufacturerId: 'M1', category: 'collaborative', payloadKg: 10, reachMm: 1300, listPrice: 50_000_000, leaseMonthlyPrice: 1_200_000, raasMonthlyPrice: 1_800_000 } })`
- **Then:** 레코드 생성, isActive 기본값 true, currency='KRW' 기본값.

**Scenario 2: modelCode UNIQUE 제약**
- **Given:** `modelCode='UR10e'`가 이미 존재
- **When:** 동일 코드로 INSERT 시도
- **Then:** `P2002` UNIQUE violation.

**Scenario 3: 단종 모델 비활성화 처리**
- **Given:** `isActive=true`인 기존 모델
- **When:** `prisma.robotModel.update({ where: { id }, data: { isActive: false } })`
- **Then:** isActive=false 전환. FC-020 RaaS 계산 엔진은 `WHERE isActive=true` 필터로 단종 모델 제외.

**Scenario 4: Manufacturer 삭제 Restrict 차단**
- **Given:** M1이 등록한 RobotModel 존재
- **When:** Manufacturer M1 삭제 시도
- **Then:** `P2003` Restrict 차단 (제품 이력 보존).

**Scenario 5: FC-020 RaaS 계산 — modelCode 기반 조회**
- **Given:** `modelCode='UR10e'`
- **When:** `prisma.robotModel.findUnique({ where: { modelCode: 'UR10e' } })`
- **Then:** UNIQUE 인덱스 활용 p95 ≤ 50ms, listPrice/leaseMonthlyPrice/raasMonthlyPrice 반환.

**Scenario 6: FC-028 유사 모델 추천 쿼리 성능**
- **Given:** 마스터 100건 시드, `category='collaborative'`인 활성 모델 15건
- **When:** `findMany({ where: { category: 'collaborative', payloadKg: { gte: 8, lte: 12 }, isActive: true }, take: 3 })`
- **Then:** `[category, isActive]` + `payloadKg` 인덱스 활용 p95 ≤ 100ms.

**Scenario 7: Decimal 정밀도 (가격 정확성)**
- **Given:** `listPrice: 49_999_999.99`
- **When:** INSERT 후 SELECT (PostgreSQL)
- **Then:** 정확히 49999999.99 반환. 부동소수점 오차 없음.

**Scenario 8: NULL 가격 필드 처리 (미공시 모델)**
- **Given:** `leaseMonthlyPrice: null`, `raasMonthlyPrice: null`
- **When:** FC-020이 해당 모델 계산 요청
- **Then:** 일시불만 계산 가능, 리스/RaaS는 "문의하기" 표시 (FC-020 로직 책임)

**Scenario 9: specifications JSON 확장성**
- **Given:** `specifications: { axes: 6, repeatability_mm: 0.05, power_kw: 1.5 }`
- **When:** 조회 후 UI 표시
- **Then:** 자유 JSON 구조로 모델별 특화 스펙 저장 가능.

**Scenario 10: 인덱스 검증**
- **When:** `\d robot_model`
- **Then:** PK, UNIQUE(model_code), COMPOSITE(manufacturer_id, is_active), COMPOSITE(category, is_active), INDEX(payload_kg) 5개 이상.

## :gear: Technical & Non-Functional Constraints

### 스키마 설계
- **SRS 보완 엔티티:** REQ-FUNC-018/021 요구사항 구현을 위해 필수
- **`modelCode UNIQUE`:** 사용자 입력의 안정적 조회 키
- **가격 필드 3개:** 일시불/리스/RaaS 3옵션 대응 (REQ-FUNC-018 요구)
- **`isActive` 필드:** 단종 모델 관리 — 삭제 대신 비활성화로 기존 참조 보존
- **Brand-Agnostic (REQ-NF-022):** 제조사 추가는 Manufacturer INSERT + 본 테이블 INSERT만으로 완성, 스키마 변경 불필요

### 성능
- FC-020 모델 조회 p95 ≤ 50ms (UNIQUE 인덱스)
- FC-028 유사 모델 추천 p95 ≤ 100ms (복합 인덱스)
- RaaS 계산 엔진 전체 p95 ≤ 3초 (REQ-NF 관련) 중 DB 조회 비중 < 5%
- 예상 규모: 제조사 3~10사 × 모델 10~30개 = **최대 300건** — 인덱스 과다 튜닝 불필요

### 안정성
- 가격 정밀도는 Decimal(15,2) 강제
- 단종 모델 삭제 금지 정책 (Admin 가이드 문서화)
- FC-020 계산 로직은 본 테이블을 **읽기 전용**으로 사용

### 보안
- 가격 정보는 **공개 데이터** (RaaS 계산기에서 모든 사용자에게 노출)
- Admin 외 수정 권한 차단 (API-020은 읽기만, 쓰기는 별도 Admin 경로)
- 제조사 연락처·내부 계약 조건은 **본 테이블에 저장 금지** (Manufacturer 테이블 또는 별도 관리)

### 비즈니스 정확성
- **가격 업데이트 주기:** 운영팀 분기 1회 검토 권장 — 업데이트 시 `updatedAt` 자동 갱신되어 감사 추적 가능
- **`specifications` JSON 남용 주의:** 자주 검색/필터링되는 필드(payloadKg, reachMm)는 **별도 컬럼으로 승격** — 현 설계 이미 반영

### 유지보수성
- 신규 카테고리 추가 시 `RobotCategory` ENUM 마이그레이션
- 다국가 확장 시 `currency` 필드 활용 (현재 기본값 'KRW' 유지)
- 유사도 알고리즘 고도화 시 `pg_trgm` 전환 마이그레이션 경로 확보

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 AC 충족?
- [ ] `RobotCategory` ENUM + `RobotModel` 모델 정의?
- [ ] `modelCode @unique`, 가격 3개 필드, `isActive` 필드 포함?
- [ ] FK `onDelete: Restrict`?
- [ ] 4개 이상 인덱스 생성 (특히 FC-028 대응 `[category, isActive]`, `payloadKg`)?
- [ ] `@prisma/client` 재생성 및 타입 export?
- [ ] 양쪽 환경 마이그레이션 성공?
- [ ] `/lib/types/robot-model.ts` DTO 정의?
- [ ] `/lib/robot-model/similar-finder.ts` 유사 모델 추천 유틸 스켈레톤?
- [ ] `/docs/robot-model-admin-ops.md`, `/docs/robot-model-similarity-policy.md` 문서?
- [ ] ESLint / TS 경고 0건, 임시 스크립트 제거?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-004 | `MANUFACTURER` — FK 참조 대상 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| MOCK-006 | Prisma Seed — 로봇 모델 마스터 10건 (3개 제조사) |
| API-020 | `calculateRaasOptions` Server Action DTO |
| FC-020 | RaaS 비용 비교 계산 Command |
| FC-028 | 유사 모델 추천 로직 |
| UI-010 | RaaS 비용 비교 계산기 UI — 로봇 모델 자동완성 |

### 참고사항
- **SRS 보완 정당성:** REQ-FUNC-018 "내부 DB 기반 계산"을 구현하려면 마스터 데이터 테이블이 필수. SRS에 엔티티 정의만 누락되어 있을 뿐, 기능 요구는 명확
- **가격 데이터 확보 경로:** 제조사 LOI(CON-05) 체결 시점에 가격 정보 협의 필수. MVP 런칭 전 최소 3사 × 3~5모델 = **9~15건 마스터 확보 목표**
- **모델 코드 정규화:** 사용자가 대소문자 혼용 입력 가능 — FC-020에서 `.toUpperCase()` 또는 소문자 통일 후 조회. 정규화 규칙을 `/docs/robot-model-admin-ops.md`에 명시
- **Phase 2 확장 여지:**
  - `RobotModelImage` 별도 테이블 (다중 이미지 지원)
  - `PriceHistory` 가격 변동 이력 (감사 추적)
  - Admin UI에서 CSV 일괄 업로드 기능
  - `pg_trgm` 기반 퍼지 검색 (입력 오타 tolerant)
- **계산 엔진과의 결합도:** 본 테이블 스키마 변경이 FC-020 계산 로직에 직접 영향 — 가격 필드 추가/변경 시 FC-020 변경 체크리스트 동반 필요
