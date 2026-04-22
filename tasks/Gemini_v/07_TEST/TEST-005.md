---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[TEST] TEST-005: 7영업일 미응답 크론(CRON-001) 자동 분쟁 전환 방어 테스트"
labels: 'test, unit, batch, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-005] 시간 흐름 기반(Time-boxed) 자동 분쟁 이관 배치 테스트
- 목적: CRON-001 모듈이 타임머신을 쓰듯(Timers Mocks) '7일을 넘긴 계약'만 정확하게 핀셋으로 뽑아 상태를 바꾸고, '6.9일이 지난 계약'은 스킵하는 고난도 날짜 연산 무결성을 증명한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `CRON-001`
- 요구사항: REQ-FUNC-005 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 정확한 스캔(Scrub) 커버리지 타겟팅**
  - **Given**: (MOCK DB) 
    1. 어제 접수된 검수 건 (D+1)
    2. 10일 전 접수된 검수 방치 건 (D+10)
  - **When**: 자정 스케줄러라고 가정한 크론 핸들러 함수를 실행.
  - **Then**: 배치 시스템은 오직 D+10 (2번) 계약 대상들만 `disputed` 로 `updateMany` 를 때렸음을 쿼리 호출 인자로 증명한다 (1번은 건들지 않음).

- [ ] **Scenario 2: 방출 락킹 보호 (안전 자산 보호)**
  - **Given**: 위 SC 1에서 `disputed` 로 변환된 건.
  - **When**: (결합 테스트) 수요기업 혹은 SI 파트너가 "야 돈 빼"(`confirmRelease` 류 액션)라고 콜함
  - **Then**: 400 에러를 반환하며 절대 에스크로에서 자금이 방출되지 않음을 확약(Lock).

## :gear: Technical Constraint
- Time Mocking: 날짜 차이 로직 테스트 시 실시간을 기다릴 순 없으니 `jest.useFakeTimers()` 와 `setSystemTime` 을 활용하여 가상으로 10일 뒤 모킹을 수행하는 구조를 작성하라.
