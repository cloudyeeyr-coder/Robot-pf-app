---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] MOCK-006: Prisma Seed 스크립트 — 로봇 모델 마스터 10건 / 견적 리드 5건"
labels: 'feature, backend, mock, seed, raas, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-006] RaaS & Quote 도메인 Seed 스크립트 (로봇 모델 10건 + 견적 리드 5건)
- 목적: RaaS 비용 비교 계산기(UI-010, FC-020)와 수기 견적 요청(UI-011) 플로우의 독립 개발을 지원한다. REQ-FUNC-018(RaaS 3옵션 비교 계산, p95 ≤ 3초)과 REQ-FUNC-020(수기 견적 리드 상태 관리)의 AC 검증을 위해, 3개 제조사에 걸친 로봇 모델 마스터와 견적 리드의 라이프사이클 상태 분포를 제공한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.11 QUOTE_LEAD`](../06_SRS-v1.md) — 견적 리드 스키마 (status ENUM 4종, JSONB response_data)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-018`](../06_SRS-v1.md) — RaaS 비용 비교 계산 (3옵션)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-020`](../06_SRS-v1.md) — 수기 견적 요청 및 상태 관리
- 태스크 리스트: [`07_TASK-LIST-v1.md#MOCK-006`](../TASKS/07_TASK-LIST-v1.md)
- 선행 태스크: `DB-012`, `DB-016`, `MOCK-001`
- 후행 활용: `UI-010`, `UI-011`, `FC-020`, `FC-022`, `FQ-008`

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 로봇 모델(ROBOT_MODEL) 10건 마스터 데이터 생성
- [ ] `prisma/seed/robotModels.ts` 작성
- [ ] **제조사별 분포** (MANUFACTURER_IDS[0~2] 각 제조사에 대해):
  - 제조사 A (대기업 협동로봇): 4개 모델 — 소형(가반 하중 5kg) 1, 중형(10kg) 2, 대형(20kg) 1
  - 제조사 B (중견 물류로봇): 3개 모델 — AGV 2, AMR 1
  - 제조사 C (외산 국내법인): 3개 모델 — 협동로봇 2, SCARA 1
- [ ] **가격 정보 필드**:
  - `purchase_price`: 하드웨어 구매가 (소형 3,000만 / 중형 5,000만 / 대형 9,000만 / 물류 6,000만 / SCARA 4,500만)
  - `monthly_lease_price`: 월 리스료 (구매가의 약 2.5% 기준, 예: 5,000만 → 125만/월)
  - `monthly_raas_price`: RaaS 구독료 (월 리스료 × 1.3, 유지보수·AS 포함)
- [ ] 고정 UUID — `ROBOT_MODEL_IDS` 상수 export
- [ ] `model_code` UNIQUE 제약 준수 (예: `MFGA-CB-5`, `MFGB-AGV-M`)

### 2단계: RaaS 3옵션 비교 계산 검증용 데이터 조건
- [ ] 최소 1개 모델은 **5년 기준 구매 vs 리스 vs RaaS 총비용 교차 시나리오** 확인 가능하도록 설계
  - 예: 중형 협동로봇(구매가 5,000만) → 5년 리스 = 7,500만, 5년 RaaS = 9,750만
  - 단기(1~2년)는 RaaS 유리, 장기(5년+)는 구매 유리 교차점 시뮬레이션 가능
- [ ] FC-020 계산 엔진이 3옵션 비교 출력 시 참조하는 모든 가격 필드가 NOT NULL

### 3단계: 견적 리드(QUOTE_LEAD) 5건 생성
- [ ] **리드 1 (status: `pending`)**: 로그인 사용자, `buyer_company_id = BUYER_IDS[0]`, `robot_model = "MFGA-CB-5"`, `quantity = 3`, `term_months = 36`, created_at = now - 2h
- [ ] **리드 2 (status: `pending`)**: 비로그인 사용자, `buyer_company_id = NULL`, 연락처 직접 입력
- [ ] **리드 3 (status: `in_progress`)**: Admin 배정 완료, `admin_responded_at = NULL`
- [ ] **리드 4 (status: `responded`)**: `response_data` JSONB 채움 — `{ quoted_price: 380_000_000, terms: "36개월 리스", notes: "설치비 별도" }`, `admin_responded_at` 채움
- [ ] **리드 5 (status: `closed`)**: 계약 전환 완료 시나리오, `response_data` 및 `admin_responded_at` 채움

### 4단계: 리드 상태별 타임스탬프 정합성
- [ ] `pending`: `admin_responded_at = NULL`
- [ ] `in_progress`: `admin_responded_at = NULL` (아직 응답 미완료)
- [ ] `responded`, `closed`: `admin_responded_at` NOT NULL, `created_at < admin_responded_at`
- [ ] `status = 'closed'` 리드는 `updated_at = admin_responded_at + 2~5일`

### 5단계: Idempotency 및 검증
- [ ] Upsert 패턴 적용
- [ ] `ROBOT_MODEL_IDS`, `QUOTE_LEAD_IDS` 상수 export
- [ ] verify.ts에 3제조사 분포, 가격 교차 시나리오, 리드 상태 분포 검증 추가

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 3개 제조사 분포 준수**
- **Given:** MOCK-001 완료 상태가 주어짐
- **When:** MOCK-006 Seed를 실행함
- **Then:** ROBOT_MODEL 10건이 생성되며, `manufacturer_id`별로 `GROUP BY` 시 각 제조사가 최소 3개 이상의 모델을 보유함

**Scenario 2: RaaS 3옵션 교차 시나리오 존재**
- **Given:** Seed 완료 상태가 주어짐
- **When:** 임의의 중형 협동로봇 모델에 대해 5년 기준 (구매 / 리스 / RaaS) 총비용을 계산함
- **Then:** 3옵션 중 최소 1개 교차점(시점에 따라 우위가 바뀌는 조건)이 존재하여 FC-020 계산 엔진의 분기 로직을 검증할 수 있음

**Scenario 3: 견적 리드 상태 분포 커버리지**
- **Given:** Seed 완료 상태가 주어짐
- **When:** `QUOTE_LEAD.status`를 `GROUP BY`함
- **Then:** `pending` 2건, `in_progress` 1건, `responded` 1건, `closed` 1건이 존재함

**Scenario 4: 로그인/비로그인 견적 요청 케이스**
- **Given:** Seed 완료 상태가 주어짐
- **When:** `buyer_company_id IS NULL`인 리드를 조회함
- **Then:** 최소 1건이 존재하며, `contact_name/email/phone`은 NOT NULL임

**Scenario 5: 응답 완료 리드의 JSONB 유효성**
- **Given:** `status = 'responded'`인 리드가 주어짐
- **When:** `response_data` 필드를 파싱함
- **Then:** `quoted_price`(number), `terms`(string), `notes`(string) 키가 존재함

**Scenario 6: 리드 상태 타임스탬프 순서**
- **Given:** `status = 'closed'`인 리드가 주어짐
- **When:** 타임스탬프를 조회함
- **Then:** `created_at ≤ admin_responded_at ≤ updated_at` 순서가 성립함

## :gear: Technical & Non-Functional Constraints

### 데이터 정합성
- `ROBOT_MODEL.model_code`는 UNIQUE, 제조사 코드 + 유형 + 크기의 조합 규칙 적용
- `monthly_raas_price >= monthly_lease_price > purchase_price / 60` 가격 합리성 공식 준수
- `QUOTE_LEAD.status` 전이는 `pending → in_progress → responded → closed` 순차 (역행 금지)

### 비즈니스 현실성
- 가격은 실제 시장가 범위(3천만~1억원) 반영하되, 특정 실제 모델과 혼동되지 않도록 가상 model_code 사용
- `term_months`는 12, 24, 36, 48, 60개월 중 선택 (실제 RaaS 계약 관행 반영)

### 확장성
- `ROBOT_MODEL` 스키마는 Brand-Agnostic(REQ-NF-022)이어야 하므로, 신규 제조사 추가 시 스키마 변경 없이 확장 가능한 구조 검증

## :checkered_flag: Definition of Done (DoD)
- [ ] Acceptance Criteria (Scenario 1~6)를 모두 충족하는가?
- [ ] 로봇 모델 가격 매트릭스와 견적 리드 상태 매핑표가 `prisma/seed/README.md`에 문서화되었는가?
- [ ] FC-020(RaaS 계산) 단위 테스트가 MOCK-006 데이터로 3옵션 비교 출력을 검증하는가?
- [ ] FQ-008(견적 리드 목록 조회)이 상태별 필터링을 정상 수행하는가?
- [ ] TypeScript 타입 에러 및 ESLint 경고가 0건인가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-012 | `QUOTE_LEAD` 테이블 스키마 (status ENUM 4종, JSONB response_data) | 필수 |
| DB-016 | `ROBOT_MODEL` 테이블 스키마 (제조사 FK, 가격 정보) | 필수 |
| MOCK-001 | 제조사/수요기업 Seed (FK 참조) | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| UI-010 | RaaS 비용 비교 계산기 UI |
| UI-011 | 수기 견적 요청 팝업 |
| FC-020 | RaaS 계산 엔진 Command |
| FC-022 | 수기 견적 리드 등록 Command |
| FQ-008 | Admin 견적 요청 목록 조회 Query |

### 참고사항
- `ROBOT_MODEL` 테이블은 SRS에 명시적으로 없고 DB-016(보완 스키마)에서 신규 정의 — RaaS 계산 엔진의 기반 마스터 데이터
- 실제 제조사 모델명은 LOI 완료 후 익명 코드로 전환 필수 — 현 Seed는 전적으로 가상 코드(`MFGA-CB-5` 등) 사용