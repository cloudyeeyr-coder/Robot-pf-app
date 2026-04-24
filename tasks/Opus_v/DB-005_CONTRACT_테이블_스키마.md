---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DB-005: CONTRACT 테이블 스키마 및 마이그레이션 (상태 ENUM 6종, FK 관계)"
labels: 'feature, backend, db, contract, escrow, priority:critical'
assignees: ''
---

## :dart: Summary
- 기능명: [DB-005] `CONTRACT` (계약) 테이블 스키마 및 마이그레이션 작성
- 목적: 플랫폼의 **핵심 비즈니스 객체(Core Business Object)** 인 계약 엔티티를 정의한다. 수요기업(BuyerCompany)과 SI 파트너(SiPartner)를 연결하고, **6단계 상태 전이(pending → escrow_held → inspecting → release_pending → completed / disputed)** 를 통해 에스크로 결제(F-01), AS 보증서 자동 발급(F-02), 분쟁 자동 전환(REQ-FUNC-005) 등 플랫폼의 **가장 중요한 머니 플로우(Money Flow)를 관장**한다. 북극성 KPI(월간 에스크로 거래 완결 수, REQ-NF-023)의 집계 기반이며, ESCROW_TX(1:1)·AS_TICKET(1:N)·WARRANTY(1:1) 3개 하위 엔티티의 FK 참조 루트다. `inspection_deadline` 필드로 7영업일 미응답 시 자동 분쟁 전환 배치(CRON-001)의 기준점을 제공한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.4 CONTRACT`](../06_SRS-v1.md) — 계약 테이블 스키마 정의 (8개 필드, 6단계 status ENUM)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-001`](../06_SRS-v1.md) — 에스크로 결제 시스템 (계약 생성 및 예치)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-002`](../06_SRS-v1.md) — 검수 승인 및 '방출 대기' 상태 전환
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-003`](../06_SRS-v1.md) — 분쟁 중재 프로세스 자동 개시
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-005`](../06_SRS-v1.md) — 검수 기한(7영업일) 미응답 시 자동 분쟁 전환
- SRS 문서: [`06_SRS-v1.md#6.2.12 ER Diagram`](../06_SRS-v1.md) — CONTRACT 관계 (BuyerCompany/SiPartner/EscrowTx/AsTicket/Warranty)
- SRS 문서: [`06_SRS-v1.md#6.2.13 Class Diagram`](../06_SRS-v1.md) — Contract 도메인 메서드 (`transitionTo`, `setInspectionDeadline`, `isInspectionExpired`, `initiateDispute`)
- SRS 문서: [`06_SRS-v1.md#6.3.1`](../06_SRS-v1.md) — 에스크로 결제 전체 상세 시퀀스 다이어그램
- SRS 문서: [`06_SRS-v1.md#REQ-NF-023`](../06_SRS-v1.md) — 월간 에스크로 거래 완결 수 (북극성 KPI, MVP+6개월 30건)
- 태스크 리스트: [`07_TASK-LIST-v1.md#DB-005`](../TASKS/07_TASK-LIST-v1.md)
- 연동 API: `API-003` (createContract), `API-008` (submitInspection), `API-006` (dispute)
- 연동 DB: `DB-002` (BuyerCompany), `DB-003` (SiPartner), `DB-006` (EscrowTx), `DB-007` (AsTicket), `DB-011` (Warranty)
- 연동 Cron: `CRON-001` (검수 기한 만료 자동 분쟁 전환)
- 선행 태스크: `DB-002` (BUYER_COMPANY), `DB-003` (SI_PARTNER)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 상태 ENUM 정의 및 전이 규칙 정리
- [ ] `ContractStatus` enum 정의 (6단계):
  ```prisma
  enum ContractStatus {
    pending          // 계약 생성, 입금 대기 중
    escrow_held      // Admin 입금 확인 완료, 시공 진행 중
    inspecting       // 시공 완료, 검수 진행 중 (7영업일 기한 시작)
    release_pending  // 검수 합격, Admin 방출 대기
    completed        // Admin 방출 완료 (거래 종결)
    disputed         // 분쟁 개시 (검수 거절 또는 기한 만료 자동 전환)
  }
  ```
- [ ] 상태 전이 규칙 문서화 (`/docs/contract-state-machine.md`):
  ```
  pending          → escrow_held      (Admin 입금 확인, API-004)
  escrow_held      → inspecting       (SI 시공 완료 신고, API-008 선행)
  inspecting       → release_pending  (수요기업 검수 합격, API-008 approve)
  inspecting       → disputed         (수요기업 검수 거절, API-008 reject)
  inspecting       → disputed         (7영업일 자동 전환, CRON-001)
  release_pending  → completed        (Admin 방출 완료, API-005)
  disputed         → completed/refunded (중재 결론 후, Manual)
  ```
- [ ] **불가역 전이(Terminal States)**: `completed`는 최종 상태, 역전이 불가

### 2단계: Prisma 모델 정의 (`prisma/schema.prisma`)
- [ ] `Contract` 모델 정의 (SRS 6.2.4 8개 필드 반영):
  ```prisma
  model Contract {
    id                   String          @id @default(cuid())
    buyerCompanyId       String
    siPartnerId          String
    totalAmount          Decimal         @db.Decimal(15, 2)
    status               ContractStatus  @default(pending)
    inspectionDeadline   DateTime?       @db.Date
    createdAt            DateTime        @default(now())
    updatedAt            DateTime        @updatedAt

    // FK Relations
    buyerCompany         BuyerCompany    @relation(fields: [buyerCompanyId], references: [id], onDelete: Restrict)
    siPartner            SiPartner       @relation(fields: [siPartnerId], references: [id], onDelete: Restrict)

    // 역방향 관계 (DB-006, DB-007, DB-011에서 FK 설정)
    escrowTx             EscrowTx?       // 1:1
    asTickets            AsTicket[]      // 1:N
    warranty             Warranty?       // 1:1

    @@index([buyerCompanyId])
    @@index([siPartnerId])
    @@index([status])
    @@index([status, inspectionDeadline])  // CRON-001 배치 쿼리 최적화
    @@index([createdAt(sort: Desc)])        // Admin 대시보드 최신순 정렬
    @@map("contract")
  }
  ```
- [ ] `totalAmount > 0` 제약은 **application-level 검증** (Prisma check constraint 미지원 → API-003/FC-005 Zod에서 강제)
- [ ] Cascade 정책:
  - `onDelete: Restrict` 채택 — 계약이 있는 수요기업/SI 삭제 차단 (데이터 무결성)
  - 하위 관계(ESCROW_TX, AS_TICKET, WARRANTY)의 Cascade는 각 테이블에서 개별 정의

### 3단계: 인덱스 전략 수립
- [ ] 단일 FK 인덱스:
  - `@@index([buyerCompanyId])` — 수요기업별 계약 조회 (My Contracts 페이지, UI-005 등)
  - `@@index([siPartnerId])` — SI별 계약 이력 집계 (SI 프로필, FQ-002)
- [ ] 상태 필터 인덱스:
  - `@@index([status])` — Admin 대시보드 상태별 필터 (FQ-007)
  - `@@index([status, inspectionDeadline])` — **CRON-001 핵심 쿼리 대응**: `WHERE status='inspecting' AND inspection_deadline < NOW()` 
- [ ] 정렬 인덱스:
  - `@@index([createdAt(sort: Desc)])` — 최신순 정렬

### 4단계: Migration 파일 생성 및 검증
- [ ] `pnpm prisma migrate dev --name add_contract` 실행
- [ ] 생성된 SQL 면밀 검토:
  - `CREATE TYPE "ContractStatus" AS ENUM ('pending', 'escrow_held', 'inspecting', 'release_pending', 'completed', 'disputed');`
  - `CREATE TABLE "contract" (...)` 구문:
    - `total_amount DECIMAL(15, 2) NOT NULL` 확인
    - `inspection_deadline DATE` NULLABLE 확인
    - FK 제약 `FOREIGN KEY ("buyer_company_id") REFERENCES "buyer_company"("id") ON DELETE RESTRICT` 확인
    - FK 제약 `FOREIGN KEY ("si_partner_id") REFERENCES "si_partner"("id") ON DELETE RESTRICT` 확인
  - 5개 인덱스 모두 생성 확인
- [ ] SQLite에서 `Decimal` → `REAL` 매핑 시 정밀도 손실 여부 확인 (로컬 개발 시 주의, 프로덕션 계산은 Supabase PostgreSQL 기준)
- [ ] `pnpm prisma generate` → `Contract`, `ContractStatus` 타입 export 검증

### 5단계: 상태 전이 유틸리티 작성 (`/lib/contract/state-machine.ts`)
- [ ] 허용 전이 테이블 구현:
  ```ts
  import type { ContractStatus } from '@prisma/client'

  export const ALLOWED_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
    pending:         ['escrow_held'],
    escrow_held:     ['inspecting'],
    inspecting:      ['release_pending', 'disputed'],
    release_pending: ['completed'],
    completed:       [],  // Terminal
    disputed:        ['completed'],  // 중재 결론 시만 (refund는 ESCROW_TX state에서 관리)
  }

  export function canTransition(from: ContractStatus, to: ContractStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to)
  }

  export function assertTransition(from: ContractStatus, to: ContractStatus): void {
    if (!canTransition(from, to)) {
      throw new Error(`Invalid contract state transition: ${from} → ${to}`)
    }
  }
  ```
- [ ] 단위 테스트 작성: 모든 허용/금지 전이 쌍 검증 (TEST-001~006과 별도, 스키마 레이어 단위 테스트)

### 6단계: `inspectionDeadline` 계산 유틸 작성 (`/lib/contract/inspection-deadline.ts`)
- [ ] 7영업일 계산 로직 (주말·공휴일 제외):
  ```ts
  export function calculateInspectionDeadline(siCompletedAt: Date, businessDays: number = 7): Date {
    // 구현: 한국 공휴일 라이브러리(e.g., @hyunbinseo/holidays-kr) 활용 검토
    // MVP 단순화: 주말(토/일)만 제외, 공휴일은 Phase 2
  }
  ```
- [ ] CRON-001에서 해당 유틸 공유 사용 예정

### 7단계: TypeScript 타입 유틸 작성 (`/lib/types/contract.ts`)
- [ ] Prisma 타입 re-export + 도메인 전용 타입 정의:
  ```ts
  import type { Contract as PrismaContract, ContractStatus } from '@prisma/client'
  export type Contract = PrismaContract
  export type { ContractStatus }

  export const CONTRACT_STATUS_VALUES = [
    'pending', 'escrow_held', 'inspecting', 'release_pending', 'completed', 'disputed'
  ] as const

  export const CONTRACT_TERMINAL_STATUSES: ContractStatus[] = ['completed']
  export const CONTRACT_OPEN_STATUSES: ContractStatus[] = [
    'pending', 'escrow_held', 'inspecting', 'release_pending', 'disputed'
  ]

  // 관리자 대시보드 표시용 DTO 초안
  export type ContractSummary = Pick<
    Contract,
    'id' | 'status' | 'totalAmount' | 'inspectionDeadline' | 'createdAt'
  > & {
    buyerCompanyName: string
    siPartnerCompanyName: string
  }
  ```

### 8단계: 간이 Integration 검증 스크립트
- [ ] `scripts/verify-contract-schema.ts` (PR 머지 전 제거):
  - BuyerCompany/SiPartner 시드 후 CONTRACT INSERT → 성공
  - 존재하지 않는 `buyerCompanyId` FK INSERT → `P2003` Foreign key constraint violation 확인
  - `status = 'foo'` INSERT → 컴파일 에러
  - `totalAmount = -100` INSERT → 스키마 레벨 허용, application 레벨 차단 필요 주석 명시
  - BuyerCompany 삭제 시도 (CONTRACT가 있는 상태) → `P2003` Restrict 차단 확인

### 9단계: 문서 업데이트
- [ ] `/docs/erd.md`에 Contract 엔티티 반영
- [ ] `/docs/contract-state-machine.md` 상태 전이 규칙 확정
- [ ] 후행 태스크(DB-006/007/011) 담당자에게 FK 참조 및 Cascade 정책 공유

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상적인 계약 생성 (초기 상태 pending)**
- **Given:** BuyerCompany와 SiPartner 레코드가 각각 존재함
- **When:** `prisma.contract.create({ data: { buyerCompanyId, siPartnerId, totalAmount: 10_000_000 } })` 호출 (status 미지정)
- **Then:** 레코드가 생성되고, `status`는 기본값 `pending`, `inspectionDeadline`은 NULL, `id`와 `createdAt`이 자동 채워진다.

**Scenario 2: 존재하지 않는 FK 참조 거부**
- **Given:** 유효하지 않은 `buyerCompanyId` (DB에 없는 cuid)
- **When:** CONTRACT INSERT 시도
- **Then:** Prisma가 `P2003` Foreign key constraint violation 에러를 발생시키고 트랜잭션이 롤백된다.

**Scenario 3: ContractStatus ENUM 제약 검증**
- **Given:** `ContractStatus` enum이 6개 값(pending/escrow_held/inspecting/release_pending/completed/disputed)만 허용
- **When:** `status: 'approved'` 등 미정의 값 INSERT 시도
- **Then:** TypeScript 컴파일 에러 또는 Prisma 런타임 Validation Error 발생.

**Scenario 4: `inspectionDeadline` NULL 허용 및 상태별 기대값**
- **Given:** 계약이 `pending` 상태로 생성됨
- **When:** 레코드를 조회함
- **Then:** `inspectionDeadline`은 NULL이며, `inspecting` 상태로 전환되는 시점에 FC-007에서 NOW() + 7영업일 값을 할당한다. (스키마는 NULL 허용, 비즈니스 로직 책임)

**Scenario 5: FK Cascade 정책(Restrict) 검증**
- **Given:** BuyerCompany A에 연결된 Contract 1건이 존재함
- **When:** `prisma.buyerCompany.delete({ where: { id: 'A' } })` 시도
- **Then:** Prisma가 `P2003` Foreign key constraint violation 에러 발생, BuyerCompany 삭제 차단 (계약 이력 보호).

**Scenario 6: CRON-001 배치 쿼리 성능 (인덱스 활용)**
- **Given:** 계약 10,000건 (status별 분산 시드), 100건이 `inspecting` 상태 + `inspection_deadline < NOW()`
- **When:** `prisma.contract.findMany({ where: { status: 'inspecting', inspectionDeadline: { lt: new Date() } } })` 실행
- **Then:** 복합 인덱스 `[status, inspectionDeadline]` 활용으로 응답 시간 p95 ≤ 100ms 달성. (`EXPLAIN ANALYZE`로 Index Scan 확인)

**Scenario 7: 상태 전이 유틸리티 검증**
- **Given:** `canTransition` 함수 구현 완료
- **When:** `canTransition('pending', 'escrow_held')` 호출
- **Then:** `true` 반환. `canTransition('completed', 'pending')` → `false`, `assertTransition('completed', 'pending')` → Error throw.

**Scenario 8: Decimal 정밀도 검증 (PostgreSQL 환경)**
- **Given:** `totalAmount: 1234567890.12` 입력
- **When:** INSERT 후 SELECT
- **Then:** PostgreSQL에서 정확히 `1234567890.12` 반환 (DECIMAL(15,2) 정밀도 보존). SQLite 환경에서는 `REAL` 매핑으로 부동소수점 오차 가능성 문서화.

**Scenario 9: 역방향 관계(EscrowTx/AsTicket/Warranty) include 쿼리 동작**
- **Given:** DB-006, DB-007, DB-011 스키마가 후속 구현됨
- **When:** `prisma.contract.findUnique({ where: { id }, include: { escrowTx: true, asTickets: true, warranty: true, buyerCompany: true, siPartner: true } })` 실행
- **Then:** 타입 오류 없이 쿼리가 작성되고, 1:1 관계(escrowTx, warranty)는 단일 객체 또는 null, 1:N 관계(asTickets)는 배열로 반환된다.

**Scenario 10: 인덱스 생성 검증**
- **Given:** 마이그레이션 완료된 PostgreSQL DB
- **When:** `\d contract` 실행
- **Then:** PK(id), INDEX(buyer_company_id), INDEX(si_partner_id), INDEX(status), COMPOSITE INDEX(status, inspection_deadline), INDEX(created_at DESC) 6개 이상의 인덱스가 존재한다.

## :gear: Technical & Non-Functional Constraints

### 스키마 설계
- **필드 수 준수:** SRS 6.2.4에 명시된 8개 필드 (id, buyer_company_id, si_partner_id, total_amount, status, inspection_deadline, created_at, updated_at) 정확히 반영
- **ENUM 정확성:** 6단계(pending/escrow_held/inspecting/release_pending/completed/disputed) — PRD ERD(6.1)의 5단계 버전이 아닌 **SRS 6.2.4의 6단계 버전 채택** (ER Diagram 업데이트 사유: release_pending 추가)
- **타입 매핑:**
  - `DECIMAL(15,2)` → `@db.Decimal(15, 2)` (PostgreSQL 정밀도 강제, 최대 15자리 중 소수점 2자리)
  - `DATE` (inspection_deadline) → `@db.Date` (시간 정보 불필요, 날짜 단위 비교)
  - `TIMESTAMP` → `DateTime`

### 성능
- CRON-001 배치 쿼리 p95 ≤ 100ms (복합 인덱스 활용 전제)
- Admin 대시보드 상태별 집계 쿼리 p95 ≤ 500ms
- 수요기업별 My Contracts 조회 p95 ≤ 300ms
- 테이블 확장성: 월 GMV 1억 × 12개월 = 연 12억 기준 **계약 약 1,200건/년** 예상 — 현 인덱스로 3년 이상 충분

### 안정성
- FK Cascade: `onDelete: Restrict` 전면 적용 — 계약 이력은 **전자금융거래법 5년 보존 의무(REQ-NF-011)** 대상이므로 물리적 삭제 원천 차단
- `total_amount > 0` 제약은 API-003/FC-005에서 Zod 검증 강제 (스키마 레벨 체크 제약 없음)
- 상태 전이 무결성: `/lib/contract/state-machine.ts`의 `assertTransition` 사용을 **FC-006/007/009 등 모든 상태 변경 로직에서 강제** (PR 리뷰 체크리스트 명시)

### 보안 (REQ-NF-011, REQ-NF-014)
- 거래·결제 데이터 5년 보존 의무 — 계약 물리 삭제 금지, Soft delete 필드 추가는 Phase 2 검토
- Admin 확인 기록(admin_memo 등)은 ESCROW_TX 테이블(DB-006)에서 관리 — 본 테이블은 Contract 메타데이터 중심
- `totalAmount`는 민감 재무 정보 — 로그 출력 시 마스킹 권장

### 비즈니스 정확성
- **북극성 KPI 대응(REQ-NF-023):** 월간 거래 완결 수 집계 쿼리 — `WHERE status='completed' AND updated_at BETWEEN ...` 패턴 — `@@index([status])` 활용
- **검수 기한 7영업일:** MVP에서는 주말만 제외하는 단순 계산. 한국 공휴일 반영은 Phase 2 확장
- **상태 역전이 금지:** `completed → pending` 같은 역전이는 스키마 레벨에서 차단 불가 — state machine 유틸리티에서 강제

### 유지보수성
- ContractStatus ENUM 확장(예: `cancelled` 추가) 시 **상태 전이 테이블 + CRON 로직 + UI 상태 표시** 3군데 동시 수정 필요 — 체크리스트 문서화
- 중재 결과에 따른 `disputed → completed / refunded` 분기는 ESCROW_TX state로 관리 (Contract는 `completed`로 종결)

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~10)를 충족하는가?
- [ ] `prisma/schema.prisma`에 `ContractStatus` enum + `Contract` 모델이 SRS 6.2.4 명세대로 정의되었는가?
- [ ] 마이그레이션 SQL 파일이 생성 및 커밋되었는가?
- [ ] 6단계 status ENUM이 정확히 정의되고 `pending` 기본값이 적용되었는가?
- [ ] `buyerCompanyId`, `siPartnerId` FK에 `onDelete: Restrict` 정책이 적용되었는가?
- [ ] 5개 이상의 인덱스(FK 2개, status, composite, createdAt)가 생성되었는가?
- [ ] `@prisma/client`가 재생성되어 `Contract`, `ContractStatus` 타입이 정상 export되는가?
- [ ] 로컬 SQLite와 Supabase PostgreSQL 양쪽에서 마이그레이션이 성공하는가?
- [ ] `/lib/contract/state-machine.ts` 상태 전이 유틸리티가 구현되고 단위 테스트가 통과하는가?
- [ ] `/lib/contract/inspection-deadline.ts` 검수 기한 계산 유틸이 구현되었는가?
- [ ] `/lib/types/contract.ts` DTO 타입이 정의되었는가?
- [ ] `/docs/contract-state-machine.md` 상태 전이 규칙 문서가 작성되었는가?
- [ ] ESLint / TypeScript 컴파일 경고 0건인가?
- [ ] PR 머지 전 임시 검증 스크립트가 제거되었는가?
- [ ] 후행 태스크(DB-006/007/011) 담당자에게 FK 참조 준비 완료가 공유되었는가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-001 | Prisma ORM 초기 설정 | 필수 (간접, DB-002/003 경유) |
| DB-002 | `BUYER_COMPANY` 테이블 — `buyer_company_id` FK 참조 대상 | 필수 |
| DB-003 | `SI_PARTNER` 테이블 — `si_partner_id` FK 참조 대상 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| DB-006 | `ESCROW_TX` — `contract_id` FK 참조 (1:1, UNIQUE) |
| DB-007 | `AS_TICKET` — `contract_id` FK 참조 (1:N) |
| DB-011 | `WARRANTY` — `contract_id` FK 참조 (1:1) |
| MOCK-002 | Prisma Seed — 계약 5건 (6개 상태별) + ESCROW_TX 5건 |
| API-003 | `createContract` Server Action DTO — 상태 전이 규칙 정의 |
| API-008 | `submitInspection` Server Action DTO — 상태 전이(inspecting→release_pending/disputed) |
| API-006 | 분쟁 접수 Route Handler |
| FC-005 | `createContract` Command 로직 |
| FC-007 | 검수 승인/거절 Command 로직 |
| FC-008 | 분쟁 접수 Command 로직 |
| CRON-001 | **검수 기한 만료 자동 분쟁 전환 배치** — `[status, inspectionDeadline]` 복합 인덱스 활용의 핵심 쿼리 |
| UI-005 | 에스크로 결제 흐름 UI |
| UI-006 | 검수 승인/거절 UI |

### 참고사항
- **SRS vs PRD ERD 불일치 주의:** PRD(`00_PRD-v1.md`) 6.1 ERD에는 status가 5개(pending/escrow_held/inspecting/completed/disputed)로 표기되어 있으나, **SRS 6.2.4가 정식 스펙**이며 `release_pending` 포함 6개 채택 — 이 태스크에서 확정
- **`inspection_deadline` 설정 시점:** 스키마는 NULLABLE이지만, 비즈니스 로직상 `inspecting` 상태 진입 시점에 반드시 설정되어야 함 — API-008/FC-007에서 강제
- **Decimal 정밀도 이슈:** SQLite 로컬 개발 시 `REAL` 매핑으로 인한 부동소수점 오차 가능성 — 중요 계산은 테스트 환경도 PostgreSQL로 수행 권장
- **소프트 삭제 vs 하드 삭제:** 계약은 전자금융거래법 5년 보존 의무(REQ-NF-011) — 하드 삭제 금지. 향후 `deletedAt` Nullable 필드 추가 시 마이그레이션 호환성 고려
- **State Machine 라이브러리 검토:** 규모가 커지면 `xstate` 등 정식 state machine 라이브러리 도입 검토 — 현재는 단순 lookup table로 충분
- **성능 핵심:** CRON-001의 7영업일 미응답 감지 쿼리가 테이블 전체 스캔이 되지 않도록 **복합 인덱스 `[status, inspectionDeadline]`이 가장 중요한 성능 포인트**
