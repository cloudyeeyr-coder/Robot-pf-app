---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 사양
title: "[TEST] TEST-030: 방치된 AS 미배정 건 Slack 타겟팅 색출 테스트"
labels: 'test, unit, monitoring, priority:low'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-030] 24H 블랙홀 AS 미배정 모니터링 데몬(`CRON-007`) 테스트
- 목적: 시간 계산 착오 없이 딱 24시간 이상 방치된 미배정 티켓만 솎아내어 시스템 관리자를 괴롭히는지(!) 수학적 입증하기.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `CRON-007`
- 요구사항: REQ-FUNC-034 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 시간 기준(Timers) 타겟팅 명중력**
  - **Given**: DB상 미배정 건(A: 작성일 25시간 지남), (B: 작성일 1시간 지남).
  - **When**: 1시간 주기의 배치 구동 시뮬레이션
  - **Then**: Slack 모듈 함수가 호출되었는지를 보고, 이때 넘어간 Payload 메시지 안에 `A티켓` 의 ID는 존재하지만 `B티켓` 은 없음을 String Matcher 로 철저히 필터 검증한다.

- [ ] **Scenario 2: 오인 발사 방어 (기 배정건 건너뛰기)**
  - **Given**: 작성일은 30시간이 지났으나, 이미 `assigned` 로 상태가 방금 바뀐 행복한 티켓건.
  - **When**: 배치 가동
  - **Then**: 타겟팅 조건망(미배정 상태)을 유유히 회피하여 Slack 알람이 발생하지 않음을 증명.
