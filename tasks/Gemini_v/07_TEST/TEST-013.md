---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[TEST] TEST-013: Brand-Agnostic 제조사 뱃지 발급 보장 및 캐시 트리거 테스트"
labels: 'test, unit, badge, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-013] 신규 뱃지 발급 트랜잭션(`FC-016`) 단위 증명
- 목적: 제조사가 뱃지를 발급할 때, 한 SI가 다수의 제조사 뱃지를 자유롭게 보유(Brand-Agnostic)할 수 있는 구조인지 증명하며 멱등성을 지키는지 살핀다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-016`
- 요구사항: REQ-FUNC-013, 017 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: Brand-Agnostic 수평 뱃지 보유 확인 시스템**
  - **Given**: 이미 "현대" 로봇 뱃지를 보유한 SI 파트너.
  - **When**: "두산" 제조사 세션이 이 파트너에게 신규 뱃지를 `issueBadge` 함.
  - **Then**: DB 충돌(Unique 침해) 없이 정상 발급되어야 하며, 파트너 객체 하나가 제조사 태그가 다른 2개의 독립된 뱃지를 배열로 지닐 수 있음(1:N)을 쿼리 상으로 증명.

- [ ] **Scenario 2: 동일 제조사 멱등성 갱신 보호**
  - **Given**: "현대" 뱃지를 가진 SI 에게 "현대" 가 다시 뱃지 발급을 지시함 (실수 대응).
  - **When**: FC-016 핸들러 통과.
  - **Then**: 새로운 뱃지 로우(Row)가 더 생기지 않고 기존 뱃지의 식별자가 유지되거나, "이미 보유중" 이라는 통제로 난도질 치는 것을 방어. 

- [ ] **Scenario 3: 캐시 초기화 사이드 이펙트 감지**
  - **Given**: 위 SC 1 종료 지점.
  - **When**: 뱃지 발급 함수가 리턴되기 직전.
  - **Then**: Next.js의 캐시 소거용 매크로 함수(`revalidateTask` 혹은 관련 Mocking Spy)가 1회 확실히 호출되었는지 확인.
