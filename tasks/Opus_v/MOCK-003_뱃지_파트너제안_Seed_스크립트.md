---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] MOCK-003: Prisma Seed 스크립트 — 뱃지 15건(활성/만료/철회) / 파트너 제안 10건"
labels: 'feature, backend, mock, seed, badge, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-003] Badge & Partnership 도메인 Seed 스크립트 (뱃지 15건 + 파트너 제안 10건)
- 목적: 제조사 인증 뱃지 시스템(F-04)과 파트너 제안 플로우(REQ-FUNC-030)의 **핵심 상태 다양성**(활성/만료/철회, pending/accepted/rejected/expired)을 제공하여, SI 검색 필터(FQ-003, REQ-FUNC-015 "미인증 SI 혼입률 0%"), 제조사 포털(UI-009), SI 파트너 포털(UI-013)이 다중 제조사 뱃지와 제안 라이프사이클을 독립 테스트할 수 있도록 한다. 특히 REQ-FUNC-017(Brand-Agnostic 3사 동시 뱃지) 및 REQ-FUNC-030(응답 기한 5영업일) 검증의 기반 데이터셋이다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.7 BADGE`](../06_SRS-v1.md) — 뱃지 테이블 스키마 (is_active, expires_at, revoked_at)
- SRS 문서: [`06_SRS-v1.md#6.2.12 PARTNER_PROPOSAL`](../06_SRS-v1.md) — 파트너 제안 (Class Diagram 참조)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-015`](../06_SRS-v1.md) — 뱃지 보유 SI 필터 (미인증 혼입률 0%)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-017`](../06_SRS-v1.md) — Brand-Agnostic 3사 동시 뱃지 구조
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-030`](../06_SRS-v1.md) — 파트너 제안 발송/응답 (5영업일)
- 태스크 리스트: [`07_TASK-LIST-v1.md#MOCK-003`](../TASKS/07_TASK-LIST-v1.md)
- 선행 태스크: `DB-008`, `DB-013`, `MOCK-001`
- 후행 활용: `UI-009`, `UI-013`, `UI-003`, `UI-004`, `FQ-001`, `FQ-003`, `FQ-006`

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Seed 파일 구조
- [ ] `prisma/seed/badges.ts` 작성 — MOCK-001의 `MANUFACTURER_IDS`, `SI_PARTNER_IDS` import
- [ ] `prisma/seed/partnerProposals.ts` 작성 — 동일 ID 참조
- [ ] Index 실행 순서 추가: `… → badges → partnerProposals`

### 2단계: 뱃지(BADGE) 15건 분포 설계 — 3 제조사 × 5 SI = 15 조합
- [ ] **제조사 A × SI 5개**: 5건 중 4건 활성(is_active=true, expires_at=now+180일), 1건 만료(is_active=false, expires_at=now-10일)
- [ ] **제조사 B × SI 5개**: 5건 중 3건 활성, 1건 철회(is_active=false, revoked_at=now-30일), 1건 만료 임박(expires_at=now+7일)
- [ ] **제조사 C × SI 5개**: 5건 중 5건 활성 (신규 제조사 시나리오)
- [ ] **REQ-FUNC-017 검증**: SI_PARTNER_IDS[0]은 3개 제조사 뱃지 동시 보유 → 프로필 상세(UI-004) 다중 뱃지 렌더링 검증
- [ ] `manufacturer_name`(비정규화 필드)는 MANUFACTURER 테이블 `company_name` 동기화
- [ ] `issued_at`은 최근 12개월 내 랜덤 분포, `expires_at = issued_at + 12개월` 기본값

### 3단계: 뱃지 상태 분포 집계 목표
- [ ] 활성 뱃지: 12건 (is_active=true, expires_at > now)
- [ ] 만료 뱃지: 2건 (is_active=false, expires_at < now, revoked_at IS NULL)
- [ ] 철회 뱃지: 1건 (is_active=false, revoked_at IS NOT NULL)
- [ ] **FQ-003 검증**: 뱃지 미보유 SI_PARTNER 5사 존재 확인 (20사 중 15사만 뱃지 보유)

### 4단계: 파트너 제안(PARTNER_PROPOSAL) 10건 생성
- [ ] **제조사 A**: 4건 — `pending` 2건 / `accepted` 1건 / `rejected` 1건
- [ ] **제조사 B**: 3건 — `pending` 1건 / `accepted` 1건 / `expired` 1건 (deadline < now, 미응답 상태)
- [ ] **제조사 C**: 3건 — `pending` 3건 (신규 진입 시나리오)
- [ ] `deadline` 필드: `pending`은 now + 3~5영업일, `accepted/rejected`는 과거 일자, `expired`는 now - 1일
- [ ] `accepted` 제안은 **자동 뱃지 발급 연계 규칙(REQ-FUNC-030)** 검증용 — 대응하는 BADGE 레코드 존재 여부 일치
- [ ] 같은 (manufacturer_id, si_partner_id) 조합에 중복 제안 생성 금지 (비즈니스 규칙)

### 5단계: 관계 무결성 및 Idempotency
- [ ] 뱃지 UNIQUE 제약: `(manufacturer_id, si_partner_id)` 조합에 활성 뱃지 1개 제한 (시스템 비즈니스 규칙) — Seed 단계에서도 준수
- [ ] Upsert 패턴 적용
- [ ] `BADGE_IDS`, `PARTNER_PROPOSAL_IDS` 상수 export

### 6단계: 검증 스크립트
- [ ] `prisma/seed/verify.ts`에 케이스 추가: 활성/만료/철회 카운트, Brand-Agnostic 다중 뱃지 SI 존재 확인, 제안 상태 분포

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 뱃지 15건 상태 분포**
- **Given:** MOCK-001 완료 상태가 주어짐
- **When:** MOCK-003 Seed를 실행함
- **Then:** BADGE 총 15건이 생성되며, is_active=true가 12건, is_active=false+revoked_at IS NULL이 2건, revoked_at IS NOT NULL이 1건임

**Scenario 2: Brand-Agnostic 다중 뱃지 SI 존재 (REQ-FUNC-017)**
- **Given:** Seed 실행 완료 상태가 주어짐
- **When:** `SELECT si_partner_id, COUNT(DISTINCT manufacturer_id) FROM badge WHERE is_active=true GROUP BY si_partner_id HAVING COUNT(DISTINCT manufacturer_id) >= 3`를 조회함
- **Then:** 최소 1명의 SI 파트너가 반환되며, 해당 SI가 3개 제조사 모두로부터 활성 뱃지를 보유함

**Scenario 3: 미인증 SI 혼입률 0% 필터 검증 (REQ-FUNC-015)**
- **Given:** FQ-003(뱃지 보유 SI 필터) Query가 구현된 상태가 주어짐
- **When:** 활성 뱃지 보유 SI 필터를 적용함
- **Then:** 반환된 SI 목록 중 뱃지 미보유 SI가 0명이며, 뱃지 미보유 SI 5명은 필터링되어 제외됨

**Scenario 4: 파트너 제안 상태 분포**
- **Given:** MOCK-003 Seed 실행 완료 상태가 주어짐
- **When:** `PARTNER_PROPOSAL.status`를 `GROUP BY`하여 집계함
- **Then:** `pending` 6건, `accepted` 2건, `rejected` 1건, `expired` 1건의 분포를 가짐

**Scenario 5: 수락 제안 ↔ 뱃지 발급 연계 (REQ-FUNC-030)**
- **Given:** `status = 'accepted'`인 PARTNER_PROPOSAL이 주어짐
- **When:** 해당 (manufacturer_id, si_partner_id) 조합으로 BADGE 테이블을 조회함
- **Then:** 활성 BADGE 레코드(is_active=true)가 1건 존재함

**Scenario 6: 만료 제안 케이스 (deadline 초과)**
- **Given:** `status = 'expired'`인 PARTNER_PROPOSAL이 주어짐
- **When:** `deadline` 필드를 조회함
- **Then:** `deadline < NOW()`이며, 응답 기록(accepted_at/rejected_at)이 NULL임

## :gear: Technical & Non-Functional Constraints

### 데이터 정합성
- `manufacturer_name`(비정규화 필드)은 MANUFACTURER.company_name과 반드시 일치 — Seed 검증 단계에서 동기화 확인
- 뱃지 UNIQUE 비즈니스 규칙: `(manufacturer_id, si_partner_id, is_active=true)` 중복 생성 금지
- 날짜 필드는 UTC 기준, 영업일 계산은 한국 공휴일 미고려 (MVP 단순화 — CRON 태스크에서 실제 영업일 계산)

### 비즈니스 규칙 Seed 단계 반영
- `accepted` 제안 발생 시 BADGE 자동 발급 로직(FC-019)은 **Command 로직의 책임**이며, Seed에서는 **결과 상태만 반영**
- 제안 중복 방지: 동일 (manufacturer_id, si_partner_id) 조합에 활성 제안 1건 제한

### 운영
- Seed 실행 시간 ≤ 2초
- `prisma.$transaction()`으로 BADGE와 PARTNER_PROPOSAL 원자적 삽입

## :checkered_flag: Definition of Done (DoD)
- [ ] Acceptance Criteria (Scenario 1~6)를 모두 충족하는가?
- [ ] 뱃지 15건 / 파트너 제안 10건 고정 UUID 매핑표가 `prisma/seed/README.md`에 문서화되었는가?
- [ ] Brand-Agnostic 다중 뱃지 SI 존재 검증이 verify.ts에 포함되었는가?
- [ ] FQ-003(뱃지 보유 SI 필터)이 본 Seed 데이터로 "미인증 SI 혼입률 0%" AC를 실제로 통과하는가?
- [ ] TypeScript 타입 에러 및 ESLint 경고가 0건인가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-008 | `BADGE` 테이블 스키마 | 필수 |
| DB-013 | `PARTNER_PROPOSAL` 테이블 스키마 | 필수 |
| MOCK-001 | 제조사/SI 파트너 Seed (FK 참조) | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| UI-003 | SI 검색 결과 목록 (뱃지 필터) |
| UI-004 | SI 프로필 상세 (다중 뱃지 렌더링) |
| UI-009 | 제조사 포털 (뱃지 발급/철회, 파트너 제안) |
| UI-013 | SI 파트너 포털 (제안 수락/거절, 뱃지 현황) |
| FQ-001 | SI 검색 Query |
| FQ-003 | 뱃지 보유 SI 필터 Query |
| FQ-006 | 제조사 대시보드 파트너 현황 Query |

### 참고사항
- `PARTNER_PROPOSAL` 테이블은 SRS ER Diagram에는 미포함이나 Class Diagram에서 명시적으로 정의됨(DB-013) — 스키마 확정 후 본 Seed 실행 가능
- `accepted` → BADGE 자동 발급 연계는 FC-019(Command 로직) 완료 이후 E2E 통합 테스트에서 재검증