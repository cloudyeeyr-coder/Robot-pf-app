---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DB-011: WARRANTY 테이블 스키마 및 마이그레이션 (FK→CONTRACT, FK→ESCROW_TX, coverage 필드)"
labels: 'feature, backend, db, warranty, as, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [DB-011] `WARRANTY` (AS 보증서) 테이블 스키마 및 마이그레이션 작성
- 목적: **F-02 AS망 연동 기능의 신뢰 증거 엔티티**. 에스크로 예치가 완료되는 순간(REQ-FUNC-006)에 **1분 이내 자동 발급**되어, 수요기업에게 "SI 파산 시에도 AS가 보장된다"는 물리적 증거(PDF)를 제공한다. Contract(1:1)와 EscrowTx(1:1) 양쪽을 FK로 참조하는 이중 연결 구조로, **어떤 계약에서도 중복 보증서가 발급되지 않도록** UNIQUE 제약을 부여한다. `as_company_name`/`as_contact_phone`/`coverage_scope`/`coverage_period_months` 필드에 지정 로컬 AS 업체의 책임 범위를 명시하여 REQ-FUNC-006의 "AS 업체명·연락처·보증범위 100% 명시" 요건을 충족한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.10 WARRANTY`](../06_SRS-v1.md) — 보증서 테이블 스키마 정의 (10개 필드)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-006`](../06_SRS-v1.md) — 에스크로 완료 시 1분 이내 자동 발급, AS 업체명·연락처·보증범위 100% 명시
- SRS 문서: [`06_SRS-v1.md#6.3.1`](../06_SRS-v1.md) — 에스크로 시퀀스 (`BFF->>BFF: 보증서 자동 생성 (≤1분)` → `BFF->>DB: WARRANTY INSERT`)
- SRS 문서: [`06_SRS-v1.md#6.2.13 Class Diagram (Warranty)`](../06_SRS-v1.md) — `issue(contractId, escrowTxId)`, `generatePdf()` 도메인 메서드
- SRS 문서: [`06_SRS-v1.md#6.2.12 ER Diagram`](../06_SRS-v1.md) — CONTRACT 1:1 WARRANTY, EscrowTx ..> Warranty (triggers issuance)
- 태스크 리스트: [`07_TASK-LIST-v1.md#DB-011`](../TASKS/07_TASK-LIST-v1.md)
- 연동 API: `API-012` (보증서 발급 PDF Route Handler)
- 연동 DB: `DB-005` (CONTRACT 상위 1:1), `DB-006` (ESCROW_TX 상위 1:1)
- 연동 로직: `FC-014` (보증서 자동 발급 Command, 에스크로 완료 트리거)
- 선행 태스크: `DB-005` (CONTRACT), `DB-006` (ESCROW_TX)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Prisma 모델 정의 (`prisma/schema.prisma`)
- [ ] `Warranty` 모델 정의 (SRS 6.2.10 10개 필드 반영):
  ```prisma
  model Warranty {
    id                     String    @id @default(cuid())
    contractId             String    @unique                       // 1:1 관계 강제
    escrowTxId             String    @unique                       // 1:1 관계 강제 (중복 발급 원천 차단)
    asCompanyName          String    @db.VarChar(255)
    asContactPhone         String    @db.VarChar(20)
    asContactEmail         String?   @db.VarChar(255)              // SRS에서 유일한 NULLABLE 필드
    coverageScope          String    @db.Text
    coveragePeriodMonths   Int       @default(12)
    issuedAt               DateTime  @default(now())
    pdfUrl                 String?   @db.VarChar(500)              // Supabase Storage 업로드 후 URL 기록
    createdAt              DateTime  @default(now())

    // FK Relations
    contract               Contract   @relation(fields: [contractId], references: [id], onDelete: Restrict)
    escrowTx               EscrowTx   @relation(fields: [escrowTxId], references: [id], onDelete: Restrict)

    @@index([issuedAt(sort: Desc)])
    @@map("warranty")
  }
  ```
- [ ] **이중 UNIQUE 제약 핵심:** `contractId @unique` + `escrowTxId @unique` — 1계약/1에스크로당 최대 1개 보증서 강제
- [ ] **Cascade 정책:** 양쪽 모두 `onDelete: Restrict` — 계약·에스크로·보증서는 모두 전자금융거래법 5년 보존 대상(REQ-NF-014)

### 2단계: 인덱스 전략
- [ ] `contractId @unique`, `escrowTxId @unique` (FK + UNIQUE 동시 만족)
- [ ] `issuedAt(sort: Desc)` — Admin 대시보드 최신순
- [ ] 추가 인덱스 불필요 — 테이블 접근은 대부분 Contract 또는 EscrowTx에서 JOIN 조회

### 3단계: Migration 파일 생성 및 검증
- [ ] `pnpm prisma migrate dev --name add_warranty` 실행
- [ ] 생성된 SQL 검토:
  - 2개 UNIQUE INDEX (`warranty_contract_id_key`, `warranty_escrow_tx_id_key`)
  - `as_company_name VARCHAR(255) NOT NULL`, `as_contact_phone VARCHAR(20) NOT NULL`
  - `as_contact_email VARCHAR(255) NULL` (유일한 NULLABLE 문자열 필드)
  - `coverage_scope TEXT NOT NULL`
  - `coverage_period_months INT NOT NULL DEFAULT 12`
  - `pdf_url VARCHAR(500) NULL` (PDF 생성 전 NULL, 생성 후 URL 업데이트)
  - FK 2개 `ON DELETE RESTRICT` 확인
- [ ] `pnpm prisma generate` → `Warranty` 타입 export 검증

### 4단계: TypeScript 타입 유틸 (`/lib/types/warranty.ts`)
- [ ] Prisma 타입 re-export + DTO:
  ```ts
  import type { Warranty as PrismaWarranty } from '@prisma/client'
  export type Warranty = PrismaWarranty

  // Buyer 뷰: PDF 다운로드 + 보증 정보 확인
  export type WarrantyBuyerView = Pick<
    Warranty,
    'id' | 'asCompanyName' | 'asContactPhone' | 'asContactEmail' |
    'coverageScope' | 'coveragePeriodMonths' | 'issuedAt' | 'pdfUrl'
  >

  export const DEFAULT_COVERAGE_PERIOD_MONTHS = 12  // SRS 6.2.10 DEFAULT 값
  ```

### 5단계: 간이 Integration 검증 스크립트
- [ ] `scripts/verify-warranty-schema.ts` (PR 머지 전 제거):
  - Contract + EscrowTx 시드 후 Warranty INSERT → 성공
  - 동일 `contractId` 2번째 INSERT → `P2002` UNIQUE violation
  - 동일 `escrowTxId` 2번째 INSERT → `P2002` UNIQUE violation
  - `coverage_scope` 빈 문자열 허용 확인 (스키마 레벨) → **FC-014에서 의미 있는 값 강제**
  - `pdf_url=null` 초기 INSERT 후 PDF 생성 완료 시 UPDATE → 정상 동작 검증

### 6단계: 문서 업데이트
- [ ] `/docs/erd.md`에 Warranty 엔티티 반영
- [ ] `/docs/warranty-issuance-flow.md` — 에스크로 완료 트리거 → 1분 이내 발급 플로우 (FC-014 연계)
- [ ] `coverage_scope` 기본 템플릿 문서 (`/docs/warranty-coverage-template.md`) — 운영팀이 발급 시 참조할 표준 보증 범위 문구

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 에스크로 완료 후 보증서 정상 발급**
- **Given:** Contract C1 + EscrowTx E1 (state=held) 레코드 존재
- **When:** `prisma.warranty.create({ data: { contractId: 'C1', escrowTxId: 'E1', asCompanyName: '수도권AS센터', asContactPhone: '02-1234-5678', coverageScope: '1년간 부품·공임·출동비 무상 지원', coveragePeriodMonths: 12 } })`
- **Then:** 레코드 생성, `issuedAt`/`createdAt` 자동 채워짐, `pdfUrl=null` 초기 상태.

**Scenario 2: 1계약 1보증서 UNIQUE 제약**
- **Given:** Contract C1에 이미 Warranty 1건 존재
- **When:** 동일 contractId로 두 번째 Warranty INSERT 시도
- **Then:** `P2002` UNIQUE violation, 중복 발급 원천 차단.

**Scenario 3: 1에스크로 1보증서 UNIQUE 제약**
- **Given:** EscrowTx E1에 이미 Warranty 1건 존재
- **When:** 동일 escrowTxId로 두 번째 Warranty INSERT 시도
- **Then:** `P2002` UNIQUE violation.

**Scenario 4: 존재하지 않는 FK 거부**
- **Given:** 유효하지 않은 contractId 또는 escrowTxId
- **When:** Warranty INSERT 시도
- **Then:** `P2003` Foreign key constraint violation.

**Scenario 5: PDF URL 후속 업데이트**
- **Given:** Warranty 생성 직후 `pdfUrl=null`
- **When:** PDF 생성 완료 후 `prisma.warranty.update({ where: { id }, data: { pdfUrl: 'https://supabase.../warranty.pdf' } })` 호출
- **Then:** `pdfUrl` 필드에 URL 저장. Buyer 뷰에서 다운로드 링크 노출.

**Scenario 6: NULLABLE 필드 동작**
- **Given:** `asContactEmail=null`로 Warranty 생성
- **When:** 조회
- **Then:** `asContactEmail`은 null 반환. SRS 명세상 AS 업체가 이메일을 제공하지 않을 수 있음을 수용.

**Scenario 7: DEFAULT 값 검증**
- **Given:** `coveragePeriodMonths` 미지정으로 INSERT
- **When:** 조회
- **Then:** 기본값 12 (개월) 저장 확인.

**Scenario 8: Contract 삭제 Restrict 차단**
- **Given:** Warranty가 연결된 Contract C1
- **When:** Contract C1 삭제 시도
- **Then:** `P2003` Restrict 차단, 보증서 이력 보존.

**Scenario 9: 역방향 관계 include 쿼리**
- **Given:** Warranty, Contract, EscrowTx 레코드 존재
- **When:** `prisma.warranty.findUnique({ where: { id }, include: { contract: true, escrowTx: true } })`
- **Then:** Contract + EscrowTx 객체가 함께 조회됨.

**Scenario 10: 인덱스 검증**
- **Given:** 마이그레이션 완료 DB
- **When:** `\d warranty` 실행
- **Then:** PK(id), UNIQUE(contract_id), UNIQUE(escrow_tx_id), INDEX(issued_at DESC) 4개 이상 존재.

## :gear: Technical & Non-Functional Constraints

### 스키마 설계
- **필드 수 준수:** SRS 6.2.10 10개 필드 정확히 반영
- **이중 UNIQUE 제약:** `contractId` + `escrowTxId` 모두 UNIQUE — 1:1 관계 이중 강제
- **NULLABLE 정책:**
  - `asContactEmail`: NULLABLE (SRS 명시)
  - `pdfUrl`: NULLABLE (PDF 생성 전 NULL)
  - 나머지: NOT NULL
- **타입 매핑:**
  - `VARCHAR(500)` (pdfUrl) → `@db.VarChar(500)` (PDF URL은 장시간 유지 필요, 서명 URL은 짧지만 Supabase 공개 URL은 길 수 있음)
  - `TEXT` (coverageScope) → `@db.Text`
  - `DEFAULT 12` (coveragePeriodMonths) — SRS 명시

### 성능
- PK 조회 p95 ≤ 50ms (단일 행 접근)
- Buyer의 보증서 조회는 Contract 기반으로 JOIN (별도 인덱스 불필요)
- 예상 규모: 계약 1:1 → **계약 수와 동일한 규모** (연 1,200건 이내)

### 안정성 (REQ-FUNC-006 "1분 이내 발급")
- Warranty INSERT는 **EscrowTx 생성과 동일 트랜잭션(`prisma.$transaction`)** 으로 처리 권장 — FC-014에서 원자성 보장
- PDF 생성은 비동기 후속 처리 (jsPDF 기반, ≤ 5초, REQ-NF-004) — 생성 후 `pdfUrl` UPDATE
- 1분 이내 발급 보장을 위해 **PDF 생성 실패 시 재시도 로직** 필요 (FC-014 범위)

### 보안 및 규제
- 전자금융거래법 5년 보존(REQ-NF-014) 대상 — 삭제 금지, `onDelete: Restrict`
- `pdfUrl`은 **Supabase Storage 서명 URL** 권장 (장기 공개 URL 지양, 만료 시 재생성) — Phase 2 세부화
- AS 업체 연락처(`asContactPhone`, `asContactEmail`)는 Buyer에게 공개되지만, SI/Admin 외부 제3자 노출 금지

### 비즈니스 정확성
- **`coverageScope` 빈 값 방지:** 스키마에서는 `String NOT NULL`이지만 빈 문자열 허용 — FC-014에서 Zod `.min(20)` 등으로 강제 (표준 템플릿 활용 권장)
- **AS 업체 정보 동기화:** 현재 스키마는 AS 업체 정보를 **스냅샷**으로 저장 (발급 시점 기록). AS 업체가 변경되어도 기존 보증서는 발급 당시 정보 유지
- **보증 기간 만료 처리:** `issuedAt + coveragePeriodMonths` 이후는 만료 — 별도 상태 필드 없음 (계산으로 판정). 향후 `expiresAt` 필드 추가 검토

### 유지보수성
- AS 업체를 별도 `AS_COMPANY` 테이블로 정규화하는 방안 Phase 2 검토 (현재는 문자열 스냅샷)
- `coveragePeriodMonths` 표준값(6/12/24 등) ENUM 전환 검토

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~10)를 충족하는가?
- [ ] `prisma/schema.prisma`에 `Warranty` 모델이 SRS 6.2.10 명세대로 10개 필드 정의되었는가?
- [ ] `contractId`, `escrowTxId` 둘 다 UNIQUE 제약이 적용되었는가?
- [ ] `asContactEmail`, `pdfUrl`이 NULLABLE로 정의되었는가?
- [ ] `coveragePeriodMonths` DEFAULT 12가 적용되었는가?
- [ ] FK `onDelete: Restrict` 양쪽 모두 적용되었는가?
- [ ] 마이그레이션 SQL 파일이 생성 및 커밋되었는가?
- [ ] `@prisma/client` 재생성 및 `Warranty` 타입 export 정상?
- [ ] 로컬 SQLite와 Supabase PostgreSQL 양쪽에서 마이그레이션 성공?
- [ ] `/lib/types/warranty.ts` Buyer DTO 및 상수 정의?
- [ ] `/docs/warranty-issuance-flow.md`, `/docs/warranty-coverage-template.md` 문서 작성?
- [ ] ESLint / TypeScript 컴파일 경고 0건?
- [ ] PR 머지 전 임시 검증 스크립트 제거?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-005 | `CONTRACT` 테이블 | 필수 |
| DB-006 | `ESCROW_TX` 테이블 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| MOCK-005 | Prisma Seed — 보증서 5건 |
| API-012 | 보증서 발급 PDF Route Handler (바이너리 응답) |
| FC-014 | 보증서 자동 발급 Command (에스크로 완료 트리거, ≤ 1분) |
| UI-005 | 에스크로 결제 흐름 UI — 보증서 다운로드 버튼 |

### 참고사항
- **AS 업체 정보 스냅샷 전략:** 발급 시점 기록 보존 — 향후 `AS_COMPANY` 테이블 도입해도 본 테이블은 스냅샷 유지 (법적 증거 효력 보존)
- **PDF 생성 실패 대응:** FC-014에서 재시도 로직 필수. 3회 실패 시 Ops Slack 알림 (REQ-FUNC-034 패턴과 유사)
- **`pdfUrl` 생성 지연 허용:** DB INSERT는 에스크로와 동기(원자성), PDF 생성·업로드는 비동기 — UX상 "보증서가 곧 발급됩니다" 안내 필요
- **Phase 2 확장:** `expiresAt` 계산 필드, AS 업체 정규화(`AS_COMPANY` 테이블), 다중 AS 커버리지 (multi-AS 시나리오)
