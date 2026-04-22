---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 사양
title: "[TEST] TEST-029: 금융심장(에스크로) 오류 임계치 Slack 훅 증명 모의전"
labels: 'test, unit, monitoring, priority:low'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-029] 에스크로 에러율 감시 크론 데몬(`CRON-006`) 시뮬레이터
- 목적: 결제/승인 에러가 누적될 때 임계치(0.5%)를 정확하게 연산하여 시스템 슬랙 채널을 무사히 호출 해내는지 증명.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `CRON-006`, `API-026`
- 요구사항: REQ-FUNC-033 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 임계점 타격 (0.5% 룰)**
  - **Given**: DB 스냅샷(Mock) 에서 최근 5분간 총 1만 건의 트랜잭션 모수 중, 오류 내역이 55건(0.55%) 존재함.
  - **When**: 크론 모니터 배치 가동.
  - **Then**: 연산식이 `0.5` 를 넘은 것을 계산해내고 `sendSlackAlert` (또는 Sentry 알람 Mock) 함수를 `toHaveBeenCalled` 했는지 검수.

- [ ] **Scenario 2: 침묵(Silence) 유지 규칙**
  - **Given**: 오류율이 0.1% 수준으로 안정적인 모킹 구간.
  - **When**: 크론 가동.
  - **Then**: 스파이(Spy) 모듈에 알림 발송 함수가 전~혀 호출되지 않았어야 함 (스팸 알림 방어력 입증).
