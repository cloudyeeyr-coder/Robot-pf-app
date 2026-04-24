---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DB-017: AS_ENGINEER 테이블 스키마 및 마이그레이션 (이름, 지역, 역량, 가용 상태) — AS 배정 로직 기반"
labels: 'feature, backend, db, as, master-data, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [DB-017] `AS_ENGINEER` (로컬 AS 엔지니어) 테이블 스키마 및 마이그레이션 작성
- 목적: **F-02 긴급 AS 배정 로직(REQ-FUNC-007, SRS 6.3.5 시퀀스)의 매칭 대상 마스터 데이터**. SI 파트너 부도·폐업·연락두절 시 수요기업이 긴급 AS를 접수하면, 플랫폼은 **지역·역량 기반으로 가용 엔지니어를 4시간 이내 자동 매칭**한다. 본 테이블은 그 매칭의 후보 풀(pool)을 정의하며, AS_TICKET(DB-007)의 `assignedEngineerId`가 **본 테이블의 `id`를 참조**한다(DB-007에서 Nullable String FK로 선제 정의됨 — 본 태스크에서 Relation 연결 완성). `availability` ENUM으로 가용 상태를 관리하고, `capability_tags`로 엔지니어의 전문 분야(예: 용접 로봇, 협동 로봇)를 저장하여 매칭 정확도를 높인다. **SRS 6.2에 엔티티 정의가 없는 보완 엔티티** — 07_TASK-LIST-v1.md 참고 사항 및 SRS 6.3.5 "로컬 AS 엔지니어 매칭 (지역, 역량 기반)"에 근거한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-007`](../06_SRS-v1.md) — SI 부도·폐업·연락두절 시 로컬 AS 엔지니어 4시간 이내 자동 매칭, 24시간 이내 출동, 성공률 ≥ 95%
- SRS 문서: [`06_SRS-v1.md#6.3.5`](../06_SRS-v1.md) — "AS_TICKET INSERT 후 로컬 AS 엔지니어 매칭 (지역, 역량 기반)", 가용 엔지니어 부재 시 Ops Slack 알림
- SRS 문서: [`06_SRS-v1.md#CON-07`](../06_SRS-v1.md) — 로컬 AS 사업자가 24시간 SLA에 동의하고 계약 가능 (수도권 5개 산단 D-30일 목표)
- SRS 문서: [`06_SRS-v1.md#REQ-NF-024`](../06_SRS-v1.md) — 24시간 내 AS 출동 성공률 ≥ 95% (G-01 KPI)
- **SRS 보완 근거:** 07_TASK-LIST-v1.md 참고 사항 — "AS_ENGINEER (DB-017): AS 엔지니어 배정 로직(6.3.5)에서 요구됨"
- 태스크 리스트: [`07_TASK-LIST-v1.md#DB-017`](../TASKS/07_TASK-LIST-v1.md)
- 연동 DB: `DB-007` (AS_TICKET — `assignedEngineerId` FK 상대, 현재는 Nullable String, 본 태스크 완료 후 Relation 완성)
- 연동 API: `API-010` (assignEngineer Server Action — 지역·역량 기반 배정 규칙)
- 연동 로직: `FC-012` (AS 엔지니어 배정 Command)
- 연동 Mock: `MOCK-005` (AS 엔지니어 8명 시드)
- 선행 태스크: `DB-001` (Prisma ORM 초기 설정)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 가용 상태 ENUM 정의
- [ ] `EngineerAvailability` enum:
  ```prisma
  enum EngineerAvailability {
    available        // 배정 가능
    busy             // 다른 티켓 처리 중 (자동 전환 가능)
    off_duty         // 휴무/오프 (가용 0건 집계에서 제외)
    inactive         // 퇴사/계약 종료 (매칭 대상 제외, 이력 보존)
  }
  ```

### 2단계: Prisma 모델 정의 (`prisma/schema.prisma`)
- [ ] `AsEngineer` 모델:
  ```prisma
  model AsEngineer {
    id                  String                  @id @default(cuid())
    name                String                  @db.VarChar(100)
    phone               String                  @db.VarChar(20)
    email               String?                 @db.VarChar(255)
    region              String                  @db.VarChar(100)        // 주 활동 지역 (예: "서울", "경기남부")
    capabilityTags      Json?                                            // TEXT[] → Json (DB-009와 일관)
    availability        EngineerAvailability    @default(available)
    companyName         String?                 @db.VarChar(255)         // 소속 AS 업체명 (개인사업자 시 NULL 가능)
    createdAt           DateTime                @default(now())
    updatedAt           DateTime                @updatedAt

    // Reverse Relation: DB-007 AS_TICKET의 assignedEngineerId가 참조
    asTickets           AsTicket[]

    @@index([region, availability])                                      // FC-012 배정 핵심 쿼리: "이 지역의 available 엔지니어"
    @@index([availability])                                              // 전역 가용 엔지니어 집계
    @@index([companyName])                                               // 업체별 엔지니어 목록
    @@map("as_engineer")
  }
  ```
- [ ] **DB-007 Relation 완성:** `AsTicket.assignedEngineerId String?` 필드에 `@relation(fields: [assignedEngineerId], references: [id], onDelete: SetNull)` 추가 마이그레이션 필요:
  - 옵션 A (권장): 본 태스크에서 **DB-007 스키마에 Relation 필드 추가하는 별도 마이그레이션**(`pnpm prisma migrate dev --name link_as_engineer_to_ticket`)
  - 옵션 B: 본 태스크 완료 후 별도 Ad-hoc 마이그레이션
  - → **옵션 A 채택** — 본 태스크가 AS_ENGINEER 도입의 완결 책임

### 3단계: `capability_tags` 표준 사전 (DB-009와 일관)
- [ ] 엔지니어 역량 태그는 **DB-009 SI_PROFILE.capabilityTags와 태그 사전 공유** (매칭 정확도 극대화):
  - 예: `"collaborative-robot"`, `"welding"`, `"automotive"`, `"scara"`
  - `/docs/capability-tags-dictionary.md` (DB-009에서 시작된 문서) 공통 참조
- [ ] 태그 매칭 규칙:
  - FC-012: AS 티켓 증상 설명에서 태그 추출 (MVP에서는 Admin 수동 매칭) → 일치하는 capabilityTags 보유 엔지니어 우선 배정
  - Phase 2: LLM 기반 증상 → 태그 자동 분류 (Vercel AI SDK + Gemini)

### 4단계: 인덱스 전략
- [ ] `[region, availability]` — **FC-012 핵심 쿼리**: `WHERE region=? AND availability='available'`
- [ ] `availability` 단독 — Ops 대시보드 전역 가용 현황
- [ ] `companyName` — AS 업체별 엔지니어 집계
- [ ] `capabilityTags` JSONB GIN 인덱스는 **MVP 규모(엔지니어 10~50명)에서 불필요** — 순차 스캔으로 충분

### 5단계: Migration 파일 생성 및 검증
- [ ] Step 1: 본 태스크 신규 테이블 마이그레이션
  - `pnpm prisma migrate dev --name add_as_engineer` 실행
  - SQL 검토: `CREATE TYPE "EngineerAvailability" AS ENUM (...)`, 3개 인덱스 생성
- [ ] Step 2: DB-007과의 Relation 연결 마이그레이션
  - `pnpm prisma migrate dev --name link_as_engineer_to_ticket` 실행
  - 생성 SQL: `ALTER TABLE "as_ticket" ADD CONSTRAINT "as_ticket_assigned_engineer_id_fkey" FOREIGN KEY ("assigned_engineer_id") REFERENCES "as_engineer"("id") ON DELETE SET NULL ON UPDATE CASCADE;`
  - **주의:** 기존 `assigned_engineer_id` 값이 있는 레코드가 있다면 참조 무결성 체크 필수 (MVP 배포 전이므로 문제 없음)
- [ ] `pnpm prisma generate` → `AsEngineer`, `EngineerAvailability` 타입 export 검증

### 6단계: 배정 매칭 유틸 (`/lib/as-engineer/matcher.ts`)
- [ ] MVP 배정 로직 스켈레톤 (FC-012에서 본격 구현):
  ```ts
  export async function findBestEngineer(
    prisma: PrismaClient,
    criteria: { region: string; requiredTags?: string[] },
  ): Promise<AsEngineer | null> {
    // 1순위: 지역 일치 + 역량 태그 모두 포함 + available
    // 2순위: 지역 일치 + 역량 태그 일부 포함 + available
    // 3순위: 인근 지역 확장 + available
    // 반환: 매칭 성공 시 Engineer, 실패 시 null (FC-012가 null 시 Ops Slack 알림)
  }
  ```
- [ ] **매칭 실패 시나리오:** 가용 엔지니어 0명 → FC-012가 Ops Slack 알림 발송 (REQ-FUNC-007 요구), 수동 배정으로 fallback

### 7단계: TypeScript 타입 유틸 (`/lib/types/as-engineer.ts`)
- [ ] Prisma 타입 + 캐페빌리티 태그 타입 재사용:
  ```ts
  import type { AsEngineer as PrismaAsEngineer, EngineerAvailability } from '@prisma/client'
  import type { CapabilityTags } from '@/lib/types/si-profile'                      // DB-009 재사용

  export type AsEngineer = Omit<PrismaAsEngineer, 'capabilityTags'> & {
    capabilityTags: CapabilityTags | null
  }
  export type { EngineerAvailability }

  // Ops 대시보드용 DTO (개인정보 최소화)
  export type AsEngineerAdminView = Omit<AsEngineer, 'phone' | 'email'>

  // 매칭 결과용 DTO (AS 티켓에 노출되는 필드)
  export type AsEngineerAssigned = Pick<
    AsEngineer, 'id' | 'name' | 'phone' | 'companyName'
  >
  ```

### 8단계: 간이 Integration 검증 및 문서
- [ ] `scripts/verify-as-engineer-schema.ts` (PR 머지 전 제거):
  - AsEngineer INSERT (region='서울', capabilityTags=['welding', 'collaborative-robot'], availability='available') → 성공
  - AS_TICKET의 `assignedEngineerId`에 신규 엔지니어 ID 할당 UPDATE → 성공 (Relation 연결 검증)
  - 엔지니어 삭제 시도 → `onDelete: SetNull`로 AS_TICKET.assignedEngineerId=NULL 전환 확인
  - FC-012 쿼리 시뮬레이션: `WHERE region='서울' AND availability='available'` → `[region, availability]` 인덱스 활용 확인
- [ ] `/docs/erd.md` 반영 — AS_TICKET ↔ AS_ENGINEER Relation 표기
- [ ] `/docs/as-engineer-matching-policy.md` — 매칭 우선순위, 실패 시 Ops 알림 SOP
- [ ] DB-009의 `/docs/capability-tags-dictionary.md`에 엔지니어 전용 태그 섹션 추가

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: AS 엔지니어 정상 등록**
- **Given:** Admin이 AS 업체 담당자 정보 수집
- **When:** `prisma.asEngineer.create({ data: { name: '김기사', phone: '010-1111-2222', email: 'kim@as-co.kr', region: '서울', capabilityTags: ['collaborative-robot', 'welding'], availability: 'available', companyName: '수도권AS센터' } })`
- **Then:** 레코드 생성 성공, availability 기본값 `available` 적용.

**Scenario 2: FC-012 배정 매칭 쿼리 (지역 + 가용)**
- **Given:** 엔지니어 20명 시드 (지역/가용 분산), 서울 available 5명
- **When:** `prisma.asEngineer.findMany({ where: { region: '서울', availability: 'available' } })`
- **Then:** `[region, availability]` 인덱스 활용 p95 ≤ 100ms, 5명 반환.

**Scenario 3: DB-007 Relation 연결 — 엔지니어 배정**
- **Given:** AsTicket T1 (assignedEngineerId=null), AsEngineer E1 존재
- **When:** `prisma.asTicket.update({ where: { id: 'T1' }, data: { assignedEngineerId: 'E1', assignedAt: new Date() } })`
- **Then:** FK 참조 성공, `prisma.asTicket.findUnique({ include: { assignedEngineer: true } })`로 엔지니어 정보 조회 가능.

**Scenario 4: 엔지니어 삭제 시 SetNull 동작**
- **Given:** AsTicket T1의 assignedEngineerId=E1, 엔지니어 E1 퇴사
- **When:** `prisma.asEngineer.delete({ where: { id: 'E1' } })`
- **Then:** 삭제 성공, AsTicket T1.assignedEngineerId=NULL (이력 보존, assignedAt은 유지).

**Scenario 5: 역량 태그 매칭 로직 (MVP 순차 스캔)**
- **Given:** 엔지니어 10명 시드, `capabilityTags`에 `'welding'` 포함 엔지니어 3명
- **When:** 애플리케이션 레벨에서 `findMany()` 후 `capabilityTags.includes('welding')` 필터
- **Then:** 3명 반환, MVP 규모에서 성능 이슈 없음 (수십 명 순차 스캔 < 50ms).

**Scenario 6: 가용 상태 전환 (available → busy)**
- **Given:** Engineer E1 (availability='available')
- **When:** AS 티켓 배정 완료 시 `update({ where: { id: 'E1' }, data: { availability: 'busy' } })`
- **Then:** 전환 성공. (자동 전환 로직은 FC-012 책임 — 선택 사항)

**Scenario 7: 퇴사 처리 (inactive 전환)**
- **Given:** Engineer E1 퇴사
- **When:** `update({ data: { availability: 'inactive' } })` (물리 삭제 대신)
- **Then:** FC-012 매칭에서 제외, 기존 AS 티켓 이력은 보존.

**Scenario 8: Ops 대시보드 가용 현황 집계**
- **When:** `groupBy({ by: ['availability'], _count: true })`
- **Then:** availability 인덱스 활용 p95 ≤ 100ms, 상태별 엔지니어 수 반환.

**Scenario 9: capability_tags JSON 유연성**
- **Given:** `capabilityTags: ['welding', 'automotive', 'scara', '6-axis']`
- **When:** 저장 후 조회
- **Then:** Prisma Json 반환 → 애플리케이션에서 string[] 캐스팅.

**Scenario 10: 인덱스 검증**
- **When:** `\d as_engineer`
- **Then:** PK, COMPOSITE(region, availability), INDEX(availability), INDEX(company_name) 4개 이상 존재.

## :gear: Technical & Non-Functional Constraints

### 스키마 설계
- **SRS 보완 엔티티:** REQ-FUNC-007 배정 로직 구현에 필수
- **DB-007 Relation 완성:** 본 태스크가 `as_ticket.assigned_engineer_id` FK 제약 추가의 책임 범위
- **`availability` ENUM 4단계:** 이직/휴무/활동 중을 명확히 구분 — 배정 매칭 정확도 확보
- **`capabilityTags`:** DB-009와 동일 포맷(`Json`) — 태그 사전 공유로 매칭 정확도 향상

### 성능
- 배정 매칭 쿼리 p95 ≤ 100ms (REQ-FUNC-007 "4시간 이내 배정"에 대비 여유 충분)
- Ops 대시보드 가용 현황 p95 ≤ 200ms
- 예상 규모: **수도권 5개 산단 × 엔지니어 3~10명 = 15~50명** (CON-07 기준, MVP) — 현 인덱스 충분

### 안정성
- 엔지니어 삭제 시 SetNull로 AS 티켓 이력 보존 (감사 추적)
- `availability` 자동 전환(busy → available)은 별도 CRON 또는 FC-013 완료 시점에 처리 — 본 태스크는 스키마만

### 보안 (PII 보호)
- `phone`, `email`은 개인정보 — Admin/배정된 Buyer만 접근 가능 (RBAC)
- 로그 출력 시 마스킹 필수
- 퇴사 엔지니어 개인정보 파기 정책: `inactive` 전환 후 30일 보존 (REQ-NF-012 준용), 이후 익명화 (이름/연락처 NULL 처리, 이력은 `id`로만 유지)

### 비즈니스 정확성
- **CON-07 요건 충족:** MVP 런칭 전 수도권 5개 산단 × 엔지니어 3~10명 확보 필수
- **G-01 KPI (출동률 ≥ 95%):** 본 테이블의 가용 엔지니어 풀 크기가 직접적 영향
- **24시간 SLA 동의:** 엔지니어 등록 시 **계약 조건에 동의한 엔지니어만 입력** (SOP) — 스키마 레벨 표현 불필요, Admin 운영 문서화

### 유지보수성
- 엔지니어 풀 확장 시 DB 변경 없음 (데이터 INSERT만)
- Phase 2 확장:
  - 실시간 위치 추적 (`current_lat`, `current_lng`)
  - 엔지니어 평가/리뷰 (`EngineerReview` 서브 테이블)
  - 자격증/면허 관리 (`certifications` JSON)
  - 휴가/휴무 스케줄 별도 테이블

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 AC 충족?
- [ ] `EngineerAvailability` ENUM + `AsEngineer` 모델 정의?
- [ ] **DB-007과의 Relation 연결 마이그레이션 완료** (`as_ticket.assigned_engineer_id` FK 제약 추가)?
- [ ] FK `onDelete: SetNull` 적용?
- [ ] 3개 이상 인덱스 (특히 `[region, availability]`) 생성?
- [ ] `@prisma/client` 재생성 및 `AsEngineer`, `EngineerAvailability` 타입 export?
- [ ] 양쪽 환경 마이그레이션 성공?
- [ ] `/lib/types/as-engineer.ts` DTO 정의 (capabilityTags 타입은 DB-009 재사용)?
- [ ] `/lib/as-engineer/matcher.ts` 배정 유틸 스켈레톤?
- [ ] `/docs/as-engineer-matching-policy.md` 매칭 정책 문서?
- [ ] `/docs/capability-tags-dictionary.md`에 엔지니어 태그 추가?
- [ ] FC-012 담당자에게 매칭 실패 시 Ops Slack 알림 필수 가이드 공유?
- [ ] ESLint / TS 경고 0건, 임시 스크립트 제거?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-001 | Prisma ORM 초기 설정 | 필수 |
| DB-007 | `AS_TICKET` 테이블 — `assignedEngineerId` Nullable FK 사전 정의됨 | 필수 (Relation 완성을 본 태스크에서 수행) |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| MOCK-005 | Prisma Seed — AS 엔지니어 8명 (지역/역량 분산) |
| API-010 | `assignEngineer` Server Action DTO (지역·역량 기반 배정 규칙) |
| FC-012 | AS 엔지니어 배정 Command (매칭 실패 시 Ops Slack 알림) |
| FQ-010 | Admin/Ops 대시보드 — AS SLA 모니터링 (엔지니어 가용 현황 포함) |
| UI-008 | Admin 대시보드 — AS 엔지니어 관리 섹션 |

### 참고사항
- **DB-007과의 선후행 관계 해결:** DB-007에서 `assignedEngineerId`를 Nullable String으로 선제 정의 → 본 태스크에서 Relation 완성. 이 패턴은 **"순환 의존성 없이 FK 확장을 점진적으로 추가"** 하는 표준 기법 (DB-009 SI_PROFILE의 태그 매칭과 동일 철학)
- **태그 사전 공유:** DB-009와 `capabilityTags` 포맷/사전 공유 — 매칭 품질의 핵심. `/docs/capability-tags-dictionary.md`에 양쪽 엔티티의 태그를 통합 관리하되, **엔지니어-전용**(예: `'on-call-24h'`, `'night-shift'`)과 **SI-전용**(예: `'system-design'`) 태그를 섹션 분리 권장
- **MVP 규모 현실성:** CON-07 "수도권 5개 산단 D-30일" 목표 — 15~50명 규모에서 배정 알고리즘은 단순 SQL + 애플리케이션 필터로 충분. 정교한 매칭 엔진(가중치, ML)은 Phase 2
- **배정 자동화 수준:**
  - MVP: 쿼리 기반 단순 매칭 + 후보 여러 명이면 Admin 수동 선택 (UI-008)
  - Phase 2: 응답 시간, 과거 SLA 충족률 등을 고려한 자동 선택
- **외주 엔지니어 관리 이슈:** `companyName NULLABLE` 이유 — 개인사업자 엔지니어도 수용. 정규화(`AS_COMPANY` 테이블)는 Phase 2에서 데이터량 증가 후 검토
