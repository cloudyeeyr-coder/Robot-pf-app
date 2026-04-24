---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] MOCK-002: Prisma Seed 스크립트 — 계약 5건(상태별) / 에스크로 TX 5건"
labels: 'feature, backend, mock, seed, escrow, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-002] Contract & Escrow 도메인 Seed 스크립트 (계약 5건 + 에스크로 TX 5건)
- 목적: 에스크로 상태 전이 플로우(pending → escrow_held → inspecting → release_pending → completed, 분기: disputed)의 **모든 주요 상태를 대표하는 샘플 계약**을 제공하여, Admin 대시보드(UI-008), 검수 승인 UI(UI-006), 에스크로 결제 흐름 UI(UI-005)가 각 상태별 분기 로직을 독립적으로 렌더링·테스트할 수 있도록 한다. 특히 REQ-FUNC-001(예치 확인 E2E ≤ 10분)과 REQ-FUNC-002(검수 7영업일) 시나리오의 AC 검증 기반이 된다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.4 CONTRACT`](../06_SRS-v1.md) — 계약 테이블 스키마 (status ENUM 6종)
- SRS 문서: [`06_SRS-v1.md#6.2.5 ESCROW_TX`](../06_SRS-v1.md) — 에스크로 거래 테이블 스키마 (state ENUM 3종)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-001`](../06_SRS-v1.md) — 에스크로 예치 확인 프로세스
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-002`](../06_SRS-v1.md) — 검수 승인 및 방출 프로세스
- 태스크 리스트: [`07_TASK-LIST-v1.md#MOCK-002`](../TASKS/07_TASK-LIST-v1.md)
- 선행 태스크: `DB-005`, `DB-006`, `MOCK-001`
- 후행 활용: `UI-005`, `UI-006`, `UI-008`, `FQ-004`, `FQ-007`, `MOCK-005`

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Seed 파일 구조 및 Index 연결
- [ ] `prisma/seed/contracts.ts` 작성 — MOCK-001의 `BUYER_IDS`, `SI_PARTNER_IDS` import
- [ ] `prisma/seed/escrowTx.ts` 작성 — `contracts.ts` export한 `CONTRACT_IDS` 참조
- [ ] `prisma/seed/index.ts`에 실행 순서 추가: `… → contracts → escrowTx`

### 2단계: 계약(CONTRACT) 5건 상태 분포 설계
- [ ] **계약 1 (status: `pending`)** — 방금 생성, 예치 미완료. `buyer_company_id = BUYER_IDS[0]`, `si_partner_id = SI_PARTNER_IDS[0]`, `total_amount = 30_000_000`, `inspection_deadline = null`
- [ ] **계약 2 (status: `escrow_held`)** — 예치 완료, 시공 진행 중. `total_amount = 55_000_000`, `inspection_deadline = now + 14일`
- [ ] **계약 3 (status: `inspecting`)** — 시공 완료, 검수 진행 중. `inspection_deadline = now + 5일` (여유 있음)
- [ ] **계약 4 (status: `release_pending`)** — 검수 승인 완료, 방출 대기. `inspection_deadline = now - 1일`(지난 상태)
- [ ] **계약 5 (status: `completed`)** — 정상 종결. `total_amount = 80_000_000`, `created_at = now - 60일`
- [ ] (선택) **계약 6 (status: `disputed`)** — 분쟁 접수. Scenario 5 검증용. MOCK-002 범위 내 추가 권장

### 3단계: 에스크로 TX(ESCROW_TX) 5건 상태 매핑
- [ ] 계약 ↔ TX는 `UNIQUE(contract_id)` 1:1 관계 — 계약 1(pending)은 TX 미생성, 계약 2~6에 각 1건씩 TX 생성
- [ ] **TX for 계약 2 (state: `held`)**: `held_at`, `admin_verified_at` 채움, `released_at = null`
- [ ] **TX for 계약 3 (state: `held`)**: 동일
- [ ] **TX for 계약 4 (state: `held`)**: `released_at = null` (방출 대기 상태)
- [ ] **TX for 계약 5 (state: `released`)**: `released_at = now - 10일`
- [ ] **TX for 계약 6 (state: `refunded`)**: `refunded_at = now - 3일`, `admin_memo = "분쟁 조정 결과 전액 환불"`
- [ ] `amount` 필드는 해당 계약 `total_amount`와 일치

### 4단계: Admin 확인 기록 필드 채우기
- [ ] `admin_verified_at`: 분 단위 정밀도로 채움 (REQ-FUNC-001 "10분 이내 확인" 시나리오용)
- [ ] `admin_memo`: 증빙 마커 (예: `"입금자명: (주)테스트기업, 증빙 #ESC-2026-0042"`) — 마스킹 정책 검증용

### 5단계: 상태 전이 타임스탬프 일관성 검증
- [ ] 각 계약의 `created_at < held_at < released_at` 순서 보장
- [ ] `inspection_deadline` = `held_at` + 시공기간(14일) + 7영업일 공식 적용
- [ ] `prisma.$transaction()`으로 계약·TX 원자적 삽입

### 6단계: 재현성 및 문서화
- [ ] Upsert 기반 재실행 안전성 확보 (MOCK-001과 동일 패턴)
- [ ] `CONTRACT_IDS`, `ESCROW_TX_IDS` 상수 export
- [ ] `prisma/seed/README.md` 업데이트 — 계약별 상태·금액·참여자 매핑표 추가

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 모든 계약 상태 대표 샘플 생성**
- **Given:** MOCK-001이 완료된 상태가 주어짐
- **When:** `npx prisma db seed`를 실행함
- **Then:** `CONTRACT` 테이블에 status가 `pending`, `escrow_held`, `inspecting`, `release_pending`, `completed`, `disputed`인 레코드가 각각 최소 1건씩 존재함

**Scenario 2: 에스크로 1:1 관계 무결성**
- **Given:** Seed 실행이 완료된 상태가 주어짐
- **When:** `SELECT contract_id, COUNT(*) FROM escrow_tx GROUP BY contract_id`를 조회함
- **Then:** 모든 `contract_id`의 count가 1이며, UNIQUE 제약 위반이 없음

**Scenario 3: Admin 대시보드(FQ-007) 방출 대기 필터링**
- **Given:** MOCK-002 Seed가 완료된 상태가 주어짐
- **When:** Admin 대시보드에서 `status = 'release_pending'` 필터를 적용함
- **Then:** 최소 1건의 계약이 표시되며, 해당 계약의 에스크로 TX `state`가 `held`임

**Scenario 4: 상태 전이 타임스탬프 정합성**
- **Given:** `state = 'released'`인 에스크로 TX가 주어짐
- **When:** 해당 레코드의 `created_at`, `held_at`, `released_at`을 조회함
- **Then:** `created_at ≤ held_at ≤ released_at` 순서가 성립함

**Scenario 5: 분쟁 케이스 환불 정합성**
- **Given:** `status = 'disputed'`인 계약이 주어짐
- **When:** 연결된 에스크로 TX를 조회함
- **Then:** TX `state`가 `refunded`이며, `refunded_at`과 `admin_memo`가 NOT NULL임

**Scenario 6: 검수 기한(inspection_deadline) 계산 규칙**
- **Given:** `status = 'inspecting'`인 계약이 주어짐
- **When:** `inspection_deadline`을 조회함
- **Then:** `inspection_deadline ≥ held_at + 14일`이며, 현재 시점 대비 +5일 이상 여유가 있음

## :gear: Technical & Non-Functional Constraints

### 데이터 정합성
- 모든 타임스탬프는 UTC 기준 ISO 8601로 저장 (CON-13 Prisma 표준)
- `total_amount`와 `amount` 필드 타입 일치 (DECIMAL 15,2) — 소수점 오차 방지
- ENUM 값은 Prisma 생성 타입(`ContractStatus`, `EscrowState`) 참조 — 하드코딩 문자열 금지

### 보안
- `admin_memo`의 입금자명은 가상 기업명(`(주)테스트기업-A` 등) 사용 — PII 포함 금지
- 금액 데이터는 실제 견적 범위(3천만~1억원)를 반영하되, 실거래 금액 사용 금지

### 성능 및 운영
- Seed 실행 시간 ≤ 3초 (단일 트랜잭션)
- `released_at`, `refunded_at` 등 TIMESTAMP 필드에 인덱스가 있는 경우 분포 다양성 확보 (쿼리 최적화 검증용)

## :checkered_flag: Definition of Done (DoD)
- [ ] Acceptance Criteria (Scenario 1~6)를 모두 충족하는가?
- [ ] CONTRACT 6건(5+1 disputed), ESCROW_TX 5건의 고정 UUID가 `prisma/seed/README.md`에 문서화되었는가?
- [ ] 상태 분포·타임스탬프 순서·FK 무결성을 검증하는 `prisma/seed/verify.ts` 케이스가 추가되었는가?
- [ ] MOCK-005(AS 티켓 Seed)가 `CONTRACT_IDS`를 정상 참조할 수 있는 export 계약이 성립하는가?
- [ ] TypeScript 타입 에러 및 ESLint 경고가 0건인가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-005 | `CONTRACT` 테이블 스키마 및 마이그레이션 (status ENUM 6종) | 필수 |
| DB-006 | `ESCROW_TX` 테이블 스키마 및 마이그레이션 (state ENUM 3종, UNIQUE FK) | 필수 |
| MOCK-001 | 수요기업/SI 파트너 Seed (FK 참조 대상) | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| MOCK-005 | AS 티켓·보증서 Seed (CONTRACT_IDS / ESCROW_TX_IDS FK 참조) |
| UI-005 | 에스크로 결제 흐름 UI |
| UI-006 | 검수 승인/거절 UI |
| UI-008 | Admin 대시보드 (방출 대기 목록 렌더링) |
| FQ-004 | 에스크로 TX 상태 조회 Query |
| FQ-007 | Admin 에스크로 거래 목록 조회 Query |

### 참고사항
- Phase 1 MVP 검증용 5~6건 규모이며, Admin 대시보드 페이지네이션 검증을 위해서는 추가 Seed(≥ 20건) 필요 시 별도 태스크(`MOCK-002-EXT`)로 분리 권장
- 분쟁 케이스는 본래 SRS Seed 요구에는 명시되지 않았으나, 상태 커버리지 완결성을 위해 본 태스크에 포함