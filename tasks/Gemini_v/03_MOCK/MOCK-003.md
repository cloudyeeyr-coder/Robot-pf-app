---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[MOCK] MOCK-003: 뱃지 발급 및 파트너 제안 기초 Seed"
labels: 'mock, database, badge, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-003] 제조사 뱃지 및 파트너 제안 이력 Seed
- 목적: 활성/만료 뱃지의 필터링 구현(UI-003)과 대시보드 구성을 위해 파트너십이 체결된 모의 상태를 스크립팅한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 연관 데이터 모델: `06_SRS-v1.md#6.2.7`, `6.2.12`

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 제조사 3종(A, B, C)과 SI 파트너 풀 사이의 M:N 교차 데이터를 통해 총 **15건의 뱃지 데이터** 생성.
  - 이중 10건: `isActive: true` (활성)
  - 3건: `isActive: false`이되 만료(`expiresAt`) 경과됨.
  - 2건: `isActive: false`이되 철회(`revokedAt`) 찍힘.
- [ ] 만료 및 대기 중 테스트를 위한 **제안(Proposal) 10건** 구성.
  - 이중 5건은 `pending`, 기한은 일부 과거/일부 미래로 배분. (Cron 테스트용)

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 다중 뱃지 테스트
- Given: SI 파트너 X
- When: 뱃지 Seed 프로세스 통과
- Then: 해당 SI 파트너 X가 조회되었을 때 제조사 A, B에게 중복으로 뱃지를 발급받은 'Brand-Agnostic' 구조 테스트 샘플이 정상적으로 반환되어 프론트 로직 검증을 돕는다.

Scenario 2: 배치의 제물(Victim) 타겟 세팅
- Given: 자동 만료(CRON) 동작 처리기
- When: `expiresAt` 이 D-7 에 해당하는 뱃지를 찾음
- Then: 이 Seed 가 제공하는 샘플 세트에 의도적으로 "딱 7일 남은" 데이터가 포진되어 있어 Cron Batch의 동작 검증을 자동화한다(의도된 타임스탬프 하드코딩).

## :gear: Technical & Non-Functional Constraints
- 제약/구조: Date 핸들링을 위해 `dayjs` 나 내장 Date 기반으로 정확히 (NOW - X) 시간 조작을 넣은 데이터 Seeding 일 것.

## :checkered_flag: Definition of Done (DoD)
- [ ] 뱃지 15건 생성 패턴과 파트너 제안 10건이 스크립트에 탑재되었는가?
- [ ] M:N을 위한 멱등성(`upsert` with Compound Unique Key) 보장 구현 완료

## :construction: Dependencies & Blockers
- Depends on: #MOCK-001, #DB-008, #DB-013
- Blocks: #FQ-003, #FQ-006, #UI-003, #UI-009
