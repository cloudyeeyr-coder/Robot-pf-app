---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[TEST] TEST-010: AS 24H SLA 수학적 완료 판정 자동 도출 증명"
labels: 'test, unit, as, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-010] SLA 24시간 준수 판정 엔진(`FC-013`) 수학/기능 결합 무결성 검증
- 목적: 현장 엔지니어가 유지보수를 완료(`resolved`)했다고 쳤을 때, 서버가 시간을 계산하여 "24시간 이내인가?"를 판별하고 `slaMet` 불리언 값을 정확히 DB에 남기는지 테스트한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-013` (SLA 마감 로직)
- 요구사항: REQ-FUNC-008 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: SLA 준수(Pass) 통과 여부 시뮬레이션**
  - **Given**: (타이머) `reportedAt` 이 현재시간 기준 불과 5시간(5 * 60 * 60 * 1000) 전인 티켓 객체.
  - **When**: `resolveTicket` 함수가 당겨짐.
  - **Then**: DB에 `status: 'resolved'` 로 박힘과 동시에 연산 엔진이 24시간 이내임을 판정, `slaMet: true` 가 영구 표기된다.

- [ ] **Scenario 2: SLA 24H 한계 지연(Fail) 마킹 시뮬레이션**
  - **Given**: `reportedAt` 이 현재시간 기준 25시간을 훌쩍 넘겨버린 티켓 객체 (예: 금요일 접수 - 토요일 파업).
  - **When**: 헐레벌떡 엔지니어가 완료 처리를 함.
  - **Then**: 완료는 받아주되(`resolved`), `slaMet: false` 로 냉정하게 도장이 찍혀서 추후 대시보드 경고망(FQ-010 등)에 카운팅 될 단서 역할을 수행한다.

## :gear: Technical Constraint
- 시간 상대성 주의: 배포(서버) 환경의 시간대(UTC, KST) 차이로 인해 24시간 연산이 9시간 오차를 겪을 수 있다. 시스템의 모든 Date 연산이 `.getTime()` 기반의 MS 통일인지, 아니면 `dayjs` 같은 타임존 라이브러리를 쓰고 있다면 플러그인이 잘 로드되어있는지 테스트 내에서 점검.
