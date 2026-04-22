---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 사양
title: "[TEST] TEST-023: O2O 동시 접속 예약선점 방어 및 이중 통보 증명"
labels: 'test, unit, o2o, priority:low'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-023] O2O 예약 트랜잭션 동시성(Race-Condition) 및 알림 테스트
- 목적: 한 슬롯을 두고 여러 사용자가 광클 했을 때 시스템이 1건만 통과시키고 나머지는 치워버리는지와, 이후 SMS 이중 알림이 트리거 되는지 연합 모의.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-025`
- 요구사항: REQ-FUNC-024 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 광클릭 레이스 컨디션 차단**
  - **Given**: 동일 빈 슬롯 하나를 향해 3개의 User Session 이 `Promise.all` 로 0.05초 간격 액션 Call 발동 (모킹).
  - **When**: 트랜잭션 도킹.
  - **Then**: Prisma의 제약조건(Unique 등)이나 테이블 락(Lock)에 의해 단 하나의 데이터만 `status: pending` 으로 DB에 담기며 결제되고, 나머지 두 Promise는 400 중복 에러로 배제됨을 확인.

- [ ] **Scenario 2: 통보 시스템 분리 구동 검증**
  - **Given**: 위 1위로 승리한 예약건.
  - **When**: 트랜잭션이 성공으로 막을 내리기 직전 후.
  - **Then**: 카카오알림톡과 SMS 두 채널을 호출하는 `sendNotification`(API-025) 메서드가 지연 없이 콜 되었음을 증명 (`spy.toHaveBeenCalledTimes`).
