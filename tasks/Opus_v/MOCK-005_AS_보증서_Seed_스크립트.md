---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] MOCK-005: Prisma Seed 스크립트 — AS 티켓 10건 / 보증서 5건 / AS 엔지니어 8명"
labels: 'feature, backend, mock, seed, as, warranty, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-005] AS & Warranty 도메인 Seed 스크립트 (AS 티켓 10 + 보증서 5 + AS 엔지니어 8)
- 목적: 긴급 AS 접수(UI-007), AS SLA 모니터링(FQ-010, FQ-005), 보증서 발급·조회 흐름의 독립 개발을 지원한다. REQ-FUNC-007(AS 접수 즉시 처리), REQ-FUNC-008(SLA 24시간 충족 판정) 검증을 위해 **4단계 타임스탬프(reported_at → assigned_at → dispatched_at → resolved_at) 전체 커버리지**와 SLA 충족/미충족 혼합 분포를 제공한다. 본 Seed는 MOCK-002의 계약/에스크로 데이터 위에 구축된다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.6 AS_TICKET`](../06_SRS-v1.md) — AS 티켓 스키마 (priority, 4단계 timestamp, sla_met)
- SRS 문서: [`06_SRS-v1.md#6.2.10 WARRANTY`](../06_SRS-v1.md) — AS 보증서 스키마 (FK→CONTRACT, FK→ESCROW_TX)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-007`](../06_SRS-v1.md) — 긴급 AS 접수 및 배정
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-008`](../06_SRS-v1.md) — SLA 24시간 판정
- 태스크 리스트: [`07_TASK-LIST-v1.md#MOCK-005`](../TASKS/07_TASK-LIST-v1.md)
- 선행 태스크: `DB-007`, `DB-011`, `DB-017`, `MOCK-002`
- 후행 활용: `UI-007`, `UI-008`, `FQ-005`, `FQ-010`

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: AS 엔지니어(AS_ENGINEER) 8명 생성
- [ ] `prisma/seed/asEngineers.ts` 작성 — 선행 테이블(DB-017)
- [ ] **지역 분포**: 서울 3명, 경기 2명, 부산 1명, 대구 1명, 인천 1명 (수도권 75% 집중)
- [ ] **역량(specialty) 분포**: `collaborative_robot` 4명, `mobile_robot` 2명, `scara` 1명, `agv` 1명
- [ ] **가용 상태(is_available)**: 7명 true / 1명 false(휴가 시나리오)
- [ ] 고정 UUID — `AS_ENGINEER_IDS` 상수 export

### 2단계: AS 티켓(AS_TICKET) 10건 단계별 분포
- [ ] **티켓 1 (접수만)**: reported_at = now - 30분, 이후 모든 timestamp NULL, `assigned_engineer_id = NULL`, `sla_met = NULL` (미판정)
- [ ] **티켓 2 (배정 완료)**: reported_at → assigned_at 경과, dispatched_at NULL
- [ ] **티켓 3 (출동 중)**: assigned_at → dispatched_at 경과, resolved_at NULL
- [ ] **티켓 4 (SLA 충족 해결)**: 4단계 모두 완료, `resolved_at - reported_at ≤ 24h`, `sla_met = true`
- [ ] **티켓 5 (SLA 미충족 해결)**: 4단계 모두 완료, `resolved_at - reported_at = 36h`, `sla_met = false`
- [ ] **티켓 6~8 (정상 해결, urgent 우선순위)**: priority = 'urgent', 모두 SLA 충족
- [ ] **티켓 9 (미배정 경보)**: reported_at = now - 2h, 배정 미완료 — FQ-010 "AS 미배정 건" 모니터링 검증
- [ ] **티켓 10 (normal 우선순위, 장기 케이스)**: priority = 'normal', resolved_at = reported_at + 5일 (정상 우선순위 SLA 별도 규칙)
- [ ] `contract_id`는 MOCK-002의 `status IN ('completed', 'release_pending')` 계약에 매핑 (A/S는 시공 완료 후 발생이 논리적)

### 3단계: AS 티켓 우선순위 및 증상 설명
- [ ] **priority 분포**: urgent 4건 (생산 중단 시나리오), normal 6건
- [ ] **symptom_description**: 현실적인 산업 증상 문구 (예: "협동로봇 End-Effector 위치 오차 발생, 공정 중단 1일차", "AGV 경로 인식 오류, 충돌 위험")
- [ ] 개인정보/실업체명 포함 금지

### 4단계: 보증서(WARRANTY) 5건 생성
- [ ] MOCK-002의 `status = 'completed'` 또는 `release_pending` 계약 5건에 매핑
- [ ] `escrow_tx_id`는 대응 계약의 에스크로 TX (UNIQUE 1:1 관계 준수)
- [ ] **보증 기간(coverage_period_months) 분포**: 12개월 3건, 24개월 1건, 36개월 1건 (계약 금액별 차등)
- [ ] `as_company_name`: "테스트AS-수도권", "테스트AS-영남권" 등 지역별 가상 법인명
- [ ] `as_contact_phone`: `02-XXXX-XXXX` 또는 `051-XXXX-XXXX` 포맷
- [ ] `coverage_scope`: "로봇 본체 및 End-Effector 하드웨어 결함, 소프트웨어 펌웨어 업데이트 포함" 등 현실적 문구
- [ ] `pdf_url`: NULL 또는 placeholder URL (예: `https://storage.example.com/warranty/{id}.pdf`)

### 5단계: SLA 판정 로직 정합성 검증
- [ ] `sla_met` 자동 계산 로직과 Seed 데이터 일치: `resolved_at IS NOT NULL AND (resolved_at - reported_at) <= 24h` → `sla_met = true`
- [ ] priority별 SLA 기준 차등 적용 여부 확인 (현재 스키마는 단일 기준이나, API-011 구현 시 이중화 가능성 대비 주석)

### 6단계: Idempotency 및 검증
- [ ] Upsert 패턴 적용
- [ ] `AS_TICKET_IDS`, `WARRANTY_IDS` 상수 export
- [ ] verify.ts에 단계별 분포·SLA 충족률·미배정 건수 검증 추가

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: AS 티켓 4단계 커버리지**
- **Given:** MOCK-002 완료 상태가 주어짐
- **When:** MOCK-005 Seed를 실행함
- **Then:** AS_TICKET 10건 중 (접수만 1 / 배정 완료 1 / 출동 중 1 / 해결 완료 7)의 단계 분포가 존재함

**Scenario 2: SLA 충족/미충족 혼합 분포**
- **Given:** Seed 실행 완료 상태가 주어짐
- **When:** `sla_met` 필드를 집계함
- **Then:** `true` 7건 이상, `false` 1건 이상, `NULL`(미해결) 2~3건의 분포가 확인됨

**Scenario 3: FQ-010 미배정 모니터링 대상 탐지**
- **Given:** `reported_at < now - 1h AND assigned_at IS NULL` 쿼리가 주어짐
- **When:** FQ-010 Admin 모니터링 Query를 실행함
- **Then:** 최소 1건의 미배정 티켓(티켓 9)이 반환됨

**Scenario 4: 긴급도 분포 및 SLA 상관관계**
- **Given:** `priority = 'urgent'`인 티켓이 주어짐
- **When:** 해당 티켓들의 `sla_met` 분포를 조회함
- **Then:** urgent 티켓 중 최소 1건은 `sla_met = false`(최악 시나리오 재현)를 포함함

**Scenario 5: 보증서 1:1 관계 무결성**
- **Given:** WARRANTY 5건이 생성된 상태가 주어짐
- **When:** `GROUP BY contract_id, escrow_tx_id HAVING COUNT(*) > 1`을 조회함
- **Then:** 중복 레코드가 0건이며, 모든 `escrow_tx_id`가 UNIQUE임

**Scenario 6: 보증 기간 분포 다양성**
- **Given:** WARRANTY 레코드 5건이 주어짐
- **When:** `coverage_period_months`를 조회함
- **Then:** 최소 2종 이상의 보증 기간(12/24/36)이 존재함

## :gear: Technical & Non-Functional Constraints

### 데이터 정합성
- AS 엔지니어의 `specialty` 지역과 배정된 티켓의 지역은 가능한 한 일치 (API-010 배정 규칙 검증 편의성)
- `reported_at < assigned_at < dispatched_at < resolved_at` 시간 순서 엄격히 준수
- Seed `sla_met` 값은 타임스탬프 계산 결과와 항상 일치

### 비즈니스 규칙
- 보증서는 계약의 `status`가 `completed` 또는 `release_pending`일 때만 발급 가능 — Seed 단계에서도 준수
- `coverage_period_months` 기본값 12개월, 특정 케이스만 연장

### 보안
- 엔지니어 개인정보는 가상 데이터(`김AS-01`, `이엔지니어-02` 등 코드명) 사용
- AS 업체 연락처는 테스트 전용 대표번호(`02-0000-0000` 등) 권장

## :checkered_flag: Definition of Done (DoD)
- [ ] Acceptance Criteria (Scenario 1~6)를 모두 충족하는가?
- [ ] AS 티켓 단계별 매핑표와 SLA 분포가 `prisma/seed/README.md`에 문서화되었는가?
- [ ] FQ-005(SLA 충족 여부 조회)와 FQ-010(AS SLA 모니터링)이 본 Seed 데이터로 정상 동작하는가?
- [ ] `sla_met` 자동 계산 로직과 Seed 데이터 일치 검증이 verify.ts에 포함되었는가?
- [ ] TypeScript 타입 에러 및 ESLint 경고가 0건인가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-007 | `AS_TICKET` 테이블 스키마 (priority ENUM, 4단계 timestamp, sla_met) | 필수 |
| DB-011 | `WARRANTY` 테이블 스키마 (FK→CONTRACT, FK→ESCROW_TX) | 필수 |
| DB-017 | `AS_ENGINEER` 테이블 스키마 | 필수 |
| MOCK-002 | 계약·에스크로 Seed (FK 참조) | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| UI-007 | 긴급 AS 접수 UI |
| UI-008 | Admin 대시보드 (AS SLA 모니터링 섹션) |
| FQ-005 | SLA 충족 여부 조회 Query |
| FQ-010 | Admin AS SLA 모니터링 Query |

### 참고사항
- `AS_ENGINEER` 테이블은 SRS에 명시적 스키마가 없고 DB-017(보완 스키마)에서 신규 정의됨 — DB-017 확정 후 본 Seed 실행 가능
- Phase 2에서 O2O 방문 매니저와 AS 엔지니어 통합 관리 검토 필요 시, 본 Seed 구조 재활용 가능