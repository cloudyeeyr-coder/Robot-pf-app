---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] MOCK-007: Prisma Seed 스크립트 — O2O 예약 5건 / 매니저 슬롯 (Phase 2 대비)"
labels: 'feature, backend, mock, seed, o2o, phase-2, priority:low'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-007] O2O Booking 도메인 Seed 스크립트 (O2O 예약 5건 + 매니저 슬롯 데이터)
- 목적: Phase 2 범위인 O2O 매니저 파견 서비스(F-06)의 **UI/Query 사전 개발 및 스키마 확장성 검증**을 지원한다. REQ-FUNC-023(가용 슬롯 조회 ≤ 2초)과 REQ-FUNC-025(방문 보고서 등록)의 독립 개발을 가능하게 하되, Phase 1 범위에서는 **스키마 확장성 확보와 기본 상태 커버리지만 제공**한다. 본 Seed는 Phase 1 배포 후 O2O 서비스 런칭 시 즉시 활용 가능한 기반 데이터셋이다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.9 O2O_BOOKING`](../06_SRS-v1.md) — O2O 예약 테이블 스키마 (status ENUM 4종, JSONB report_content)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-023`](../06_SRS-v1.md) — 가용 매니저 슬롯 조회
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-025`](../06_SRS-v1.md) — 방문 보고서 등록
- 태스크 리스트: [`07_TASK-LIST-v1.md#MOCK-007`](../TASKS/07_TASK-LIST-v1.md)
- Phase 구분: `07_TASK-LIST-v1.md` — F-06 관련 태스크는 Phase 2 범위 (DB/DTO/Seed만 Phase 1 사전 정의)
- 선행 태스크: `DB-010`, `MOCK-001`
- 후행 활용 (Phase 2): `UI-012`, `FC-025~027`, `FQ-011`

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 매니저 슬롯 가용성 데이터 모델 결정
- [ ] O2O 매니저는 별도 테이블이 SRS에 정의되지 않음 → **Phase 1에서는 가상 매니저 ID 상수 배열로 처리**
- [ ] `prisma/seed/lib/fixtures.ts`에 `O2O_MANAGER_IDS` 정의 (UUID 3개: 서울, 경기, 부산 지역 매니저)
- [ ] Phase 2에서 `MANAGER` 테이블 본격 설계 시 본 상수를 마이그레이션하도록 주석 처리

### 2단계: O2O 예약(O2O_BOOKING) 5건 상태 분포
- [ ] **예약 1 (status: `requested`)**: 방금 예약, `assigned_manager_id = NULL`, `visit_date = now + 3일`
- [ ] **예약 2 (status: `confirmed`)**: 매니저 배정 완료, `visit_date = now + 7일`, `assigned_manager_id = O2O_MANAGER_IDS[0]`
- [ ] **예약 3 (status: `completed`)**: 방문 완료 + 보고서 등록, `visit_date = now - 5일`, `report_content` JSONB 채움
- [ ] **예약 4 (status: `completed`)**: 방문 완료 + 보고서 등록, `visit_date = now - 15일`
- [ ] **예약 5 (status: `cancelled`)**: 고객 취소 시나리오, `assigned_manager_id = NULL`, `updated_at = created_at + 1일`

### 3단계: 방문 보고서(report_content) JSONB 구조 설계
- [ ] 완료된 예약 2건(예약 3, 4)에 대해 `report_content` 필드 채움:
```json
  {
    "consultation_summary": "피킹/팔레타이징 공정 협동로봇 도입 상담, 가반하중 10kg 요구",
    "recommended_si_ids": ["si-uuid-1", "si-uuid-2"],
    "quote_range": { "min": 45_000_000, "max": 75_000_000 },
    "next_steps": ["견적서 3사 비교 발송", "실사 방문 재예약"]
  }
```
- [ ] `recommended_si_ids`는 MOCK-001의 실제 `SI_PARTNER_IDS` 참조 (FK 관계 시뮬레이션)
- [ ] `report_submitted_at`은 `visit_date + 1~3일` 내 분포

### 4단계: 지역 분포 및 가용 슬롯 시뮬레이션
- [ ] 예약 지역 분포: 서울 2건, 경기 2건, 부산 1건 (MOCK-001 수요기업 지역과 일치)
- [ ] `visit_date` 분포: 과거 2건(완료), 현재 미래 2건(진행 중), 취소 1건
- [ ] FQ-011(가용 슬롯 조회) 검증용: 특정 날짜(now + 5일)에 매니저 1명 가용/1명 예약 상태 혼합 설계

### 5단계: Idempotency 및 Phase 2 확장성
- [ ] Upsert 패턴 적용
- [ ] `O2O_BOOKING_IDS` 상수 export
- [ ] **Phase 2 확장 Hook**: 매니저 별도 테이블 도입 시 FK 마이그레이션 스크립트 작성 가이드 주석 추가

### 6단계: 문서화
- [ ] `prisma/seed/README.md`에 Phase 2 범위 명시 및 현재 Seed의 제한사항(매니저 테이블 부재) 기재

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: O2O 예약 상태 분포**
- **Given:** MOCK-001 완료 상태가 주어짐
- **When:** MOCK-007 Seed를 실행함
- **Then:** O2O_BOOKING 5건이 생성되며, `status`별로 `requested` 1, `confirmed` 1, `completed` 2, `cancelled` 1의 분포가 존재함

**Scenario 2: 완료 예약의 보고서 필수 존재**
- **Given:** `status = 'completed'`인 예약이 주어짐
- **When:** 해당 레코드를 조회함
- **Then:** `report_submitted_at`과 `report_content`가 모두 NOT NULL이며, `report_content`는 `consultation_summary`, `recommended_si_ids`, `quote_range`, `next_steps` 4개 키를 포함함

**Scenario 3: 취소 예약의 매니저 미배정**
- **Given:** `status = 'cancelled'`인 예약이 주어짐
- **When:** `assigned_manager_id` 필드를 조회함
- **Then:** 값이 NULL이며, `updated_at > created_at`임

**Scenario 4: FQ-011 가용 슬롯 조회 시뮬레이션**
- **Given:** Seed 완료 상태가 주어짐
- **When:** 특정 미래 날짜(예: now + 5일)로 가용 매니저를 조회함
- **Then:** 해당 날짜에 예약이 없는 매니저가 반환되며, 쿼리 실행 시간 ≤ 2초

**Scenario 5: recommended_si_ids FK 참조 유효성**
- **Given:** `report_content.recommended_si_ids` 배열이 주어짐
- **When:** 각 UUID로 `SI_PARTNER` 테이블을 조회함
- **Then:** 모든 UUID가 실제 SI_PARTNER 레코드와 매칭됨 (FK 무결성 시뮬레이션)

**Scenario 6: Phase 2 확장성 검증**
- **Given:** 현재 Seed 상태가 주어짐
- **When:** 가상의 `MANAGER` 테이블을 신규 생성하고 `O2O_MANAGER_IDS`를 FK로 전환함
- **Then:** 기존 O2O_BOOKING 레코드의 `assigned_manager_id` 마이그레이션이 데이터 손실 없이 가능함

## :gear: Technical & Non-Functional Constraints

### Phase 2 대비 설계
- 본 Seed는 **Phase 1 배포 범위 밖**이나, 스키마·DTO·Seed는 Phase 1에서 사전 정의 (07_TASK-LIST-v1.md 참고사항)
- Phase 2 시작 시 `MANAGER` 테이블 도입 → `O2O_MANAGER_IDS` 상수가 실제 FK로 승격됨

### 데이터 정합성
- `visit_date`는 `created_at`과 동일한 timezone(UTC) 기준 DATE 타입
- `report_content.recommended_si_ids`는 실제 `SI_PARTNER_IDS`만 참조 (존재하지 않는 UUID 금지)
- `status` 전이 순서: `requested → confirmed → completed`, 또는 `requested/confirmed → cancelled`

### 성능 (Phase 2 기준)
- FQ-011 가용 슬롯 조회 p95 ≤ 2초 — 본 Seed 5건으로는 성능 검증 제한, Phase 2에서 `SEED_SCALE=5` 실행 시 25건 기준 재검증 필요

### 확장성
- 매니저 테이블 부재로 인한 NULL 가능성 명시 — Phase 2 마이그레이션 시점에 FK 제약 추가

## :checkered_flag: Definition of Done (DoD)
- [ ] Acceptance Criteria (Scenario 1~6)를 모두 충족하는가?
- [ ] O2O 예약 상태 매핑표와 Phase 2 마이그레이션 가이드가 `prisma/seed/README.md`에 문서화되었는가?
- [ ] `report_content` JSONB 구조가 Zod 스키마로 정의되어 타입 안정성이 확보되었는가?
- [ ] Phase 2 확장성 검증(Scenario 6)이 가상의 마이그레이션 스크립트로 사전 검토되었는가?
- [ ] TypeScript 타입 에러 및 ESLint 경고가 0건인가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-010 | `O2O_BOOKING` 테이블 스키마 (status ENUM 4종, report_content JSONB) | 필수 |
| MOCK-001 | 수요기업/SI 파트너 Seed (FK 참조) | 필수 |

### Blocks (후행 태스크 — Phase 2)
| Task ID | 설명 |
|:---|:---|
| UI-012 | O2O 매니저 파견 예약 캘린더 UI (Phase 2) |
| FC-025 | O2O 예약 생성 Command (Phase 2) |
| FC-026 | 매니저 배정 Command (Phase 2) |
| FC-027 | 방문 보고서 등록 Command (Phase 2) |
| FQ-011 | 가용 매니저 슬롯 조회 Query (Phase 2) |

### 참고사항
- **Phase 2 범위 명시**: 본 태스크는 Phase 1 배포 직전에는 실행하지 않을 수 있음. 단, `SEED_SCALE` 환경변수로 Phase 2 준비 단계에서 활성화 가능하도록 `index.ts`에 플래그 지원 권장
- 매니저 관리 시스템은 Phase 2 설계 검토 시 AS 엔지니어(`AS_ENGINEER`, DB-017) 테이블과의 통합 여부 재검토 필요 — 두 역할 모두 "지역 기반 가용 인력 관리" 패턴 공유