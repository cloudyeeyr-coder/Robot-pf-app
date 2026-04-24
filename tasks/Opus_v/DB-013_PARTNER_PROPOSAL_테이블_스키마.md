---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DB-013: PARTNER_PROPOSAL 테이블 스키마 및 마이그레이션 (status ENUM 4종, deadline) — SRS ER Diagram 보완"
labels: 'feature, backend, db, partnership, badge, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [DB-013] `PARTNER_PROPOSAL` (제조사-SI 파트너 제안) 테이블 스키마 및 마이그레이션 작성
- 목적: **F-04 제조사 인증 뱃지 시스템의 워크플로우 엔티티**. 제조사(Manufacturer)가 특정 SI(SiPartner)에게 파트너십 제안을 발송하고, SI의 수락/거절/만료를 관리한다(REQ-FUNC-030). **SI 수락 시 Badge가 자동 발급**되는 트리거 관계(DB-008과 연계)이자, **5영업일 응답 기한(deadline) 미준수 시 D+3 리마인더 + D+5 만료 처리**(REQ-FUNC-032, CRON-004/005)의 스캔 대상 테이블이다. **SRS 6.2.12 ER Diagram에는 누락되었으나 6.2.13 Class Diagram 및 6.3.2 시퀀스에서 명확히 식별**된 엔티티 — 본 태스크로 스키마를 보완한다(07_TASK-LIST-v1.md 참고 사항 명시).

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.13 Class Diagram (PartnerProposal)`](../06_SRS-v1.md) — 7개 속성 + 5개 메서드 정의 (엔티티 스펙 원천)
- SRS 문서: [`06_SRS-v1.md#6.3.2`](../06_SRS-v1.md) — 파트너 제안 시퀀스 다이어그램 (`PROPOSAL INSERT (status=pending, deadline=D+5)`, `BADGE INSERT on accept`)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-030`](../06_SRS-v1.md) — 파트너 제안 발송 ≤ 3초, SI 응답 기한 ≤ 5영업일, 미응답 시 자동 리마인더
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-031`](../06_SRS-v1.md) — 파트너십 체결 시 '공식 인증 파트너' 뱃지 자동 노출 (≤ 1시간)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-032`](../06_SRS-v1.md) — D+3 리마인더 1회, D+5 만료 + 대안 SI 3개사 자동 추천
- SRS 문서: [`06_SRS-v1.md#3.4.4`](../06_SRS-v1.md) — 제조사 인증 뱃지 발급·관리 흐름 (개요)
- **SRS 보완 근거:** 07_TASK-LIST-v1.md 참고 사항 — "ER Diagram에는 미포함이나, Class Diagram 및 시퀀스 다이어그램(6.3.2)에서 명확히 식별됨"
- 태스크 리스트: [`07_TASK-LIST-v1.md#DB-013`](../TASKS/07_TASK-LIST-v1.md)
- 연동 API: `API-018` (sendPartnerProposal), `API-019` (respondProposal — 수락 시 Badge 자동 발급)
- 연동 DB: `DB-003` (SI_PARTNER), `DB-004` (MANUFACTURER), `DB-008` (BADGE — 수락 시 INSERT 트리거)
- 연동 Cron: `CRON-004` (D+3 리마인더), `CRON-005` (D+5 만료 + 대안 SI 추천)
- 선행 태스크: `DB-003` (SI_PARTNER), `DB-004` (MANUFACTURER)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 상태 ENUM 정의
- [ ] `PartnerProposalStatus` enum 정의 (4단계, SRS Class Diagram 준수):
  ```prisma
  enum PartnerProposalStatus {
    pending      // 제안 발송 완료, SI 응답 대기
    accepted     // SI 수락 → Badge 자동 발급 트리거됨
    rejected     // SI 거절 (사유 별도 저장 없음, Phase 2 검토)
    expired      // D+5 미응답 → CRON-005에 의해 자동 만료
  }
  ```
- [ ] 상태 전이 규칙 (`/docs/partner-proposal-state-machine.md`):
  ```
  (new)       → pending      (제조사 발송 시 초기 상태)
  pending     → accepted     (SI 수락, API-019 — Badge 자동 발급 트랜잭션)
  pending     → rejected     (SI 거절, API-019)
  pending     → expired      (CRON-005 D+5 자동 만료)
  accepted/rejected/expired   (모두 Terminal — 역전이 금지)
  ```

### 2단계: Prisma 모델 정의 (`prisma/schema.prisma`)
- [ ] `PartnerProposal` 모델 정의 (SRS Class Diagram 7개 속성 반영):
  ```prisma
  model PartnerProposal {
    id                String                  @id @default(cuid())
    manufacturerId    String
    siPartnerId       String
    status            PartnerProposalStatus   @default(pending)
    deadline          DateTime                @db.Date              // D+5 응업일 기한
    respondedAt       DateTime?                                     // 수락/거절 시각 (SRS Class Diagram에는 없으나 실무상 필수)
    reminderSentAt    DateTime?                                     // D+3 리마인더 발송 시각 (CRON-004 중복 발송 방지)
    createdAt         DateTime                @default(now())
    updatedAt         DateTime                @updatedAt

    // FK Relations
    manufacturer      Manufacturer            @relation(fields: [manufacturerId], references: [id], onDelete: Restrict)
    siPartner         SiPartner               @relation(fields: [siPartnerId], references: [id], onDelete: Restrict)

    @@index([status, deadline])                                     // CRON-004, CRON-005 핵심 쿼리
    @@index([manufacturerId, status])                               // 제조사 대시보드 (FQ-006)
    @@index([siPartnerId, status])                                  // SI 포털 (내 제안 목록)
    @@map("partner_proposal")
  }
  ```
- [ ] **SRS Class Diagram에 없지만 추가한 필드:**
  - `respondedAt` — 수락/거절 시각 기록 (감사 추적, UX 표시)
  - `reminderSentAt` — CRON-004 리마인더 중복 발송 방지 플래그
  - `updatedAt` — 상태 변경 이력 추적 (관례)
  - → 이 확장은 **비즈니스 요구사항(REQ-FUNC-032 "D+3 리마인더 1회") 충족을 위해 불가피**

### 3단계: 중복 제안 방지 정책 결정
- [ ] **UNIQUE 제약 검토:**
  - 옵션 A: `@@unique([manufacturerId, siPartnerId, status])` (부분 UNIQUE 불가, PostgreSQL partial index로는 가능)
  - 옵션 B (채택): UNIQUE 미도입 + **application-level 검증** (FC-018에서 "동일 제조사→SI 활성 제안 존재 여부" 조회)
  - → 옵션 B 이유: 거절 후 재제안 시나리오가 자연스럽고, partial unique는 Prisma 네이티브 지원이 약함

### 4단계: 인덱스 전략
- [ ] `[status, deadline]` — **CRON-004/005 핵심 쿼리**:
  - CRON-004: `WHERE status='pending' AND deadline BETWEEN NOW()+2d AND NOW()+3d AND reminder_sent_at IS NULL`
  - CRON-005: `WHERE status='pending' AND deadline < NOW()`
- [ ] `[manufacturerId, status]` — 제조사별 제안 현황 (FQ-006)
- [ ] `[siPartnerId, status]` — SI 포털 "내 제안함"

### 5단계: Migration 및 유틸리티
- [ ] `pnpm prisma migrate dev --name add_partner_proposal` 실행, SQL 검토:
  - `CREATE TYPE "PartnerProposalStatus" AS ENUM ('pending', 'accepted', 'rejected', 'expired');`
  - `deadline DATE NOT NULL`
  - `responded_at TIMESTAMP NULL`, `reminder_sent_at TIMESTAMP NULL`
  - FK `ON DELETE RESTRICT` 양쪽
  - 3개 복합 인덱스 생성 확인
- [ ] 상태 전이 유틸리티 `/lib/partner-proposal/state-machine.ts`
- [ ] **5영업일 deadline 계산 유틸** `/lib/partner-proposal/deadline-calculator.ts`:
  ```ts
  // DB-005 CONTRACT의 inspection-deadline 계산 유틸과 **일관성 유지** (동일 영업일 계산 로직 공유 권장)
  export const RESPONSE_DEADLINE_BUSINESS_DAYS = 5
  export const REMINDER_DAY = 3

  export function calculateProposalDeadline(createdAt: Date): Date { /* 주말 제외 D+5 */ }
  export function isReminderDue(proposal: Pick<PartnerProposal, 'createdAt' | 'reminderSentAt' | 'status'>, now: Date = new Date()): boolean { /* D+3 이후 && 미발송 && pending */ }
  export function isExpirationDue(proposal: Pick<PartnerProposal, 'deadline' | 'status'>, now: Date = new Date()): boolean { /* deadline < now && pending */ }
  ```
- [ ] **영업일 계산 로직 중복 방지:** DB-005에서 만든 `/lib/contract/inspection-deadline.ts`와 **공통 영업일 유틸로 추출 검토** — `/lib/common/business-days.ts`

### 6단계: TypeScript 타입 + Badge 자동 발급 연계 주석
- [ ] Prisma 타입 re-export + 도메인 타입:
  ```ts
  import type { PartnerProposal as PrismaPartnerProposal, PartnerProposalStatus } from '@prisma/client'
  export type PartnerProposal = PrismaPartnerProposal
  export type { PartnerProposalStatus }
  ```
- [ ] **FC-019 구현 시 주의사항 문서화:** `pending → accepted` 전이와 Badge INSERT는 **반드시 동일 트랜잭션(`prisma.$transaction`)** 으로 처리 — 원자성 보장

### 7단계: 간이 Integration 검증 및 문서
- [ ] `scripts/verify-partner-proposal-schema.ts` (PR 머지 전 제거):
  - 정상 INSERT (status=pending, deadline=+5BD) → 성공
  - 동일 (M, S) 쌍 중복 INSERT → 스키마 허용 but FC-018 차단 주석 명시
  - 수락 전이 시뮬레이션 (pending → accepted, respondedAt 기록)
  - CRON-005 쿼리 시뮬레이션: `WHERE status='pending' AND deadline < NOW()` → `[status, deadline]` 인덱스 활용 확인
- [ ] `/docs/erd.md` 및 `/docs/partner-proposal-state-machine.md` 반영
- [ ] `/docs/business-days-policy.md` (DB-005와 공통) — 영업일 계산 정책 일원화

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 제조사의 정상적인 파트너 제안 발송**
- **Given:** Manufacturer M1, SiPartner S1 레코드 존재
- **When:** `prisma.partnerProposal.create({ data: { manufacturerId: 'M1', siPartnerId: 'S1', deadline: calculateProposalDeadline(now) } })`
- **Then:** status 기본값 `pending`, respondedAt/reminderSentAt NULL, 생성 성공.

**Scenario 2: SI 수락 + Badge 자동 발급 (트랜잭션)**
- **Given:** PartnerProposal (status=pending)
- **When:** FC-019가 `prisma.$transaction([update proposal, insert badge])` 실행
- **Then:** proposal.status=accepted + respondedAt 기록, Badge INSERT 성공 (원자적). 실패 시 양쪽 롤백.

**Scenario 3: SI 거절**
- **Given:** PartnerProposal (status=pending)
- **When:** `status: 'rejected', respondedAt: now` UPDATE
- **Then:** Badge 발급 없음, 상태만 전이.

**Scenario 4: CRON-004 D+3 리마인더 감지 쿼리**
- **Given:** 제안 100건, 그 중 10건이 `createdAt + 3d` 경과 + `reminderSentAt=null` + `status=pending`
- **When:** `prisma.partnerProposal.findMany({ where: { status: 'pending', reminderSentAt: null, createdAt: { lte: now - 3d } } })`
- **Then:** 10건 조회, p95 ≤ 200ms. 발송 후 `reminderSentAt=now` UPDATE로 중복 발송 방지.

**Scenario 5: CRON-005 D+5 만료 전환**
- **Given:** 제안 50건 중 5건이 deadline < now + status=pending
- **When:** CRON-005가 `updateMany({ where: { status: 'pending', deadline: { lt: now } }, data: { status: 'expired' } })`
- **Then:** 5건이 expired로 일괄 전환. `[status, deadline]` 인덱스 활용 p95 ≤ 200ms.

**Scenario 6: FK 제약 — 존재하지 않는 Manufacturer/SiPartner 거부**
- **When:** 유효하지 않은 manufacturerId로 INSERT
- **Then:** `P2003` FK violation.

**Scenario 7: Manufacturer 삭제 Restrict 차단**
- **Given:** M1이 발송한 proposal 존재
- **When:** Manufacturer M1 삭제 시도
- **Then:** `P2003` Restrict 차단 (제안 이력 보존).

**Scenario 8: 상태 전이 — Terminal 상태 역전이 차단**
- **Given:** PartnerProposal (status=expired)
- **When:** `state-machine.ts`의 `assertTransition('expired', 'pending')`
- **Then:** Error throw (스키마는 허용하나 application이 차단).

**Scenario 9: 거절 후 재제안 허용 (UNIQUE 미도입 효과)**
- **Given:** (M1, S1) 조합으로 `status=rejected` proposal 1건 존재
- **When:** 동일 (M1, S1) 조합으로 신규 pending proposal INSERT
- **Then:** 성공 — UNIQUE 제약 없음 덕분에 재제안 자연스럽게 지원.

**Scenario 10: 인덱스 검증**
- **When:** `\d partner_proposal`
- **Then:** PK, COMPOSITE(status, deadline), COMPOSITE(manufacturer_id, status), COMPOSITE(si_partner_id, status) 4개 이상.

## :gear: Technical & Non-Functional Constraints

### 스키마 설계
- **SRS 보완 엔티티:** ER Diagram 누락에 대한 보완 근거를 Summary/References에 명시
- **확장 필드(SRS Class Diagram 미포함):** `respondedAt`, `reminderSentAt`, `updatedAt` — 운영 요건(CRON-004 중복 방지, 감사 추적) 충족을 위해 불가피
- **UNIQUE 제약 미도입:** 거절 후 재제안 시나리오 지원, 중복 활성 제안은 FC-018에서 application-level 차단
- **영업일 정책:** MVP에서는 주말만 제외, 공휴일 반영은 Phase 2 (DB-005와 일관)

### 성능
- CRON-004/005 배치 쿼리 p95 ≤ 200ms (복합 인덱스)
- FQ-006 제조사 대시보드 p95 ≤ 500ms
- 예상 규모: 제조사 3사 × SI 120사 × 연 2회 = **연 720건 이내** — 현 인덱스 충분

### 안정성
- **SI 수락 시 Badge 발급은 반드시 트랜잭션** (FC-019 필수 준수)
- 상태 역전이는 state-machine 유틸에서 차단
- CRON-004 중복 발송 방지는 `reminderSentAt` NULL 체크로 강제

### 보안
- 제안 정보는 **제조사, SI, Admin만 열람 가능** — RBAC 제어 (API-018/019)
- 거절 사유는 MVP에 없음 — Phase 2에서 `rejection_reason TEXT` 추가 검토

### 비즈니스 정확성
- **D+5 계산:** 주말 제외 5영업일. `calculateProposalDeadline` 유틸로 일원화
- **REQ-FUNC-032 "대안 SI 3개사 자동 추천":** 본 스키마는 저장소 역할만, 추천 로직은 CRON-005 + FQ-001 조합
- **Badge 자동 발급 타임 요건 (≤ 1시간, REQ-FUNC-031):** FC-019 트랜잭션에서 즉시 처리 — MVP는 목표 대비 여유롭게 달성

### 유지보수성
- 공통 영업일 계산 유틸 추출 (`/lib/common/business-days.ts`) — DB-005 연계
- 거절 사유, 재제안 이력 연결 등 확장 여지

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 AC 충족?
- [ ] Class Diagram 기반 5개 핵심 필드 + 운영 필드(`respondedAt`, `reminderSentAt`, `updatedAt`) 정의?
- [ ] FK 2개 `onDelete: Restrict`?
- [ ] 3개 복합 인덱스(`[status, deadline]`, `[manufacturerId, status]`, `[siPartnerId, status]`) 생성?
- [ ] `@prisma/client` 재생성 및 타입 export?
- [ ] 양쪽 환경 마이그레이션 성공?
- [ ] `/lib/partner-proposal/state-machine.ts`, `/lib/partner-proposal/deadline-calculator.ts` 구현 및 테스트?
- [ ] `/lib/common/business-days.ts` 공통 유틸 추출 또는 DB-005와 일원화 방침 결정?
- [ ] `/docs/partner-proposal-state-machine.md`, `/docs/business-days-policy.md`?
- [ ] ESLint / TS 경고 0건, 임시 스크립트 제거?
- [ ] FC-019 구현 담당자에게 "Badge 발급 트랜잭션 필수" 가이드 공유?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-003 | `SI_PARTNER` | 필수 |
| DB-004 | `MANUFACTURER` | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| MOCK-003 | Prisma Seed — 파트너 제안 10건 |
| API-018 | `sendPartnerProposal` Server Action DTO (응답 기한 5영업일 규칙) |
| API-019 | `respondProposal` — 수락 시 Badge 자동 발급 연계 규칙 |
| FC-018 | 파트너 제안 발송 Command |
| FC-019 | 파트너 제안 수락/거절 Command (Badge 자동 발급 트랜잭션) |
| CRON-004 | D+3 리마인더 |
| CRON-005 | D+5 만료 + 대안 SI 3개사 추천 |
| UI-009 | 제조사 포털 — 제안 발송 UI |
| UI-013 | SI 포털 — 제안 수락/거절 UI |

### 참고사항
- **SRS 보완 선언:** 07_TASK-LIST-v1.md 참고 사항에 "ER Diagram에는 미포함이나, Class Diagram 및 시퀀스 다이어그램(6.3.2)에서 명확히 식별됨"으로 명기되어 있으므로, 본 태스크는 **정당한 SRS 보완 작업**으로 간주. PR 설명에 이 사실 명시 권장
- **Badge-PartnerProposal 순환 의존성 주의:** FC-019 `accepted` 전이와 Badge INSERT는 반드시 동일 트랜잭션. 둘 중 하나라도 실패 시 전체 롤백 — 로그에 트랜잭션 ID 기록 권장
- **영업일 계산 일원화:** DB-005 inspection-deadline(7영업일)과 본 태스크 proposal-deadline(5영업일)은 **동일한 영업일 계산 로직**을 써야 일관성 확보. `/lib/common/business-days.ts`로 공통 유틸 추출 권장 — 리팩터링 시점은 DB-005 또는 본 태스크 먼저 착수하는 쪽에서 결정
- **Phase 2 확장:** 거절 사유, 재제안 히스토리 체이닝(`previousProposalId` self-FK), 제안서 첨부 파일
