---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DB-006: ESCROW_TX 테이블 스키마 및 마이그레이션 (state ENUM 3종, UNIQUE FK→CONTRACT, admin 필드)"
labels: 'feature, backend, db, escrow, priority:critical'
assignees: ''
---

## :dart: Summary
- 기능명: [DB-006] `ESCROW_TX` (에스크로 거래) 테이블 스키마 및 마이그레이션 작성
- 목적: 플랫폼의 **결제 보호(Trust Layer) 핵심 엔티티**. 수요기업이 법인 계좌에 예치한 대금의 **3단계 상태(held/released/refunded)** 를 기록하고, **Admin 수동 확인 프로세스(admin_verified_at, admin_memo)** 의 법적 증빙을 남긴다. MVP에서는 PG 연동 없이 **무통장 입금 + Admin 수기 확인** 방식을 채택(CON-02 관련)하며, 향후 Phase 2 PG 전환 시에도 스키마 호환성이 유지되도록 설계한다. `contract_id`에 **UNIQUE 제약**을 부여하여 1계약-1에스크로 관계를 DB-level에서 강제하고, 전자금융거래법 5년 보존(REQ-NF-014) 대상이다. 북극성 KPI(REQ-NF-023: 월 거래 완결 수 30건)의 실제 집계 테이블이다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.5 ESCROW_TX`](../06_SRS-v1.md) — 에스크로 거래 테이블 스키마 정의 (10개 필드, state ENUM 3종)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-001`](../06_SRS-v1.md) — 에스크로 예치 및 Admin 입금 확인 프로세스
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-002`](../06_SRS-v1.md) — 검수 합격 후 방출 대기 → Admin 수기 송금 → released 전환
- SRS 문서: [`06_SRS-v1.md#6.2.13 Class Diagram (EscrowTx)`](../06_SRS-v1.md) — `adminConfirmDeposit`, `adminConfirmRelease`, `refund` 도메인 메서드
- SRS 문서: [`06_SRS-v1.md#6.3.1`](../06_SRS-v1.md) — 에스크로 결제 전체 상세 시퀀스 다이어그램
- SRS 문서: [`06_SRS-v1.md#REQ-NF-008`](../06_SRS-v1.md) — 에스크로 오류율 < 0.1%
- SRS 문서: [`06_SRS-v1.md#REQ-NF-011, REQ-NF-014`](../06_SRS-v1.md) — 전자금융거래법 5년 보존
- SRS 문서: [`06_SRS-v1.md#REQ-NF-023`](../06_SRS-v1.md) — 월간 거래 완결 수 집계 (북극성 KPI)
- 태스크 리스트: [`07_TASK-LIST-v1.md#DB-006`](../TASKS/07_TASK-LIST-v1.md)
- 연동 API: `API-004` (updateEscrowStatus), `API-005` (confirmRelease), `API-007` (status 조회)
- 연동 DB: `DB-005` (CONTRACT 1:1 상위), `DB-011` (WARRANTY FK 참조)
- 연동 Cron: `CRON-006` (에스크로 오류율 모니터링)
- 선행 태스크: `DB-005` (CONTRACT 테이블)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 상태 ENUM 정의 및 전이 규칙 정리
- [ ] `EscrowState` enum 정의 (3단계):
  ```prisma
  enum EscrowState {
    held        // Admin 입금 확인 완료, 예치 중
    released    // Admin 방출 완료, SI 수령 완료 (거래 종결)
    refunded    // 환불 완료 (분쟁 중재 후 Buyer 환불 결정 시)
  }
  ```
- [ ] 상태 전이 규칙 (`/docs/escrow-state-machine.md` 또는 `/lib/escrow/state-machine.ts`):
  ```
  (new)    → held       (INSERT 시 초기 상태, Admin 입금 확인 — API-004)
  held     → released   (검수 승인 + Admin 방출 확인 — API-005)
  held     → refunded   (분쟁 중재 후 환불 결정 — Manual Admin)
  released → (terminal, 변경 불가)
  refunded → (terminal, 변경 불가)
  ```
- [ ] CONTRACT status와의 연동 규칙 문서화:
  - CONTRACT.status = `escrow_held` ↔ EscrowTx.state = `held`
  - CONTRACT.status = `completed` ↔ EscrowTx.state = `released`
  - CONTRACT.status = `disputed` + 환불 결론 ↔ EscrowTx.state = `refunded`

### 2단계: Prisma 모델 정의 (`prisma/schema.prisma`)
- [ ] `EscrowTx` 모델 정의 (SRS 6.2.5 10개 필드 반영):
  ```prisma
  model EscrowTx {
    id                String       @id @default(cuid())
    contractId        String       @unique                    // 1:1 관계 강제
    amount            Decimal      @db.Decimal(15, 2)
    state             EscrowState  @default(held)             // INSERT 시점이 Admin 입금 확인 시점이므로 기본값 held
    heldAt            DateTime?                                // 예치 완료 시각 (INSERT 시 NOW() 기록 권장)
    releasedAt        DateTime?                                // 방출 완료 시각
    refundedAt        DateTime?                                // 환불 완료 시각
    adminVerifiedAt   DateTime?                                // Admin 입금 확인 시각 (heldAt과 동일 또는 가까움)
    adminMemo         String?      @db.Text                   // 관리자 메모 (입금자명, 증빙 등)
    createdAt         DateTime     @default(now())

    // FK Relations
    contract          Contract     @relation(fields: [contractId], references: [id], onDelete: Restrict)

    // 역방향 관계 (DB-011에서 FK 설정)
    warranty          Warranty?    // 1:1 (에스크로 예치 → 보증서 자동 발급)

    @@index([state])
    @@index([createdAt(sort: Desc)])
    @@index([adminVerifiedAt])
    @@map("escrow_tx")
  }
  ```
- [ ] **UNIQUE 제약 핵심:** `contractId @unique` — 1개 계약당 최대 1개 에스크로 TX 강제 (SRS 6.2.5 명시)
- [ ] `amount > 0` 제약은 **application-level 검증** (Zod, API-004에서 강제) — Prisma check 미지원
- [ ] Cascade 정책: `onDelete: Restrict` — 5년 보존 의무(REQ-NF-014)로 Contract 삭제 차단

### 3단계: 인덱스 전략 수립
- [ ] `contractId` → `@unique` (1:1 관계 강제 + 조회 성능)
- [ ] `state` → `@@index([state])` — Admin 대시보드 상태별 필터 (FQ-007 '방출 대기' 목록)
- [ ] `createdAt(sort: Desc)` — 최신순 정렬 (Admin 대시보드)
- [ ] `adminVerifiedAt` → `@@index([adminVerifiedAt])` — 확인 이력 감사 쿼리 대응
- [ ] **북극성 KPI 쿼리 대응 인덱스 검토:** `WHERE state='released' AND released_at BETWEEN ...` 패턴 — 필요 시 `@@index([state, releasedAt])` 복합 인덱스 추가 (거래량 증가 후 `EXPLAIN ANALYZE` 기반 재평가)

### 4단계: Migration 파일 생성 및 검증
- [ ] `pnpm prisma migrate dev --name add_escrow_tx` 실행
- [ ] 생성된 SQL 검토:
  - `CREATE TYPE "EscrowState" AS ENUM ('held', 'released', 'refunded');`
  - `CREATE UNIQUE INDEX "escrow_tx_contract_id_key" ON "escrow_tx"("contract_id");` 확인 (UNIQUE FK)
  - FK 제약 `ON DELETE RESTRICT` 확인
  - `amount DECIMAL(15, 2) NOT NULL` 확인
  - 4개 timestamp 필드 모두 NULLABLE 확인 (held_at, released_at, refunded_at, admin_verified_at)
  - `admin_memo TEXT` NULLABLE 확인
- [ ] `pnpm prisma generate` → `EscrowTx`, `EscrowState` 타입 export 검증

### 5단계: 상태 전이 유틸리티 작성 (`/lib/escrow/state-machine.ts`)
- [ ] 허용 전이 테이블:
  ```ts
  import type { EscrowState } from '@prisma/client'

  export const ALLOWED_TRANSITIONS: Record<EscrowState, EscrowState[]> = {
    held:     ['released', 'refunded'],
    released: [],  // Terminal
    refunded: [],  // Terminal
  }

  export function canTransition(from: EscrowState, to: EscrowState): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to)
  }

  export function assertTransition(from: EscrowState, to: EscrowState): void {
    if (!canTransition(from, to)) {
      throw new Error(`Invalid escrow state transition: ${from} → ${to}`)
    }
  }
  ```
- [ ] 단위 테스트 작성: 허용/금지 전이 쌍 검증

### 6단계: CONTRACT-EscrowTx 동기화 헬퍼 (`/lib/escrow/sync-contract.ts`)
- [ ] 상태 동기화 가이드 함수 (FC-006/009에서 활용):
  ```ts
  // EscrowTx.state 변경 시 함께 업데이트되어야 할 Contract.status 매핑
  export function contractStatusFor(escrowState: EscrowState): ContractStatus | null {
    switch (escrowState) {
      case 'held':     return 'escrow_held'
      case 'released': return 'completed'
      case 'refunded': return null  // Contract.status는 별도 중재 결과로 결정
    }
  }
  ```
- [ ] 실제 업데이트는 **Prisma 트랜잭션(`prisma.$transaction`)** 으로 묶어 원자성 보장 — FC-006/009 구현 가이드 문서화

### 7단계: TypeScript 타입 유틸 작성 (`/lib/types/escrow.ts`)
- [ ] Prisma 타입 re-export + 도메인 전용 타입:
  ```ts
  import type { EscrowTx as PrismaEscrowTx, EscrowState } from '@prisma/client'
  export type EscrowTx = PrismaEscrowTx
  export type { EscrowState }

  export const ESCROW_STATE_VALUES = ['held', 'released', 'refunded'] as const
  export const ESCROW_TERMINAL_STATES: EscrowState[] = ['released', 'refunded']

  // Admin 대시보드 표시용 DTO
  export type EscrowTxAdminView = Pick<
    EscrowTx,
    'id' | 'contractId' | 'amount' | 'state' | 'heldAt' | 'releasedAt' | 'adminVerifiedAt' | 'adminMemo'
  >

  // 'admin_memo'는 민감 정보(입금자 식별 정보 포함 가능) — Buyer 뷰에서는 제외
  export type EscrowTxBuyerView = Omit<EscrowTxAdminView, 'adminMemo'>
  ```

### 8단계: 간이 Integration 검증 스크립트
- [ ] `scripts/verify-escrow-schema.ts` (PR 머지 전 제거):
  - Contract 시드 후 EscrowTx INSERT (state=held, admin_verified_at=NOW(), admin_memo="...") → 성공
  - **동일 contractId로 두 번째 EscrowTx INSERT → `P2002` UNIQUE violation 확인** (핵심 제약)
  - 존재하지 않는 contractId FK INSERT → `P2003` 확인
  - state='held'에서 state='released' UPDATE → 성공 (released_at 기록)
  - released 상태에서 다시 held로 역전이 UPDATE → 스키마 허용, **state-machine 유틸에서 차단되어야 함** 주석 명시

### 9단계: 문서 업데이트
- [ ] `/docs/erd.md`에 EscrowTx 엔티티 반영
- [ ] `/docs/escrow-state-machine.md` 상태 전이 및 Contract 동기화 규칙 확정
- [ ] `/docs/escrow-legal-retention.md` 전자금융거래법 5년 보존 정책 명시
- [ ] 후행 태스크(DB-011, API-004/005) 담당자에게 스키마 준비 완료 공유

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: Admin 입금 확인 시 EscrowTx 정상 생성 (state=held)**
- **Given:** CONTRACT (status=pending) 레코드가 존재하고, 아직 EscrowTx가 없음
- **When:** Admin이 입금 확인 → `prisma.escrowTx.create({ data: { contractId, amount, state: 'held', heldAt: now, adminVerifiedAt: now, adminMemo: '입금자: (주)테스트기업' } })` 호출
- **Then:** 레코드 생성 성공, `id` 자동 생성, `createdAt` 자동 채워짐. 이후 FC-006에서 Contract.status='escrow_held'로 트랜잭션 업데이트.

**Scenario 2: 1계약-1에스크로 UNIQUE 제약 강제**
- **Given:** Contract A에 이미 EscrowTx가 1건 존재함
- **When:** 동일 Contract A에 대해 두 번째 EscrowTx INSERT 시도
- **Then:** Prisma가 `P2002` Unique constraint violation 발생, 트랜잭션 롤백. (중복 예치 원천 차단)

**Scenario 3: 존재하지 않는 Contract FK 거부**
- **Given:** 유효하지 않은 `contractId`
- **When:** EscrowTx INSERT 시도
- **Then:** `P2003` Foreign key constraint violation 발생.

**Scenario 4: EscrowState ENUM 제약 검증**
- **Given:** `EscrowState` enum이 3개 값(held/released/refunded)만 허용
- **When:** `state: 'processing'` 등 미정의 값 INSERT
- **Then:** TypeScript 컴파일 에러 또는 Prisma Validation Error 발생.

**Scenario 5: 방출 처리 상태 전이 (held → released)**
- **Given:** EscrowTx (state='held')가 존재하고, Contract는 release_pending 상태
- **When:** Admin이 방출 확인 → `prisma.escrowTx.update({ where: { id }, data: { state: 'released', releasedAt: now } })` 호출 (트랜잭션 내에서 Contract.status='completed'와 함께)
- **Then:** state='released', releasedAt 타임스탬프 기록. Contract.status='completed'도 동기화됨.

**Scenario 6: Decimal 정밀도 검증 (금액 데이터)**
- **Given:** `amount: 12345678.90`
- **When:** INSERT 후 SELECT (PostgreSQL 환경)
- **Then:** 정확히 `12345678.90` 반환, 부동소수점 오차 없음. SQLite 환경에서는 REAL 매핑으로 정밀도 손실 가능성 문서화.

**Scenario 7: 역방향 관계 include 쿼리**
- **Given:** DB-011 Warranty 스키마 구현 완료
- **When:** `prisma.escrowTx.findUnique({ where: { id }, include: { contract: true, warranty: true } })`
- **Then:** Contract 객체와 Warranty 객체(1:1)가 함께 조회됨.

**Scenario 8: 북극성 KPI 쿼리 성능**
- **Given:** EscrowTx 10,000건 시드 (state별 분산)
- **When:** `prisma.escrowTx.count({ where: { state: 'released', releasedAt: { gte: monthStart, lt: monthEnd } } })` 실행
- **Then:** `state` 인덱스 활용으로 p95 ≤ 200ms. 거래량 확대 후 필요 시 `[state, releasedAt]` 복합 인덱스 추가.

**Scenario 9: Contract 삭제 시도 Restrict 차단**
- **Given:** EscrowTx가 연결된 Contract A가 존재
- **When:** `prisma.contract.delete({ where: { id: 'A' } })` 시도
- **Then:** `P2003` Restrict 에러 발생, 삭제 차단. (전자금융거래법 5년 보존 의무 준수)

**Scenario 10: 인덱스 생성 검증**
- **Given:** 마이그레이션 완료된 PostgreSQL DB
- **When:** `\d escrow_tx` 실행
- **Then:** PK(id), UNIQUE(contract_id), INDEX(state), INDEX(created_at DESC), INDEX(admin_verified_at) 5개 이상의 인덱스 존재.

## :gear: Technical & Non-Functional Constraints

### 스키마 설계
- **필드 수 준수:** SRS 6.2.5에 명시된 10개 필드 정확히 반영 (id, contract_id, amount, state, held_at, released_at, refunded_at, admin_verified_at, admin_memo, created_at)
- **UNIQUE 제약 핵심:** `contract_id UNIQUE` — 1:1 관계 DB-level 강제
- **NULLABLE 정책:**
  - `held_at`, `released_at`, `refunded_at`: 해당 상태 진입 시점에 기록 — 미진입 상태는 NULL
  - `admin_verified_at`: Admin 수동 확인 시점 기록
  - `admin_memo`: Admin 입력 선택 사항
- **타입 매핑:**
  - `DECIMAL(15,2)` → `@db.Decimal(15, 2)` (재무 정밀도 보장)
  - `TEXT` (admin_memo) → Prisma `String @db.Text` (길이 제한 없음)

### 성능
- Admin 대시보드 '방출 대기' 목록 조회 p95 ≤ 500ms (state 인덱스 활용)
- 북극성 KPI 집계 쿼리 p95 ≤ 200ms (월 단위 거래 완결 수)
- 에스크로 상태 조회(API-007) p95 ≤ 100ms (PK 조회)
- 예상 규모: MVP+6개월 월 30건 × 12개월 = **연 360건**, 3년 1,000건 규모 — 현 인덱스로 충분

### 안정성 (REQ-NF-008)
- 에스크로 오류율 < 0.1% — CRON-006에서 모니터링
- Contract.status와 EscrowTx.state 동기화는 **반드시 `prisma.$transaction` 내에서 수행** (원자성) — FC-006/009 구현 필수 체크리스트
- 상태 역전이(released → held 등)는 state-machine 유틸에서 차단

### 보안 및 규제 준수 (REQ-NF-011, REQ-NF-014)
- **전자금융거래법 5년 보존 의무** — 물리 삭제 금지, `onDelete: Restrict` 전면 적용
- `admin_memo` 필드는 입금자명 등 PII 포함 가능 — **Buyer/SI 뷰에서 노출 금지**, Admin 전용
- TLS 1.3 강제 (REQ-NF-017) — Supabase 기본값
- Admin 권한 검증은 API-004/005 레이어에서 책임 (RBAC, API-027 연계)

### 비즈니스 정확성
- **MVP PG 미연동:** 현 스키마는 PG ID 필드 없음 — Phase 2 PG 도입 시 `pg_tx_id VARCHAR(100) NULLABLE` 추가 마이그레이션 예정 (REQ-NF-019)
- **북극성 KPI 집계 쿼리:** `WHERE state='released' AND released_at BETWEEN ...` — 월말 집계 패턴 (REQ-NF-023)
- **분쟁 → 환불 흐름:** `held → refunded` 전이는 **Admin이 중재 결론 후 수동 실행** — 자동화 없음 (MVP)

### 유지보수성
- PG 연동 시 필드 확장 여지: `pg_tx_id`, `pg_status`, `pg_raw_response (JSONB)` 추가 Migration-safe
- `admin_memo`를 JSONB로 확장하여 구조화된 증빙(입금자/증빙URL/확인자) 관리 가능성 검토

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~10)를 충족하는가?
- [ ] `prisma/schema.prisma`에 `EscrowState` enum + `EscrowTx` 모델이 SRS 6.2.5 명세대로 정의되었는가?
- [ ] `contract_id`에 UNIQUE 제약이 적용되어 1:1 관계가 DB-level에서 강제되는가?
- [ ] FK `onDelete: Restrict` 정책이 적용되어 Contract 삭제가 차단되는가?
- [ ] `DECIMAL(15, 2)` 타입 매핑으로 재무 정밀도가 보장되는가?
- [ ] 마이그레이션 SQL 파일이 생성 및 커밋되었는가?
- [ ] `@prisma/client`가 재생성되어 `EscrowTx`, `EscrowState` 타입이 정상 export되는가?
- [ ] 로컬 SQLite와 Supabase PostgreSQL 양쪽에서 마이그레이션이 성공하는가?
- [ ] `/lib/escrow/state-machine.ts` 상태 전이 유틸리티가 구현되고 단위 테스트가 통과하는가?
- [ ] `/lib/escrow/sync-contract.ts` Contract 동기화 헬퍼가 구현되었는가?
- [ ] `/lib/types/escrow.ts` Admin/Buyer 뷰 분리 DTO가 정의되었는가?
- [ ] `/docs/escrow-state-machine.md` 및 `/docs/escrow-legal-retention.md`가 작성되었는가?
- [ ] ESLint / TypeScript 컴파일 경고 0건인가?
- [ ] PR 머지 전 임시 검증 스크립트가 제거되었는가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-005 | `CONTRACT` 테이블 — `contract_id` FK 참조 대상 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| DB-011 | `WARRANTY` — `escrow_tx_id` FK 참조 (1:1, 에스크로 완료 트리거로 자동 발급) |
| MOCK-002 | Prisma Seed — EscrowTx 5건 (상태별 분산) |
| API-004 | `updateEscrowStatus` Server Action DTO (예치) |
| API-005 | `confirmRelease` Server Action DTO (방출) |
| API-007 | `GET /api/escrow/[txId]/status` Route Handler |
| FC-006 | `updateEscrowStatus` Command — Contract.status와 트랜잭션 동기화 |
| FC-009 | `confirmRelease` Command |
| FQ-004 | 에스크로 TX 상태 조회 Server Component |
| FQ-007 | Admin 대시보드 — 에스크로 거래 목록 조회 |
| CRON-006 | 에스크로 오류율 모니터링 배치 |
| UI-005 | 에스크로 결제 흐름 UI |
| UI-008 | Admin 대시보드 — 에스크로 관리 |

### 참고사항
- **MVP vs Phase 2 전환 포인트:** 현 스키마는 PG 미연동 기준. Phase 2 PG 도입 시 `pg_tx_id`, `pg_status` 필드 Nullable 추가가 **가장 작은 마이그레이션 경로**
- **Contract.status ↔ EscrowTx.state 동기화 이중 관리 리스크:** 두 테이블이 서로 다른 소스에서 상태를 관리하므로, **반드시 `prisma.$transaction`으로 원자성 보장 필수** — FC 구현 체크리스트 강조
- **법적 증빙 강화 여지:** `admin_memo`를 단순 TEXT 대신 JSONB로 구조화하면 감사 대응이 용이 — Phase 2 검토
- **북극성 KPI 성능 튜닝 시점:** 월 거래량 100건 초과 시 `[state, releasedAt]` 복합 인덱스 도입 재평가
- **분쟁 중재 워크플로우:** `held → refunded` 자동 전환 로직은 MVP 범위 외. Admin 수동 실행 (별도 관리 UI 필요 시 UI-008에서 구현)
