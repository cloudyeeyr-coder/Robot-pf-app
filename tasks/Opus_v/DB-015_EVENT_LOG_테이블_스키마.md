---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DB-015: EVENT_LOG 테이블 스키마 및 마이그레이션 (이벤트 유형, 사용자 ID, payload JSONB) — Vercel Analytics 대체"
labels: 'feature, backend, db, monitoring, event, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [DB-015] `EVENT_LOG` (이벤트 로그) 테이블 스키마 및 마이그레이션 작성
- 목적: **Vercel Analytics 대체 DB 이벤트 로그**. REQ-FUNC-027(`signup_complete` 이벤트 기록), SRS 시퀀스 다이어그램에 명시된 각종 이벤트(`escrow_deposit_confirmed`, `escrow_released`, `inspection_rejected`, `as_ticket_resolved`, `manual_quote_requested` 등)를 DB에 구조화 저장하여, **북극성 KPI 집계 + 퍼널 분석 + 감사 추적**의 원천 데이터를 제공한다. Vercel Analytics의 외부 의존성을 제거하고 자체 DB 기반으로 **Admin 대시보드(FQ-009)** 에서 실시간 조회 가능하게 한다. **SRS 6.2에 엔티티 정의가 없는 보완 엔티티** — 07_TASK-LIST-v1.md 참고 사항에 "Vercel Analytics 대체 DB 이벤트 로그로 `signup_complete` 등 이벤트 기록용"으로 근거가 명시됨.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-027`](../06_SRS-v1.md) — "`signup_complete` 이벤트가 Vercel Analytics (DB 이벤트 로그)에 기록되고, 대시보드에서 집계됨"
- SRS 문서: [`06_SRS-v1.md#6.3.1, 6.3.5`](../06_SRS-v1.md) — 시퀀스 다이어그램에서 이벤트 예시 (`escrow_deposit_confirmed`, `escrow_released`, `inspection_rejected`, `inspection_timeout_dispute`, `as_ticket_resolved`, `manual_quote_requested`)
- SRS 문서: [`06_SRS-v1.md#REQ-NF-013`](../06_SRS-v1.md) — "로그 데이터는 90일 Hot Storage, 이후 1년 Cold Storage로 보존"
- SRS 문서: [`06_SRS-v1.md#REQ-NF-023~028`](../06_SRS-v1.md) — KPI 측정 기반 (본 테이블이 퍼널 분석의 기초)
- **SRS 보완 근거:** 07_TASK-LIST-v1.md 참고 사항 — "EVENT_LOG (DB-015): Vercel Analytics 대체 DB 이벤트 로그로 `signup_complete` 등 이벤트 기록용"
- 태스크 리스트: [`07_TASK-LIST-v1.md#DB-015`](../TASKS/07_TASK-LIST-v1.md)
- 연동 로직: `FQ-009` (Admin 대시보드 이벤트 로그 조회)
- 관련 기능: 전 도메인 FC 계열 (이벤트 기록은 비즈니스 로직 완료 시점마다 INSERT)
- 선행 태스크: `DB-001` (Prisma ORM 초기 설정)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 이벤트 유형 체계 정의
- [ ] 옵션 검토:
  - 옵션 A: `EventType` ENUM (타입 안전, 하지만 신규 이벤트 추가 시 매 마이그레이션 필요)
  - 옵션 B (채택): `eventType String` (자유 문자열, 표준 사전 관리)
  - → 옵션 B 이유: 이벤트 유형은 **가장 빈번히 추가되는 범주** (신규 기능마다 1~3개 이벤트 신설). 마이그레이션 오버헤드 회피 + 애플리케이션 레이어 상수 관리가 실용적
- [ ] 표준 이벤트 사전 상수 파일 작성 (`/lib/event-log/event-types.ts`):
  ```ts
  export const EventTypes = {
    // 사용자 온보딩
    SIGNUP_COMPLETE: 'signup_complete',

    // F-01 에스크로
    CONTRACT_CREATED: 'contract_created',
    ESCROW_DEPOSIT_CONFIRMED: 'escrow_deposit_confirmed',
    ESCROW_RELEASED: 'escrow_released',
    INSPECTION_APPROVED: 'inspection_approved',
    INSPECTION_REJECTED: 'inspection_rejected',
    INSPECTION_TIMEOUT_DISPUTE: 'inspection_timeout_dispute',

    // F-02 AS
    AS_TICKET_CREATED: 'as_ticket_created',
    AS_TICKET_ASSIGNED: 'as_ticket_assigned',
    AS_TICKET_RESOLVED: 'as_ticket_resolved',
    WARRANTY_ISSUED: 'warranty_issued',

    // F-04 뱃지/파트너십
    BADGE_ISSUED: 'badge_issued',
    BADGE_REVOKED: 'badge_revoked',
    BADGE_EXPIRED: 'badge_expired',
    PARTNER_PROPOSAL_SENT: 'partner_proposal_sent',
    PARTNER_PROPOSAL_ACCEPTED: 'partner_proposal_accepted',
    PARTNER_PROPOSAL_REJECTED: 'partner_proposal_rejected',
    PARTNER_PROPOSAL_EXPIRED: 'partner_proposal_expired',

    // F-05 RaaS
    RAAS_CALCULATED: 'raas_calculated',
    MANUAL_QUOTE_REQUESTED: 'manual_quote_requested',
    QUOTE_RESPONSE_SENT: 'quote_response_sent',

    // F-06 O2O (Phase 2)
    O2O_BOOKING_CREATED: 'o2o_booking_created',
    O2O_VISIT_REPORT_SUBMITTED: 'o2o_visit_report_submitted',

    // 기타
    OTHER: 'other',
  } as const

  export type EventTypeValue = typeof EventTypes[keyof typeof EventTypes]
  ```
- [ ] 신규 이벤트 추가 규칙 문서화 (`/docs/event-log-catalog.md`): snake_case, 과거형 동사 (`*_created`, `*_completed` 등), 1회 발생 원칙

### 2단계: Prisma 모델 정의 (`prisma/schema.prisma`)
- [ ] `EventLog` 모델:
  ```prisma
  model EventLog {
    id            String    @id @default(cuid())
    eventType     String    @db.VarChar(100)                      // 표준 사전 기반 자유 문자열
    actorId       String?                                          // 이벤트 주체 (사용자 ID, 시스템 이벤트는 NULL)
    actorRole     String?   @db.VarChar(50)                        // 'buyer' | 'si_partner' | 'manufacturer' | 'admin' | 'system' | 'cron'
    targetId      String?                                          // 이벤트 대상 ID (예: contractId, badgeId)
    targetType    String?   @db.VarChar(50)                        // 대상 엔티티 타입 (예: 'contract', 'badge')
    payload       Json?                                            // 추가 컨텍스트 (금액, 상태 전이 정보 등)
    occurredAt    DateTime  @default(now())                        // 이벤트 발생 시각 (INSERT 시각과 통상 동일)

    @@index([eventType, occurredAt])                               // FQ-009 주요 쿼리: 유형별 시계열 집계
    @@index([actorId, actorRole, occurredAt(sort: Desc)])          // 사용자별 활동 이력
    @@index([targetType, targetId])                                // 특정 엔티티 이벤트 추적 (감사)
    @@index([occurredAt(sort: Desc)])                              // 최신순 전체 로그
    @@map("event_log")
  }
  ```
- [ ] **FK 미설정 이유:**
  - `actorId`, `targetId`는 다양한 엔티티를 polymorphic하게 참조 → FK 불가 (DB-014와 동일 패턴)
  - 로그 테이블은 **FK 없음이 일반적** — 이벤트 기록 시 참조 무결성보다 **성능과 유연성 우선**
  - 참조 대상 삭제되어도 로그는 보존 (감사 추적 원칙)

### 3단계: 인덱스 전략 — 집계 쿼리 패턴 최적화
- [ ] `[eventType, occurredAt]` → **FQ-009 핵심 쿼리**:
  - `WHERE event_type='signup_complete' AND occurred_at BETWEEN monthStart AND monthEnd`
  - 월별/주별/일별 이벤트 건수 집계
- [ ] `[actorId, actorRole, occurredAt DESC]` — 특정 사용자 활동 이력 (보안 감사)
- [ ] `[targetType, targetId]` — "이 계약에서 발생한 모든 이벤트" 추적 (감사 대응)
- [ ] `[occurredAt DESC]` — 전역 최신순 (운영팀 대시보드)

### 4단계: Migration 및 쓰기 헬퍼
- [ ] `pnpm prisma migrate dev --name add_event_log` 실행, SQL 검토:
  - `event_type VARCHAR(100) NOT NULL`
  - 4개 인덱스 생성
- [ ] 이벤트 로깅 헬퍼 `/lib/event-log/logger.ts`:
  ```ts
  import { prisma } from '@/lib/prisma'
  import type { EventTypeValue } from './event-types'

  export async function logEvent(params: {
    eventType: EventTypeValue
    actorId?: string
    actorRole?: 'buyer' | 'si_partner' | 'manufacturer' | 'admin' | 'system' | 'cron'
    targetId?: string
    targetType?: string
    payload?: Record<string, unknown>
  }): Promise<void> {
    try {
      await prisma.eventLog.create({ data: { ...params } })
    } catch (err) {
      // 이벤트 로그 실패는 메인 비즈니스 로직을 막지 않음 (fire-and-forget)
      console.error('[event-log] failed to log event', err, params)
    }
  }
  ```
- [ ] **설계 원칙:** 이벤트 로그 실패는 **메인 트랜잭션을 중단시키지 않음** (서브 시스템 장애 격리) — FC 계열 구현 시 try-catch로 격리

### 5단계: TypeScript 타입 유틸 (`/lib/types/event-log.ts`)
- [ ] Prisma 타입 re-export + payload 타입 매핑 (type별 분기는 옵션 — 초기엔 unknown 유지):
  ```ts
  import type { EventLog as PrismaEventLog } from '@prisma/client'
  export type EventLog = PrismaEventLog

  // FQ-009 집계용 DTO
  export type EventLogAggregateRow = {
    eventType: string
    count: number
    bucket: string  // e.g., '2026-04' (월 단위)
  }
  ```

### 6단계: 데이터 보존 정책 구현 준비 (REQ-NF-013)
- [ ] 90일 Hot Storage + 1년 Cold Storage 정책 문서화 (`/docs/event-log-retention.md`):
  - **Hot (90일):** 본 테이블에 저장, 인덱스 활용 실시간 조회
  - **Cold (90일 이후 1년):** 별도 Archive 테이블(`event_log_archive`) 또는 Supabase Storage 파일 백업
  - **1년 이후:** 삭제
- [ ] CRON 작업 후보 문서화 (본 태스크 범위 외, 후속 CRON 태스크로 분리 가능):
  - 일 1회 90일 초과 레코드를 Archive로 이동 + 원본 삭제
  - 1년 초과 Archive 삭제

### 7단계: 간이 Integration 검증 및 문서
- [ ] `scripts/verify-event-log-schema.ts` (PR 머지 전 제거):
  - 정상 INSERT (eventType='signup_complete', actorId='B1', actorRole='buyer', payload={segment: 'Q1'}) → 성공
  - FK 없음 검증: 존재하지 않는 actorId INSERT → **성공** (의도된 동작)
  - FQ-009 쿼리 시뮬레이션: `WHERE event_type='signup_complete' AND occurred_at BETWEEN ...` → `[eventType, occurredAt]` 인덱스 활용 확인
  - `logEvent({ ... })` 호출 후 DB에서 조회 확인
- [ ] `/docs/erd.md` 반영
- [ ] `/docs/event-log-catalog.md` 표준 이벤트 사전 (1단계에서 시작)
- [ ] `/docs/event-log-retention.md` 90일/1년 보존 정책

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 사용자 가입 이벤트 정상 기록 (REQ-FUNC-027)**
- **Given:** BuyerCompany 신규 가입 완료 시점
- **When:** `logEvent({ eventType: 'signup_complete', actorId: 'B1', actorRole: 'buyer', payload: { segment: 'Q1', region: '서울' } })` 호출
- **Then:** EventLog 레코드 생성, `occurredAt`이 현재 시각으로 기록됨.

**Scenario 2: 시스템 이벤트 (actorId NULL) 기록**
- **Given:** CRON-001이 검수 기한 만료 자동 전환 실행
- **When:** `logEvent({ eventType: 'inspection_timeout_dispute', actorId: null, actorRole: 'cron', targetId: 'C1', targetType: 'contract' })`
- **Then:** actorId=null 허용, 시스템 주체 이벤트 저장 성공.

**Scenario 3: FK 없음 — 대상 엔티티 삭제 후에도 로그 보존**
- **Given:** Contract C1 이벤트 로그 존재
- **When:** Contract 삭제 (이론적, 실제로는 Restrict로 차단되지만 우회 가정)
- **Then:** EventLog는 보존됨 (FK 없음). 감사 추적성 유지.

**Scenario 4: 이벤트 로그 실패 시 메인 로직 격리**
- **Given:** FC-005가 Contract 생성 + `logEvent('contract_created')` 호출
- **When:** EventLog INSERT가 일시적 DB 오류로 실패
- **Then:** `logger.ts`의 try-catch로 격리되어 **Contract 생성 트랜잭션은 성공**. 로그만 누락 (console.error 기록).

**Scenario 5: FQ-009 집계 쿼리 성능**
- **Given:** 100,000건 시드 (이벤트 유형 분산)
- **When:** `groupBy({ by: ['eventType'], _count: true, where: { occurredAt: { gte: monthStart } } })`
- **Then:** `[eventType, occurredAt]` 인덱스 활용 p95 ≤ 500ms.

**Scenario 6: 특정 엔티티 감사 추적 쿼리**
- **Given:** Contract C1 관련 이벤트 20건 시드
- **When:** `findMany({ where: { targetType: 'contract', targetId: 'C1' }, orderBy: { occurredAt: 'desc' } })`
- **Then:** `[targetType, targetId]` 인덱스 활용 p95 ≤ 100ms.

**Scenario 7: 사용자별 활동 이력**
- **Given:** Buyer B1 이벤트 100건
- **When:** `findMany({ where: { actorId: 'B1', actorRole: 'buyer' }, orderBy: { occurredAt: 'desc' }, take: 50 })`
- **Then:** `[actorId, actorRole, occurredAt DESC]` 인덱스 활용 p95 ≤ 200ms.

**Scenario 8: payload JSON 구조 유연성**
- **Given:** `payload: { amount: 10000000, contractId: 'C1', statusTransition: { from: 'pending', to: 'escrow_held' } }`
- **When:** 저장 후 조회
- **Then:** 임의 JSON 구조 자유롭게 저장, 추후 유형별 Zod 파싱 가능.

**Scenario 9: 고빈도 INSERT 처리**
- **Given:** 동시 100건의 logEvent 호출
- **When:** 병렬 INSERT 처리
- **Then:** Prisma Connection Pool 내에서 정상 처리 — 대량 INSERT 시 배치 활용 권장

**Scenario 10: 인덱스 검증**
- **When:** `\d event_log`
- **Then:** PK + 4개 인덱스 존재.

## :gear: Technical & Non-Functional Constraints

### 스키마 설계
- **SRS 보완 엔티티:** 07_TASK-LIST-v1.md 참고 사항 근거
- **eventType = String (ENUM 아님):** 빈번한 확장 대응, 표준 사전 상수(`EventTypes`)로 일관성 유지
- **FK 없음:** 로그 테이블 일반 패턴 (참조 대상 삭제와 독립적 보존)
- **Polymorphic (`actorId+actorRole`, `targetId+targetType`):** DB-014와 동일 설계 원칙

### 성능
- INSERT 성능: 단건 ≤ 20ms, 배치 가능
- FQ-009 집계 p95 ≤ 500ms
- 엔티티 감사 p95 ≤ 100ms
- 예상 규모: **일 평균 500~5,000건** (MVP+6개월 사용자 500명 기준) → 연 최대 180만 건 — 90일 Hot Storage로 약 45만 건 유지

### 안정성
- **Fire-and-forget 원칙:** 이벤트 로그 실패가 메인 비즈니스 로직을 중단시키지 않음 (`logger.ts` try-catch)
- 단, **규제·법적 감사 목적 이벤트**(예: `escrow_released`)는 실패 시 별도 복구 메커니즘 필요 — `sentry`/alerting 연동 (Phase 2)

### 보안 (PII 주의)
- `payload`에 **PII 직접 저장 금지** — ID 참조만, 실제 PII는 원천 테이블에서 조회
- 감사 로그 자체는 Admin만 열람 (RBAC)
- 보존: Hot 90일 + Cold 1년 (REQ-NF-013), 이후 삭제

### 비용
- DB 용량: 평균 레코드 크기 500B × 180만/년 = 약 900MB/년 — Supabase 요금제 내 수용 가능
- Cold Storage 전환 시 비용 절감 (Supabase Storage 또는 별도 Archive 테이블)

### 유지보수성
- 신규 이벤트 추가 = `EventTypes` 상수에 추가 + 문서 업데이트 (마이그레이션 불필요)
- payload 구조 변경은 Zod 스키마 버전으로 관리 (하위 호환성 유지)
- Hot/Cold 전환 CRON은 별도 태스크로 분리 (본 태스크 범위 외)

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 AC 충족?
- [ ] `EventLog` 모델 정의 + 4개 인덱스 생성?
- [ ] `eventType`을 String으로 정의하고 `EventTypes` 상수 파일로 표준화?
- [ ] `logger.ts` fire-and-forget 헬퍼 구현 및 단위 테스트?
- [ ] `@prisma/client` 재생성, 양쪽 환경 마이그레이션 성공?
- [ ] `/docs/event-log-catalog.md` 표준 이벤트 사전?
- [ ] `/docs/event-log-retention.md` 90일/1년 보존 정책 문서?
- [ ] FC 계열 담당자에게 "이벤트 로그 실패는 메인 로직 중단시키지 않는다" 원칙 공유?
- [ ] ESLint / TS 경고 0건, 임시 스크립트 제거?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-001 | Prisma ORM 초기 설정 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| FC-001~029 전 계열 | 비즈니스 로직 완료 시점에 `logEvent()` 호출 — 계약/에스크로/뱃지 등 |
| FQ-009 | Admin 대시보드 이벤트 로그 조회 |
| CRON-006~009 | 모니터링 알림 (임계치 초과 시 이벤트 로그 기반 감지 가능) |
| UI-008 | Admin 대시보드 — 이벤트 로그 표시 섹션 |

### 참고사항
- **Vercel Analytics vs 자체 DB:** Vercel Analytics는 페이지뷰/Core Web Vitals 자동 수집에 적합하나, **비즈니스 이벤트(가입/계약/방출 등) 집계는 DB 기반이 더 유연**. 본 테이블이 비즈니스 이벤트 원천, Vercel Analytics는 Web Vitals 담당 — 역할 분리 명확히
- **Hot/Cold 전환 시점:** MVP에서는 90일 전환 CRON 불필요 (데이터 볼륨 소규모). **MVP+6개월 운영 데이터 확인 후 도입 결정** 권장
- **대체 저장소 옵션:** 초대규모 이벤트 (일 10만+ 건) 예상 시 TimescaleDB, ClickHouse 등 시계열 DB 이관 검토 — **MVP 규모에서는 불필요**, Phase 3 검토
- **privacy-by-design:** payload에 PII 저장을 기본 금지하는 린트 규칙 고려 (예: `email`, `phone` 키 감지 시 경고)
- **이벤트 스키마 버전 관리:** `payload.schemaVersion: 'v1'` 필드를 관례적으로 포함하면 추후 구조 변경 시 호환성 관리 용이
