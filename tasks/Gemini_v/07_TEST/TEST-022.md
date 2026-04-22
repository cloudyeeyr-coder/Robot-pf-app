---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[TEST] TEST-022: O2O 달력 가용시간(슬롯) 배식 알고리즘 무결성 확인"
labels: 'test, unit, o2o, priority:low'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-022] O2O 방문 예약(상담) 가용 슬롯 제척 쿼리(`FQ-011`) 검증
- 목적: Phase 2에서 사용될 예약 캘린더 기능이 기존 예약된 시간을 "정확하게 빼고" 남은 빈 깡통 시간만 프론트로 응답하는지 검사.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FQ-011`
- 요구사항: REQ-FUNC-023 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 기존 시간 제척(Subtract) 반환 무결성**
  - **Given**: MOCK DB에 특정 날짜(X)의 13:00, 15:00 이 각각 `confirmed`, `pending` 으로 예약되어 있음.
  - **When**: 사용자가 날짜 X 의 빈 슬롯을 요청함.
  - **Then**: 반환되는 `availableSlots` 배열에 절대로 13:00 이나 15:00 이 섞여 들어오지 않으며, 2초(p95) 내에 10:00, 11:00 등의 나머지 슬롯 모음만 가공되어 넘어옴을 Assertion으로 증명.

## :gear: Technical Constraint
- 타임존 경계: 날짜 검색 조건식이 UTC 기준 `00:00:00` ~ `23:59:59` 를 탐색할 때, 시차로 인해 전날 혹은 다음날 예약이 물려 들어오지 않는지 Edge 케이스 단속에 중점을 둬라.
