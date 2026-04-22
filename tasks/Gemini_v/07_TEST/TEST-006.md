---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[TEST] TEST-006: 종단 에스크로 자금 방출 결정(confirmRelease) 로직 무결성 증명"
labels: 'test, unit, escrow, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-006] Admin 자금 방출(`confirmRelease`) 단위 테스트
- 목적: 에스크로 프로세스의 대단원이자 SI 측에 대금이 입금되는 종말점 로직이 혹여나 검수 미승인 상태에서 오발동 되지 않는지 이중 삼중으로 체크하는 가드 테스트.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-009` 
- 요구사항: REQ-FUNC-002 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 정상 방출 및 후속 트리거 타격**
  - **Given**: 선행 조건(Contract.status = `release_pending`)을 완벽히 맞춘 레코드 데이터. MFA 통과 Admin
  - **When**: 방출 액션을 때림.
  - **Then**: `EscrowTx.state` 는 `released` 로 닫히고, 상태 전이 즉시 FC-014(워런티)를 호출하는 연쇄 체인이 백그라운드로 작동됨을 검증한다(Spy Check).

- [ ] **Scenario 2: 방출 대기 미도달 건 불법 접근 방어**
  - **Given**: 검수가 이뤄지지 않은 `inspecting` 급 상태의 Contract 또는 이미 분쟁(`disputed`)에 빠져버린 Contract.
  - **When**: 관리자 세션이 강제로 방출 액션을 지시함.
  - **Then**: FC의 선행 룰 엔진에 부딪혀 "유효하지 않은 상태 전이입니다." 혹은 400 Bad Request 급 에러로 즉각 블록되며 돈이 풀리지 않음이 확인된다.

## :gear: Technical Constraint
- 체인 테스트: 이 로직은 `Warranty` 모델 생성을 연계 호출하므로 병합 테스트 시 사이드 이펙트에 의해 실제 레코드가 생기지 않도록, `Warranty` Create 부분의 쿼리가 잘 Mocking 되어있는지 점검 바람.
