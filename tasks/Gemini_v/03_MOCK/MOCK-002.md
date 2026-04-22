---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[MOCK] MOCK-002: 계약 및 에스크로 진행 상태별 Seed 데이터"
labels: 'mock, database, escrow, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-002] 계약 및 에스크로 5단계 트랜잭션 Seed 생성
- 목적: UI 개발팀이 계약 파이프라인(에스크로 거치 → 검수 → 방출 대기)을 테스트할 수 있도록 계약 상태 전이별로 1건씩 고정된 모의 데이터를 준비한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 연관 데이터 모델: `06_SRS-v1.md#6.2.4`, `6.2.5`
- 연관 태스크: UI-005, UI-006

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] MOCK-001에서 만들어둔 SI 파트너 1곳과 수요기업 1곳을 참조할 Helper 추가.
- [ ] 다음과 같은 상태(Status)를 지니는 `Contract` 레코드 5건 적재:
  1. `pending`
  2. `escrow_held`
  3. `inspecting`
  4. `release_pending`
  5. `completed`
- [ ] 2~5번의 계약에 매핑되는 `EscrowTx` 거래 이력을 적절한 상태(`held` or `released`)로 맵핑(총 5건).

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 상태 무결성 지원
- Given: 계약과 에스크로가 분리된 스키마.
- When: 대시보드(UI-008) 개발 시 해당 Seed를 Query함
- Then: Contract 의 상태가 `release_pending` 인 경우, 물려있는 EscrowTx 상태가 `held`인 식으로 실제 도메인 상태 기계의 정책에 거스르지 않는 무결한 Seed 데이터여야 한다.

Scenario 2: 데이터 추적성 확인
- Given: 테스트용 Seed 스크립트 실행 환경
- When: `$transaction` 을 통해 병렬 제안됨
- Then: 이전에 등록된 사용자 ID(UUID/CUID)와 외래키로 올바르게 참조 연결이 성립함.

## :gear: Technical & Non-Functional Constraints
- 구조/옵션: 에스크로 내역 생성 시 1,000만 원부터 1억 단위에 이르는 현실주의형 소수점 Decimal 값이 삽입되도록 맵핑할 것.

## :checkered_flag: Definition of Done (DoD)
- [ ] 5건 이상의 대표 계약 상태가 스크립트 내에 하드코딩 또는 동적 할당 되었는가?
- [ ] Seeding이 멱등성(Idempotence - 여러 번 돌려도 테이블이 망가지지 않음)을 보장하는가?

## :construction: Dependencies & Blockers
- Depends on: #MOCK-001, #DB-005, #DB-006
- Blocks: #MOCK-005, #UI-005
