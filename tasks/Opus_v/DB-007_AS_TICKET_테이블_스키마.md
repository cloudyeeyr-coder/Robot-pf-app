---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DB-007: AS_TICKET 테이블 스키마 및 마이그레이션 (priority ENUM, 4단계 timestamp, sla_met)"
labels: 'feature, backend, db, as, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [DB-007] `AS_TICKET` (AS 티켓) 테이블 스키마 및 마이그레이션 작성
- 목적: 플랫폼의 **AS 보증 신뢰 체계(F-02)의 핵심 운영 엔티티**. 수요기업이 계약 후 SI 파트너의 부도·폐업·연락두절 상황에서 긴급 AS를 접수하면, 본 테이블에 **4단계 타임스탬프(reported_at → assigned_at → dispatched_at → resolved_at)** 가 순차 기록되고, **`sla_met`** 필드에 24시간 SLA 충족 여부가 자동 판정된다. `priority ENUM(normal/urgent)` 으로 긴급도를 구분하며, 핵심 KPI(G-01: 24시간 내 AS 출동 성공률 ≥ 95%, REQ-NF-024)의 집계 기반이다. CRON-007(24시간 미배정 모니터링)이 본 테이블을 주기 스캔한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.6 AS_TICKET`](../06_SRS-v1.md) — AS 티켓 테이블 스키마 정의 (11개 필드, priority ENUM 2종, 4단계 timestamp)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-007`](../06_SRS-v1.md) — SI 부도·폐업·연락두절 시 로컬 AS 엔지니어 자동 매칭·배정
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-008`](../06_SRS-v1.md) — AS 티켓 4단계 추적 및 SLA 자동 판정 (24시간 기준)
- SRS 문서: [`06_SRS-v1.md#REQ-NF-024`](../06_SRS-v1.md) — 24시간 내 AS 출동 성공률 ≥ 95% (G-01 KPI)
- SRS 문서: [`06_SRS-v1.md#6.3.5`](../06_SRS-v1.md) — 긴급 AS 접수·배정·출동 상세 시퀀스 다이어그램
- SRS 문서: [`06_SRS-v1.md#6.2.13 Class Diagram (AsTicket)`](../06_SRS-v1.md) — `create`, `assignEngineer`, `confirmDispatch`, `resolve`, `evaluateSla` 도메인 메서드
- 태스크 리스트: [`07_TASK-LIST-v1.md#DB-007`](../TASKS/07_TASK-LIST-v1.md)
- 연동 API: `API-009` (createAsTicket), `API-010` (assignEngineer), `API-011` (resolveTicket)
- 연동 DB: `DB-005` (CONTRACT 상위), `DB-017` (AS_ENGINEER — assigned_engineer_id 참조 대상)
- 연동 Cron: `CRON-007` (24시간 미배정 Slack 알림)
- 선행 태스크: `DB-005` (CONTRACT 테이블)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 우선순위 ENUM 정의
- [ ] `AsPriority` enum 정의:
  ```prisma
  enum AsPriority {
    normal    // 일반 AS (예: 정기 점검, 소모품 교체)
    urgent    // 긴급 AS (예: SI 파산·폐업·연락두절 → 자동 매칭 트리거)
  }
  ```
- [ ] priority별 SLA 정책 문서화 (`/docs/as-sla-policy.md`):
  - `urgent`: 배정 ≤ 4시간, 해결 ≤ 24시간 (REQ-FUNC-007/008)
  - `normal`: 별도 명시 없음 — MVP에서는 urgent와 동일 적용, Phase 2에서 차별화 검토

### 2단계: Prisma 모델 정의 (`prisma/schema.prisma`)
- [ ] `AsTicket` 모델 정의 (SRS 6.2.6 11개 필드 반영):
  ```prisma
  model AsTicket {
    id                   String       @id @default(cuid())
    contractId           String
    priority             AsPriority   @default(normal)
    symptomDescription   String       @db.Text
    assignedEngineerId   String?                              // DB-017 AsEngineer FK (nullable — 배정 전 NULL)
    reportedAt           DateTime                             // 접수 시각 (INSERT 시 필수 입력)
    assignedAt           DateTime?                            // 배정 시각
    dispatchedAt         DateTime?                            // 출동 시각
    resolvedAt           DateTime?                            // 해결 시각
    slaMet               Boolean?                             // SLA 충족 여부 (resolved_at 기록 시점에 판정)
    createdAt            DateTime     @default(now())

    // FK Relations
    contract             Contract     @relation(fields: [contractId], references: [id], onDelete: Restrict)
    assignedEngineer     AsEngineer?  @relation(fields: [assignedEngineerId], references: [id], onDelete: SetNull)

    @@index([contractId])
    @@index([priority])
    @@index([reportedAt(sort: Desc)])
    @@index([assignedAt])                                     // CRON-007 미배정 감지 (assignedAt IS NULL)
    @@index([slaMet])                                         // G-01 KPI 집계
    @@map("as_ticket")
  }
  ```
- [ ] `reported_at`은 DEFAULT NOW()로 자동 채우기 검토:
  ```prisma
  reportedAt  DateTime  @default(now())
  ```
  SRS 명세상 "NOT NULL"만 있고 DEFAULT 언급은 없으나, **API-009에서 클라이언트 시각이 아닌 서버 NOW() 기록 강제** — 애플리케이션 레이어에서 명시 설정이 안전
- [ ] Cascade 정책:
  - `contract` → `onDelete: Restrict` — 계약 삭제 차단 (법적 보존 + 데이터 무결성)
  - `assignedEngineer` → `onDelete: SetNull` — 엔지니어 삭제 시 이력 보존, FK만 NULL 처리

### 3단계: 인덱스 전략 수립
- [ ] `contractId` → `@@index` — 계약별 AS 이력 조회 (SI 프로필 상세에서 활용)
- [ ] `priority` → `@@index` — 긴급 티켓 우선 조회
- [ ] `reportedAt(sort: Desc)` — Admin 대시보드 최신순 정렬 (FQ-010)
- [ ] `assignedAt` → `@@index` — **CRON-007 핵심 쿼리**: `WHERE assignedAt IS NULL AND reportedAt < NOW() - 24h`
- [ ] `slaMet` → `@@index` — G-01 KPI 집계 (`WHERE slaMet = true`)
- [ ] 복합 인덱스 검토:
  - `@@index([priority, assignedAt])` — 긴급 + 미배정 필터 (urgent 티켓 감시)
  - 거래량 증가 후 `EXPLAIN ANALYZE` 기반 재평가

### 4단계: Migration 파일 생성 및 검증
- [ ] `pnpm prisma migrate dev --name add_as_ticket` 실행
- [ ] 생성된 SQL 검토:
  - `CREATE TYPE "AsPriority" AS ENUM ('normal', 'urgent');`
  - `CREATE TABLE "as_ticket" (...)`:
    - `symptom_description TEXT NOT NULL`
    - 4개 timestamp 중 `reported_at`만 NOT NULL, 나머지 3개 NULLABLE 확인
    - `sla_met BOOLEAN` NULLABLE 확인 (resolved_at 기록 전까지 NULL)
    - `assigned_engineer_id UUID NULLABLE` 확인
  - FK `ON DELETE RESTRICT` (contract), `ON DELETE SET NULL` (assigned_engineer) 확인
  - 5개 이상 인덱스 생성 확인
- [ ] `pnpm prisma generate` → `AsTicket`, `AsPriority` 타입 export 검증

### 5단계: SLA 판정 유틸리티 작성 (`/lib/as-ticket/sla-evaluator.ts`)
- [ ] SLA 자동 판정 함수 (FC-013에서 `resolveTicket` 호출 시 활용):
  ```ts
  export const SLA_THRESHOLD_HOURS = 24

  export function evaluateSla(reportedAt: Date, resolvedAt: Date): boolean {
    const elapsedMs = resolvedAt.getTime() - reportedAt.getTime()
    const elapsedHours = elapsedMs / (1000 * 60 * 60)
    return elapsedHours <= SLA_THRESHOLD_HOURS
  }

  export function hasExceededAssignmentSla(reportedAt: Date, now: Date = new Date()): boolean {
    // CRON-007: 24시간 배정 SLA 초과 감지 (REQ-FUNC-007: 배정 ≤ 4h, 출동 ≤ 24h)
    // 본 함수는 '출동 전체 SLA' 기준. 배정 4시간 초과는 별도 함수로 분리 가능
    const elapsedHours = (now.getTime() - reportedAt.getTime()) / (1000 * 60 * 60)
    return elapsedHours > SLA_THRESHOLD_HOURS
  }
  ```
- [ ] 단위 테스트: 23h59m → true, 24h01m → false 등 경계값 검증

### 6단계: 타임스탬프 순서 검증 유틸리티 (`/lib/as-ticket/timestamp-validator.ts`)
- [ ] 4단계 타임스탬프 순서 무결성 검증 (`reportedAt ≤ assignedAt ≤ dispatchedAt ≤ resolvedAt`):
  ```ts
  export function validateTimestampOrder(ticket: AsTicket): void {
    const { reportedAt, assignedAt, dispatchedAt, resolvedAt } = ticket
    if (assignedAt && assignedAt < reportedAt) {
      throw new Error('assignedAt must be >= reportedAt')
    }
    if (dispatchedAt && assignedAt && dispatchedAt < assignedAt) {
      throw new Error('dispatchedAt must be >= assignedAt')
    }
    if (resolvedAt && dispatchedAt && resolvedAt < dispatchedAt) {
      throw new Error('resolvedAt must be >= dispatchedAt')
    }
  }
  ```
- [ ] FC-011~013 구현 시 UPDATE 전 반드시 호출 — PR 체크리스트 명시

### 7단계: TypeScript 타입 유틸 작성 (`/lib/types/as-ticket.ts`)
- [ ] Prisma 타입 re-export + 도메인 전용 타입:
  ```ts
  import type { AsTicket as PrismaAsTicket, AsPriority } from '@prisma/client'
  export type AsTicket = PrismaAsTicket
  export type { AsPriority }

  export const AS_PRIORITY_VALUES = ['normal', 'urgent'] as const

  // 티켓 진행 단계 표시 (UI에서 Progress Indicator 활용)
  export type AsTicketStage = 'reported' | 'assigned' | 'dispatched' | 'resolved'

  export function getCurrentStage(ticket: AsTicket): AsTicketStage {
    if (ticket.resolvedAt) return 'resolved'
    if (ticket.dispatchedAt) return 'dispatched'
    if (ticket.assignedAt) return 'assigned'
    return 'reported'
  }
  ```

### 8단계: 간이 Integration 검증 스크립트
- [ ] `scripts/verify-as-ticket-schema.ts` (PR 머지 전 제거):
  - Contract 시드 후 AsTicket INSERT (priority=urgent, symptom="화재 감지") → 성공
  - 존재하지 않는 contractId FK → `P2003` 확인
  - priority='critical' (미정의 값) → 컴파일 에러
  - 타임스탬프 역순 (`assignedAt < reportedAt`) → 스키마 허용 but timestamp-validator가 차단하는지 단위 테스트
  - `evaluateSla(now, now + 25h)` → false 반환 검증

### 9단계: 문서 업데이트
- [ ] `/docs/erd.md`에 AsTicket 엔티티 반영
- [ ] `/docs/as-sla-policy.md` SLA 정책 확정
- [ ] `/docs/as-ticket-lifecycle.md` 4단계 타임스탬프 순서 규칙 문서화
- [ ] 후행 태스크 담당자(DB-017, API-009~011) 에게 FK 준비 완료 공유

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 긴급 AS 티켓 정상 생성 (priority=urgent, reported_at=NOW)**
- **Given:** Contract A가 존재하고, SI 파트너가 부도 상태
- **When:** `prisma.asTicket.create({ data: { contractId: 'A', priority: 'urgent', symptomDescription: '로봇 팔 오작동', reportedAt: new Date() } })` 호출
- **Then:** 레코드 생성 성공, assignedAt/dispatchedAt/resolvedAt/slaMet 모두 NULL 상태.

**Scenario 2: 엔지니어 배정 단계 전이**
- **Given:** AsTicket (reportedAt=T0, 다른 timestamp 모두 NULL)
- **When:** `prisma.asTicket.update({ where: { id }, data: { assignedEngineerId: 'eng-01', assignedAt: T0 + 2h } })`
- **Then:** assignedEngineerId, assignedAt 업데이트 성공. `getCurrentStage(ticket)` === 'assigned' 반환.

**Scenario 3: 출동 단계 전이**
- **Given:** AsTicket (assignedAt=T0+2h 기록됨)
- **When:** `prisma.asTicket.update({ where: { id }, data: { dispatchedAt: T0 + 4h } })`
- **Then:** dispatchedAt 기록, `getCurrentStage(ticket)` === 'dispatched' 반환.

**Scenario 4: 해결 및 SLA 판정 자동 기록 (SLA 충족)**
- **Given:** AsTicket (reportedAt=T0), 현재 시각 T0 + 20h
- **When:** FC-013에서 `evaluateSla(T0, T0+20h)` === true 판정 → `prisma.asTicket.update({ where: { id }, data: { resolvedAt: T0+20h, slaMet: true } })`
- **Then:** resolvedAt, slaMet=true 기록. Stage='resolved'.

**Scenario 5: 해결 및 SLA 판정 자동 기록 (SLA 미충족)**
- **Given:** AsTicket (reportedAt=T0), 현재 시각 T0 + 30h
- **When:** `evaluateSla(T0, T0+30h)` === false → slaMet=false 기록
- **Then:** slaMet=false 저장, G-01 KPI 집계에서 미충족 건으로 카운트.

**Scenario 6: 존재하지 않는 Contract FK 거부**
- **Given:** 유효하지 않은 contractId
- **When:** AsTicket INSERT 시도
- **Then:** `P2003` Foreign key constraint violation 발생.

**Scenario 7: 엔지니어 삭제 시 FK SetNull 동작**
- **Given:** AsTicket의 assignedEngineerId가 'eng-01'로 설정됨
- **When:** `prisma.asEngineer.delete({ where: { id: 'eng-01' } })` 시도 (DB-017 구현 후)
- **Then:** 삭제 성공, AsTicket.assignedEngineerId는 NULL로 자동 설정. 이력은 보존 (`assignedAt`은 유지).

**Scenario 8: CRON-007 미배정 감지 쿼리 성능**
- **Given:** AsTicket 1,000건 시드, 이 중 50건이 미배정 + reportedAt 24시간 초과
- **When:** `prisma.asTicket.findMany({ where: { assignedAt: null, reportedAt: { lt: new Date(Date.now() - 24*3600*1000) } } })` 실행
- **Then:** `assignedAt` 인덱스 활용으로 p95 ≤ 300ms. (인덱스는 NULL도 포함)

**Scenario 9: G-01 KPI 집계 쿼리**
- **Given:** 해결 완료 티켓 500건 (slaMet true/false 혼합)
- **When:** `prisma.asTicket.groupBy({ by: ['slaMet'], _count: true, where: { resolvedAt: { gte: monthStart } } })`
- **Then:** `slaMet` 인덱스 활용, 충족/미충족 건수 집계 p95 ≤ 200ms. 출동률 = `count(slaMet=true) / total`.

**Scenario 10: 인덱스 생성 검증**
- **Given:** 마이그레이션 완료된 PostgreSQL DB
- **When:** `\d as_ticket` 실행
- **Then:** PK(id), INDEX(contract_id), INDEX(priority), INDEX(reported_at DESC), INDEX(assigned_at), INDEX(sla_met) 6개 이상 존재.

## :gear: Technical & Non-Functional Constraints

### 스키마 설계
- **필드 수 준수:** SRS 6.2.6에 명시된 11개 필드 정확히 반영
- **NULLABLE 정책:**
  - `assignedEngineerId`, `assignedAt`, `dispatchedAt`, `resolvedAt`, `slaMet`: 해당 단계 진입 전까지 NULL
  - `symptomDescription`: NOT NULL (접수 시 필수 입력)
  - `reportedAt`: NOT NULL (접수 시각, 서버 NOW() 기록)
- **타입 매핑:**
  - `TEXT` (symptomDescription) → `@db.Text` (길이 제한 없음, 상세 설명 허용)
  - `BOOLEAN` (slaMet) → `Boolean?` (NULL = 미판정, true/false = 판정 완료)
- **Cascade 정책:**
  - Contract → `Restrict` (데이터 무결성)
  - AsEngineer → `SetNull` (엔지니어 이직/퇴사 대응, 이력 보존)

### 성능
- CRON-007 미배정 스캔 p95 ≤ 300ms (예상 MVP 규모 월 50건 기준)
- G-01 KPI 집계 쿼리 p95 ≤ 200ms (slaMet 인덱스 활용)
- Admin 대시보드 최신순 조회 p95 ≤ 500ms
- 계약별 AS 이력 조회(SI 프로필 용도) p95 ≤ 200ms
- 예상 규모: 연 계약 1,000건 × AS 발생률 10% = **연 100건** — 현 인덱스로 5년 이상 충분

### 안정성
- 타임스탬프 순서 무결성은 **application-level 검증** (스키마 레벨 check 미지원) — FC-011/012/013에서 `validateTimestampOrder` 필수 호출
- SLA 판정 로직은 `/lib/as-ticket/sla-evaluator.ts`에 단일 소스로 고정, FC와 CRON에서 공유 사용
- 엔지니어 배정이 4시간 초과 시 CRON-007이 Slack 알림 발송 (REQ-FUNC-034)

### 보안
- `symptomDescription`에 민감한 고객 정보(작업장 위치, 시공 내역) 포함 가능 — Admin/SI/배정 엔지니어만 접근 (RBAC)
- 전자금융거래법 5년 보존 대상 아니지만 AS 보증 범위 내에서 보존 (coverage_period_months 기반, Phase 2 정책 재확정)

### 비즈니스 정확성 (REQ-NF-024)
- **24시간 SLA 기준:** `resolved_at - reported_at ≤ 86,400초` — `evaluateSla` 함수에서 명확히 정의
- **배정 SLA:** REQ-FUNC-007에서 "배정 ≤ 4시간" 명시 — 별도 지표로 관리 (`hasAssignmentSlaExceeded` 함수 확장)
- **MVP 배정 로직:** 지역 + 역량 매칭 (API-010에서 구현) — 자동 매칭 실패 시 운영팀 수동 배정

### 유지보수성
- 타임스탬프 4단계 구조가 **Progress Tracking UI의 근간** — 향후 5단계 확장(예: 부품 수배) 시 스키마 확장 검토
- `sla_met` 판정 기준 변경(예: 48시간으로 완화) 시 과거 데이터 재판정 여부 결정 필요

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~10)를 충족하는가?
- [ ] `prisma/schema.prisma`에 `AsPriority` enum + `AsTicket` 모델이 SRS 6.2.6 명세대로 정의되었는가?
- [ ] 마이그레이션 SQL 파일이 생성 및 커밋되었는가?
- [ ] 11개 필드가 모두 정의되고, NULLABLE 정책이 정확한가? (reportedAt, contractId, priority, symptomDescription만 NOT NULL)
- [ ] FK Cascade 정책: Contract → Restrict, AsEngineer → SetNull이 적용되었는가?
- [ ] 6개 이상의 인덱스가 생성되었는가?
- [ ] `@prisma/client`가 재생성되어 `AsTicket`, `AsPriority` 타입이 정상 export되는가?
- [ ] 로컬 SQLite와 Supabase PostgreSQL 양쪽에서 마이그레이션 성공?
- [ ] `/lib/as-ticket/sla-evaluator.ts` SLA 판정 유틸 및 단위 테스트 통과?
- [ ] `/lib/as-ticket/timestamp-validator.ts` 타임스탬프 순서 검증 유틸 구현?
- [ ] `/lib/types/as-ticket.ts` DTO 및 stage 유틸 정의?
- [ ] `/docs/as-sla-policy.md`, `/docs/as-ticket-lifecycle.md` 문서 작성?
- [ ] ESLint / TypeScript 컴파일 경고 0건?
- [ ] PR 머지 전 임시 검증 스크립트 제거?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-005 | `CONTRACT` 테이블 — `contract_id` FK 참조 대상 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| DB-017 | `AS_ENGINEER` — `assignedEngineerId`가 이 테이블을 참조 (현 스키마는 Nullable FK로 선제 정의, AsEngineer 추가 시 릴레이션 완성) |
| MOCK-005 | Prisma Seed — AS 티켓 10건 (접수~완료 단계별) |
| API-009 | `createAsTicket` Server Action DTO |
| API-010 | `assignEngineer` Server Action DTO (지역·역량 기반 배정) |
| API-011 | `resolveTicket` Server Action DTO (SLA 자동 판정 연계) |
| FC-011 | 긴급 AS 접수 Command |
| FC-012 | AS 엔지니어 배정 Command |
| FC-013 | AS 완료 처리 + SLA 판정 Command |
| FQ-005 | SLA 충족 여부 조회 Server Component |
| FQ-010 | Admin/Ops 대시보드 — AS SLA 모니터링 |
| CRON-007 | AS 티켓 24시간 미배정 Slack 알림 |
| UI-007 | 긴급 AS 접수 UI |
| UI-008 | Admin 대시보드 — AS SLA 모니터링 |

### 참고사항
- **AsEngineer 선행 관계 처리:** DB-017이 본 태스크 이후 진행되므로, 현 스키마에서 `assignedEngineer AsEngineer?` 관계 선언은 **DB-017 완료 후 마이그레이션 추가** 또는 **DB-017을 먼저 구현**하는 옵션 중 선택. 의존성 그래프상 본 태스크의 블록으로 간주하지 않으려면 **Nullable String FK(`assignedEngineerId String?`)만 정의하고 Relation은 DB-017에서 연결** 권장. 이후 마이그레이션은 추가 컬럼 없이 Relation만 추가되므로 호환성 문제 없음
- **SLA 기준 일원화:** 24시간 = 86,400초 하드코딩을 피하고 `/lib/as-ticket/sla-evaluator.ts`에 상수로 관리하여 향후 정책 변경 대응
- **'배정 ≤ 4시간'과 '출동 ≤ 24시간'의 구분:** SRS는 두 SLA를 동시 명시 — 본 스키마는 `sla_met` 단일 필드로 출동 SLA만 기록. 배정 SLA는 `assignedAt - reportedAt` 실시간 계산으로 처리 (별도 필드 불필요)
- **Phase 2 확장 여지:** 부품 교체 이력, 수리 비용, 고객 만족도 평가 필드 추가 가능 (JSONB 활용 검토)
- **미배정 배정 로직 실패 시:** API-010에서 가용 엔지니어 0명일 경우 Ops Slack 알림 후 수동 배정 — 본 테이블은 `assignedEngineerId` NULL 상태로 남아 CRON-007의 감시 대상이 됨
