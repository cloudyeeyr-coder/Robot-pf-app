---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[TEST] TEST-016: 인증 뱃지 권한 만료 D-7일 사전 통보망 테스트"
labels: 'test, unit, batch, priority:low'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-016] 뱃지 권한 상실 7일 전 알람(`CRON-002`) 가동 테스트
- 목적: 파트너들이 갑자기 일감이 떨어지는 불상사를 겪지 않도록, Date 범위 연산 크론 워커가 정확히 7일 남은 유저만 표적 스캔하여 알림 큐를 쏘는지 시뮬레이션.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `CRON-002`
- 요구사항: REQ-FUNC-016 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: D-7 정밀 타겟 범위 스캔**
  - **Given**: (MOCK DB) 
    1. 만료일이 "오늘 + 7.5일" 인 뱃지 (대상 아님, 내일 실행 시 대상)
    2. 만료일이 "오늘 + 6.9일" 인 뱃지 (타겟 스팟)
    3. 이미 만료된 뱃지
  - **When**: 크론 함수 동기 실행
  - **Then**: 쿼리의 조건문(`gte`, `lt`) 결과에 2번 객체만이 Select 되어야 하며, 중복 방송 방지 룰로 인해 시스템 메일러(`API-025` Fake)가 딱 1번만 `toHaveBeenCalled` 됨을 증명한다.

## :gear: Technical Constraint
- 타임존 무결성: JS의 Date 타임존과 DB(Postgres)의 타임존이 어긋나면 새벽에 도는 배치가 엉뚱한 사람을 잡을 수 있다. `UTC 기준으로 7일(7 * 24 * 60 * 60)` 을 명확히 Mocking하여 Assert 한다.
