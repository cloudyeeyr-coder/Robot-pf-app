---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[TEST] TEST-009: AS 엔지니어 가용성 판단 배정 룰 무결성 증명"
labels: 'test, unit, as, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-009] AS 엔지니어 배정 파이프라인(`assignEngineer`) 가드 테스트
- 목적: FC-012 를 통해 관리자가 티켓에 엔지니어를 점지할 때, 이중 배정, 휴가자 배정 등을 백엔드가 잘 막아내는지 방어막을 허물어보는 철저한 단위 테스트.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-012`
- 요구사항: REQ-FUNC-007 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 정상 매칭 전이 확인**
  - **Given**: 지역이 일치하고 현재 `isAvailable: true` 인 엔지니어 풀. 상태가 `reported` 인 미배정 티켓.
  - **When**: 관리자가 배정 액션을 지시.
  - **Then**: 티켓의 상태가 `assigned` 로 바뀌고, `engineerId` 릴레이션이 정상 구축되며 타임스탬프가 박힘. 

- [ ] **Scenario 2: 배정 불가 상태의 엔지니어 필터링**
  - **Given**: 오늘 일정이 꽉 차 있거나 휴가중으로 `isAvailable: false` 인 엔지니어 모킹.
  - **When**: 이 모킹된 대상을 강제 배정하려 시도.
  - **Then**: "해당 엔지니어는 할당 불가 상태입니다" 와 같은 4xx 에러가 터지며 티켓의 상태는 계속 미배정(`reported`) 으로 유지된다.

- [ ] **Scenario 3: 이미 배정된 건 덮어쓰기 금지 보장**
  - **Given**: 이미 누군가가 배정되어 `assigned` 나 `in_progress` 상태에 돌입한 티켓.
  - **When**: 화면 새로고침 등의 오류로 인해 또 한 번 위 액션을 실행함.
  - **Then**: 현재 상태가 할당 가능하지 않다며(`ALREADY_ASSIGNED` 등) 로직을 거절한다.

## :gear: Technical Constraint
- 타겟 모델링: 이 테스트는 Prisma의 `ticket` 과 `engineer` 두 모델의 상태를 엮어서 봐야하므로, Prisma 릴레이션 트랙젝션을 온당하게 모킹할 수 있는 전략(또는 로컬 SQLite E2E)으로 짜야한다.
